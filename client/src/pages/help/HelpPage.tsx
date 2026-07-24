import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Bug, CheckCircle2, ChevronDown, FileText, Github, HelpCircle, Layers3, Library, Lightbulb, Linkedin, Lock, Mail, MessageSquare, Paperclip, PenLine, Search, Sparkles, UserRound, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { cn } from "../../utils/cn";
import { useAppSelector } from "../../app/hooks";
import { useCreateContactSubmissionMutation, type ContactPriority, type ContactSubmissionType } from "../../features/contact/contactApi";
import { getErrorMessage } from "../../utils/errors";

const categories = [
  { id: "getting-started", title: "Getting Started", icon: HelpCircle, body: "Create your profile, choose interests, follow creators, and start with Today for your next best action." },
  { id: "reading", title: "Reading", icon: BookOpen, body: "Use Read to discover articles by topic, search, author, popularity, and freshness." },
  { id: "writing", title: "Writing Articles", icon: PenLine, body: "Draft long-form articles, upload covers, improve clarity, save drafts, and publish to your profile." },
  { id: "logs", title: "Learning Logs", icon: FileText, body: "Capture short reflections, insights, achievements, and updates up to the learning log word limit." },
  { id: "library", title: "Library & Collections", icon: Library, body: "Save articles and posts, organize them into collections, and return when you are ready to learn." },
  { id: "learn", title: "Flashcards & Review", icon: Layers3, body: "Generate flashcards, review due cards, and practice ideas until they become easier to recall." },
  { id: "ai", title: "AI Features", icon: Sparkles, body: "Summarize, simplify, explain selections, generate notes, suggest tags, and create flashcards from source material." },
  { id: "profile", title: "Profile", icon: UserRound, body: "Show your articles, learning logs, skills, interests, stats, and public learning identity." },
  { id: "account", title: "Account & Privacy", icon: Lock, body: "Manage appearance, security settings, profile visibility, social links, and notification preferences." }
];

const faqs = [
  ["What is the fastest way to start?", "Open Read, save one useful article, generate flashcards or notes, then write one learning log about what you understood."],
  ["What is a learning log?", "A learning log is a short public note about what you learned, built, questioned, or realized. It is lighter than an article and useful for momentum."],
  ["How are articles different from learning logs?", "Articles are polished long-form writing. Learning logs are quick reflections, insights, achievements, or updates that document progress."],
  ["Where do saved items go?", "Saved articles and posts appear in Library, where you can search, organize collections, and launch learning workflows."],
  ["How do flashcards work?", "Upwrite can generate flashcards from article content. Reviewed cards receive due dates so Learn can show what needs practice."],
  ["Is AI required?", "No. AI is a helper for understanding and recall. You can still read, save, write, publish, and organize without using AI actions."],
  ["Can I use Upwrite as a portfolio?", "Yes. Your profile shows your published articles, learning logs, creator details, and engagement as a public knowledge identity."],
  ["How do I report a bug?", "Use the contact actions at the bottom of this page and include what happened, what you expected, and the page where it occurred."]
];

const walkthroughs = [
  ["Publish your first article", ["Open Write.", "Choose Article.", "Add a title, content, excerpt, tags, and cover if useful.", "Save as draft or publish.", "Find it later in Profile or Studio."]],
  ["Turn reading into review", ["Open an article.", "Use AI to generate flashcards.", "Save the flashcard set.", "Open Learn.", "Start a due or article-specific review session."]],
  ["Build a useful library", ["Save articles or posts.", "Open Library.", "Create focused collections.", "Move from saved knowledge into Learn when you are ready.", "Return to Write to publish what you learned."]]
];

type SupportMode = "bug" | "feature" | "feedback" | "creator";

const supportActions: Array<{ mode: SupportMode; title: string; body: string; icon: typeof Bug }> = [
  { mode: "bug", title: "Report Bug", body: "Tell us what broke so we can improve the product with useful context.", icon: Bug },
  { mode: "feature", title: "Suggest Feature", body: "Start with the problem you want Upwrite to solve better.", icon: Lightbulb },
  { mode: "feedback", title: "Give Feedback", body: "Share thoughts, suggestions, or your overall experience.", icon: MessageSquare },
  { mode: "creator", title: "Contact Creator", body: "Reach Vishesh directly through personal creator channels.", icon: Mail }
];

