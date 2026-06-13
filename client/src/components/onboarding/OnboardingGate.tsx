import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, BriefcaseBusiness, Check, Code2, Compass, PenLine, Rocket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setCurrentUser } from "../../features/auth/authSlice";
import { useCompleteOnboardingMutation, useCompleteProductTourMutation } from "../../features/settings/settingsApi";
import { pushToast } from "../../features/ui/uiSlice";
import { getErrorMessage } from "../../utils/errors";
import { BrandLogo } from "../brand/BrandLogo";
import { Button } from "../ui/Button";
import { ProductTourOverlay } from "./ProductTourOverlay";

const interests = ["DSA", "Web Development", "AI", "Cyber Security", "DevOps", "Open Source", "Startups", "Productivity", "Books", "Career Growth", "Personal Development"];
const identities = [
  ["student", "Student", BookOpen],
  ["developer", "Developer", Code2],
  ["creator", "Creator", Sparkles],
  ["writer", "Writer", PenLine],
  ["freelancer", "Freelancer", BriefcaseBusiness],
  ["founder", "Founder", Rocket],
  ["learner", "Learner", Compass]
] as const;
const goals = [
  ["learn_skills", "Learn skills"],
  ["build_personal_brand", "Build a personal brand"],
  ["share_knowledge", "Share knowledge"],
  ["document_journey", "Document my journey"],
  ["grow_audience", "Grow an audience"],
  ["find_opportunities", "Find opportunities"]
] as const;
const learningPreferences = [
  ["short_reads", "Short reads"],
  ["deep_dives", "Deep dives"],
  ["project_based", "Project-based learning"],
  ["community_discussion", "Community discussion"]
] as const;
const writingPreferences = [
  ["quick_posts", "Quick posts"],
  ["long_form", "Long-form essays"],
  ["learning_logs", "Learning logs"],
  ["tutorials", "Tutorials"]
] as const;

type Step = "welcome" | "interests" | "identity" | "goals" | "learning" | "writing" | "tour" | "done";

