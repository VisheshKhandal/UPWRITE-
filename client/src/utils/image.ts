import type { ImageAsset } from "../types/models";

export const getImageSrc = (image?: ImageAsset): string | undefined => {
  if (!image) return undefined;
  return image.url ?? image.secureUrl;
};
