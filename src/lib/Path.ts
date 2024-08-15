const ROOT = 'cloud';

export function getFullPath(path: string[]) {
	const fullPath = join(ROOT, ...path);
	return isValidPath(fullPath) ? `/${fullPath}` : null;
}

export function getPath(path?: string) {
	if (path === undefined || !isValidPath(path)) return null;
	if (path === '') return [];
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

function isValidPath(path: string) {
	// use regex to check if the path is valid
	if (path === '') return true;

	const regex = /^([\w\däöü\-() ]+\/)*([\w\däöü\-() ]+(\.[\w\däöü\-()]+)*)$/i;
	return regex.test(path);
}

function join(...parts: string[]) {
	return parts.join('/');
}
