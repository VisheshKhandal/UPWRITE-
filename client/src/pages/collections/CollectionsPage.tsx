import { FormEvent, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import {
  useCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation
} from "../../features/collections/collectionsApi";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";

export default function CollectionsPage() {
  const dispatch = useAppDispatch();
  const { data: collections = [] } = useCollectionsQuery({ limit: 30 });
  const [createCollection, createState] = useCreateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createCollection({ name, description, isPublic: false }).unwrap();
    dispatch(pushToast({ title: "Collection created", tone: "success" }));
    setName("");
    setDescription("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Collections</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Organize your learning resources.</h1>
      </section>
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-start">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Collection name" />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="min-h-11" />
          <Button loading={createState.isLoading}>Create</Button>
        </form>
      </Card>
      {!collections.length ? <EmptyState title="No collections yet" description="Create groups like React Resources, System Design, or DSA Revision." /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {collections.map((collection) => (
          <Card key={collection._id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink-950 dark:text-ink-50">{collection.name}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{collection.description || "A focused set of saved resources."}</p>
                <p className="mt-3 text-xs text-ink-500">{collection.itemsCount} saved items</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await deleteCollection(collection._id).unwrap();
                  dispatch(pushToast({ title: "Collection deleted", tone: "success" }));
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
