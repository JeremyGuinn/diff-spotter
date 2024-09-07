import { memoize } from './memoize';

export const getImageSrc: (file?: File | null) => string = memoize(
  (file?: File | null) => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }
);
