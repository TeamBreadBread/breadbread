import type { ImgHTMLAttributes } from "react";

import { getSafeImageUrl, resolveSafeImageSrc } from "@/utils/safeImageUrl";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** 로컬 미리보기 blob URL 허용 */
  allowBlob?: boolean;
};

export function SafeImage({ src, allowBlob = false, ...props }: SafeImageProps) {
  const safeSrc = allowBlob
    ? resolveSafeImageSrc(src ?? undefined)
    : getSafeImageUrl(src ?? undefined);

  if (!safeSrc) {
    return null;
  }

  return <img {...props} src={safeSrc} />;
}
