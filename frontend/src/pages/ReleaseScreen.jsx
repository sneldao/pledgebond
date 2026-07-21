import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import VaultSeal from "@/components/VaultSeal";
import OrbitAvatars from "@/components/OrbitAvatars";
import PayoutPockets from "@/components/PayoutPockets";
import WaxStamp from "@/components/WaxStamp";
import RibbonButton from "@/components/RibbonButton";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { api } from "@/lib/api";
import { sfx, unlockAudio } from "@/lib/sound";
import { toast } from "sonner";
import { Share2, Download, RefreshCcw, Copy, X } from "lucide-react";

export default function ReleaseScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const [bond, setBond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggered, setTriggered] = useState(false);
  const [step, setStep] = useState(null); // 'crack' | 'swing' | 'burst' | 'coins' | 'done'
  const [showShare, setShowShare] = useState(false);
  const stageRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const b = await api.getBond(id);
        setBond(b);
      } catch (e) {
        toast.error("Failed to load bond");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalPledged = useMemo(() => {
    if (!bond) return 0;
    return (bond.participants?.length || 0) * (bond.fundee_pledge_amount || 0);
  }, [bond]);
  const pledgeRatio = bond ? Math.min(1, totalPledged / Math.max(1, bond.activation_threshold || 1)) : 0;

  const trigger = async () => {
    if (!bond) return;
    unlockAudio();
    if (bond.status === "active") {
      try {
        const updated = await api.release(id);
        setBond(updated);
        setTriggered(true);
        if (updated.status === "released") sfx.release();
        else sfx.fail();
      } catch (e) {
        toast.error("Release check failed", { description: e?.response?.data?.detail });
      }
    } else if (bond.status === "released") {
      // Replay
      setTriggered(false);
      // small delay to let the seal reset visually
      setTimeout(() => {
        setTriggered(true);
        sfx.release();
      }, 200);
    } else if (bond.status === "failed") {
      setTriggered(true);
      sfx.fail();
    } else {
      toast.info("Bond must be Active before attempting release.");
    }
  };

  // On first arrival with released/failed status, auto-trigger the animation
  useEffect(() => {
    if (bond && !triggered && (bond.status === "released" || bond.status === "failed")) {
      setTimeout(trigger, 500);
    }
    // eslint-disable-next-line
  }, [bond]);

  // Coin cascade when step becomes 'coins'
  useEffect(() => {
    if (step === "coins" && bond?.status === "released") {
      shootCoins();
    }
  }, [step, bond]);

  const shootCoins = () => {
    const sealEl = stageRef.current?.querySelector('[data-testid="vault-seal"]');
    const sealRect = sealEl ? sealEl.getBoundingClientRect() : null;
    // Seal center in viewport fractions (canvas-confetti origin is 0..1 of viewport)
    const origin = sealRect
      ? { x: (sealRect.left + sealRect.width / 2) / window.innerWidth, y: (sealRect.top + sealRect.height / 2) / window.innerHeight }
      : { x: 0.5, y: 0.42 };

    // Find each payout pocket in the DOM and aim a coin stream at it
    const pocketEls = stageRef.current?.querySelectorAll('[data-testid^="payout-pocket-"]') || [];
    const pockets = Array.from(pocketEls).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      };
    });

    const goldColors = ["#E0C06A", "#C49A3A", "#8E6A1F", "#F2E2A6"];

    if (pockets.length === 0) {
      // Fallback: centered burst if pockets aren't rendered yet
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 40, spread: 68, startVelocity: 42, gravity: 1.05,
            scalar: 1.1, angle: 90, origin, colors: goldColors,
            shapes: ["circle", "square"], disableForReducedMotion: true,
          });
        }, i * 100);
      }
      return;
    }

    // Direct a stream of coins from the seal toward each pocket
    pockets.forEach((p, i) => {
      const dx = p.x - origin.x;
      const dy = p.y - origin.y;
      // canvas-confetti angle: 0 = right, 90 = down
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Velocity scaled to reach the pocket; gravity pulls them down into it
      const velocity = Math.min(55, 30 + dist * 60);
      const bursts = 4;
      for (let b = 0; b < bursts; b++) {
        setTimeout(() => {
          confetti({
            particleCount: 18,
            spread: 28,
            startVelocity: velocity,
            gravity: 1.1,
            scalar: 1.15,
            angle,
            origin,
            colors: goldColors,
            shapes: ["circle"],
            ticks: 220,
            disableForReducedMotion: true,
          });
        }, i * 120 + b * 90);
      }
    });

    // Later paper confetti (parchment-tinted) — ambient celebration
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 120,
        startVelocity: 30,
        gravity: 0.9,
        origin: { x: 0.5, y: 0.35 },
        colors: ["#FBF2E3", "#F2E6D1", "#E7D7BC", "#C49A3A"],
        disableForReducedMotion: true,
      });
    }, 700);
  };

  const downloadShareCard = async () => {
    if (!stageRef.current) return;
    try {
      const dataUrl = await toPng(stageRef.current, { pixelRatio: 2, backgroundColor: "#FBF2E3" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pledgebond-${bond.id.slice(0, 6)}.png`;
      a.click();
      toast.success("Share card downloaded");
    } catch (e) {
      toast.error("Could not export card");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading || !bond) return <AppShell showBack><div className="pt-10 text-center font-ui text-ink-500">Preparing the stage...</div></AppShell>;

  const released = bond.status === "released";
  const failed = bond.status === "failed";
  const finalPhase = step === "coins" || step === "done";

  return (
    <AppShell showBack backTo={`/bond/${id}`} title="Release">
      <div ref={stageRef} className="relative pt-2 pb-8">
        {/* Vertical stage — tuned for 9:16 screen recording */}
        <div className="relative mx-auto" style={{ maxWidth: 420 }}>
          <div className="text-center pt-4 pb-3">
            <WaxStamp variant={released ? "gold" : failed ? "ink" : "burgundy"} className="mb-2">
              {released ? "Bond Released" : failed ? "Bond Broken" : "Awaiting Release"}
            </WaxStamp>
            <h1 className="font-serif-display text-[26px] leading-tight text-ink px-4">{bond.title}</h1>
            <p className="font-serif-display italic text-[13px] text-ink-600 mt-1">In benefit of — {bond.cause_name}</p>
          </div>

          <div className="relative flex items-center justify-center" style={{ height: 340 }}>
            <div className="relative" style={{ width: 320, height: 320 }}>
              <VaultSeal
                status={bond.status === "active" && !triggered ? "active" : bond.status}
                pledgeRatio={pledgeRatio}
                deadlineRatio={0.85}
                completionRatio={1}
                size={320}
                style={bond.seal_style || "burgundy"}
                onReleaseStep={(s) => setStep(s)}
              />
              {!finalPhase && (
                <OrbitAvatars participants={bond.participants || []} centerSize={320} ringRadius={175} maxSlots={18} />
              )}
            </div>
          </div>

          {/* Payout pockets */}
          <div className="mt-4 px-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="ink-divider flex-1" />
              <span className="font-serif-display italic text-[13px] text-ink-600">Payout pockets</span>
              <span className="ink-divider flex-1" />
            </div>
            <PayoutPockets splits={bond.payout_split || []} filled={released && finalPhase} totalAmount={bond.funder_amount + (bond.participants?.length || 0) * bond.fundee_pledge_amount} />
          </div>

          {/* Result copy */}
          <div className="mt-6 text-center px-4">
            {released && (
              <p className="font-serif-display text-[17px] text-ink leading-snug">
                The seal cracked. The vault opened. Pledge points are dispatched to the pockets below — the ledger is sealed.
              </p>
            )}
            {failed && (
              <p className="font-serif-display italic text-[16px] text-wax leading-snug">
                Conditions unmet. The bond remains sealed. The vault fades, quiet as a shut ledger.
              </p>
            )}
            {!released && !failed && (
              <p className="font-serif-display italic text-[15px] text-ink-600">Press the seal to attempt release.</p>
            )}
          </div>
        </div>

        {/* Footer stamp (goes into share card) */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 opacity-70">
            <div className="w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #9A1F3D 0%, #7B1730 60%, #4A0F1E 100%)" }} />
            <span className="font-serif-display text-[15px] text-ink">Pledgebond</span>
            <span className="font-ui text-[11px] text-ink-500">· sealed ledger</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0" style={{ background: "linear-gradient(0deg, rgba(255,251,242,1) 60%, rgba(255,251,242,0))" }}>
        <div className="mx-auto w-full max-w-[460px] px-4 py-3 flex items-center gap-2">
          {!triggered && bond.status === "active" && (
            <RibbonButton variant="wax" className="flex-1" onClick={trigger} data-testid="release-trigger-button">
              Attempt Release
            </RibbonButton>
          )}
          {triggered && (
            <>
              <RibbonButton variant="ghost" onClick={() => setTriggered(false) || setTimeout(trigger, 100)} data-testid="release-replay-button" className="flex-1">
                <RefreshCcw size={14} className="inline mr-1" /> Replay
              </RibbonButton>
              <RibbonButton variant="gold" className="flex-1" onClick={() => setShowShare(true)} data-testid="release-screen-share-button">
                <Share2 size={14} className="inline mr-1" /> Share
              </RibbonButton>
            </>
          )}
          {bond.status === "pending" && (
            <RibbonButton variant="ghost" className="flex-1" onClick={() => nav(`/bond/${id}`)} data-testid="release-goback-button">
              Back to bond
            </RibbonButton>
          )}
        </div>
      </div>

      {/* Share drawer */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-[420px] bg-parchment-50 border border-ink p-4 rounded-t-lg sm:rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="font-serif-display text-[20px] text-ink">Share the moment</div>
                <button onClick={() => setShowShare(false)} data-testid="share-close-button"><X size={18} /></button>
              </div>
              <p className="font-ui text-[12px] text-ink-500 mt-1">One-tap card export (9:16 recommended for socials).</p>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <button onClick={downloadShareCard} className="ribbon-btn ribbon-btn-gold" data-testid="share-download-button"><Download size={14} className="inline mr-2" /> Download share card (.png)</button>
                <button onClick={copyLink} className="ribbon-btn ribbon-btn-ghost" data-testid="share-copy-link-button"><Copy size={14} className="inline mr-2" /> Copy bond link</button>
              </div>
              <div className="mt-3 text-center font-ui text-[11px] text-ink-500">Pledge points are commitment signals — your reputation is the real stake.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
