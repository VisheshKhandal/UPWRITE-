import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const Card = ({ className, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    className={cn("surface rounded-xl", className)}
    {...props}
  />
);
