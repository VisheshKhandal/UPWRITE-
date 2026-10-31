import { FormEvent, useEffect, useRef, useState } from "react";
import { Bookmark, FolderPlus, Lock } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCreateCollectionMutation, useCollectionsQuery } from "../../features/collections/collectionsApi";
import { useSaveContentMutation } from "../../features/saved/savedApi";
import { matchesResumedContentAction } from "../../features/auth/authIntent";
import { pushToast } from "../../features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { ModalDialog } from "../../motion/overlays";
import type { ContentType } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { AuthPrompt } from "../auth/AuthPrompt";

interface SaveToCollectionButtonProps {
  contentType: ContentType;
  contentId: string;
  initialSaved?: boolean;
  compact?: boolean;
  quiet?: boolean;
  className?: string;
}

export const SaveToCollectionButton = ({
  contentType,
  contentId,
  initialSaved,
  compact,
  quiet,
  className
}: SaveToCollectionButtonProps) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const resumedSaveRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [newCollection, setNewCollection] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [justSaved, setJustSaved] = useState(false);
  const {
    data: collections = [],
    isLoading: collectionsLoading,
    isError: collectionsError,
    refetch: refetchCollections
  } = useCollectionsQuery({ limit: 30 }, { skip: !open || !user });
  const [saveContent, saveState] = useSaveContentMutation();
  const [createCollection, createState] = useCreateCollectionMutation();

  useEffect(() => {
    if (typeof initialSaved === "boolean") {
      setSaved(initialSaved);
    }
  }, [initialSaved, user?._id]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 180);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  const closeDialog = () => {
    setOpen(false);
  };

  const save = async (collection?: string) => {
    if (saveState.isLoading) return;
    try {
      await saveContent({ contentType, contentId, collection }).unwrap();
      setSaved(true);
      setJustSaved(true);
      dispatch(pushToast({ title: "Saved to Library", tone: "success" }));
      setOpen(false);
    } catch (error) {
      dispatch(
        pushToast({
          title: getErrorMessage(error, "Sign in to save this item to your library."),
          tone: "error"
        })
      );
    }
  };

  useEffect(() => {
    if (!user || resumedSaveRef.current) return;
    if (!matchesResumedContentAction(location.state, "save", contentType, contentId)) return;
    const resumeKey = `upwrite.resumedSave.${contentType}.${contentId}.${window.location.pathname}${window.location.search}`;
    if (sessionStorage.getItem(resumeKey)) return;
    resumedSaveRef.current = true;
    sessionStorage.setItem(resumeKey, "true");
    void save();
  }, [contentId, contentType, location.state, user]);

  const createAndSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCollection.trim() || createState.isLoading || saveState.isLoading) return;

    try {
      const collection = await createCollection({ name: newCollection.trim(), isPublic }).unwrap();
      dispatch(pushToast({ title: "Collection created", tone: "success" }));
      await save(collection._id);
      setNewCollection("");
      setIsPublic(false);
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not create collection."), tone: "error" }));
    }
  };

  const label = saved ? "In Library" : "Save";

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled={saveState.isLoading}
        onClick={(event) => {
          event.stopPropagation();
          if (user) {
            setOpen(true);
          } else {
            setAuthOpen(true);
          }
        }}
        aria-label={saved ? "Saved in Library (change collection)" : "Save to Library"}
        aria-pressed={saved}
        title={saved ? "Saved in Library" : "Save to Library"}
        className={cn(
          quiet && "h-8 px-2 text-xs text-content-muted hover:text-content-primary",
          saved && "text-content-accent",
          className
        )}
      >
        <Bookmark
          className={cn(
            "h-4 w-4 transition-transform duration-150",
            saved && "fill-current",
            justSaved && "scale-110"
          )}
        />
        {compact ? null : <span>{label}</span>}
      </Button>

      <ModalDialog
        open={open}
        onClose={closeDialog}
        title="Save to Library"
        description="Choose a knowledge collection or keep it in your main Library."
        maxWidthClassName="max-w-md"
      >
        <div className="grid max-h-60 gap-2 overflow-y-auto pr-0.5">
          <button
            type="button"
            disabled={saveState.isLoading}
            onClick={() => void save()}
            className="flex min-h-11 items-center justify-between rounded-md border border-subtle bg-surface px-3 text-left text-sm transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60"
          >
            <span className="font-medium text-content-primary">Library</span>
            <Bookmark className="h-4 w-4 text-content-muted" />
          </button>

          {collectionsLoading ? (
            <p className="py-2 text-xs text-content-muted">Loading collections…</p>
          ) : collectionsError ? (
            <div className="flex items-center justify-between rounded-md border border-subtle px-3 py-2 text-xs text-content-muted">
              <span>Could not load collections.</span>
              <button
                type="button"
                onClick={() => void refetchCollections()}
                className="font-medium text-content-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            collections.map((collection) => (
              <button
                type="button"
                key={collection._id}
                disabled={saveState.isLoading}
                onClick={() => void save(collection._id)}
                className="flex min-h-11 items-center justify-between rounded-md border border-subtle bg-surface px-3 text-left text-sm transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60"
              >
                <span className="min-w-0 pr-2">
                  <span className="block truncate font-medium text-content-primary">{collection.name}</span>
                  <span className="text-xs text-content-muted tabular-nums">{collection.itemsCount} saved items</span>
                </span>
                {collection.isPublic ? (
                  <FolderPlus className="h-4 w-4 shrink-0 text-content-muted" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-content-muted" />
                )}
              </button>
            ))
          )}
        </div>

        <form
          onSubmit={createAndSave}
          className="mt-4 rounded-md border border-subtle bg-surface p-3"
        >
          <Input
            aria-label="New collection name"
            value={newCollection}
            onChange={(event) => setNewCollection(event.target.value)}
            placeholder="Create new collection"
          />
          <label className="mt-2.5 flex min-h-9 cursor-pointer items-center gap-2 text-xs text-content-secondary">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
            Public collection
          </label>
          <Button
            type="submit"
            className="mt-2.5 w-full"
            variant="secondary"
            loading={createState.isLoading}
            disabled={!newCollection.trim() || saveState.isLoading}
          >
            <FolderPlus className="h-4 w-4" />
            Create and save
          </Button>
        </form>
      </ModalDialog>

      <AuthPrompt
        open={authOpen}
        message={
          contentType === "post"
            ? "Sign in to save this learning log to your library."
            : "Sign in to save this article to your library."
        }
        action="save"
        contentType={contentType}
        contentId={contentId}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
};
