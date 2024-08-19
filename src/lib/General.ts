export function getResponse(type: 'success' | 'error', message: string, status_code?: number) {
  status_code = status_code || (type === 'success' ? 200 : 400);

  return new Response(message, {
    status: status_code
  });
}

export function clipName(name: string, length = 50, reverse = false) {
  if (name.length <= length) return name;
  if (reverse) return '...' + name.slice(name.length - length + 3);
  else return name.slice(0, length - 3) + '...';
}

export function isVideo(file: string) {
  const videoExtensions = ['mp4', 'webm', 'ogg'];
  const extension = file.split('.').pop();
  if (!extension) return false;
  return videoExtensions.includes(extension.toLowerCase());
}

export function isImage(file: string) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = file.split('.').pop();
  if (!extension) return false;
  return imageExtensions.includes(extension.toLowerCase());
}

export function isAudio(file: string) {
  const audioExtensions = ['mp3', 'wav', 'ogg'];
  const extension = file.split('.').pop();
  if (!extension) return false;
  return audioExtensions.includes(extension.toLowerCase());
}

export function isZip(file: string) {
  const zipExtensions = ['zip', 'rar', '7z'];
  const extension = file.split('.').pop();
  if (!extension) return false;
  return zipExtensions.includes(extension.toLowerCase());
}

export function isPDF(file: string) {
  const pdfExtensions = ['pdf'];
  const extension = file.split('.').pop();
  if (!extension) return false;
  return pdfExtensions.includes(extension.toLowerCase());
}

export function isDefault(file: string) {
  return !isVideo(file) && !isImage(file) && !isAudio(file) && !isZip(file) && !isPDF(file);
}

export function sizeToString(size: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unit = 0;
  while (size >= 1024) {
    size /= 1024;
    unit++;
  }
  return size.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + units[unit];
}
