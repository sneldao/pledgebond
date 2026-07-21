import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VaultSeal from "@/components/VaultSeal";
import RibbonButton from "@/components/RibbonButton";
import WaxStamp from "@/components/WaxStamp";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import SoccerBallLoader from "@/components/SoccerBallLoader";
import { setSession, getSession } from "@/lib/session";
import { sfx, unlockAudio } from "@/lib/sound";
import { api } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Trophy, Target, Sparkles, TrendingUp, Eye, CheckCircle } from "lucide-react";

const PLEDGE_GOALS = [
  { key: "football", label: "Football goal", sub: "Fitness, skills, or match streak", icon: "\u26BD", template: "football", color: "#7B1730" },
  { key: "fitness", label: "Fitness goal", sub: "Run, lift, or train for 30 days", icon: "\uD83C\uDFC3", template: "fitness", color: "#1F6B4E" },
  { key: "project", label: "Ship a project", sub: "Launch by deadline, no excuses", icon: "\uD83D\uDE80", template: "contest", color: "#A77D2A" },
  { key: "custom", label: "Something else", sub: "Any pledge you can seal", icon: "\u2728", template: null, color: "#2B4A66" },
];

export default function Landing() {
  const nav = useNavigate();
  const [name, setName] = useState(getSession()?.displayName || "");
  const [goal, setGoal] = useState(null);
  const [stats, setStats] = useState(null);
  const [sealState, setSealState] = useState("idle"); // idle | sealed | released | failed
  const [sealHint, setSealHint] = useState("Tap the seal to see how it works");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    document.title = "Pledgebond \u2014 Seal Your Vow";
    api.stats().then(setStats).catch(() => {});
  }, []);

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
      // Confetti burst
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
      // Show football-specific transition for football goal
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center parchment-noise">
      <AmbientBackdrop />

      {/* Football transition overlay — rolling ball while navigating to template */}
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
      <div className="mx-auto w-full max-w-[460px] px-5 pt-8 pb-32 relative" style={{ zIndex: 1 }}>
        {/* Social proof counters */}
        {stats && (
          <div className="flex items-center justify-center gap-4 mb-6" data-testid="landing-social-proof">
            <StatPill icon={<CheckCircle size={12} />} value={stats.bonds_sealed} label="sealed" />
            <StatPill icon={<Eye size={12} />} value={stats.witnesses_watching} label="watching" />
            <StatPill icon={<TrendingUp size={12} />} value={stats.proofs_logged} label="proofs logged" />
          </div>
        )}

        {/* Problem statement */}
        <div className="text-center mb-6" data-testid="landing-problem-statement">
          <p className="font-ui text-[12px] uppercase tracking-[0.22em] text-wax">
            {"HERE WE GO \u2014 84% of private pledges fail"}
          </p>
          <p className="mt-1 font-serif-display text-[15px] text-ink-600 leading-snug">
            Pledgebond makes accountability <span className="not-italic text-ink">public</span>.
            <br />Seal your vow like a transfer deal. Your crew witnesses it. Break it, and everyone sees the L.
          </p>
        </div>

        {/* Masthead */}
        <div className="text-center">
          <WaxStamp variant="burgundy" className="mb-3">A Ritual of Pledges</WaxStamp>
          <h1 className="font-serif-display text-[42px] leading-[1.02] tracking-serif-tight text-ink">
            Pledge<span className="text-wax">bond</span>
          </h1>
          <p className="mt-2 font-serif-display italic text-[15px] text-ink-600">
            Seal the vow. Match the stake. Walk it out together.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="ink-divider w-10" />
            <WaxStamp variant="gold" className="text-[9px]">EST. MMXXVI</WaxStamp>
            <span className="ink-divider w-10" />
          </div>
        </div>

        {/* Interactive vault seal — tap to cycle through states */}
        <div className="relative flex flex-col items-center justify-center my-6" data-testid="landing-interactive-seal-container">
          <button
            id="landing-interactive-seal"
            onClick={tapSeal}
            data-testid="landing-interactive-seal-button"
            className="relative cursor-pointer outline-none"
            aria-label="Tap the seal to preview the pledge lifecycle"
          >
            <motion.div
              key={sealState}
              initial={sealState !== "idle" ? { scale: 0.85, opacity: 0.5 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 280 }}
            >
              <VaultSeal
                status={sealStatus}
                pledgeRatio={sealPledgeRatio}
                size={240}
                style="burgundy"
                showTension={sealState === "sealed"}
                hidePill
              />
            </motion.div>
          </button>
          <AnimatePresence mode="wait">
            <motion.p
              key={sealHint}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`mt-3 font-serif-display text-[14px] text-center max-w-[300px] ${
                sealState === "failed" ? "text-wax italic" : sealState === "released" ? "text-emerald-800" : "text-ink-600"
              }`}
              data-testid="landing-seal-hint"
            >
              {sealHint}
            </motion.p>
          </AnimatePresence>
          {/* State dots */}
          <div className="mt-2 flex items-center gap-1.5">
            {["idle", "sealed", "released", "failed"].map((s) => (
              <div
                key={s}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${sealState === s ? "bg-wax" : "bg-parchment-300"}`}
              />
            ))}
          </div>
        </div>

        {/* Goal question — replaces role picker */}
        <div className="space-y-3 mt-6">
          <div className="font-serif-display text-[18px] text-ink-700 flex items-center gap-2">
            <span className="w-8 ink-divider" /> What are you pledging? <span className="flex-1 ink-divider" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLEDGE_GOALS.map((g) => (
              <button
                key={g.key}
                onClick={() => setGoal(g.key)}
                data-testid={`goal-picker-${g.key}-button`}
                className={`text-left px-3 py-3 border transition-all flex flex-col gap-1 ${
                  goal === g.key
                    ? "border-ink bg-parchment-200 scale-[1.02]"
                    : "border-parchment-300 hover:bg-parchment-200/60"
                }`}
              >
                <span className="text-[20px]">{g.icon}</span>
                <span className="font-serif-display text-[16px] text-ink leading-tight">{g.label}</span>
                <span className="font-ui text-[11px] text-ink-500">{g.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mt-6 space-y-2">
          <label htmlFor="display-name-input" className="font-serif-display text-[16px] text-ink-700">Sign your mark</label>
          <input
            id="display-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marco Rossi"
            data-testid="landing-display-name-input"
            aria-describedby="name-help"
            className="w-full px-4 py-3 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[16px] text-ink placeholder:text-ink-500/50 focus:border-wax transition-colors"
          />
          <p id="name-help" className="font-ui text-[11px] text-ink-500">No account required. Your name is stored only on this device.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <RibbonButton
            variant="wax"
            onClick={proceed}
            data-testid="landing-continue-button"
            className="w-full"
          >
            <Sparkles size={14} className="inline mr-1" />
            {goal ? `Seal Your ${PLEDGE_GOALS.find((g) => g.key === goal)?.label}` : "Choose a goal to begin"}
          </RibbonButton>
          <button
            onClick={() => nav("/explore")}
            className="font-ui text-[13px] text-ink-500 underline underline-offset-4 hover:text-ink"
            data-testid="landing-preview-button"
          >
            Browse open bonds first
          </button>
        </div>

        <div className="mt-10 torn-divider" />

        {/* Football CTA — HERE WE GO */}
        <div className="mt-6 ornate-frame p-4 text-center" data-testid="landing-football-cta">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SoccerBallLoader label="" size={28} />
            <WaxStamp variant="burgundy" className="text-[9px]">{"HERE WE GO"}</WaxStamp>
          </div>
          <div className="font-serif-display text-[18px] text-ink leading-tight">
            Seal your football pledge.
          </div>
          <p className="font-ui text-[12px] text-ink-600 mt-1">
            Pledge to hit your goal in 30 days. Your crew witnesses it. Miss the deadline and everyone sees the L.
          </p>
          <button
            onClick={() => { unlockAudio(); nav("/create?template=football"); }}
            className="mt-3 ribbon-btn ribbon-btn-gold text-[13px]"
            data-testid="landing-football-cta-button"
          >
            <span className="inline-flex items-center gap-1"><Target size={14} /> Draft a Football Pledge</span>
          </button>
        </div>

        {/* Contest CTA */}
        <div className="mt-4 ornate-frame p-4 text-center" data-testid="landing-contest-cta">
          <WaxStamp variant="gold" className="text-[9px] mb-2">BUILDER'S CONTEST</WaxStamp>
          <div className="font-serif-display text-[18px] text-ink leading-tight">
            Pledge to ship your contest entry.
          </div>
          <p className="font-ui text-[12px] text-ink-600 mt-1">
            Join the self-referential bond — witnesses hold you accountable to your deadline.
          </p>
          <button
            onClick={() => { unlockAudio(); nav("/create?template=contest"); }}
            className="mt-3 ribbon-btn ribbon-btn-gold text-[13px]"
            data-testid="landing-contest-cta-button"
          >
            <span className="inline-flex items-center gap-1"><Trophy size={14} /> Draft a Contest Bond</span>
          </button>
        </div>

        <p className="mt-4 font-ui text-[11px] text-ink-500 text-center">
          Stakes are pledge points — commitment signals, not real money. Your reputation is the real currency.
        </p>
      </div>
    </div>
  );
}

function StatPill({ icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5" data-testid={`landing-stat-${label.replace(/\s/g, "-")}`}>
      <span className="text-wax">{icon}</span>
      <span className="font-serif-display text-[18px] text-ink leading-none">{value}</span>
      <span className="font-ui text-[10px] uppercase tracking-wider text-ink-500">{label}</span>
    </div>
  );
}
