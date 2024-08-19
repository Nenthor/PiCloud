const ROOT = 'cloud';

export function getFullPath(path: string[]) {
  const fullPath = join(ROOT, ...path);
  return `/${fullPath}`;
}

export function getPath(path?: string) {
  if (path === undefined || path === '') return [];
  return path.split('/');
}

export function getPathStr(path?: string[]) {
  const pathArr = getPath(path?.join('/'));
  if (pathArr === null) return null;
  return pathArr.join('/');
}

export function getParentPath(path: string[]) {
  const parentPath = path.slice(); // make a copy
  parentPath.pop();
  return parentPath;
}

function join(...parts: string[]) {
  return parts.join('/');
}
