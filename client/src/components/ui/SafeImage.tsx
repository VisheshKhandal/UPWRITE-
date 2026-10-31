import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  fallbackLabel?: string;
}

export function SafeImage({ className, fallbackClassName, fallbackLabel = "Image", src, alt, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-end bg-surface-subtle p-4",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <span className="rounded-md border border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-content-muted">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return <img {...props} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
