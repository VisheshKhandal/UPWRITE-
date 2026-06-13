import { Outlet } from "react-router-dom";
import { BrandLogo } from "../components/brand/BrandLogo";

export const AuthLayout = () => (
  <main className="grid min-h-screen grid-cols-1 bg-ink-50 dark:bg-ink-950 lg:grid-cols-[1fr_0.9fr]">
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <BrandLogo />
        <Outlet />
      </div>
    </section>
    <aside className="hidden border-l border-ink-200 bg-white px-12 py-14 dark:border-ink-800 dark:bg-ink-900 lg:flex lg:flex-col lg:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">
          Knowledge-first social
        </p>
        <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight tracking-normal text-ink-950 dark:text-ink-50">
          Build a public identity around learning, writing, and thoughtful progress.
        </h1>
      </div>
      <div className="grid gap-4 text-sm leading-6 text-ink-600 dark:text-ink-400">
        <p>Write articles. Document progress. Follow builders. Save knowledge.</p>
        <p>Calm by design, fast by default, and focused on meaningful growth.</p>
        <p className="pt-4 text-xs text-ink-400 dark:text-ink-500">Built by Vishesh Khandal</p>
      </div>
    </aside>
  </main>
);
