import { FormEvent, useState } from "react";
import { Bookmark, FolderPlus, Lock, X } from "lucide-react";
import { useCreateCollectionMutation, useCollectionsQuery } from "../../features/collections/collectionsApi";
import { useSaveContentMutation } from "../../features/saved/savedApi";
import { pushToast } from "../../features/ui/uiSlice";
import { useAppDispatch } from "../../app/hooks";
import type { ContentType } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface SaveToCollectionButtonProps {
  contentType: ContentType;
  contentId: string;
  compact?: boolean;
}

export const SaveToCollectionButton = ({ contentType, contentId, compact }: SaveToCollectionButtonProps) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [newCollection, setNewCollection] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { data: collections = [] } = useCollectionsQuery({ limit: 30 }, { skip: !open });
  const [saveContent, saveState] = useSaveContentMutation();
  const [createCollection, createState] = useCreateCollectionMutation();

  const save = async (collection?: string) => {
    try {
      await saveContent({ contentType, contentId, collection }).unwrap();
      dispatch(pushToast({ title: "Saved", tone: "success" }));
      setOpen(false);
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not save"), tone: "error" }));
    }
  };

  const createAndSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCollection.trim()) return;

    try {
      const collection = await createCollection({ name: newCollection.trim(), isPublic }).unwrap();
      dispatch(pushToast({ title: "Collection created", tone: "success" }));
      await save(collection._id);
      setNewCollection("");
      setIsPublic(false);
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not create collection"), tone: "error" }));
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled={saveState.isLoading}
        onClick={() => setOpen(true)}
        aria-label="Save"
      >
        <Bookmark className="h-4 w-4" />
        {compact ? null : "Save"}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-ink-200 bg-white p-4 shadow-xl dark:border-ink-800 dark:bg-ink-950 sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">Save to</h2>
                <p className="mt-1 text-sm text-ink-500">Choose a collection or keep it in All Saved.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => save()}
                className="flex min-h-11 items-center justify-between rounded-lg border border-ink-200 px-3 text-left text-sm transition hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
              >
                <span className="font-medium">All Saved</span>
                <Bookmark className="h-4 w-4 text-ink-400" />
              </button>
              {collections.map((collection) => (
                <button
                  type="button"
                  key={collection._id}
                  onClick={() => save(collection._id)}
                  className="flex min-h-11 items-center justify-between rounded-lg border border-ink-200 px-3 text-left text-sm transition hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
                >
                  <span>
                    <span className="block font-medium">{collection.name}</span>
                    <span className="text-xs text-ink-500">{collection.itemsCount} saved items</span>
                  </span>
                  {collection.isPublic ? <FolderPlus className="h-4 w-4 text-ink-400" /> : <Lock className="h-4 w-4 text-ink-400" />}
                </button>
              ))}
            </div>

            <form onSubmit={createAndSave} className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-900">
              <Input
                value={newCollection}
                onChange={(event) => setNewCollection(event.target.value)}
                placeholder="Create new collection"
              />
              <label className="mt-3 flex min-h-10 items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
                Public collection
              </label>
              <Button className="mt-3 w-full" variant="secondary" loading={createState.isLoading} disabled={!newCollection.trim()}>
                <FolderPlus className="h-4 w-4" />
                Create and save
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
