import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { BrandLogo } from "../components/brand/BrandLogo";

export const AuthLayout = () => (
  <main className="grid min-h-screen grid-cols-1 bg-ink-50 dark:bg-ink-950 lg:grid-cols-[1fr_0.9fr]">
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <BrandLogo size="lg" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-ink-500 dark:text-ink-400">
            A calmer place to read, write, and grow a public knowledge identity.
          </p>
        </motion.div>
        <Outlet />
      </div>
    </section>
    <aside className="hidden border-l border-ink-200 bg-white px-12 py-14 dark:border-ink-800 dark:bg-ink-900 lg:flex lg:flex-col lg:justify-center">
      <motion.div
        className="mx-auto grid w-full max-w-xl gap-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">
            Knowledge-first social
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal text-ink-950 dark:text-ink-50">
            Turn reading into writing, and writing into a public body of knowledge.
          </h1>
        </div>
        <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-ink-800 dark:bg-ink-950/60">
          <div className="grid gap-3">
            {["Read with intent", "Capture what matters", "Publish your thinking"].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm font-medium text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700 dark:bg-accent-950 dark:text-accent-300">
                  {index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 text-sm leading-6 text-ink-600 dark:text-ink-400">
          <p>Save ideas, shape them into articles, and let your profile reflect the work you are actually doing.</p>
          <p className="text-xs text-ink-400 dark:text-ink-500">Built by Vishesh Khandal</p>
        </div>
      </motion.div>
    </aside>
  </main>
);
