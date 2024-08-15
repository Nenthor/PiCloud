import { getResponse } from '$lib/General';
import { getPath } from '$lib/Path';
import { createDirectory, deleteFile, downloadDirectoryAsStream, downloadFileAsStream, getStats, getThumbnail, renameFile, uploadFile } from '$lib/server/FileHandler';
import type { RequestHandler } from '@sveltejs/kit';

// Download a file from the server (as stream)
export const GET = (async ({ params, request, url }) => {
  const path = getPath(params.path);
  if (!path) return getResponse('error', 'Invalid path');

  const stats = await getStats(path);
  let size = stats?.size ?? 0;
  if (stats === null || (!stats.isFile() && !stats.isDirectory())) return getResponse('error', 'File not found');

  const isThumbnail = url.searchParams.has('thumbnail');
  if (isThumbnail) {
    const thumbnail = await getThumbnail(path);
    if (thumbnail === null) return getResponse('error', 'Failed to generate thumbnail');
    return new Response(thumbnail, {
      status: 200
    });
  }

  // Calculate the range of the file to download
  const range = request.headers.get('Range');
  let rangeStart = 0;
  let rangeEnd = size - 1;
  if (range && range.startsWith('bytes=')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const newRangeStart = parseInt(parts[0], 10);
    const newRangeEnd = parseInt(parts[1], 10);
    if (!isNaN(newRangeStart)) rangeStart = Math.max(0, newRangeStart);
    if (!isNaN(newRangeEnd)) rangeEnd = Math.min(size - 1, newRangeEnd);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/octet-stream'
  };

  let stream: ReadableStream<any> | null = null;
  if (stats.isFile()) {
    stream = await downloadFileAsStream(path, rangeStart, rangeEnd);
    headers['Content-Range'] = `bytes ${rangeStart}-${rangeEnd}/${size}`;
    headers['Content-Length'] = `${rangeEnd - rangeStart + 1}`;
    headers['Accept-Ranges'] = 'bytes';
  } else if (stats.isDirectory()) {
    const selectedFiles = url.searchParams
      .get('files')
      ?.split(',')
      .map((file) => file.trim());

    const selectedFolders = url.searchParams
      .get('folders')
      ?.split(',')
      .map((folder) => folder.trim());

    stream = await downloadDirectoryAsStream(path, selectedFiles, selectedFolders);
  }
  if (stream === null) return getResponse('error', 'Failed to download file');

  const status = rangeStart === 0 && rangeEnd === size - 1 ? 200 : 206;

  return new Response(stream, {
    status,
    headers
  });
}) satisfies RequestHandler;

// Create a new file on the server
export const POST = (async ({ params, request }) => {
  const path = getPath(params.path);
  if (!path) return getResponse('error', 'Invalid path');

  const exist = (await getStats(path)) !== null;
  const overwrite = request.headers.get('X-Overwrite') === 'true';
  if (exist && !overwrite) return getResponse('error', 'File already exists');

  const isFolder = request.headers.get('X-Is-Folder') === 'true';
  if (isFolder) {
    const success = await createDirectory(path);
    if (!success) return getResponse('error', 'Failed to create folder');
    return getResponse('success', 'Folder created');
  }

  const success = await uploadFile(request.body!, path, overwrite);
  if (!success) {
    request.body!.cancel();
    return getResponse('error', 'Failed to upload file');
  }

  return getResponse('success', 'File uploaded');
}) satisfies RequestHandler;

// Rename a file on the server
export const PUT = (async ({ params, request }) => {
  const oldPath = getPath(params.path);
  if (!oldPath) return getResponse('error', 'Invalid old path');

  const newPath = getPath(request.headers.get('X-New-Path')?.trim() ?? '');
  if (newPath === null || newPath.length === 0) return getResponse('error', 'Invalid new path');

  // make sure the filetype is the same
  const oldType = oldPath[oldPath.length - 1].split('.').pop();
  const newType = newPath[newPath.length - 1].split('.').pop();
  if (oldType !== newType) {
    newPath[newPath.length - 1] += '.' + oldType;
  }

  const newName = newPath[newPath.length - 1].split('.').shift();
  if (newName === undefined) return getResponse('error', 'Invalid file name');
  if (oldPath === newPath) return getResponse('error', 'New name is the same as the old name');

  // check if the new filename already exists
  const overwrite = request.headers.get('X-Overwrite') === 'true';
  const exist = (await getStats(newPath)) !== null;
  if (exist && !overwrite) return getResponse('error', 'New Filename already exists');

  const success = await renameFile(oldPath, newPath, overwrite);

  return getResponse(success ? 'success' : 'error', success ? newPath.join('/') : 'Failed to rename file');
}) satisfies RequestHandler;

// Delete a file from the server
export const DELETE = (async ({ params }) => {
  const path = getPath(params.path);
  if (!path) return getResponse('error', 'Invalid path');

  const success = await deleteFile(path);

  return getResponse(success ? 'success' : 'error', success ? 'File deleted' : 'Failed to delete file');
}) satisfies RequestHandler;
