import { ROOT_DIR } from '$env/static/private';
import { isImage, isVideo } from '$lib/General';
import archiver from 'archiver';
import ffmpeg from 'fluent-ffmpeg';
import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { PassThrough } from 'stream';
import { BufferCache } from './BufferCache';

// Check if ROOT_DIR is available
fs.readdir(ROOT_DIR).catch((err) => console.error('ROOT_DIR not available:\n', err));

const MAX_THUMBNAIL_SIZE = 10 * 1024 ** 2; // 10 MB
const thumbnails = new BufferCache(MAX_THUMBNAIL_SIZE);
const recentlyDeleted: string[] = [];

export async function uploadFile(stream: ReadableStream<Uint8Array>, path: string[], overwrite = false) {
  const fullPath = join(ROOT_DIR, ...path);

  let deletedIndex = recentlyDeleted.indexOf(fullPath);
  if (deletedIndex !== -1) {
    recentlyDeleted.splice(deletedIndex, 1);
    overwrite = true;
  }

  // Create directories if they don't exist
  try {
    await fs.mkdir(dirname(fullPath), { recursive: true });
  } catch (err) {
    console.error(err);
    return false;
  }

  // Check if file exists and overwrite is false
  if (!overwrite && (await isValidPath(fullPath))) return false;

  // Write file to disk
  const diskStream = createWriteStream(fullPath, { highWaterMark: 256 * 1024 });
  diskStream.on('error', () => {});

  const writeableStream = new WritableStream<Uint8Array>({
    write(chunk) {
      diskStream.write(chunk);
    },
    close() {
      diskStream.end();
    },
    abort() {
      diskStream.end();
      diskStream.destroy();
    }
  });

  const success = await new Promise<boolean>((resolve) =>
    stream
      .pipeTo(writeableStream)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  );

  // Cleanup
  if (!success) {
    await deleteFile(path);
  }

  return success;
}

export async function downloadFile(path: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if file exists
  if (!(await isValidPath(fullPath))) return null;

  try {
    return await fs.readFile(fullPath);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function downloadFileAsStream(path: string[], rangeStart?: number, rangeEnd?: number) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if file exists
  if (!(await isValidPath(fullPath))) return null;
  const file = createReadStream(fullPath, { highWaterMark: 256 * 1024, start: rangeStart, end: rangeEnd });

  return new ReadableStream({
    start(controller) {
      file.on('data', (chunk) => controller.enqueue(chunk));
      file.on('close', () => {
        if (controller.desiredSize) controller.close();
      });
      file.on('warning', (warn) => console.warn(warn));
      file.on('error', (err) => {
        console.error(err);
        controller.error(err);
        controller.close();
        file.destroy();
      });
    },
    cancel() {
      file.destroy();
    }
  });
}

export async function downloadDirectoryAsStream(path: string[], selectedFiles?: string[], selectedFolders?: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if directory exists
  if (!(await isValidPath(fullPath))) return null;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk));
      archive.on('end', () => controller.close());
      archive.on('warning', (warn) => console.warn(warn));
      archive.on('error', (err) => {
        console.error(err);
        controller.error(err);

        controller.close();
        archive.destroy();
      });

      if (selectedFiles || selectedFolders) {
        selectedFiles?.forEach((file) => archive.file(join(fullPath, file), { name: file }));
        selectedFolders?.forEach((folder) => archive.directory(join(fullPath, folder), folder));
      } else archive.directory(fullPath, false);

      archive.finalize();
    },
    cancel() {
      archive.destroy();
    }
  });

  return stream;
}

export async function getThumbnail(path: string[], width = 200, height = 200) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if file exists
  const stats = await getStats(path);
  if (stats === null || !stats.isFile()) return null;

  // Check if file is an image
  if (!isImage(fullPath) && !isVideo(fullPath)) return null;

  // Check if thumbnail already exists in cache
  const thumbnail = thumbnails.get(fullPath);
  if (thumbnail) return thumbnail;

  let input: string | Buffer = fullPath;
  if (isVideo(fullPath)) {
    // Get thumbnail from video as Buffer - (and hope it accepts the format)
    input = await new Promise<Buffer>(async (resolve, reject) => {
      const buffers: Buffer[] = [];
      const duration = await getVideoDurationInSeconds(fullPath);

      const stream = new PassThrough();
      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', (err) => {
        console.error(err);
        stream.end();
        reject();
      });

      ffmpeg(fullPath)
        .on('end', () => stream.end())
        .on('error', (err) => {
          if (!err.message.includes('Output stream closed')) {
            console.error(err);
            stream.end();
          }
        })
        .seekInput(duration * 0.1) // Get thumbnail from 10% of the video
        .format('image2pipe')
        .frames(1)
        .pipe(stream, { end: true });
    });
  }

  try {
    sharp.cache(false); // Sharp keeps files open, which prevents them from being deleted/overwritten
    const thumbnail = await sharp(input).resize(width, height, { fit: 'inside' }).withMetadata().toBuffer();
    thumbnails.set(fullPath, thumbnail);
    return thumbnail;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function renameFile(oldPath: string[], newPath: string[], overwrite = false) {
  const oldFilePath = join(ROOT_DIR, ...oldPath);
  const newFilePath = join(ROOT_DIR, ...newPath);

  // Check if file paths are the same
  if (oldFilePath === newFilePath) return false;

  // Check if file exists
  if (!(await isValidPath(oldFilePath))) return false;
  if (!overwrite && (await isValidPath(newFilePath))) return false;

  // Move thumbnail cache to new path
  const cachedThumbnail = thumbnails.get(oldFilePath);
  if (cachedThumbnail) {
    thumbnails.set(newFilePath, cachedThumbnail);
    thumbnails.delete(oldFilePath);
  }

  try {
    await fs.rename(oldFilePath, newFilePath);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function deleteFile(path: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if file exists
  if (!(await isValidPath(fullPath))) return false;

  try {
    await fs.rm(fullPath, { recursive: true, force: true });

    // Remove thumbnail from cache
    thumbnails.delete(fullPath);

    // Necessary to prevent, that the file is still accessible after deletion
    recentlyDeleted.push(fullPath);
    setTimeout(() => {
      recentlyDeleted.splice(recentlyDeleted.indexOf(fullPath), 1);
    }, 60 * 1000); // Remove from recentlyDeleted after 1 minute
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

export async function createDirectory(path: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if directory exists
  if (await isValidPath(fullPath)) return false;

  try {
    await fs.mkdir(fullPath, { recursive: true });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function listDirectory(path: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if directory exists
  if (!(await isValidPath(fullPath))) return [];

  try {
    let content = await fs.readdir(fullPath, { withFileTypes: true });
    return content.filter((file) => !recentlyDeleted.includes(join(fullPath, file.name)));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getStats(path: string[]) {
  const fullPath = join(ROOT_DIR, ...path);

  // Check if file exists
  if (!(await isValidPath(fullPath))) return null;

  try {
    return await fs.stat(fullPath);
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Check if file exists and can be accessed
async function isValidPath(fullPath: string) {
  return await fs
    .access(fullPath)
    .then(() => true)
    .catch(() => false);
}
