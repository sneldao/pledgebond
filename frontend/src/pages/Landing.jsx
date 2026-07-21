import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import VaultSeal from "@/components/VaultSeal";
import RibbonButton from "@/components/RibbonButton";
import WaxStamp from "@/components/WaxStamp";
import { setSession, getSession } from "@/lib/session";
import { unlockAudio } from "@/lib/sound";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

const ROLES = [
  { key: "funder", label: "Funder", sub: "I stake the seed pledge", color: "#7B1730" },
  { key: "fundee", label: "Fundee", sub: "I match & commit to the tasks", color: "#A77D2A" },
  { key: "organizer", label: "Organizer", sub: "I witness & monitor progress", color: "#1F6B4E" },
];

export default function Landing() {
  const nav = useNavigate();
  const [name, setName] = useState(getSession()?.displayName || "");
  const [role, setRole] = useState(getSession()?.role || "fundee");

  useEffect(() => {
    document.title = "Pledgebond \u2014 Enter";
  }, []);

  const proceed = () => {
    unlockAudio();
    if (!name.trim()) {
      toast.error("Sign your mark first", { description: "Enter a display name to be witnessed on the ledger." });
      return;
    }
    const roleColor = ROLES.find((r) => r.key === role)?.color;
    setSession({ displayName: name.trim(), role, color: roleColor });
    toast.success(`Welcome, ${name.trim()}`, { description: `Role: ${ROLES.find(r => r.key === role)?.label}` });
    nav("/explore");
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center parchment-noise">
      <div className="mx-auto w-full max-w-[460px] px-5 pt-10 pb-32">
        {/* Problem statement — contest voter hook */}
        <div className="text-center mb-8" data-testid="landing-problem-statement">
          <p className="font-ui text-[12px] uppercase tracking-[0.22em] text-wax">
            84% of private pledges fail
          </p>
          <p className="mt-1 font-serif-display text-[15px] text-ink-600 leading-snug">
            Pledgebond makes accountability <span className="not-italic text-ink">public</span>.
            <br />Your vow is witnessed. Your stake flows to charity if you break it.
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

        {/* Seal */}
        <div className="relative flex items-center justify-center my-8">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <VaultSeal status="pending" pledgeRatio={0.55} size={260} style="burgundy" showTension={false} hidePill />
          </motion.div>
        </div>

        {/* Role ribbons */}
        <div className="space-y-3 mt-6">
          <div className="font-serif-display text-[18px] text-ink-700 flex items-center gap-2">
            <span className="w-8 ink-divider" /> Choose your seat at the table <span className="flex-1 ink-divider" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                data-testid={`role-picker-${r.key}-button`}
                className={`w-full text-left px-4 py-3 border transition-colors flex items-center gap-3 ${
                  role === r.key
                    ? "border-ink bg-parchment-200"
                    : "border-parchment-300 hover:bg-parchment-200/60"
                }`}
                style={{
                  clipPath: "polygon(0% 0%, 100% 0%, calc(100% - 12px) 50%, 100% 100%, 0% 100%, 12px 50%)",
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-parchment font-ui font-semibold text-[12px]"
                  style={{ background: r.color }}
                >
                  {r.label[0]}
                </span>
                <span className="flex-1">
                  <span className="block font-serif-display text-[19px] text-ink">{r.label}</span>
                  <span className="block font-ui text-[12px] text-ink-500">{r.sub}</span>
                </span>
                {role === r.key && <WaxStamp variant="gold">Chosen</WaxStamp>}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mt-8 space-y-2">
          <label htmlFor="display-name-input" className="font-serif-display text-[16px] text-ink-700">Sign your mark</label>
          <input
            id="display-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ada Lovelace"
            data-testid="landing-display-name-input"
            aria-describedby="name-help"
            className="w-full px-4 py-3 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[16px] text-ink placeholder:text-ink-500/50 focus:border-wax transition-colors"
          />
          <p id="name-help" className="font-ui text-[11px] text-ink-500">No account required. Your name is stored only on this device.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <RibbonButton
            variant="wax"
            onClick={proceed}
            data-testid="landing-continue-button"
            className="w-full"
          >
            Enter the Rotunda
          </RibbonButton>
          <button
            onClick={() => nav("/explore")}
            className="font-ui text-[13px] text-ink-500 underline underline-offset-4 hover:text-ink"
            data-testid="landing-preview-button"
          >
            Preview without signing
          </button>
        </div>

        <div className="mt-10 torn-divider" />

        {/* Contest CTA */}
        <div className="mt-6 ornate-frame p-4 text-center" data-testid="landing-contest-cta">
          <WaxStamp variant="gold" className="text-[9px] mb-2">BUILDER'S CONTEST</WaxStamp>
          <div className="font-serif-display text-[18px] text-ink leading-tight">
            Pledge to ship your contest entry.
          </div>
          <p className="font-ui text-[12px] text-ink-600 mt-1">
            Join the self-referential bond — witnesses hold you accountable to your deadline.
          </p>
          <button
            onClick={() => nav("/create?template=contest")}
            className="mt-3 ribbon-btn ribbon-btn-gold text-[13px]"
            data-testid="landing-contest-cta-button"
          >
            <span className="inline-flex items-center gap-1"><Trophy size={14} /> Draft a Contest Bond</span>
          </button>
        </div>

        <p className="mt-4 font-ui text-[11px] text-ink-500 text-center">
          Pledgebond is a demo ledger. No real payments are processed.
        </p>
      </div>
    </div>
  );
}
