import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const Card = ({ className, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    whileHover={{ y: -2 }}
    className={cn("surface rounded-lg", className)}
    {...props}
  />
);
