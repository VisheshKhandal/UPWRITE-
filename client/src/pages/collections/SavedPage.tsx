import { FormEvent, useMemo, useState } from "react";
import { Folder, Lock, Pencil, Trash2, Unlock } from "lucide-react";
import { ArticleCard } from "../../components/article/ArticleCard";
import { EmptyState } from "../../components/common/EmptyState";
import { PostCard } from "../../components/feed/PostCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import {
  useCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useUpdateCollectionMutation
} from "../../features/collections/collectionsApi";
import { useSavedQuery } from "../../features/saved/savedApi";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import type { Article, Collection, Post } from "../../types/models";

export default function SavedPage() {
  const dispatch = useAppDispatch();
  const [activeCollection, setActiveCollection] = useState("all");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const { data: collections = [] } = useCollectionsQuery({ limit: 50 });
  const { data: saved = [], isLoading } = useSavedQuery({
    limit: 30,
    ...(activeCollection !== "all" ? { collection: activeCollection } : {})
  });
  const [createCollection, createState] = useCreateCollectionMutation();
  const [updateCollection, updateState] = useUpdateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  const tabs = useMemo(
    () => [
      { value: "all", label: "All Saved" },
      ...collections.map((collection) => ({ value: collection._id, label: collection.name }))
    ],
    [collections]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setEditing(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      await updateCollection({ id: editing._id, body: { name, description, isPublic } }).unwrap();
      dispatch(pushToast({ title: "Collection updated", tone: "success" }));
    } else {
      await createCollection({ name, description, isPublic }).unwrap();
      dispatch(pushToast({ title: "Collection created", tone: "success" }));
    }
    resetForm();
  };

  const startEdit = (collection: Collection) => {
    setEditing(collection);
    setName(collection.name);
    setDescription(collection.description ?? "");
    setIsPublic(collection.isPublic);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Saved</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Your private library for useful knowledge.</h1>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-x-auto pb-1">
            <Tabs value={activeCollection} onChange={setActiveCollection} items={tabs} />
          </div>
          {isLoading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => <Card key={item} className="h-40 animate-pulse bg-ink-100 dark:bg-ink-900" />)}
            </div>
          ) : null}
          {!isLoading && !saved.length ? (
            <EmptyState title="Nothing saved here yet" description="Use the Save button on articles and posts to build this collection." />
          ) : null}
          <div className="space-y-4">
            {saved.map((savedItem) =>
              savedItem.contentType === "article" && savedItem.item ? (
                <ArticleCard key={savedItem._id} article={savedItem.item as Article} />
              ) : savedItem.item ? (
                <PostCard key={savedItem._id} post={savedItem.item as Post} />
              ) : null
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">{editing ? "Edit collection" : "Create collection"}</h2>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Collection name" />
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="min-h-24" />
              <label className="flex min-h-11 items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
                Public collection
              </label>
              <div className="flex flex-wrap gap-2">
                <Button loading={createState.isLoading || updateState.isLoading} disabled={!name.trim()}>
                  {editing ? <Pencil className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                  {editing ? "Update" : "Create"}
                </Button>
                {editing ? <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button> : null}
              </div>
            </form>
          </Card>

          <div className="grid gap-3">
            {collections.map((collection) => (
              <Card key={collection._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {collection.isPublic ? <Unlock className="h-4 w-4 text-ink-400" /> : <Lock className="h-4 w-4 text-ink-400" />}
                      <h3 className="truncate font-medium text-ink-950 dark:text-ink-50">{collection.name}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{collection.description || "A focused set of saved resources."}</p>
                    <p className="mt-2 text-xs text-ink-500">{collection.itemsCount} saved items</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(collection)} aria-label="Edit collection">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await deleteCollection(collection._id).unwrap();
                        dispatch(pushToast({ title: "Collection deleted", tone: "success" }));
                      }}
                      aria-label="Delete collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
