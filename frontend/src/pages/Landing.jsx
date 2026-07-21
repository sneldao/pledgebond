import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VaultSeal from "@/components/VaultSeal";
import RibbonButton from "@/components/RibbonButton";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import SoccerBallLoader from "@/components/SoccerBallLoader";
import { CategoryMotif } from "@/components/PbIllustrations";
import { setSession, getSession } from "@/lib/session";
import { sfx, unlockAudio } from "@/lib/sound";
import { api } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Sparkles, Eye, CheckCircle, TrendingUp, ArrowLeft } from "lucide-react";

const PLEDGE_GOALS = [
  { key: "football", label: "Football goal", sub: "Fitness, skills, or match streak", icon: "\u26BD", template: "football", color: "#7B1730" },
  { key: "fitness", label: "Fitness goal", sub: "Run, lift, or train for 30 days", icon: "\uD83C\uDFC3", template: "fitness", color: "#1F6B4E" },
  { key: "project", label: "Ship a project", sub: "Launch by deadline, no excuses", icon: "\uD83D\uDE80", template: "contest", color: "#A77D2A" },
  { key: "custom", label: "Something else", sub: "Any pledge you can seal", icon: "\u2728", template: null, color: "#2B4A66" },
];

// Motion variants — custom easing (emil-design-eng)
const EASE_OUT = [0.23, 1, 0.32, 1];

