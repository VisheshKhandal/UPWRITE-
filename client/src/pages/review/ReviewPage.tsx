import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock, FolderOpen, Layers3, Play, RotateCcw, Sparkles, Target } from "lucide-react";
import { FlashcardReview } from "../../components/review/FlashcardReview";
import { EmptyState } from "../../components/common/EmptyState";
import { LearningLoopStrip } from "../../components/common/LearningLoopStrip";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { nextReview, useFlashcardsQuery, useUpdateFlashcardMutation } from "../../features/flashcards/flashcardsApi";
import { useFlashcardSetsQuery, useSaveFlashcardSetMutation } from "../../features/ai/aiApi";
import { useCollectionsQuery } from "../../features/collections/collectionsApi";
import { useSavedQuery } from "../../features/saved/savedApi";
import { useReadingProgressQuery } from "../../features/readingProgress/readingProgressApi";
import { useAppSelector } from "../../app/hooks";
import { AuthPrompt } from "../../components/auth/AuthPrompt";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; message: string; action?: string }>({
    open: false,
    message: "Continue with Upwrite"
  });
  const [syncingArticle, setSyncingArticle] = useState("");
  const sessionMode = params.get("session");
  const sessionArticle = params.get("article") ?? "";
  const { data: dueCards = [], isLoading: dueLoading } = useFlashcardsQuery({ due: true }, { skip: !user });
  const { data: articleCards = [], isLoading: articleCardsLoading } = useFlashcardsQuery(
    sessionMode === "article" && sessionArticle ? { article: sessionArticle } : undefined,
    { skip: !user }
  );
  const { data: allCards = [], isLoading: cardsLoading } = useFlashcardsQuery(undefined, { skip: !user });
  const { data: flashcardSets = [] } = useFlashcardSetsQuery(undefined, { skip: !user });
  const { data: collections = [] } = useCollectionsQuery({ limit: 6 }, { skip: !user });
  const { data: saved = [] } = useSavedQuery({ limit: 12 }, { skip: !user });
  const { data: progress = [] } = useReadingProgressQuery(undefined, { skip: !user });
  const [updateCard] = useUpdateFlashcardMutation();
  const [saveFlashcardSet] = useSaveFlashcardSetMutation();
  const sessionActive = sessionMode === "due" || sessionMode === "article";
  const sessionCards = sessionMode === "article" ? articleCards : dueCards;
  const sessionLoading = sessionMode === "article" ? articleCardsLoading : dueLoading;
  const selectedSet = flashcardSets.find((set) => set.articleId === sessionArticle);

  const learnedCards = allCards.filter((card) => card.lastReviewedAt).length;
  const hardCards = allCards.filter((card) => card.difficulty === "hard").length;
  const recentlyReviewed = allCards.filter((card) => card.lastReviewedAt).sort((a, b) => new Date(b.lastReviewedAt ?? 0).getTime() - new Date(a.lastReviewedAt ?? 0).getTime());
  const weeklyReviewed = recentlyReviewed.filter((card) => Date.now() - new Date(card.lastReviewedAt ?? 0).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const inProgressReads = progress.filter((item) => !item.completedAt && item.progressPercent > 0);
  const readyCollections = collections.filter((collection) => collection.itemsCount > 0);
  const hasLearningMaterial = dueCards.length || allCards.length || flashcardSets.length || saved.length;

  const openLastRead = () => {
    const last = progress[0]?.article;
    const author = last && typeof last === "object" && typeof last.author === "object" ? last.author : null;
    if (last && typeof last === "object" && author?.username) navigate(`/articles/${author.username}/${last.slug}`);
    else navigate("/read");
  };

  useEffect(() => {
    if (sessionMode !== "article" || !sessionArticle || articleCardsLoading || articleCards.length || !selectedSet) return;
    if (syncingArticle === sessionArticle) return;
    setSyncingArticle(sessionArticle);
    void saveFlashcardSet({
      articleId: selectedSet.articleId,
      articleTitle: selectedSet.articleTitle,
      cards: selectedSet.cards
    });
  }, [articleCards.length, articleCardsLoading, saveFlashcardSet, selectedSet, sessionArticle, sessionMode, syncingArticle]);

  const startDueSession = () => {
    if (!user) {
      setAuthPrompt({ open: true, message: "Sign in to save your flashcards.", action: "study" });
      return;
    }
    const next = new URLSearchParams(params);
    next.set("session", "due");
    next.delete("article");
    setParams(next);
  };

  const startArticleSession = (articleId: string) => {
    if (!user) {
      setAuthPrompt({ open: true, message: "Sign in to save your flashcards.", action: "study" });
      return;
    }
    const next = new URLSearchParams(params);
    next.set("session", "article");
    next.set("article", articleId);
    setParams(next);
  };

  const exitSession = () => {
    const next = new URLSearchParams(params);
    next.delete("session");
    setParams(next);
  };

  if (sessionActive) {
    return (
      <div className="mx-auto max-w-4xl min-w-0 space-y-6 overflow-x-clip px-[max(0px,env(safe-area-inset-left))]">
        <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/70">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Learning session</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Today&apos;s flashcards</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">Reveal each answer, rate honestly, and Upwrite will schedule the next review.</p>
        </section>
        {sessionLoading ? (
          <Card className="h-80 animate-pulse bg-ink-100 dark:bg-ink-900" />
        ) : (
          <FlashcardReview
            cards={sessionCards}
            onExit={exitSession}
            onRate={(id, patch: ReturnType<typeof nextReview>) =>
              user
                ? updateCard({ id, ...patch }).unwrap()
                : Promise.resolve(setAuthPrompt({ open: true, message: "Sign in to save your flashcards.", action: "study" }))
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl min-w-0 space-y-6 overflow-x-clip px-[max(0px,env(safe-area-inset-left))]">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/70">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Learn</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Turn saved knowledge into recall.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              {user ? "Start today's practice, resume unfinished reading, or launch learning from your library collections." : "Explore how Upwrite turns saved articles into review, recall, and learning momentum."}
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-center sm:min-w-80 lg:w-auto">
            <Metric label="Due" value={dueCards.length} />
            <Metric label="Learned" value={learnedCards} />
            <Metric label="Sets" value={flashcardSets.length} />
          </div>
        </div>
      </section>
      <LearningLoopStrip current="Practice" next="Reflect in a learning log" />

      {!hasLearningMaterial && !dueLoading && !cardsLoading ? (
        <EmptyState
          title="Your learning queue is ready when your library is."
          description="Save articles, generate flashcards, or create collections to start building a learning workflow."
          action={<Button variant="secondary" onClick={() => navigate("/library")}>Open Library</Button>}
        />
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 overflow-hidden space-y-6">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Today’s Learning</h2>
                <p className="mt-1 text-sm text-ink-500">{dueCards.length ? `${dueCards.length} cards are ready for practice.` : "No cards are due right now."}</p>
              </div>
              <Button disabled={!dueCards.length} onClick={startDueSession}>
                <Play className="h-4 w-4" />
                Start session
              </Button>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <LearningCard icon={Target} title="Daily queue" value={`${dueCards.length} due`} description="Cards scheduled for practice now." />
              <LearningCard icon={RotateCcw} title="Needs reinforcement" value={`${hardCards} hard`} description="Cards marked difficult recently." />
              <LearningCard icon={CheckCircle2} title="Practice history" value={`${learnedCards} reviewed`} description="Cards with completed review data." />
            </div>
          </section>

          {inProgressReads.length ? (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Continue Learning</h2>
              <div className="grid gap-3">
                {inProgressReads.slice(0, 3).map((item) => {
                  const article = typeof item.article === "object" ? item.article : null;
                  const author = article && typeof article.author === "object" ? article.author : null;
                  return (
                    <Card key={item._id} className="overflow-hidden p-4">
                      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500">Reading progress</p>
                          <h3 className="mt-1 truncate font-semibold text-ink-950 dark:text-ink-50">{article?.title ?? "Saved article"}</h3>
                          <div className="mt-3 h-1.5 max-w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                            <div className="h-full rounded-full bg-accent-600 dark:bg-accent-400" style={{ width: `${Math.min(100, item.progressPercent)}%` }} />
                          </div>
                        </div>
                        <Button variant="secondary" className="shrink-0 self-start md:self-center" onClick={() => article && author?.username ? navigate(`/articles/${author.username}/${article.slug}`) : openLastRead()}>
                          Continue
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section id="flashcard-session" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Flashcard Session</h2>
              <p className="mt-1 text-sm text-ink-500">Flip, rate, and let Upwrite schedule the next review.</p>
            </div>
            {dueLoading ? (
              <Card className="h-72 animate-pulse bg-ink-100 dark:bg-ink-900" />
            ) : (
              <FlashcardReview
                cards={dueCards}
                onExit={exitSession}
                onRate={(id, patch: ReturnType<typeof nextReview>) =>
                  user
                    ? updateCard({ id, ...patch }).unwrap()
                    : Promise.resolve(setAuthPrompt({ open: true, message: "Sign in to save your flashcards.", action: "study" }))
                }
              />
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Review history</p>
              <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">{weeklyReviewed} cards reviewed this week</h2>
              <div className="mt-4 space-y-3">
                {recentlyReviewed.slice(0, 3).map((card) => (
                  <div key={card._id} className="rounded-lg border border-ink-200 p-3 dark:border-ink-800">
                    <p className="line-clamp-2 text-sm font-medium text-ink-800 dark:text-ink-100">{card.front}</p>
                    <p className="mt-1 text-xs text-ink-500">Reviewed {card.lastReviewedAt ? new Date(card.lastReviewedAt).toLocaleDateString() : "recently"}</p>
                  </div>
                ))}
                {!recentlyReviewed.length ? <p className="text-sm text-ink-500">Review cards to build a visible learning trail.</p> : null}
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Weak areas</p>
              <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">{hardCards} cards need reinforcement</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">Upwrite prioritizes cards marked hard or again so practice stays focused.</p>
              <Button className="mt-5" variant="secondary" disabled={!hardCards} onClick={startDueSession}>Review weak cards</Button>
            </Card>
          </section>
        </main>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">Ready to Learn</h2>
            <div className="mt-4 space-y-3">
              {flashcardSets.slice(0, 4).map((set) => (
                <div key={set._id} className="rounded-lg border border-ink-200 p-3 dark:border-ink-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{set.articleTitle}</p>
                      <p className="mt-1 text-xs text-ink-500">{set.cards.length} flashcards</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => startArticleSession(set.articleId)}>Learn</Button>
                  </div>
                </div>
              ))}
              {!flashcardSets.length ? <p className="text-sm text-ink-500">Generate flashcards from an article to create your first learning set.</p> : null}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">Learning Collections</h2>
            <div className="mt-4 space-y-3">
              {readyCollections.slice(0, 4).map((collection) => (
                <div key={collection._id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{collection.name}</p>
                    <p className="text-xs text-ink-500">{collection.itemsCount} saved items</p>
                  </div>
                  <Link to={`/library`} className="text-xs font-medium text-accent-700 dark:text-accent-300">Open</Link>
                </div>
              ))}
              {!readyCollections.length ? <p className="text-sm text-ink-500">Organize saved items into collections, then practice from here.</p> : null}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">Next best actions</h2>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={() => navigate("/library")}><FolderOpen className="h-4 w-4" />Organize Library</Button>
              <Button variant="secondary" onClick={() => navigate("/read")}><BookOpen className="h-4 w-4" />Find Articles</Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-ink-950 dark:text-ink-50">Weekly digest</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">{weeklyReviewed ? `You reviewed ${weeklyReviewed} cards this week. Turn the strongest insight into a learning log.` : "Review a few cards and Upwrite will turn practice into a useful weekly summary."}</p>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => navigate("/write")}>Write reflection</Button>
          </Card>
        </aside>
      </div>
      <AuthPrompt
        open={authPrompt.open}
        message={authPrompt.message}
        action={authPrompt.action}
        onClose={() => setAuthPrompt((current) => ({ ...current, open: false }))}
      />
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

function LearningCard({ icon: Icon, title, value, description }: { icon: typeof Clock; title: string; value: string; description: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-accent-50 p-2 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-950 dark:text-ink-50">{title}</p>
          <p className="mt-1 text-lg font-semibold text-ink-950 dark:text-ink-50">{value}</p>
          <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>
        </div>
      </div>
    </Card>
  );
}
