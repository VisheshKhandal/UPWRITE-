import { useEffect, useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  CodeXml,
  Ellipsis,
  Eye,
  FileCode2,
  Focus,
  Heading,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  PanelRight,
  Quote,
  Underline,
  X
} from "lucide-react";
import { cn } from "../../utils/cn";
import { FloatingDropdown } from "../ui/FloatingDropdown";
import { MobileBottomSheet } from "../ui/MobileBottomSheet";

export type EditorToolId =
  | "h1" | "h2" | "h3" | "bold" | "italic" | "underline" | "quote"
  | "bullets" | "numbers" | "inline-code" | "code-block" | "link" | "image" | "divider";

export function ResponsiveEditorToolbar({
  mode,
  focusMode,
  panelOpen,
  activeTools,
  onModeChange,
  onFocusChange,
  onPanelToggle,
  onTool
}: {
  mode: "write" | "preview";
  focusMode: boolean;
  panelOpen: boolean;
  activeTools: Set<EditorToolId>;
  onModeChange: (mode: "write" | "preview") => void;
  onFocusChange: (focus: boolean) => void;
  onPanelToggle: () => void;
  onTool: (tool: EditorToolId) => void;
}) {
  const [menu, setMenu] = useState<"headings" | "insert" | "more" | "code" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLButtonElement | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle menu close
  const closeMenu = () => setMenu(null);

  // Get menu items based on current menu type
  const getMenuItems = (currentMenu: typeof menu): Array<[EditorToolId, string, typeof Bold]> => {
    switch (currentMenu) {
      case "headings":
        return [
          ["h1", "Heading 1", Heading],
          ["h2", "Heading 2", Heading],
          ["h3", "Heading 3", Heading]
        ];
      case "code":
        return [
          ["inline-code", "Inline code", CodeXml],
          ["code-block", "Code block", FileCode2]
        ];
      case "insert":
        return [
          ["link", "Link", Link],
          ["image", "Image", Image],
          ["divider", "Divider", Minus]
        ];
      case "more":
        return [
          ["underline", "Underline", Underline],
          ["quote", "Quote", Quote],
          ["inline-code", "Inline code", CodeXml],
          ["code-block", "Code block", FileCode2],
          ["link", "Link", Link],
          ["image", "Image", Image],
          ["divider", "Divider", Minus]
        ];
      default:
        return [];
    }
  };

  // Render menu items
  const renderMenuItems = (items: Array<[EditorToolId, string, typeof Bold]>) =>
    items.map(([id, label, Icon]) => (
      <button
        key={id}
        type="button"
        onClick={() => choose(id)}
        className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
      >
        <Icon className="h-4 w-4 text-ink-500" />
        {label}
      </button>
    ));

  // Render "More" menu special buttons
  const renderMoreMenuButtons = () =>
    !focusMode ? (
      <>
        <button
          type="button"
          onClick={() => { onModeChange(mode === "write" ? "preview" : "write"); closeMenu(); }}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
        >
          <Eye className="h-4 w-4 text-ink-500" />
          {mode === "write" ? "Preview" : "Return to writing"}
        </button>
        <button
          type="button"
          onClick={() => { onFocusChange(true); closeMenu(); }}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
        >
          <Focus className="h-4 w-4 text-ink-500" />
          Focus mode
        </button>
        <button
          type="button"
          onClick={() => { onPanelToggle(); closeMenu(); }}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
        >
          <PanelRight className="h-4 w-4 text-ink-500" />
          Document tools
        </button>
        <div className="my-1 border-t border-ink-200 dark:border-ink-800" />
      </>
    ) : null;

  const toolButton = (id: EditorToolId, label: string, Icon: typeof Bold, className?: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onTool(id)}
      title={label}
      aria-label={label}
      aria-pressed={activeTools.has(id)}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 active:bg-ink-200 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50 dark:active:bg-ink-800",
        activeTools.has(id) && "bg-ink-100 text-ink-950 ring-1 ring-inset ring-ink-200 dark:bg-ink-800 dark:text-ink-50 dark:ring-ink-700",
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const menuButton = (id: "headings" | "insert" | "more" | "code", label: string, Icon: typeof Bold, className?: string) => (
    <button
      ref={id === "more" ? moreMenuRef : undefined}
      type="button"
      onClick={() => setMenu((current) => current === id ? null : id)}
      aria-label={label}
      aria-expanded={menu === id}
      title={label}
      className={cn(
        "flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50",
        menu === id && "bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-ink-50",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className={cn("hidden sm:inline", (id === "insert" || id === "more") && "inline")}>{label}</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  );

  const choose = (tool: EditorToolId) => {
    onTool(tool);
    setMenu(null);
  };

  return (
    <div ref={rootRef} className={cn("relative mx-auto flex h-12 w-full items-center gap-1", focusMode ? "max-w-5xl" : "max-w-none")}>
      <div className={cn("shrink-0 items-center gap-1 border-r border-ink-200 pr-1.5 dark:border-ink-800", focusMode ? "flex" : "hidden sm:flex")}>
        <button
          type="button"
          onClick={() => onModeChange(mode === "write" ? "preview" : "write")}
          aria-pressed={mode === "preview"}
          title={mode === "write" ? "Preview article" : "Return to writing"}
          className={cn("flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50", mode === "preview" && "bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-ink-50")}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden md:inline">{mode === "write" ? "Preview" : "Write"}</span>
        </button>
        <button
          type="button"
          onClick={() => onFocusChange(!focusMode)}
          title={focusMode ? "Exit focus mode (Esc)" : "Focus mode"}
          aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
          aria-pressed={focusMode}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50"
        >
          {focusMode ? <X className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
        </button>
        {!focusMode ? (
          <button
            type="button"
            onClick={onPanelToggle}
            title="Document tools — assistant, details, publishing, and history"
            aria-label="Document tools"
            aria-pressed={panelOpen}
            className={cn("flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50", panelOpen && "bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-ink-50")}
          >
            <PanelRight className="h-4 w-4" />
            <span className="hidden 2xl:inline">Tools</span>
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {menuButton("headings", "Headings", Heading)}
        {toolButton("bold", "Bold", Bold)}
        {toolButton("italic", "Italic", Italic)}
        {toolButton("bullets", "Bulleted list", List)}
        {toolButton("numbers", "Numbered list", ListOrdered, "hidden sm:grid")}
        {toolButton("underline", "Underline", Underline, "hidden lg:grid")}
        {toolButton("quote", "Quote", Quote, "hidden xl:grid")}
        {menuButton("code", "Code", CodeXml, "hidden xl:flex")}
        {toolButton("link", "Link", Link, "hidden 2xl:grid")}
        {toolButton("image", "Image", Image, "hidden 2xl:grid")}
        {toolButton("divider", "Divider", Minus, "hidden 2xl:grid")}
      </div>

      <div className="flex shrink-0 items-center border-l border-ink-200 pl-1.5 dark:border-ink-800">
        {menuButton("insert", "Insert", Link, "sm:hidden")}
        {menuButton("more", "More", Ellipsis)}
      </div>

      {/* Desktop Floating Dropdown */}
      {!isMobile && menu === "more" && moreMenuRef.current && (
        <FloatingDropdown
          isOpen={menu === "more"}
          onClose={closeMenu}
          triggerRef={moreMenuRef as React.RefObject<HTMLElement>}
          align="right"
          minWidth="min-w-52"
        >
          {renderMoreMenuButtons()}
          {renderMenuItems(getMenuItems("more"))}
        </FloatingDropdown>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && menu === "more" && (
        <MobileBottomSheet
          isOpen={menu === "more"}
          onClose={closeMenu}
          title="More options"
        >
          {renderMoreMenuButtons()}
          {renderMenuItems(getMenuItems("more"))}
        </MobileBottomSheet>
      )}

      {/* Fallback for non-more menus - keep as absolute positioned for simplicity */}
      {menu && menu !== "more" && (
        <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-52 rounded-xl border border-ink-200 bg-white p-1.5 shadow-2xl dark:border-ink-800 dark:bg-ink-950">
          {renderMenuItems(getMenuItems(menu))}
        </div>
      )}
    </div>
  );
}
