import { ExternalLink, Github, Linkedin } from "lucide-react";
import { Card } from "../../components/ui/Card";

const sections = [
  {
    title: "What is Upwrite?",
    body:
      "Upwrite is a modern knowledge-sharing platform for people who want to turn learning into public momentum. It brings articles, short updates, creator profiles, saved collections, and discovery into one calm space built around ideas that are worth returning to."
  },
  {
    title: "How it is different",
    body:
      "Unlike noisy social feeds, Upwrite is centered on thoughtful writing and creator identity. It combines the long-form clarity of Medium, the personal publishing feel of Substack, the clean product focus of Linear, and the organized knowledge style of Notion."
  },
  {
    title: "How it helps",
    body:
      "Upwrite helps learners, builders, and creators document progress, explain concepts, share experiences, discover useful insights, and build trust through consistent public work. Every profile becomes a living portfolio of what someone knows, builds, and cares about."
  },
  {
    title: "How to use it",
    body:
      "Create a profile, write articles, share focused posts, follow creators, save useful content into collections, and use your profile link as a public knowledge hub. The more you publish and curate, the more your learning journey becomes visible and useful to others."
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="grid gap-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">About Upwrite</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-ink-950 dark:text-ink-50 sm:text-5xl">
            A creator-focused platform for learning in public.
          </h1>
        </div>
        <p className="text-base leading-8 text-ink-600 dark:text-ink-400">
          Upwrite is a modern knowledge-sharing platform designed and developed by Vishesh Khandal, a software engineering student passionate about technology, learning, and personal growth. Built with the vision of connecting curious minds, Upwrite enables people to publish ideas, share experiences, discover valuable insights, and grow together through the power of knowledge.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="p-6">
            <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-ink-600 dark:text-ink-400">{section.body}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-950">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Creator</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-950 dark:text-ink-50">Vishesh Khandal</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600 dark:text-ink-400">
          Upwrite reflects Vishesh&apos;s interest in software engineering, practical learning, and building products that help people organize and share knowledge with confidence.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900" href="https://github.com/VisheshKhandal" target="_blank" rel="noreferrer">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900" href="https://www.linkedin.com/in/vishesh-khandal-451826310/" target="_blank" rel="noreferrer">
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
          <a className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900" href="https://ams-orpin-mu.vercel.app/pages/dashboard.html" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Attendance Management System
          </a>
        </div>
      </section>
    </div>
  );
}
