import { useEffect, useMemo } from "react";

import { getSafeImageUrl, resolveSafeImageSrc } from "@/utils/safeImageUrl";

type ImagePreviewThumbProps = {
  src: string;
  alt: string;
  index: number;
  onRemove?: () => void;
  allowBlob?: boolean;
};

export function ImagePreviewThumb({
  src,
  alt,
  index,
  onRemove,
  allowBlob = false,
}: ImagePreviewThumbProps) {
  const safeSrc = allowBlob ? resolveSafeImageSrc(src) : getSafeImageUrl(src);
  if (!safeSrc) {
    return null;
  }

  return (
    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-[#eeeff1]">
      <img src={safeSrc} alt={alt} className="h-full w-full object-cover" />
      {onRemove ? (
        <button
          type="button"
          aria-label={`이미지 ${index + 1} 삭제`}
          className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-[12px] text-white"
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

type LocalFilePreviewThumbProps = {
  file: File;
  index: number;
  onRemove: () => void;
};

export function LocalFilePreviewThumb({ file, index, onRemove }: LocalFilePreviewThumbProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <ImagePreviewThumb
      src={previewUrl}
      alt={`선택 이미지 ${index + 1}`}
      index={index}
      onRemove={onRemove}
      allowBlob
    />
  );
}

type ImageUploadPreviewStripProps = {
  remoteUrls?: string[];
  localFiles?: File[];
  onRemoveRemote?: (url: string) => void;
  onRemoveLocal?: (index: number) => void;
  className?: string;
};

export function ImageUploadPreviewStrip({
  remoteUrls = [],
  localFiles = [],
  onRemoveRemote,
  onRemoveLocal,
  className,
}: ImageUploadPreviewStripProps) {
  if (remoteUrls.length === 0 && localFiles.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-wrap gap-[10px] pb-[4px]"}>
      {remoteUrls.map((url, index) => (
        <ImagePreviewThumb
          key={url}
          src={url}
          alt={`첨부 이미지 ${index + 1}`}
          index={index}
          onRemove={onRemoveRemote ? () => onRemoveRemote(url) : undefined}
        />
      ))}
      {localFiles.map((file, index) => (
        <LocalFilePreviewThumb
          key={`${file.name}-${file.lastModified}-${index}`}
          file={file}
          index={remoteUrls.length + index}
          onRemove={() => onRemoveLocal?.(index)}
        />
      ))}
    </div>
  );
}
