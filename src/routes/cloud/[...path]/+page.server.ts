import { getPath } from '$lib/Path';
import { getStats, listDirectory } from '$lib/server/FileHandler';
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
  let size = '';
  let creationDate = '';

  const dirPath = stats.isDirectory() ? path : path.slice(0, -1);
  const content = await listDirectory(dirPath);
  files = content.filter((file) => file.isFile()).map((file) => file.name);
  folders = content.filter((file) => file.isDirectory()).map((file) => file.name);

  creationDate = stats.birthtime.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  let sizeNum: number;
  let unit: string;
  if (stats.size < 1024) {
    sizeNum = stats.size;
    unit = 'B';
  } else if (stats.size < 1024 ** 2) {
    sizeNum = stats.size / 1024;
    unit = 'KB';
  } else if (stats.size < 1024 ** 3) {
    sizeNum = stats.size / 1024 ** 2;
    unit = 'MB';
  } else {
    sizeNum = stats.size / 1024 ** 3;
    unit = 'GB';
  }
  size = sizeNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + unit;

  return { fileType, path, files, folders, size, creationDate };
}) satisfies PageServerLoad;
