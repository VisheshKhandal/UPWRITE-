import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, BookOpen, FileText, Folder, Inbox, Layers3, Lock, Pencil, Search, Share2, Sparkles, Trash2, Unlock } from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { LearningLoopStrip } from "../../components/common/LearningLoopStrip";
import { PostCard } from "../../components/feed/PostCard";
import { ArticleCard } from "../../components/article/ArticleCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import { LibraryTabs } from "../../components/library/LibraryTabs";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import {
  useCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useUpdateCollectionMutation
} from "../../features/collections/collectionsApi";
import { useSavedQuery } from "../../features/saved/savedApi";
import { useFlashcardSetsQuery } from "../../features/ai/aiApi";
import { useFlashcardsQuery } from "../../features/flashcards/flashcardsApi";
import { useReadingProgressQuery } from "../../features/readingProgress/readingProgressApi";
import type { Article, Collection, Post, SavedItem } from "../../types/models";

const searchableText = (item: SavedItem) => {
  const content = item.item;
  if (!content) return "";
  if ("title" in content && content.title) return content.title;
  if ("body" in content) return content.body;
  return "";
};

export default function SavedPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeCollection, setActiveCollection] = useState("all");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [libraryTab, setLibraryTab] = useState("All");
  const [query, setQuery] = useState("");

  const { data: collections = [] } = useCollectionsQuery({ limit: 50 });
  const { data: saved = [], isLoading } = useSavedQuery({
    limit: 40,
    ...(activeCollection !== "all" ? { collection: activeCollection } : {})
  });
  const { data: flashcardSets = [] } = useFlashcardSetsQuery();
  const { data: reviewCards = [] } = useFlashcardsQuery();
  const { data: progress = [] } = useReadingProgressQuery();
  const [createCollection, createState] = useCreateCollectionMutation();
  const [updateCollection, updateState] = useUpdateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  const tabs = useMemo(
    () => [
      { value: "all", label: "All items" },
      ...collections.map((collection) => ({ value: collection._id, label: collection.name }))
    ],
    [collections]
  );

  const filteredSaved = useMemo(() => {
    const term = query.trim().toLowerCase();
    return saved.filter((item) => {
      if (libraryTab === "Articles" && item.contentType !== "article") return false;
      if (libraryTab === "All" || libraryTab === "Articles") {
        if (!term) return true;
        return searchableText(item).toLowerCase().includes(term);
      }
      return false;
    });
  }, [libraryTab, query, saved]);

  const inboxCount = saved.filter((item) => !item.collection).length;
  const articleCount = saved.filter((item) => item.contentType === "article").length;
  const totalFlashcards = reviewCards.length + flashcardSets.reduce((count, set) => count + set.cards.length, 0);

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

  const openLastRead = () => {
    const last = progress[0]?.article;
    const author = last && typeof last === "object" && typeof last.author === "object" ? last.author : null;
    if (last && typeof last === "object" && author?.username) navigate(`/articles/${author.username}/${last.slug}`);
    else navigate("/read");
  };

  const shareSavedItem = async (savedItem: SavedItem) => {
    const content = savedItem.item;
    const title = searchableText(savedItem) || "Saved item";
    const article = savedItem.contentType === "article" && content && "slug" in content ? content : null;
    const url = article?.author?.username ? `${window.location.origin}/articles/${article.author.username}/${article.slug}` : window.location.origin;
    try {
      await navigator.clipboard.writeText(url);
      dispatch(pushToast({ title: `${title.slice(0, 48)} link copied`, tone: "success" }));
    } catch {
      dispatch(pushToast({ title: "Unable to copy link", tone: "error" }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/70">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Library</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Your knowledge vault.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">Store, organize, search, and manage saved knowledge. Launch learning when you are ready.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
            <Metric label="Saved" value={saved.length} />
            <Metric label="Collections" value={collections.length} />
            <Metric label="Inbox" value={inboxCount} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved articles, notes, cards..." className="h-12 rounded-xl pl-10" />
          </div>
          <Button type="button" variant="secondary" className="h-12 rounded-xl" onClick={() => navigate("/learn?session=due")}>
            <Layers3 className="h-4 w-4" />
            Learn Now
          </Button>
        </div>
      </section>
      <LearningLoopStrip current="Save" next="Understand and practice" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 space-y-4">
          <LibraryTabs active={libraryTab} onChange={setLibraryTab} />
          <div className="max-w-full overflow-x-auto pb-1">
            <Tabs value={activeCollection} onChange={setActiveCollection} items={tabs} className="flex shrink-0 flex-nowrap" />
          </div>

          {libraryTab === "All" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <KnowledgeBucket icon={Inbox} title="Knowledge Inbox" value={`${inboxCount} items`} description="Newly saved items waiting to be organized." />
              <KnowledgeBucket icon={BookOpen} title="Saved Articles" value={`${articleCount} articles`} description="Reading material you can return to." />
              <KnowledgeBucket icon={Layers3} title="Flashcards" value={`${totalFlashcards} cards`} description="Learning material available in Learn." />
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => <Card key={item} className="h-40 animate-pulse bg-ink-100 dark:bg-ink-900" />)}
            </div>
          ) : null}

          {!isLoading && !filteredSaved.length && ["All", "Articles"].includes(libraryTab) ? (
            <EmptyState title="Nothing found in this view" description="Save articles or adjust your search and collection filters." action={<Button variant="secondary" onClick={() => navigate("/read")}>Find articles</Button>} />
          ) : null}

          <div className="space-y-4">
            {["All", "Articles"].includes(libraryTab) ? filteredSaved.map((savedItem) =>
              savedItem.contentType === "article" && savedItem.item ? (
                <div key={savedItem._id} className="space-y-2">
                  <ArticleCard article={savedItem.item as Article} />
                  <SavedItemActions savedItem={savedItem} onShare={() => void shareSavedItem(savedItem)} onMove={() => setLibraryTab("Knowledge Collections")} />
                </div>
              ) : savedItem.item ? (
                <div key={savedItem._id} className="space-y-2">
                  <PostCard post={savedItem.item as Post} />
                  <SavedItemActions savedItem={savedItem} onShare={() => void shareSavedItem(savedItem)} onMove={() => setLibraryTab("Knowledge Collections")} />
                </div>
              ) : null
            ) : null}

            {libraryTab === "Flashcards" ? (
              <div className="space-y-3">
                {flashcardSets.map((set) => (
                  <Card key={set._id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500">Flashcard set</p>
                        <h3 className="mt-1 truncate font-semibold text-ink-950 dark:text-ink-50">{set.articleTitle}</h3>
                        <p className="mt-2 text-sm text-ink-500">{set.cards.length} cards stored in your library.</p>
                      </div>
                      <Button variant="secondary" onClick={() => navigate(`/learn?session=article&article=${set.articleId}`)}>Learn Now</Button>
                    </div>
                  </Card>
                ))}
                {reviewCards.slice(0, 8).map((card) => (
                  <Card key={card._id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500">Flashcard</p>
                        <h3 className="mt-1 line-clamp-2 font-semibold text-ink-950 dark:text-ink-50">{card.front}</h3>
                        <p className="mt-2 text-xs text-ink-500">Due {new Date(card.dueAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="secondary" onClick={() => navigate("/learn?session=due")}>Learn Now</Button>
                    </div>
                  </Card>
                ))}
                {!flashcardSets.length && !reviewCards.length ? (
                  <EmptyState title="No flashcards stored yet" description="Generate flashcards from articles, then manage them here and practice them in Learn." action={<Button variant="secondary" onClick={() => navigate("/read")}>Find an article</Button>} />
                ) : null}
              </div>
            ) : null}

            {libraryTab === "Highlights" ? (
              <EmptyState title="Highlights belong to your reading context" description="Saved highlights will live here as knowledge objects once highlight storage is connected." action={<Button variant="secondary" onClick={openLastRead}>{progress.length ? "Open last read article" : "Find an article"}</Button>} />
            ) : null}

            {libraryTab === "Notes" ? (
              <EmptyState title="Notes will become searchable library objects" description="For now, create notes from article reading spaces and return here as the vault evolves." action={<Button variant="secondary" onClick={openLastRead}>{progress.length ? "Open last read article" : "Find an article"}</Button>} />
            ) : null}

            {libraryTab === "Knowledge Collections" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {collections.map((collection) => <CollectionCard key={collection._id} collection={collection} onEdit={startEdit} onDelete={async () => {
                  await deleteCollection(collection._id).unwrap();
                  dispatch(pushToast({ title: "Collection deleted", tone: "success" }));
                }} />)}
                {!collections.length ? <EmptyState title="Create your first collection" description="Use collections as knowledge folders for saved articles, notes, highlights, and flashcards." /> : null}
              </div>
            ) : null}
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">{editing ? "Edit collection" : "Create collection"}</h2>
            <p className="mt-1 text-sm text-ink-500">Collections organize knowledge. Learn handles practice.</p>
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

          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">Quick organization</h2>
            <div className="mt-4 grid gap-2 text-sm text-ink-600 dark:text-ink-300">
              <InfoRow icon={Inbox} label="Inbox" value={`${inboxCount} unfiled`} />
              <InfoRow icon={Archive} label="Collections" value={`${collections.length} folders`} />
              <InfoRow icon={FileText} label="Saved items" value={`${saved.length} total`} />
            </div>
          </Card>

          <div className="grid gap-3">
            {collections.slice(0, 4).map((collection) => <CollectionCard key={collection._id} collection={collection} compact onEdit={startEdit} onDelete={async () => {
              await deleteCollection(collection._id).unwrap();
              dispatch(pushToast({ title: "Collection deleted", tone: "success" }));
            }} />)}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950/60">
      <p className="text-base font-semibold text-ink-950 dark:text-ink-50">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}

function KnowledgeBucket({ icon: Icon, title, value, description }: { icon: typeof Inbox; title: string; value: string; description: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-accent-50 p-2 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300"><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-medium text-ink-950 dark:text-ink-50">{title}</p>
          <p className="mt-1 font-semibold text-ink-950 dark:text-ink-50">{value}</p>
          <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Inbox; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-3 py-2 dark:border-ink-800">
      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-ink-400" />{label}</span>
      <span className="text-ink-500">{value}</span>
    </div>
  );
}

function CollectionCard({ collection, compact, onEdit, onDelete }: { collection: Collection; compact?: boolean; onEdit: (collection: Collection) => void; onDelete: () => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {collection.isPublic ? <Unlock className="h-4 w-4 text-ink-400" /> : <Lock className="h-4 w-4 text-ink-400" />}
            <h3 className="truncate font-medium text-ink-950 dark:text-ink-50">{collection.name}</h3>
          </div>
          {!compact ? <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{collection.description || "A focused folder for saved knowledge."}</p> : null}
          <p className="mt-2 text-xs text-ink-500">{collection.itemsCount} saved items</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(collection)} aria-label="Edit collection">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete collection">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SavedItemActions({ savedItem, onShare, onMove }: { savedItem: SavedItem; onShare: () => void; onMove: () => void }) {
  const navigate = useNavigate();
  const content = savedItem.item;
  const article = savedItem.contentType === "article" && content && "slug" in content ? content : null;
  const articlePath = article?.author?.username ? `/articles/${article.author.username}/${article.slug}` : "/read";

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-ink-200 bg-white/80 p-2 shadow-sm dark:border-ink-800 dark:bg-ink-900/70">
      <Button size="sm" variant="secondary" onClick={() => navigate(articlePath)}>
        <BookOpen className="h-4 w-4" />
        Continue Reading
      </Button>
      <Button size="sm" variant="ghost" onClick={() => navigate(articlePath)}>
        <Sparkles className="h-4 w-4" />
        Summarize
      </Button>
      <Button size="sm" variant="ghost" onClick={() => article ? navigate(`/learn?session=article&article=${article._id}`) : navigate("/learn")}>
        <Layers3 className="h-4 w-4" />
        Generate Flashcards
      </Button>
      <Button size="sm" variant="ghost" onClick={() => navigate("/write")}>
        <FileText className="h-4 w-4" />
        Write Learning Log
      </Button>
      <Button size="sm" variant="ghost" onClick={onMove}>
        <Folder className="h-4 w-4" />
        Move to Collection
      </Button>
      <Button size="sm" variant="ghost" onClick={onShare}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
