import memoize from 'memoizee';

export const getImageSrc: (file?: File | null) => string = memoize((file?: File | null) => {
  if (!file) return '';
  return URL.createObjectURL(file);
});

export const getImageElementFromUrl: (src: string) => Promise<HTMLImageElement> = memoize(
  async (src: string) => {
    return new Promise(resolve => {
      const image = new Image();
      image.src = src;
      image.onload = () => resolve(image);
    });
  },
);

export const getImageElementFromSvg: (svg: string) => Promise<HTMLImageElement> = memoize(
  async (svg: string) => {
    return new Promise(resolve => {
      const image = new Image();
      image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      image.onload = () => resolve(image);
    });
  },
);
