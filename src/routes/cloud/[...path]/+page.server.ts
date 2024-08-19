import { sizeToString } from '$lib/General';
import { getPath } from '$lib/Path';
import { getFolderSize, getFreeSize, getFreeSizePercentage, getStats, listDirectory } from '$lib/server/FileHandler';
import type { Size } from '$lib/Types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  console.time('PageServerLoad');
  const path = getPath(params.path);
  if (!path) return error(400, 'Invalid path');

  const stats = await getStats(path);
  if (stats === null) return error(404, 'Path not found');

  let fileType: 'file' | 'directory' = stats.isFile() ? 'file' : 'directory';
  let files: string[] = [];
  let folders: string[] = [];
  let size: Size = { currentSize: '', freeSize: '', freeSizePercentage: '' };
  let creationDate = '';

  const dirPath = stats.isDirectory() ? path : path.slice(0, -1);
  const content = await listDirectory(dirPath);
  files = content
    .filter((file) => file.isFile())
    .map((file) => file.name)
    .sort();
  folders = content
    .filter((file) => file.isDirectory())
    .map((file) => file.name)
    .sort();

  creationDate = stats.birthtime.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  if (stats.isDirectory()) {
    const currentSize = await getFolderSize(path);
    const freeSize = await getFreeSize();

    size.currentSize = sizeToString(currentSize);
    size.freeSize = sizeToString(freeSize);
    size.freeSizePercentage = getFreeSizePercentage(freeSize);
  } else if (stats.isFile()) {
    const currentSize = await getFolderSize(path);
    size.currentSize = sizeToString(currentSize);
  }

  console.timeEnd('PageServerLoad');
  return { fileType, path, files, folders, size, creationDate };
}) satisfies PageServerLoad;
