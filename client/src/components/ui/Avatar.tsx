import { User } from "lucide-react";
import { cn } from "../../utils/cn";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClass = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl"
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
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-subtle bg-surface-subtle font-medium text-content-secondary",
        sizeClass[size],
        className
      )}
    >
      {src ? <img src={src} alt={name ?? "Avatar"} className="h-full w-full object-cover" /> : initials || <User className="h-4 w-4" />}
    </div>
  );
};
