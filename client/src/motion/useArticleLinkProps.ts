import { useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  isModifiedNavigationEvent,
  recordArticleActivation,
  runOptionalThumbnailViewTransition,
  type ArticleNavigationMode
} from "./articleTransition";

type UseArticleLinkOptions = {
  slug: string;
  to?: string;
  mode?: ArticleNavigationMode;
  instanceId?: string;
  state?: Record<string, unknown>;
  onIntent?: () => void;
  onBeforeNavigate?: () => void;
};

export const useArticleLinkActivation = ({
  slug,
  to,
  mode = "open",
  instanceId: customInstanceId,
  state,
  onIntent,
  onBeforeNavigate
}: UseArticleLinkOptions) => {
  const reactId = useId();
  const instanceId = customInstanceId ?? `article-${mode}:${slug || reactId.replace(/:/g, "")}`;
  const location = useLocation();
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const thumbRef = useRef<HTMLElement | null>(null);
  const targetHref = to ?? `/articles/${slug}`;

  const clearActivating = () => {
    setIsActivating(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    setIsActivating(true);
    onIntent?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      setIsActivating(true);
      onIntent?.();
    }
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedNavigationEvent(event)) {
      setIsActivating(false);
      return;
    }

    onIntent?.();
    onBeforeNavigate?.();

    const sourceKey = `${location.pathname}${location.search}`;
    recordArticleActivation({
      slug,
      instanceId,
      mode,
      hasThumbnail: Boolean(thumbRef.current),
      thumbnailElement: thumbRef.current,
      locationKey: location.key,
      sourcePath: sourceKey,
      sourceScrollY: typeof window !== "undefined" ? window.scrollY : 0
    });

    if (thumbRef.current && mode === "open") {
      event.preventDefault();
      runOptionalThumbnailViewTransition(
        () => {
          navigate(targetHref, state ? { state } : undefined);
        },
        { enabled: true }
      );
    }
  };

  return {
    instanceId,
    isActivating,
    thumbRef,
    targetHref,
    clearActivating,
    handlePointerDown,
    handleKeyDown,
    handleClick,
    linkAttributes: {
      "data-article-instance": instanceId,
      "data-activating": isActivating ? "true" : undefined
    }
  };
};

