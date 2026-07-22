import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VaultSeal from "@/components/VaultSeal";
import RibbonButton from "@/components/RibbonButton";
import ParticleField from "@/components/ParticleField";
import SoccerBallLoader from "@/components/SoccerBallLoader";
import { CategoryMotif } from "@/components/PbIllustrations";
import { setSession, getSession } from "@/lib/session";
import { sfx, unlockAudio } from "@/lib/sound";
import { api } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Sparkles, Eye, CheckCircle, TrendingUp, ArrowLeft } from "lucide-react";
import { 
  SignetRing, 
  SignetRingPicker, 
  TensionSlider, 
  AtmospherePicker, 
  DeadlineChips 
} from "@/components/motion";

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
  const particleRef = useRef(null);
  const sealWrapRef = useRef(null);
  const [sealTilt, setSealTilt] = useState({ rx: 0, ry: 0 });
  const [sealEntranceComplete, setSealEntranceComplete] = useState(false);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [ctaClicked, setCtaClicked] = useState(false);
  
  // Personalization state for Step 3
  const [pledgeContext, setPledgeContext] = useState("");
  const [pledgeTarget, setPledgeTarget] = useState("");
  const [pledgeDeadline, setPledgeDeadline] = useState("");
  const [sealStyle, setSealStyle] = useState("burgundy");
  const [signetStyle, setSignetStyle] = useState("classic");
  const [tensionLevel, setTensionLevel] = useState("standard");
  const [atmosphere, setAtmosphere] = useState("archive");

  // Cinematic seal entrance — drop in with thud
  useEffect(() => {
    if (step !== "hero") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setSealEntranceComplete(true);
      return;
    }

    // Delay slightly for page load
    const timer = setTimeout(() => {
      // Trigger screen shake
      let shakeIntensity = 8;
      const shakeInterval = setInterval(() => {
        setScreenShake({
          x: (Math.random() - 0.5) * shakeIntensity,
          y: (Math.random() - 0.5) * shakeIntensity,
        });
        shakeIntensity *= 0.7;
        if (shakeIntensity < 0.5) {
          clearInterval(shakeInterval);
          setScreenShake({ x: 0, y: 0 });
          setSealEntranceComplete(true);
        }
      }, 16);

      // Play seal-lock sound for the "thud"
      setTimeout(() => sfx.sealLock(), 400);
    }, 300);

    return () => clearTimeout(timer);
  }, [step]);

  // 3D parallax — mouse position maps to seal rotation (with inertia)
  useEffect(() => {
    if (step !== "hero") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let targetRx = 0, targetRy = 0;
    let currentRx = 0, currentRy = 0;
    let rafId = null;

    function onMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      targetRy = dx * 12;
      targetRx = -dy * 10;
    }
    function onLeave() {
      targetRx = 0;
      targetRy = 0;
    }

    function animate() {
      currentRx += (targetRx - currentRx) * 0.08;
      currentRy += (targetRy - currentRy) * 0.08;
      setSealTilt({ rx: currentRx, ry: currentRy });
      rafId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [step]);

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
    // Trigger particle burst from seal center
    const sealEl = document.getElementById("landing-interactive-seal");
    if (sealEl && particleRef.current) {
      const rect = sealEl.getBoundingClientRect();
      particleRef.current.burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    if (sealState === "idle") {
      setSealState("sealed");
      setSealHint("The vault is sealed. Your crew is watching.");
      sfx.sealLock();
    } else if (sealState === "sealed") {
      setSealState("released");
      setSealHint("Goal met. The vault opens. HERE WE GO.");
      sfx.release();
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
    setCtaClicked(true);
    // Trigger dramatic particle burst from CTA
    const btn = document.querySelector('[data-testid="landing-continue-button"]');
    if (btn && particleRef.current) {
      const rect = btn.getBoundingClientRect();
      particleRef.current.burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    // Delay step change for the burst to register
    setTimeout(() => setStep("goal"), 280);
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
    
    // Build URL params with personalization data
    const params = new URLSearchParams();
    if (selected?.template) params.set("template", selected.template);
    if (pledgeContext.trim()) params.set("context", pledgeContext.trim());
    if (pledgeTarget.trim()) params.set("target", pledgeTarget.trim());
    if (pledgeDeadline.trim()) params.set("deadline", pledgeDeadline.trim());
    params.set("seal", sealStyle);
    
    toast.success(`Welcome, ${name.trim()}`, { description: `Pledging: ${selected?.label}` });
    
    if (selected?.template) {
      if (goal === "football") {
        setTransitioning(true);
        setTimeout(() => nav(`/create?${params.toString()}`), 1200);
      } else {
        nav(`/create?${params.toString()}`);
      }
    } else {
      nav(`/explore`);
    }
  };

  const sealStatus = sealState === "sealed" || sealState === "released" ? "active" : sealState === "failed" ? "failed" : "pending";
  const sealPledgeRatio = sealState === "released" ? 1 : sealState === "sealed" ? 0.7 : 0.45;
  const selectedGoal = PLEDGE_GOALS.find((g) => g.key === goal);

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center parchment-noise"
      style={{
        transform: screenShake.x || screenShake.y ? `translate(${screenShake.x}px, ${screenShake.y}px)` : undefined,
      }}
    >
      {/* Interactive particle field — gold/burgundy embers, mouse-reactive */}
      <ParticleField ref={particleRef} />

      {/* Filmic vignette for depth */}
      <div className="landing-vignette" />

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

      <div className="mx-auto w-full max-w-[460px] px-5 pt-8 pb-24 relative flex-1 flex flex-col" style={{ zIndex: 2 }}>
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
                {/* Interactive seal — cinematic entrance + 3D parallax + glow */}
                <div className="relative flex flex-col items-center justify-center" data-testid="landing-interactive-seal-container">
                  <motion.div
                    className="seal-breathing"
                    initial={sealEntranceComplete ? false : { y: -600, opacity: 0, scale: 0.6, rotateZ: -15 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotateZ: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 180,
                      damping: 14,
                      mass: 1.2,
                      duration: 1.1,
                    }}
                  >
                    <div className="seal-parallax-container relative">
                      {/* Gold glow behind seal — enhanced breathing */}
                      <div className="seal-glow" />
                      {/* Wax shimmer overlay — subtle gold sweep */}
                      <div className="seal-shimmer-overlay" />
                      <button
                        id="landing-interactive-seal"
                        onClick={tapSeal}
                        data-testid="landing-interactive-seal-button"
                        className="relative cursor-pointer outline-none press-feedback seal-parallax-inner"
                        style={{
                          transform: `rotateX(${sealTilt.rx}deg) rotateY(${sealTilt.ry}deg)`,
                        }}
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
                    </div>
                  </motion.div>

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

                {/* One-line hook — staggered after seal lands */}
                <motion.p
                  className="mt-6 font-serif-display italic text-[16px] text-ink text-center max-w-[320px] leading-snug"
                  initial={sealEntranceComplete ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: sealEntranceComplete ? 0 : 0.8, ease: EASE_OUT }}
                >
                  Seal your vow. Your crew witnesses it.<br />Break it, and everyone sees the L.
                </motion.p>

                {/* Primary CTA — staggered after hook */}
                <motion.div
                  className="mt-8 w-full max-w-[320px]"
                  initial={sealEntranceComplete ? false : { opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: sealEntranceComplete ? 0 : 1.1, ease: EASE_OUT }}
                >
                  <motion.div
                    animate={ctaClicked ? { scale: [1, 1.05, 0], opacity: [1, 1, 0] } : {}}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <RibbonButton
                      variant="wax"
                      onClick={proceedToGoal}
                      data-testid="landing-continue-button"
                      className="w-full press-feedback"
                    >
                      <Sparkles size={14} className="inline mr-1" />
                      Seal Your Vow
                    </RibbonButton>
                  </motion.div>
                  <button
                    onClick={() => nav("/explore")}
                    className="mt-3 w-full font-ui text-[12px] text-ink-500 underline underline-offset-4 hover:text-ink transition-colors press-feedback"
                    data-testid="landing-preview-button"
                  >
                    Browse open bonds first
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 2 — GOAL PICKER */}
            {step === "goal" && (
              <motion.div
                key="goal"
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="flex flex-col items-center"
                data-testid="landing-step-goal"
              >
                {/* Back button — ink style */}
                <button
                  onClick={() => setStep("hero")}
                  className="self-start mb-6 flex items-center gap-1.5 font-ui text-[12px] text-ink-500 hover:text-ink transition-colors press-feedback group"
                  data-testid="landing-back-to-hero"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                </button>

                {/* Header with wax stamp accent */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-wax flex items-center justify-center">
                      <span className="font-serif-display text-[14px] text-parchment font-bold">2</span>
                    </div>
                  </div>
                  <h2 className="font-serif-display text-[26px] text-ink text-center mb-2 tracking-serif-tight">
                    What are you pledging?
                  </h2>
                  <p className="font-ui text-[13px] text-ink-500 text-center">
                    Choose your vow. We'll draft the bond.
                  </p>
                </div>

                {/* Goal cards — elevated with border treatment, better spacing */}
                <div className="w-full max-w-[400px] space-y-3">
                  {PLEDGE_GOALS.map((g, i) => (
                    <motion.button
                      key={g.key}
                      onClick={() => selectGoal(g.key)}
                      data-testid={`goal-picker-${g.key}-button`}
                      className="goal-card w-full text-left px-5 py-5 border-2 border-parchment-300 bg-parchment-50 flex items-center gap-4 press-feedback hover:border-wax hover:shadow-wax group"
                      initial={{ opacity: 0, x: -30, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.08 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Category motif — larger, with background */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-full bg-parchment-200 flex items-center justify-center border border-parchment-300 group-hover:border-wax group-hover:bg-wax/5 transition-colors">
                        <CategoryMotif category={g.key} size="medium" />
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-serif-display text-[18px] text-ink leading-tight mb-0.5">
                          {g.label}
                        </div>
                        <div className="font-ui text-[12px] text-ink-500 leading-snug">
                          {g.sub}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeft size={18} className="text-wax rotate-180" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Football accent — styled as a contract clause */}
                <div className="mt-8 flex items-start gap-3 text-ink-500 max-w-[400px]">
                  <div className="flex-shrink-0 mt-0.5">
                    <SoccerBallLoader label="" size={18} />
                  </div>
                  <div className="font-ui text-[11px] leading-relaxed">
                    <span className="font-semibold text-ink">Football pledges</span> get the full HERE WE GO treatment with matchday atmosphere.
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — NAME INPUT */}
            {step === "name" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="flex flex-col items-center"
                data-testid="landing-step-name"
              >
                {/* Back button — ink style */}
                <button
                  onClick={() => setStep("goal")}
                  className="self-start mb-6 flex items-center gap-1.5 font-ui text-[12px] text-ink-500 hover:text-ink transition-colors press-feedback group"
                  data-testid="landing-back-to-goal"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                </button>

                {/* Selected goal recap — elevated contract style */}
                <motion.div
                  className="w-full max-w-[400px] mb-8 px-5 py-4 border-2 border-parchment-300 bg-parchment-50 flex items-center gap-4 shadow-ink"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-parchment-200 flex items-center justify-center border border-parchment-300">
                    <CategoryMotif category={selectedGoal?.key} size="medium" />
                  </div>
                  <div className="flex-1">
                    <div className="font-ui text-[9px] uppercase tracking-wider text-ink-500 mb-0.5">Your pledge</div>
                    <div className="font-serif-display text-[17px] text-ink leading-tight">{selectedGoal?.label}</div>
                  </div>
                  <div className="wax-stamp text-[9px]">Bond Draft</div>
                </motion.div>

                {/* Header with wax stamp accent */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-wax flex items-center justify-center">
                      <span className="font-serif-display text-[14px] text-parchment font-bold">3</span>
                    </div>
                  </div>
                  <h2 className="font-serif-display text-[26px] text-ink text-center mb-2 tracking-serif-tight">
                    Sign your mark
                  </h2>
                  <p className="font-ui text-[13px] text-ink-500 text-center">
                    Your name appears on the ledger. No account required.
                  </p>
                </div>

                {/* Name input — elevated with better styling */}
                <motion.div
                  className="w-full max-w-[360px] space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
                >
                  <div className="relative">
                    <input
                      ref={nameInputRef}
                      id="display-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") proceed(); }}
                      placeholder="Enter your name"
                      data-testid="landing-display-name-input"
                      className="w-full px-5 py-4 bg-parchment-50 border-2 border-parchment-300 outline-none font-ui text-[16px] text-ink placeholder:text-ink-500/40 focus:border-wax focus:shadow-wax transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500/30">
                      <CheckCircle size={18} />
                    </div>
                  </div>

                  <div className="font-ui text-[11px] text-ink-500 text-center leading-relaxed">
                    Stored only on this device. You can change it later.
                  </div>
                </motion.div>

                {/* Personalization fields — rich components */}
                <motion.div
                  className="w-full max-w-[400px] mt-6 space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.3 }}
                >
                  <div className="font-ui text-[11px] uppercase tracking-widest text-ink-600 mb-2 text-center">
                    Personalize Your Bond
                  </div>

                  {/* Signet Ring — live preview of your identity */}
                  <div className="flex flex-col items-center gap-3 p-4 bg-parchment-100 border border-parchment-300 rounded-lg">
                    <SignetRing 
                      initials={name || "PB"} 
                      style={signetStyle}
                      color={selectedGoal?.color || "#7B1730"}
                      size={80}
                      interactive={true}
                      selected={true}
                    />
                    <div className="font-serif-display text-[14px] text-ink">
                      {name || "Your Name"}
                    </div>
                  </div>

                  {/* Signet style picker */}
                  <SignetRingPicker
                    value={signetStyle}
                    onChange={setSignetStyle}
                    initials={name || "PB"}
                    color={selectedGoal?.color || "#7B1730"}
                  />

                  {/* Tension Slider — physical stakes visualization */}
                  <TensionSlider
                    value={tensionLevel}
                    onChange={setTensionLevel}
                    label="Stakes Intensity"
                  />

                  {/* Pledge context */}
                  <div>
                    <label className="font-ui text-[12px] text-ink-600 mb-1 block">What are you committing to?</label>
                    <textarea
                      id="pledge-context-input"
                      type="text"
                      value={pledgeContext}
                      onChange={(e) => setPledgeContext(e.target.value)}
                      placeholder="e.g., Complete 50 push-ups daily for 30 days"
                      data-testid="landing-pledge-context-input"
                      className="w-full px-4 py-3 bg-parchment-50 border-2 border-parchment-300 outline-none font-ui text-[14px] text-ink placeholder:text-ink-500/40 focus:border-wax transition-all resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Pledge target */}
                  <div>
                    <label className="font-ui text-[12px] text-ink-600 mb-1 block">Set your target (optional)</label>
                    <input
                      id="pledge-target-input"
                      type="text"
                      value={pledgeTarget}
                      onChange={(e) => setPledgeTarget(e.target.value)}
                      placeholder="e.g., 50 push-ups, 5K run, ship MVP"
                      data-testid="landing-pledge-target-input"
                      className="w-full px-4 py-3 bg-parchment-50 border-2 border-parchment-300 outline-none font-ui text-[14px] text-ink placeholder:text-ink-500/40 focus:border-wax transition-all"
                    />
                  </div>

                  {/* Deadline Chips */}
                  <DeadlineChips
                    value={pledgeDeadline}
                    onChange={setPledgeDeadline}
                    category={goal}
                  />

                  {/* Atmosphere Picker — visual vibe */}
                  <AtmospherePicker
                    value={atmosphere}
                    onChange={setAtmosphere}
                  />
                </motion.div>

                {/* CTA button */}
                <motion.div
                  className="mt-8 w-full max-w-[360px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.3 }}
                >
                  <RibbonButton
                    variant="wax"
                    onClick={proceed}
                    data-testid="landing-continue-button"
                    className="w-full press-feedback"
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    {goal ? `Seal Your ${selectedGoal?.label}` : "Choose a goal to begin"}
                  </RibbonButton>
                </motion.div>
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
