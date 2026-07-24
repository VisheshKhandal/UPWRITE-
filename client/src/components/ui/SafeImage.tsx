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
          "flex items-end bg-[radial-gradient(circle_at_18%_18%,rgba(52,138,109,0.12),transparent_28%),linear-gradient(135deg,#f1f1ee,#deded7)] p-5 dark:bg-[radial-gradient(circle_at_18%_18%,rgba(90,191,157,0.14),transparent_28%),linear-gradient(135deg,#262621,#171716)]",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <span className="rounded-full border border-ink-200 bg-white/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600 dark:border-ink-700 dark:bg-ink-900/80 dark:text-ink-300">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return <img {...props} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
