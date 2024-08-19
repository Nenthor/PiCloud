import { sizeToString } from '$lib/General';
import { getPath } from '$lib/Path';
import { getFolderSize, getFreeSize, getFreeSizePercentage, getStats, listDirectory } from '$lib/server/FileHandler';
import type { Size } from '$lib/Types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const path = getPath(params.path);
  if (!path) return error(400, 'Invalid path');

  const stats = await getStats(path);
  if (stats === null) return error(404, 'Path not found');

  let fileType: 'file' | 'directory' = stats.isFile() ? 'file' : 'directory';
  let files: string[] = [];
  let folders: string[] = [];
  let size: Size = { currentSize: '', freeSize: '', freeSizePercentage: '' };
  let creationDate = '';

  creationDate = stats.birthtime.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const promises: Promise<void>[] = [];

  const dirPath = stats.isDirectory() ? path : path.slice(0, -1);
  promises.push(
    listDirectory(dirPath).then((content) => {
      files = content
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .sort();
      folders = content
        .filter((file) => file.isDirectory())
        .map((file) => file.name)
        .sort();
    })
  );

  if (stats.isDirectory()) {
    promises.push(
      getFolderSize(path).then((currentSize) => {
        size.currentSize = sizeToString(currentSize);
      })
    );

    promises.push(
      getFreeSize().then((freeSize) => {
        size.freeSize = sizeToString(freeSize);
        size.freeSizePercentage = getFreeSizePercentage(freeSize);
      })
    );
  } else if (stats.isFile()) {
    size.currentSize = sizeToString(stats.size);
  }

  await Promise.all(promises);

  return { fileType, path, files, folders, size, creationDate };
}) satisfies PageServerLoad;