const getTechnicalContext = (theme: string, username?: string) => ({
  browser: typeof navigator === "undefined" ? "Unknown" : navigator.userAgent,
  operatingSystem: typeof navigator === "undefined" ? "Unknown" : navigator.platform,
  theme,
  viewport: typeof window === "undefined" ? "Unknown" : `${window.innerWidth}x${window.innerHeight}`,
  currentUrl: typeof window === "undefined" ? "Unknown" : window.location.href,
  currentRoute: typeof window === "undefined" ? "Unknown" : window.location.pathname,
  timestamp: new Date().toISOString(),
  user: username ?? "Not signed in"
});

const typeByMode: Record<SupportMode, ContactSubmissionType> = {
  bug: "bug_report",
  feature: "feature_request",
  feedback: "general_feedback",
  creator: "creator_contact"
};

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [supportMode, setSupportMode] = useState<SupportMode | null>(null);
  const theme = useAppSelector((state) => state.ui.theme);
  const user = useAppSelector((state) => state.auth.user);
  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/70 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Help Center</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-ink-950 dark:text-ink-50 sm:text-5xl">Learn how to use Upwrite.</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ink-600 dark:text-ink-400">
              Practical guides for reading deeply, saving knowledge, using AI, reviewing flashcards, publishing work, and building your public learning identity.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics..." className="h-12 rounded-xl pl-10" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Categories</p>
            <nav className="grid gap-1" aria-label="Help categories">
              {categories.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-[background-color,color] duration-150 hover:bg-ink-100 focus-visible:bg-accent-50 dark:text-ink-300 dark:hover:bg-ink-800/70 dark:focus-visible:bg-accent-950/25">
                  {item.title}
                </a>
              ))}
            </nav>
          </Card>
        </aside>

        <main className="min-w-0 space-y-8">
          <section className="grid gap-4 md:grid-cols-2">
            {filteredCategories.map((item) => (
              <Card key={item.id} id={item.id} className="scroll-mt-24 p-5 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:bg-ink-50/70 focus-within:ring-2 focus-within:ring-accent-500 dark:hover:border-accent-800 dark:hover:bg-ink-800/35">
                <item.icon className="h-5 w-5 text-accent-700 dark:text-accent-300" />
                <h2 className="mt-4 text-lg font-semibold text-ink-950 dark:text-ink-50">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.body}</p>
              </Card>
            ))}
          </section>

          {!filteredCategories.length ? (
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold">No help topics found</h2>
              <p className="mt-2 text-sm text-ink-500">Try searching for writing, library, AI, flashcards, profile, or account.</p>
              <Button variant="secondary" className="mt-5" onClick={() => setQuery("")}>Clear search</Button>
            </Card>
          ) : null}

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Walkthroughs</p>
              <h2 className="mt-2 text-2xl font-semibold">Common workflows</h2>
            </div>
            <div className="grid gap-4">
              {walkthroughs.map(([title, steps]) => (
                <Card key={title as string} className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <ol className="mt-4 grid gap-2">
                    {(steps as string[]).map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-ink-600 dark:text-ink-400">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-50 text-xs font-semibold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">{index + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">FAQs</p>
              <h2 className="mt-2 text-2xl font-semibold">Quick answers</h2>
            </div>
            <div className="grid gap-3">
              {faqs.map(([question, answer], index) => {
                const open = openFaq === index;
                return (
                  <Card key={question} className="overflow-hidden">
                    <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} className={cn(
                      "flex w-full items-center justify-between gap-3 p-5 text-left transition-[background-color,color] duration-150 hover:bg-ink-50 focus-visible:bg-accent-50 dark:hover:bg-ink-800/40 dark:focus-visible:bg-accent-950/25",
                      open && "bg-accent-50/40 text-ink-950 dark:bg-accent-950/15 dark:text-ink-50"
                    )}>
                      <span className="font-semibold">{question}</span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-500 transition-transform", open && "rotate-180")} />
                    </button>
                    {open ? <p className="border-t border-ink-200 px-5 py-4 text-sm leading-7 text-ink-600 dark:border-ink-800 dark:text-ink-400">{answer}</p> : null}
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-panel dark:border-ink-800 dark:bg-ink-900/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Contact Upwrite</p>
                <h2 className="mt-2 text-2xl font-semibold">Can't find what you're looking for?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">Choose the action that best matches what you are trying to do. You will stay inside the Help Center.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {supportActions.map((action) => (
                <button
                  key={action.mode}
                  type="button"
                  onClick={() => setSupportMode(action.mode)}
                  className="group rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:bg-accent-50/35 hover:shadow-panel focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-ink-800 dark:bg-ink-950/45 dark:hover:border-accent-800 dark:hover:bg-accent-950/12"
                >
                  <action.icon className="h-5 w-5 text-accent-700 transition-transform duration-200 group-hover:scale-105 dark:text-accent-300" />
                  <p className="mt-4 font-semibold">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{action.body}</p>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
      <SupportModal
        mode={supportMode}
        onClose={() => setSupportMode(null)}
        technicalContext={getTechnicalContext(theme, user?.username)}
      />
    </div>
  );
}

function SupportModal({
  mode,
  onClose,
  technicalContext
}: {
  mode: SupportMode | null;
  onClose: () => void;
  technicalContext: ReturnType<typeof getTechnicalContext>;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    message: "",
    expectedBehavior: "",
    actualBehavior: "",
    expectedBenefit: "",
    priority: "medium" as ContactPriority,
    screenshot: null as File | null
  });
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("Every report helps improve Upwrite. We'll review your feedback soon.");
  const [createSubmission, createState] = useCreateContactSubmissionMutation();

  useEffect(() => {
    if (!mode) return;
    setSubmitted(false);
    setRating(0);
    setError("");
    setResultMessage("Every report helps improve Upwrite. We'll review your feedback soon.");
    setForm({
      name: "",
      email: "",
      title: "",
      message: "",
      expectedBehavior: "",
      actualBehavior: "",
      expectedBenefit: "",
      priority: "medium",
      screenshot: null
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (!mode) return null;

  const action = supportActions.find((item) => item.mode === mode);
  const Icon = action?.icon ?? MessageSquare;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const result = await createSubmission({
        type: typeByMode[mode],
        name: form.name.trim() || undefined,
        email: form.email.trim(),
        title: form.title.trim() || undefined,
        message: form.message.trim(),
        expectedBehavior: form.expectedBehavior.trim() || undefined,
        actualBehavior: form.actualBehavior.trim() || undefined,
        expectedBenefit: form.expectedBenefit.trim() || undefined,
        priority: form.priority,
        satisfactionRating: mode === "feedback" && rating ? rating : undefined,
        screenshot: form.screenshot,
        metadata: technicalContext
      }).unwrap();

      setResultMessage(result.confirmation.message);
      setSubmitted(true);
    } catch (submissionError) {
      setError(getErrorMessage(submissionError, "Could not send this request. Please review the form and try again."));
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] grid place-items-center px-4 py-6" role="dialog" aria-modal="true" aria-label={action?.title ?? "Contact Upwrite"}>
        <motion.button
          type="button"
          className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm"
          aria-label="Close contact modal"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl dark:border-ink-800 dark:bg-ink-950"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink-200 pb-4 dark:border-ink-800">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Contact Upwrite</p>
                <h2 className="mt-1 text-xl font-semibold">{action?.title}</h2>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close modal"><X className="h-4 w-4" /></Button>
          </div>

          {submitted ? (
            <motion.div className="py-10 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold">Thanks!</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">{resultMessage}</p>
              <Button className="mt-6" variant="secondary" onClick={onClose}>Return to Help Center</Button>
            </motion.div>
          ) : mode === "creator" ? (
            <form onSubmit={submit} className="space-y-4 pt-5">
              <p className="text-sm leading-7 text-ink-600 dark:text-ink-400">Use these channels for creator contact. Product support and bug reports work best through the structured actions in Help Center.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a className="rounded-xl border border-ink-200 p-4 text-sm font-medium transition hover:border-accent-300 hover:bg-ink-50 dark:border-ink-800 dark:hover:border-accent-800 dark:hover:bg-ink-900" href="mailto:hello@upwrite.app"><Mail className="mb-3 h-5 w-5 text-accent-700 dark:text-accent-300" />Email</a>
                <a className="rounded-xl border border-ink-200 p-4 text-sm font-medium transition hover:border-accent-300 hover:bg-ink-50 dark:border-ink-800 dark:hover:border-accent-800 dark:hover:bg-ink-900" href="https://github.com/VisheshKhandal" target="_blank" rel="noreferrer"><Github className="mb-3 h-5 w-5 text-accent-700 dark:text-accent-300" />GitHub</a>
                <a className="rounded-xl border border-ink-200 p-4 text-sm font-medium transition hover:border-accent-300 hover:bg-ink-50 dark:border-ink-800 dark:hover:border-accent-800 dark:hover:bg-ink-900" href="https://www.linkedin.com/in/vishesh-khandal-451826310/" target="_blank" rel="noreferrer"><Linkedin className="mb-3 h-5 w-5 text-accent-700 dark:text-accent-300" />LinkedIn</a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                <Input required label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" />
              </div>
              <Input label="Subject" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="What is this about?" />
              <Textarea required label="Message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Write your message..." className="min-h-28" />
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p> : null}
              <div className="flex flex-col-reverse gap-2 border-t border-ink-200 pt-4 dark:border-ink-800 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={createState.isLoading}>Send to Upwrite</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                <Input required label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" />
              </div>
              {mode === "bug" ? (
                <>
                  <Textarea required label="What happened?" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Describe the issue clearly..." className="min-h-28" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Textarea label="Expected behavior" value={form.expectedBehavior} onChange={(event) => setForm((current) => ({ ...current, expectedBehavior: event.target.value }))} placeholder="What did you expect?" className="min-h-24" />
                    <Textarea label="Actual behavior" value={form.actualBehavior} onChange={(event) => setForm((current) => ({ ...current, actualBehavior: event.target.value }))} placeholder="What happened instead?" className="min-h-24" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-900 dark:text-ink-100">
                      <span className="mb-2 block">Priority</span>
                      <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ContactPriority }))} className="h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-950 transition-colors focus:border-accent-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-ink-900 dark:text-ink-100">
                      <span className="mb-2 block">Optional screenshot</span>
                      <span className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 text-sm text-ink-500 dark:border-ink-700"><Paperclip className="h-4 w-4" /> Attach from device</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => setForm((current) => ({ ...current, screenshot: event.target.files?.[0] ?? null }))} />
                      {form.screenshot ? <span className="mt-1 block text-xs text-ink-500">{form.screenshot.name}</span> : null}
                    </label>
                  </div>
                </>
              ) : null}

              {mode === "feature" ? (
                <>
                  <Input required label="Feature title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Short name for the idea" />
                  <Textarea required label="What problem are you trying to solve?" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Describe the user problem, not just the feature..." className="min-h-28" />
                  <Textarea required label="Expected benefit" value={form.expectedBenefit} onChange={(event) => setForm((current) => ({ ...current, expectedBenefit: event.target.value }))} placeholder="How would this improve Upwrite?" className="min-h-24" />
                </>
              ) : null}

              {mode === "feedback" ? (
                <>
                  <Textarea required label="Your feedback" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Share thoughts, suggestions, or your overall experience..." className="min-h-32" />
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-100">Satisfaction rating</p>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button key={value} type="button" onClick={() => setRating(value)} className={cn("grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold transition", rating === value ? "border-accent-300 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-950/25 dark:text-accent-200" : "border-ink-200 text-ink-500 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900")}>{value}</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              <details className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm dark:border-ink-800 dark:bg-ink-900/60">
                <summary className="cursor-pointer font-medium text-ink-800 dark:text-ink-100">Automatically attached technical context</summary>
                <dl className="mt-3 grid gap-2 text-xs text-ink-500">
                  {Object.entries(technicalContext).map(([key, value]) => (
                    <div key={key} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
                      <dt className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p> : null}

              <div className="flex flex-col-reverse gap-2 border-t border-ink-200 pt-4 dark:border-ink-800 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={createState.isLoading}>Send to Upwrite</Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
