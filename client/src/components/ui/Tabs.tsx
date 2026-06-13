import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const Tabs = <T extends string>({ items, value, onChange, className }: TabsProps<T>) => (
  <div className={cn("inline-flex rounded-lg border border-ink-200 bg-ink-100 p-1 dark:border-ink-800 dark:bg-ink-900", className)}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors dark:text-ink-400",
          value === item.value && "bg-white text-ink-950 shadow-panel dark:bg-ink-800 dark:text-ink-50"
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);