const stepVariants = {
  enter: { opacity: 0, y: 24, scale: 0.96 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
};

const stepTransition = { duration: 0.32, ease: EASE_OUT };

export default function Landing() {
  const nav = useNavigate();
  const [name, setName] = useState(getSession()?.displayName || "");
  const [goal, setGoal] = useState(null);
  const [stats, setStats] = useState(null);
  const [sealState, setSealState] = useState("idle");
  const [sealHint, setSealHint] = useState("Tap the seal to see how it works");
  const [transitioning, setTransitioning] = useState(false);
  const [step, setStep] = useState("hero"); // hero | goal | name
  const nameInputRef = useRef(null);

  useEffect(() => {
    document.title = "Pledgebond \u2014 Seal Your Vow";
    api.stats().then(setStats).catch(() => {});
  }, []);

  // Focus name input when entering name step
  useEffect(() => {
    if (step === "name" && nameInputRef.current) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 360);
      return () => clearTimeout(t);
    }
  }, [step]);

  const tapSeal = useCallback(() => {
    unlockAudio();
    if (sealState === "idle") {
      setSealState("sealed");
      setSealHint("The vault is sealed. Your crew is watching.");
      sfx.sealLock();
    } else if (sealState === "sealed") {
      setSealState("released");
      setSealHint("Goal met. The vault opens. HERE WE GO.");
      sfx.release();
      const sealEl = document.getElementById("landing-interactive-seal");
      if (sealEl) {
        const rect = sealEl.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({ particleCount: 80, spread: 70, origin: { x, y }, colors: ["#C49A3A", "#E0C06A", "#9A1F3D", "#1F6B4E"] });
      }
    } else if (sealState === "released") {
      setSealState("failed");
      setSealHint("Deadline missed. The vault stays shut. Everyone sees the L.");
      sfx.fail();
    } else {
      setSealState("idle");
      setSealHint("Tap the seal to see how it works");
    }
  }, [sealState]);

  const proceedToGoal = () => {
    unlockAudio();
    setStep("goal");
  };

  const selectGoal = (g) => {
    setGoal(g);
    setStep("name");
  };

  const proceed = () => {
    unlockAudio();
    if (!name.trim()) {
      toast.error("Sign your mark first", { description: "Enter a display name to be witnessed on the ledger." });
      return;
    }
    if (!goal) {
      toast.error("Choose what you're pledging", { description: "Pick a goal above to get started." });
      return;
    }
    const selected = PLEDGE_GOALS.find((g) => g.key === goal);
    setSession({ displayName: name.trim(), role: "fundee", color: selected?.color || "#A77D2A" });
    toast.success(`Welcome, ${name.trim()}`, { description: `Pledging: ${selected?.label}` });
    if (selected?.template) {
      if (goal === "football") {
        setTransitioning(true);
        setTimeout(() => nav(`/create?template=${selected.template}`), 1200);
      } else {
        nav(`/create?template=${selected.template}`);
      }
    } else {
      nav("/explore");
    }
  };

  const sealStatus = sealState === "sealed" || sealState === "released" ? "active" : sealState === "failed" ? "failed" : "pending";
  const sealPledgeRatio = sealState === "released" ? 1 : sealState === "sealed" ? 0.7 : 0.45;
  const selectedGoal = PLEDGE_GOALS.find((g) => g.key === goal);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center parchment-noise">
      <AmbientBackdrop />

      {/* Football transition overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(255, 251, 242, 0.95)" }}
            data-testid="landing-football-transition"
          >
            <SoccerBallLoader label="HERE WE GO..." size={72} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-[460px] px-5 pt-8 pb-24 relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        {/* Wordmark — always visible, top */}
        <div className="text-center mb-2" data-testid="landing-problem-statement">
          <h1 className="font-serif-display text-[28px] leading-none tracking-serif-tight text-ink">
            Pledge<span className="text-wax">bond</span>
          </h1>
        </div>

        {/* Subtle stats pill — not prominent */}
        {stats && (
          <div className="flex items-center justify-center gap-3 mb-4 opacity-70" data-testid="landing-social-proof">
            <StatPill icon={<CheckCircle size={11} />} value={stats.bonds_sealed} label="sealed" />
            <StatPill icon={<Eye size={11} />} value={stats.witnesses_watching} label="watching" />
            <StatPill icon={<TrendingUp size={11} />} value={stats.proofs_logged} label="proofs" />
          </div>
        )}

        {/* Step container — progressive disclosure */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">

            {/* STEP 1 — HERO: seal demo + hook */}
            {step === "hero" && (
              <motion.div
                key="hero"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="flex flex-col items-center"
                data-testid="landing-step-hero"
              >
                {/* Interactive seal */}
                <div className="relative flex flex-col items-center justify-center" data-testid="landing-interactive-seal-container">
                  <button
                    id="landing-interactive-seal"
                    onClick={tapSeal}
                    data-testid="landing-interactive-seal-button"
                    className="relative cursor-pointer outline-none press-feedback"
                    aria-label="Tap the seal to preview the pledge lifecycle"
                  >
                    <motion.div
                      key={sealState}
                      initial={sealState !== "idle" ? { scale: 0.9, opacity: 0.6 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
                    >
                      <VaultSeal
                        status={sealStatus}
                        pledgeRatio={sealPledgeRatio}
                        size={220}
                        style="burgundy"
                        showTension={sealState === "sealed"}
                        hidePill
                      />
                    </motion.div>
                  </button>

                  {/* Seal hint — origin-aware, asymmetric timing */}
                  <div className="mt-3 h-[40px] flex items-center justify-center" style={{ transformOrigin: "center top" }}>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={sealHint}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: EASE_OUT }}
                        className={`font-serif-display text-[14px] text-center max-w-[300px] ${
                          sealState === "failed" ? "text-wax italic" : sealState === "released" ? "text-emerald-800" : "text-ink-600"
                        }`}
                        data-testid="landing-seal-hint"
                      >
                        {sealHint}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* State dots */}
                  <div className="mt-1 flex items-center gap-1.5">
                    {["idle", "sealed", "released", "failed"].map((s) => (
                      <div
                        key={s}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${sealState === s ? "bg-wax" : "bg-parchment-300"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* One-line hook — no paragraph, no problem statement */}
                <p className="mt-6 font-serif-display italic text-[16px] text-ink text-center max-w-[320px] leading-snug">
                  Seal your vow. Your crew witnesses it.<br />Break it, and everyone sees the L.
                </p>

                {/* Primary CTA */}
                <div className="mt-8 w-full max-w-[320px]">
                  <RibbonButton
                    variant="wax"
                    onClick={proceedToGoal}
                    data-testid="landing-continue-button"
                    className="w-full press-feedback"
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    Seal Your Vow
                  </RibbonButton>
                  <button
                    onClick={() => nav("/explore")}
                    className="mt-3 w-full font-ui text-[12px] text-ink-500 underline underline-offset-4 hover:text-ink transition-colors press-feedback"
                    data-testid="landing-preview-button"
                  >
                    Browse open bonds first
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — GOAL PICKER */}
            {step === "goal" && (
              <motion.div
                key="goal"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="flex flex-col items-center"
                data-testid="landing-step-goal"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep("hero")}
                  className="self-start mb-4 flex items-center gap-1 font-ui text-[12px] text-ink-500 hover:text-ink transition-colors press-feedback"
                  data-testid="landing-back-to-hero"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="font-serif-display text-[22px] text-ink text-center mb-1">
                  What are you pledging?
                </div>
                <p className="font-ui text-[12px] text-ink-500 text-center mb-6">
                  Pick a goal. We'll draft the bond.
                </p>

                {/* Goal cards — staggered entrance */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[380px]">
                  {PLEDGE_GOALS.map((g, i) => (
                    <motion.button
                      key={g.key}
                      onClick={() => selectGoal(g.key)}
                      data-testid={`goal-picker-${g.key}-button`}
                      className="text-left px-3 py-3.5 border transition-all flex flex-col gap-1 press-feedback hover:border-ink hover:bg-parchment-200/60 border-parchment-300"
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: EASE_OUT, delay: i * 0.06 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <CategoryMotif category={g.key} size="small" />
                      <span className="font-serif-display text-[16px] text-ink leading-tight">{g.label}</span>
                      <span className="font-ui text-[11px] text-ink-500">{g.sub}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Football accent — inline, not a separate CTA */}
                <div className="mt-5 flex items-center gap-2 text-ink-500">
                  <SoccerBallLoader label="" size={20} />
                  <span className="font-ui text-[11px]">Football pledges get the full HERE WE GO treatment.</span>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — NAME INPUT */}
            {step === "name" && (
              <motion.div
                key="name"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="flex flex-col items-center"
                data-testid="landing-step-name"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep("goal")}
                  className="self-start mb-4 flex items-center gap-1 font-ui text-[12px] text-ink-500 hover:text-ink transition-colors press-feedback"
                  data-testid="landing-back-to-goal"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {/* Selected goal recap */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 border border-parchment-300 bg-parchment-50">
                  <CategoryMotif category={selectedGoal?.key} size="small" />
                  <div>
                    <div className="font-serif-display text-[15px] text-ink leading-tight">{selectedGoal?.label}</div>
                    <div className="font-ui text-[10px] text-ink-500">{selectedGoal?.sub}</div>
                  </div>
                </div>

                <div className="font-serif-display text-[22px] text-ink text-center mb-1">
                  Sign your mark
                </div>
                <p className="font-ui text-[12px] text-ink-500 text-center mb-6">
                  No account required. Stored only on this device.
                </p>

                <div className="w-full max-w-[320px] space-y-2">
                  <input
                    ref={nameInputRef}
                    id="display-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") proceed(); }}
                    placeholder="e.g. Marco Rossi"
                    data-testid="landing-display-name-input"
                    className="w-full px-4 py-3 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[16px] text-ink placeholder:text-ink-500/50 focus:border-wax transition-colors"
                  />
                </div>

                <div className="mt-6 w-full max-w-[320px]">
                  <RibbonButton
                    variant="wax"
                    onClick={proceed}
                    data-testid="landing-continue-button"
                    className="w-full press-feedback"
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    {goal ? `Seal Your ${selectedGoal?.label}` : "Choose a goal to begin"}
                  </RibbonButton>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer disclaimer — subtle, bottom */}
        <p className="mt-4 font-ui text-[10px] text-ink-500/70 text-center">
          Stakes are pledge points — commitment signals, not real money.
        </p>
      </div>
    </div>
  );
}

function StatPill({ icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5" data-testid={`landing-stat-${label.replace(/\s/g, "-")}`}>
      <span className="text-wax">{icon}</span>
      <span className="font-serif-display text-[14px] text-ink leading-none">{value}</span>
      <span className="font-ui text-[9px] uppercase tracking-wider text-ink-500">{label}</span>
    </div>
  );
}
