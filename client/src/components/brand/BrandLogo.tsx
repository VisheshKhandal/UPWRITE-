import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

const logoSrc = "/UPWRITE logo.png";

export const BrandLogo = ({
  linked = true,
  showName = true,
  size = "md",
  className
}: {
  linked?: boolean;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const logo = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={logoSrc}
        alt="Upwrite"
        className={cn(
          "shrink-0 rounded-xl object-contain shadow-sm",
          size === "sm" && "h-8 w-8",
          size === "md" && "h-10 w-10",
          size === "lg" && "h-14 w-14"
        )}
      />
      {showName ? (
        <span className={cn("font-semibold tracking-tight text-ink-950 dark:text-ink-50", size === "lg" ? "text-2xl" : "text-xl")}>
          Upwrite
        </span>
      ) : null}
    </span>
  );

  return linked ? <Link to="/">{logo}</Link> : logo;
};