export function OnboardingGate() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [completeOnboarding, completeState] = useCompleteOnboardingMutation();
  const [completeTour] = useCompleteProductTourMutation();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [identity, setIdentity] = useState<(typeof identities)[number][0] | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Array<(typeof goals)[number][0]>>([]);
  const [selectedLearning, setSelectedLearning] = useState<Array<(typeof learningPreferences)[number][0]>>([]);
  const [selectedWriting, setSelectedWriting] = useState<Array<(typeof writingPreferences)[number][0]>>([]);
  const [finished, setFinished] = useState(false);

  const steps: Step[] = ["welcome", "interests", "identity", "goals", "learning", "writing", "tour", "done"];
  const shouldShow = finished || Boolean(user?.onboarding?.required && !user.onboarding?.completed);
  const progress = useMemo(() => steps.indexOf(step) + 1, [step]);

  useEffect(() => {
    if (!shouldShow) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const toggle = <T extends string>(item: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const save = async (tourCompleted: boolean) => {
    if (!identity || selectedInterests.length < 3 || !selectedGoals.length || !selectedLearning.length || !selectedWriting.length) {
      dispatch(pushToast({ title: "Complete each onboarding step before finishing.", tone: "error" }));
      return;
    }
    try {
      const updated = await completeOnboarding({
        interests: selectedInterests,
        identity,
        goals: selectedGoals,
        learningPreferences: selectedLearning,
        writingPreferences: selectedWriting,
        tourCompleted
      }).unwrap();
      setFinished(true);
      dispatch(setCurrentUser(updated));
      dispatch(pushToast({ title: "Your Upwrite experience is personalized.", tone: "success" }));
      setStep("done");
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not save onboarding"), tone: "error" }));
    }
  };

  const onTourClose = async (completed: boolean) => {
    await save(completed);
    if (completed) {
      try {
        const updated = await completeTour().unwrap();
        dispatch(setCurrentUser(updated));
      } catch {
        // The primary onboarding save already records tour completion when available.
      }
    }
  };

  const Choice = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 text-left transition-colors duration-150 active:scale-[0.99] ${active ? "border-accent-300 bg-accent-300/15 text-white shadow-[0_0_0_1px_rgba(121,213,178,0.18)]" : "border-white/10 bg-white/[0.04] text-ink-200 hover:bg-white/[0.08]"}`}
    >
      <span className="min-w-0 font-medium">{label}</span>
      <span className="grid h-5 w-5 shrink-0 place-items-center">{active ? <Check className="h-4 w-4 text-accent-200" /> : null}</span>
    </button>
  );

  const QuestionShell = ({ eyebrow, title, children, back, next, disabled, nextLabel = "Continue" }: { eyebrow: string; title: string; children: React.ReactNode; back: Step; next: Step; disabled?: boolean; nextLabel?: string }) => (
    <motion.section key={step} className="w-full max-w-4xl" initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -14, filter: "blur(8px)" }} transition={{ duration: 0.28 }}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-200">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{title}</h1>
      {children}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setStep(back)}>Back</Button>
        <Button type="button" disabled={disabled} onClick={() => setStep(next)}>{nextLabel}</Button>
      </div>
    </motion.section>
  );

  return (
    <>
      {step !== "tour" ? (
        <div className="fixed inset-0 z-[70] overflow-hidden bg-ink-950 text-white" role="dialog" aria-modal="true" aria-label="Upwrite onboarding">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(52,138,109,0.26),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative mx-auto flex h-dvh w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo />
              <div className="min-w-[120px] text-right text-xs font-medium text-ink-300">Step {Math.min(progress, 6)} of 6</div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <motion.div className="h-full rounded-full bg-accent-300" animate={{ width: `${Math.min(progress, 6) / 6 * 100}%` }} />
            </div>
            <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto py-8">
              <AnimatePresence mode="wait">
                {step === "welcome" ? (
                  <motion.section key="welcome" className="max-w-3xl text-center" initial={{ opacity: 0, filter: "blur(14px)", scale: 0.98 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }} transition={{ duration: 0.45 }}>
                    <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl"><Sparkles className="h-7 w-7 text-accent-200" /></div>
                    <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">Welcome to Upwrite</h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink-200 sm:text-lg">Learn publicly. Write thoughtfully. Build your digital identity.</p>
                    <Button type="button" size="lg" className="mt-9 bg-white text-ink-950 hover:bg-ink-100" onClick={() => setStep("interests")}>Start Journey</Button>
                  </motion.section>
                ) : null}
                {step === "interests" ? (
                  <QuestionShell eyebrow="Personalize your feed" title="What are you interested in?" back="welcome" next="identity" disabled={selectedInterests.length < 3}>
                    <p className="mt-4 text-sm text-ink-300">Choose at least 3 topics.</p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{interests.map((item) => <Choice key={item} label={item} active={selectedInterests.includes(item)} onClick={() => toggle(item, setSelectedInterests)} />)}</div>
                  </QuestionShell>
                ) : null}
                {step === "identity" ? (
                  <QuestionShell eyebrow="Creator context" title="What best describes you?" back="interests" next="goals" disabled={!identity}>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{identities.map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setIdentity(value)} className={`flex min-h-24 items-center gap-4 rounded-lg border p-4 text-left transition ${identity === value ? "border-accent-300 bg-accent-300/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}><span className="grid h-11 w-11 place-items-center rounded-lg bg-white/10"><Icon className="h-5 w-5" /></span><span className="font-medium">{label}</span></button>)}</div>
                  </QuestionShell>
                ) : null}
                {step === "goals" ? (
                  <QuestionShell eyebrow="Your direction" title="What do you want from Upwrite?" back="identity" next="learning" disabled={!selectedGoals.length}>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">{goals.map(([value, label]) => <Choice key={value} label={label} active={selectedGoals.includes(value)} onClick={() => toggle(value, setSelectedGoals)} />)}</div>
                  </QuestionShell>
                ) : null}
                {step === "learning" ? (
                  <QuestionShell eyebrow="Learning style" title="How do you prefer to learn?" back="goals" next="writing" disabled={!selectedLearning.length}>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">{learningPreferences.map(([value, label]) => <Choice key={value} label={label} active={selectedLearning.includes(value)} onClick={() => toggle(value, setSelectedLearning)} />)}</div>
                  </QuestionShell>
                ) : null}
                {step === "writing" ? (
                  <QuestionShell eyebrow="Writing rhythm" title="What will you likely publish?" back="learning" next="tour" disabled={!selectedWriting.length} nextLabel="Start Product Tour">
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">{writingPreferences.map(([value, label]) => <Choice key={value} label={label} active={selectedWriting.includes(value)} onClick={() => toggle(value, setSelectedWriting)} />)}</div>
                  </QuestionShell>
                ) : null}
                {step === "done" ? (
                  <motion.section key="done" className="max-w-2xl text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-accent-300/40 bg-accent-300/15"><Check className="h-7 w-7 text-accent-200" /></div>
                    <h1 className="mt-8 text-4xl font-semibold sm:text-5xl">You're ready to start your journey.</h1>
                    <p className="mt-4 text-lg text-ink-200">Choose where you want to begin.</p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                      <Button type="button" size="lg" loading={completeState.isLoading} className="bg-white text-ink-950 hover:bg-ink-100" onClick={() => { setFinished(false); navigate("/write"); }}>Create First Post</Button>
                      <Button type="button" size="lg" variant="secondary" onClick={() => { setFinished(false); navigate("/search"); }}>Explore Community</Button>
                    </div>
                  </motion.section>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : null}
      <ProductTourOverlay open={step === "tour"} onClose={onTourClose} />
    </>
  );
}
