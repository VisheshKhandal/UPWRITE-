import { useState } from "react";
import { ArrowRight, BookOpen, Brain, CheckCircle2, Github, Layers3, Library, Linkedin, MessageSquare, PenLine, Repeat2, Search, Sparkles, UserRound } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

const loopSteps = [
  { label: "Read", icon: BookOpen, body: "Discover useful articles and ideas worth spending real attention on." },
  { label: "Save", icon: Library, body: "Keep valuable knowledge in your library instead of losing it in a feed." },
  { label: "Understand", icon: Brain, body: "Use AI to summarize, simplify, explain selections, and extract takeaways." },
  { label: "Practice", icon: Repeat2, body: "Turn ideas into flashcards, review them, and strengthen recall over time." },
  { label: "Write", icon: PenLine, body: "Publish learning logs and articles that make your thinking visible." },
  { label: "Build Identity", icon: UserRound, body: "Let your profile become a public record of what you know and care about." }
];

const differences = [
  { name: "Medium", strength: "publishing", upwrite: "connects publishing to reading, notes, review, and identity." },
  { name: "Notion", strength: "private knowledge", upwrite: "turns organized knowledge into public learning momentum." },
  { name: "LinkedIn", strength: "professional identity", upwrite: "builds identity from actual learning and writing." },
  { name: "Readwise", strength: "reading retention", upwrite: "adds publishing, profiles, and community around retained ideas." },
  { name: "Anki", strength: "recall practice", upwrite: "connects flashcards to articles, AI, and public learning." },
  { name: "Substack", strength: "audience publishing", upwrite: "focuses less on broadcasting and more on learning in public." }
];

const experiences = [
  ["Read", "Find focused articles by topic, tag, title, or creator.", BookOpen],
  ["Library", "Save articles, posts, flashcards, and collections into a knowledge vault.", Library],
  ["Learn", "Review flashcards and continue unfinished reading from one calm workspace.", Layers3],
  ["Write", "Create long-form articles or quick learning logs while the idea is fresh.", PenLine],
  ["AI Assistant", "Summarize, explain, generate notes, and create flashcards from source material.", Sparkles],
  ["Profile", "Show articles, learning logs, skills, interests, and creator momentum.", UserRound],
  ["Creator Studio", "Manage drafts, published work, comments, and today’s learning loop.", CheckCircle2],
  ["Collections", "Group useful knowledge into public or private folders.", Library],
  ["Review Sessions", "Practice due cards and keep learning from fading after reading.", Repeat2]
] as const;

const audiences = ["Students", "Developers", "Creators", "Founders", "Researchers", "Lifelong Learners", "Freelancers", "Writers"];
const roadmap = ["AI Learning", "Knowledge Graph", "Smarter Collections", "Mobile Experience", "Better Review System", "Study Packs", "Audio Learning", "Offline Reading"];
const manifesto = [
  "We believe learning should not end after reading.",
  "We believe ideas become valuable when they are organized, practiced, and shared.",
  "We believe public learning builds trust more honestly than polished self-promotion.",
  "We believe your knowledge deserves a permanent home."
];

