import { User } from "lucide-react";
import { cn } from "../../utils/cn";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl"
};

export const Avatar = ({ src, name, size = "md", className }: AvatarProps) => {
  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-ink-200 bg-ink-100 text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300",
        sizeClass[size],
        className
      )}
    >
      {src ? <img src={src} alt={name ?? "Avatar"} className="h-full w-full object-cover" /> : initials || <User className="h-4 w-4" />}
    </div>
  );
};