export default function AboutPage() {
  const [activeLoop, setActiveLoop] = useState(0);
  const ActiveIcon = loopSteps[activeLoop].icon;

  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-10">
      <section className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">About Upwrite</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-ink-950 dark:text-ink-50 sm:text-6xl">
            The learning-in-public platform.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 dark:text-ink-300">
            Upwrite helps people turn what they read, learn, and build into organized knowledge, active recall, thoughtful writing, and a public identity that compounds over time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => document.getElementById("learning-loop")?.scrollIntoView({ behavior: "smooth" })}>
              Explore the loop <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => document.getElementById("manifesto")?.scrollIntoView({ behavior: "smooth" })}>
              Read the manifesto
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden p-5">
          <div className="grid gap-3">
            {loopSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => setActiveLoop(index)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-200 hover:bg-ink-100/70 focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:border-accent-900 dark:hover:bg-ink-800/55",
                  activeLoop === index
                    ? "scale-[1.01] border-accent-300 bg-accent-50/45 shadow-panel ring-1 ring-accent-200/40 dark:border-accent-800 dark:bg-accent-950/18 dark:ring-accent-700/25"
                    : "border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-900/55"
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-100 text-accent-700 dark:bg-ink-950 dark:text-accent-300">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{step.label}</span>
                  <span className="block text-sm leading-6 text-ink-500">{step.body}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">What is Upwrite?</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">One connected system for learning, writing, and identity.</h2>
        </div>
        <p className="text-base leading-8 text-ink-600 dark:text-ink-400">
          Upwrite is where reading becomes reusable knowledge. Save useful ideas, understand them with AI, turn them into notes and flashcards, practice what matters, then publish articles and learning logs that show your growth. Your profile becomes a living knowledge identity, not just a static bio.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Learning is easy to lose", "Most reading fades because it is not organized, revisited, or connected to action."],
          ["Private notes stay invisible", "Good ideas often sit alone in apps where they cannot build trust, feedback, or momentum."],
          ["Public learning compounds", "When you explain what you learn, you clarify your thinking and create a record others can trust."]
        ].map(([title, body]) => (
          <Card key={title} className="p-6">
            <h3 className="text-xl font-semibold text-ink-950 dark:text-ink-50">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-ink-600 dark:text-ink-400">{body}</p>
          </Card>
        ))}
      </section>

      <section id="learning-loop" className="scroll-mt-24 rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/70 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">The Upwrite Learning Loop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">From attention to public proof.</h2>
          </div>
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950">
            <div className="flex items-center gap-3">
              <ActiveIcon className="h-5 w-5 text-accent-700 dark:text-accent-300" />
              <p className="font-semibold">{loopSteps[activeLoop].label}</p>
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{loopSteps[activeLoop].body}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {loopSteps.map((step, index) => (
            <button key={step.label} type="button" onClick={() => setActiveLoop(index)} className={cn(
              "group rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-200 hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:border-accent-900 dark:hover:bg-ink-800/55",
              activeLoop === index
                ? "scale-[1.015] border-accent-300 bg-accent-50/45 shadow-panel ring-1 ring-accent-200/40 dark:border-accent-800 dark:bg-accent-950/18 dark:ring-accent-700/25"
                : "border-ink-200 bg-white/70 dark:border-ink-800 dark:bg-ink-900/55"
            )}>
              <step.icon className="h-5 w-5 text-accent-700 dark:text-accent-300" />
              <p className="mt-4 font-semibold">{step.label}</p>
              <p className="mt-1 text-xs text-ink-500">Step {index + 1}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">What makes it different</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Upwrite connects tools that usually live apart.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {differences.map((item) => (
            <Card key={item.name} className="p-5">
              <p className="text-sm font-semibold text-ink-500">{item.name} is known for {item.strength}.</p>
              <p className="mt-2 text-base font-medium leading-7 text-ink-950 dark:text-ink-50">Upwrite {item.upwrite}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Core product experience</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {experiences.map(([title, body, Icon]) => (
            <Card key={title} className="p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-800">
              <Icon className="h-5 w-5 text-accent-700 dark:text-accent-300" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Who it is for</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal">Built for people who learn by doing.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((audience) => (
            <Card key={audience} className="p-4">
              <p className="font-semibold">{audience}</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">Use Upwrite to capture progress, explain ideas, and create public proof of learning.</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="manifesto" className="scroll-mt-24 rounded-2xl border border-ink-200 bg-ink-950 p-6 text-white shadow-panel dark:border-ink-800 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-300">Manifesto</p>
        <div className="mt-6 space-y-5">
          {manifesto.map((line) => <p key={line} className="max-w-4xl text-2xl font-semibold leading-snug sm:text-3xl">{line}</p>)}
        </div>
        <p className="mt-8 text-lg text-ink-300">That is why we built Upwrite.</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Built by</p>
          <h2 className="mt-2 text-2xl font-semibold">Vishesh Khandal</h2>
          <p className="mt-2 text-sm font-medium text-ink-500">Software Engineering Student</p>
          <p className="mt-4 text-sm leading-7 text-ink-600 dark:text-ink-400">Building tools that help people learn better, organize ideas with confidence, and turn knowledge into public momentum.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900" href="https://github.com/VisheshKhandal" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> GitHub</a>
            <a className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900" href="https://www.linkedin.com/in/vishesh-khandal-451826310/" target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /> LinkedIn</a>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Roadmap</p>
          <h2 className="mt-2 text-2xl font-semibold">Where Upwrite is heading</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {roadmap.map((item) => <span key={item} className="rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-600 dark:border-ink-800 dark:text-ink-300">{item}</span>)}
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-panel dark:border-ink-800 dark:bg-ink-900/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Community & feedback</p>
            <h2 className="mt-2 text-2xl font-semibold">Help shape the platform for public learners.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.location.href = "mailto:hello@upwrite.app?subject=Upwrite%20Feedback"}><MessageSquare className="h-4 w-4" /> Share feedback</Button>
            <Button variant="ghost" onClick={() => window.location.href = "/help"}><Search className="h-4 w-4" /> Open Help Center</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
