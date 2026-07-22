import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import VaultSeal from "@/components/VaultSeal";
import OrbitAvatars from "@/components/OrbitAvatars";
import WaxStamp from "@/components/WaxStamp";
import RibbonButton from "@/components/RibbonButton";
import SealLoader from "@/components/SealLoader";
import SoccerBallLoader from "@/components/SoccerBallLoader";
import HereWeGoStamp from "@/components/HereWeGoStamp";
import MatchdayBackdrop from "@/components/MatchdayBackdrop";
import { EmptyStateIllustration, PledgeIcon, WitnessIcon, SealIcon, ReleaseIcon, ProofIcon, SquadIcon, DeadlineIcon, StakeIcon } from "@/components/PbIllustrations";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getSession, markJoined, getMyParticipantId, markWitnessed, isWitnessing, adjustCredits, getCredits, getReputationTier, getStreaks } from "@/lib/session";
import { vocab } from "@/lib/categoryVocab";
import { sfx, unlockAudio } from "@/lib/sound";
import { toast } from "sonner";
import { Check, Trophy, Share2, Copy, Download, X, Flame, Coins } from "lucide-react";
import { StaggeredList, particleBurst, screenShake } from "@/components/motion";

function fmtCountdown(iso) {
  const dt = new Date(iso).getTime();
  const now = Date.now();
  const ms = dt - now;
  if (ms < 0) return { text: "deadline passed", ratio: 1 };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return {
    text: days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m`,
    ratio: null,
  };
}

export default function BondDashboard() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = getSession();
  const [bond, setBond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [witnessing, setWitnessing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [tick, setTick] = useState(0);
  const myPid = getMyParticipantId(id);
  const [prevStatus, setPrevStatus] = useState(null);
  const [showHereWeGo, setShowHereWeGo] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const load = async () => {
    try {
      const b = await api.getBond(id);
      setBond((old) => {
        if (old?.status !== b.status) {
          if (b.status === "active" && old?.status === "pending") {
            sfx.sealLock();
            setShowRipple(true);
            setTimeout(() => setShowRipple(false), 1200);
            if (b.category === "football") setShowHereWeGo(true);
          }
          if (b.status === "released") sfx.release();
          if (b.status === "failed") sfx.fail();
        }
        return b;
      });
      setPrevStatus(b.status);
    } catch (e) {
      console.error(e);
      toast.error("Could not load bond");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    unlockAudio();
    load();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const totalPledged = useMemo(() => {
    if (!bond) return 0;
    return (bond.participants?.length || 0) * (bond.fundee_pledge_amount || 0);
  }, [bond]);

  const pledgeRatio = bond ? Math.min(1, totalPledged / Math.max(1, bond.activation_threshold || 1)) : 0;

  const { text: cdText } = bond ? fmtCountdown(bond.deadline) : { text: "" };
  const deadlineMs = bond ? new Date(bond.deadline).getTime() : 0;
  const hoursToDeadline = bond ? (deadlineMs - Date.now()) / 3600000 : 999;
  const isDeadlineDay = bond?.category === "football" && hoursToDeadline > 0 && hoursToDeadline < 24 && bond.status === "active";
  const deadlineRatio = useMemo(() => {
    if (!bond) return 0;
    const createdMs = new Date(bond.created_at).getTime();
    const deadlineMs = new Date(bond.deadline).getTime();
    const now = Date.now();
    const total = Math.max(1, deadlineMs - createdMs);
    const elapsed = Math.max(0, Math.min(total, now - createdMs));
    return elapsed / total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bond, tick]);

  const completionRatio = useMemo(() => {
    if (!bond || !bond.participants?.length || !bond.task_requirements?.length) return 0;
    const target = bond.task_requirements.length;
    const done = bond.participants.filter(
      (p) => (p.completed_tasks || []).length >= target
    ).length;
    return done / bond.participants.length;
  }, [bond]);

  const alreadyJoined = !!(bond?.participants || []).find((p) => p.id === myPid);

  const join = async () => {
    if (!session?.displayName) {
      toast.error("Sign your mark first", { description: "Return to the entry hall and pick your role." });
      nav("/");
      return;
    }
    if (alreadyJoined) {
      toast.info("You already stand at this seal.");
      return;
    }
    try {
      setJoining(true);
      unlockAudio();
      const b = await api.joinBond(id, {
        display_name: session.displayName,
        color: session.color || "#7B1730",
      });
      const me = b.participants[b.participants.length - 1];
      markJoined(id, me.id);
      sfx.pledgeIn();

      // Deduct pledge credits — skin in the game
      const pledgeCredits = b.fundee_pledge_amount || 5;
      const store = getCredits();
      const balanceBefore = store?.balance ?? 0;
      adjustCredits(-pledgeCredits, `pledged on bond ${id}`);
      const newStore = getCredits();
      const tier = newStore ? getReputationTier(newStore.balance) : null;
      const insufficient = balanceBefore < pledgeCredits;

      // Trigger reaction effects
      const vaultEl = document.querySelector('[data-testid="bond-dashboard-vault"]');
      if (vaultEl) {
        particleBurst(vaultEl);
        screenShake();
      }

      setBond(b);
      toast.success("Your mark is witnessed.", {
        description: insufficient
          ? `−${pledgeCredits} cr staked (balance was low — pledge floors at 0)${tier ? ` · ${tier.name} tier` : ""}`
          : `−${pledgeCredits} cr staked · complete the bond to earn ${pledgeCredits * 2} cr back${tier ? ` · ${tier.name} tier` : ""}`,
      });
      if (b.status === "active" && prevStatus === "pending") {
        setTimeout(() => {
          sfx.sealLock();
          setShowRipple(true);
          setTimeout(() => setShowRipple(false), 1200);
          if (b.category === "football") setShowHereWeGo(true);
        }, 200);
      }
    } catch (e) {
      toast.error("Could not join", { description: e?.response?.data?.detail || e.message });
    } finally {
      setJoining(false);
    }
  };

  const submitProof = async (taskId) => {
    if (!myPid) {
      toast.error("Only witnessed fundees can log clauses.");
      return;
    }
    // Streak day is recorded in ProofSubmission after a successful upload,
    // not here — otherwise backing out without submitting would count.
    nav(`/bond/${id}/proof/${taskId}`);
  };

  const goRelease = async () => {
    nav(`/bond/${id}/release`);
  };

  const alreadyWitnessing = isWitnessing(id);

  const witness = async () => {
    if (!session?.displayName) {
      toast.error("Sign your mark first", { description: "Return to the entry hall and pick your role." });
      nav("/");
      return;
    }
    if (alreadyWitnessing) {
      toast.info("You're already witnessing this bond.");
      return;
    }
    try {
      setWitnessing(true);
      unlockAudio();
      const b = await api.witnessBond(id, {
        display_name: session.displayName,
        color: session.color || "#1F6B4E",
      });
      markWitnessed(id);
      sfx.pledgeIn();

      // Award credits for witnessing (+3 cr)
      adjustCredits(3, `witnessed bond ${id}`);
      const newStore = getCredits();
      const tier = newStore ? getReputationTier(newStore.balance) : null;

      setBond(b);
      toast.success("You're now witnessing.", {
        description: `+3 Bond Credits earned${tier ? ` · ${tier.name} tier` : ""}`,
      });
    } catch (e) {
      toast.error("Could not witness", { description: e?.response?.data?.detail || e.message });
    } finally {
      setWitnessing(false);
    }
  };

  const shareNative = async () => {
    const url = window.location.href;
    const cardUrl = api.bondCardUrl(id);
    const isFootball = bond.category === "football";
    const squadCount = bond.participants?.length || 0;
    const funderName = bond.funder_name || "Anonymous";

    // Fabrizio-style share text for football bonds
    const shareText = isFootball
      ? `\uD83D\uDEA8 HERE WE GO! ${bond.title?.replace(/^HERE WE GO:\s*/, "") || "A pledge is sealed"}. ${squadCount} in the squad. Stake: ${bond.funder_amount?.toLocaleString()} credits. Deadline day: ${new Date(bond.deadline).toLocaleDateString()}. Witness the vow \u2192`
      : `Witness this pledge: ${bond.title}. ${squadCount} participants. ${funderName} staked ${bond.funder_amount?.toLocaleString()} credits. Deadline: ${new Date(bond.deadline).toLocaleDateString()}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isFootball ? `\uD83D\uDEA8 HERE WE GO! ${bond.title}` : bond.title,
          text: shareText,
          url,
        });
      } catch {
        // user cancelled — silent
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        toast.success("Fabrizio-style share text copied!", { description: "Paste it on Twitter/X or WhatsApp." });
      } catch {
        toast.error("Could not copy");
      }
    }
  };

  const downloadCard = async () => {
    try {
      const cardUrl = api.bondCardUrl(id);
      const a = document.createElement("a");
      a.href = cardUrl;
      a.download = `pledgebond-${(bond.title || "bond").slice(0, 20).replace(/\s+/g, "-").toLowerCase()}.png`;
      a.target = "_blank";
      a.click();
      toast.success("Share card opened — save the image to post it.");
    } catch {
      toast.error("Could not open card");
    }
  };

  const copyLink = async () => {
    try {
      const isFootball = bond.category === "football";
      const url = window.location.href;
      if (isFootball) {
        const squadCount = bond.participants?.length || 0;
        const shareText = `\uD83D\uDEA8 HERE WE GO! ${bond.title?.replace(/^HERE WE GO:\s*/, "")}. ${squadCount} in the squad. Deadline day: ${new Date(bond.deadline).toLocaleDateString()}. Witness the vow \u2192 ${url}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Fabrizio-style text copied!", { description: "Paste on Twitter/X or WhatsApp." });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) return <AppShell><SealLoader label="Opening the vault..." /></AppShell>;
  if (!bond) return <AppShell><div className="pt-10 text-center font-ui text-ink-500">Bond not found.</div></AppShell>;

  const t = vocab(bond.category);
  const isFootball = bond.category === "football";

  return (
    <AppShell showBack backTo="/explore" className={isFootball ? "matchday-shell" : ""}>
      {isFootball && <MatchdayBackdrop />}
      <HereWeGoStamp bond={bond} show={showHereWeGo} onDone={() => setShowHereWeGo(false)} />
      {/* Guest witness banner — shown when arriving via shared link without a session */}
      {!session?.displayName && (bond.status === "pending" || bond.status === "active") && (
        <GuestWitnessBanner
          bond={bond}
          onWitness={async (name) => {
            try {
              setWitnessing(true);
              unlockAudio();
              // Create a lightweight session on the fly
              const { setSession } = await import("@/lib/session");
              setSession({ displayName: name, role: "organizer", color: "#1F6B4E" });
              const b = await api.witnessBond(id, { display_name: name, color: "#1F6B4E" });
              markWitnessed(id);
              sfx.pledgeIn();
              setBond(b);
              toast.success("You're now witnessing.", { description: "We'll notify you when proof is submitted or the bond releases." });
              // Reload to pick up the new session in AppShell
              setTimeout(() => window.location.reload(), 800);
            } catch (e) {
              toast.error("Could not witness", { description: e?.response?.data?.detail || e.message });
            } finally {
              setWitnessing(false);
            }
          }}
          witnessing={witnessing}
        />
      )}

      {/* Header — cinematic entrance */}
      <motion.div
        className="pt-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-ui uppercase tracking-widest text-ink-500 min-w-0">
            {bond.category === "football" && <SoccerBallLoader label="" size={20} />}
            <span className="truncate">{bond.category === "corporate" ? "Corporate Program" : bond.category === "football" ? "Football Pledge" : "Individual Challenge"}</span>
            <span>·</span>
            <span>Bond #{bond.id.slice(0, 6)}</span>
          </div>
          <button
            onClick={() => setShowShare(true)}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-parchment-300 text-ink-700 hover:bg-parchment-200 transition-colors"
            data-testid="bond-share-button"
            aria-label="Share this bond"
          >
            <Share2 size={16} />
          </button>
        </div>
        <h1 className="font-serif-display text-[28px] tracking-serif-tight text-ink leading-tight">{bond.title}</h1>
        <p className="font-serif-display italic text-[14px] text-ink-600 mt-1">In benefit of — <span className="not-italic text-ink">{bond.cause_name}</span></p>
      </motion.div>

      {/* Hero vault — animated entrance */}
      <motion.div
        className={`mt-6 flex flex-col items-center relative ${isFootball && bond.status === "active" ? "electric-border rounded-2xl p-4" : ""}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      >
        {showRipple && (
          <div className="signal-ripple" data-testid="seal-signal-ripple">
            <i /><i /><i />
          </div>
        )}
        <div className="relative" style={{ width: 320, height: 320 }}>
          <VaultSeal
            status={bond.status}
            pledgeRatio={pledgeRatio}
            deadlineRatio={deadlineRatio}
            completionRatio={completionRatio}
            size={320}
            style={bond.seal_style || "burgundy"}
            onLockComplete={() => {}}
            hidePill
          />
          <OrbitAvatars
            participants={bond.participants || []}
            centerSize={320}
            ringRadius={175}
            maxSlots={18}
          />
        </div>

        {/* Status stamp under the orbit ring \u2014 gives room to breathe */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {isFootball && bond.status === "active" && <span className="live-dot live-dot--burgundy" data-testid="bond-live-dot" />}
          <WaxStamp
            variant={bond.status === "released" ? "gold" : bond.status === "failed" ? "ink" : "burgundy"}
            data-testid="bond-status-badge"
          >
            {bond.status === "pending" && t.pending}
            {bond.status === "active" && t.sealedActive}
            {bond.status === "released" && t.released}
            {bond.status === "failed" && t.failed}
          </WaxStamp>
        </div>

        {/* Meta strip */}
        <div className="mt-6 grid grid-cols-3 gap-2 w-full">
          <MetaBox label="At stake" value={`${(bond.funder_amount || 0).toLocaleString()} cr`} football={isFootball} />
          <MetaBox label={bond.category === "football" ? "Stake pool" : "Pool"} value={`${totalPledged.toLocaleString()} / ${bond.activation_threshold.toLocaleString()} cr`} football={isFootball} />
          <MetaBox label={bond.status === "pending" ? "Time to seal" : bond.category === "football" ? "Deadline day" : "Time remaining"} value={cdText} football={isFootball} />
        </div>

        {/* DEADLINE DAY banner — football bonds within 24h of deadline */}
        {isDeadlineDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 border-2 border-wax text-center"
            style={{
              background: "linear-gradient(180deg, rgba(155, 31, 61, 0.08) 0%, rgba(196, 154, 58, 0.08) 100%)",
              animation: "deadline-pulse 2s ease-in-out infinite",
            }}
            data-testid="deadline-day-banner"
          >
            <div className="font-ui text-[11px] uppercase tracking-[0.3em] text-wax">
              {"\uD83D\uDEA8 DEADLINE DAY \uD83D\uDEA8"}
            </div>
            <div className="font-serif-display text-[16px] text-ink mt-1">
              {Math.floor(hoursToDeadline)}h {Math.floor((hoursToDeadline % 1) * 60)}m left — the squad needs to finish
            </div>
          </motion.div>
        )}

        {/* Witness strip — zero-friction observers */}
        {(bond.status === "pending" || bond.status === "active") && (
          <div className="mt-4 w-full ornate-frame p-3 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-800/10 border border-emerald-800/30 flex items-center justify-center text-emerald-800">
              <WitnessIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-serif-display text-[15px] text-ink leading-tight">
                {t.witnessCount(bond.witnesses?.length || 0)}
              </div>
              <div className="font-ui text-[11px] text-ink-500">
                {alreadyWitnessing ? "You're in the crew — we'll notify you on updates." : "Watch without pledging. Get notified on proof + release."}
              </div>
            </div>
            {!alreadyJoined && !alreadyWitnessing && (
              <button
                onClick={witness}
                disabled={witnessing}
                data-testid="bond-witness-button"
                className="shrink-0 px-3 py-2 text-[12px] font-ui border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-parchment transition-colors disabled:opacity-50"
              >
                {witnessing ? "..." : t.witness}
              </button>
            )}
            {alreadyWitnessing && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-ui text-emerald-800" data-testid="bond-witnessing-badge">
                <Check size={12} /> Witnessing
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Viral loop closure — prompt to create your own pledge after witnessing */}
      {alreadyWitnessing && !alreadyJoined && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 ornate-frame p-3 flex items-center gap-3"
          data-testid="bond-create-your-own-prompt"
        >
          <span className="text-[24px]">{"\u2728"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-serif-display text-[14px] text-ink leading-tight">You're witnessing. Now seal your own vow.</p>
            <p className="font-ui text-[11px] text-ink-500">HERE WE GO — pledge your goal and get your crew to witness you.</p>
          </div>
          <button
            onClick={() => nav("/create?template=football")}
            className="shrink-0 ribbon-btn ribbon-btn-gold text-[12px]"
            data-testid="bond-create-your-own-button"
          >
            Seal my vow
          </button>
        </motion.div>
      )}

      {/* Description */}
      <div className="mt-6 ornate-frame p-4">
        <div className="font-ui text-[11px] uppercase tracking-widest text-ink-500 mb-1">The pledge</div>
        <p className="font-serif-display text-[16px] text-ink leading-relaxed">{bond.description || "A bond of collective intent."}</p>
        <div className="mt-3 flex items-center gap-2 text-[12px] font-ui text-ink-600">
          <span>Funder — <b>{bond.funder_name || "Anonymous Patron"}</b></span>
          <span>·</span>
          <span>Match — <b>{bond.fundee_pledge_amount} cr</b></span>
        </div>
      </div>

      {/* Clauses */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-serif-display text-[20px] text-ink flex items-center gap-2">
            <ProofIcon size={16} className="text-wax" />
            Clauses of the bond
          </h2>
          <span className="ink-divider flex-1" />
        </div>
        <StaggeredList staggerDelay={0.08}>
          {bond.task_requirements.map((t, i) => (
            <TaskRow
              key={t.id}
              index={i}
              task={t}
              bond={bond}
              myPid={myPid}
              onSubmit={() => submitProof(t.id)}
            />
          ))}
        </StaggeredList>
      </div>

      {/* Leaderboard (top 5) */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-serif-display text-[20px] text-ink flex items-center gap-2">
            <SquadIcon size={16} className="text-wax" />
            {t.participantsLabel}
          </h2>
          <span className="ink-divider flex-1" />
        </div>
        <div className="space-y-1" role="list" aria-label="Participant leaderboard">
          {(bond.participants || []).length === 0 ? (
            <EmptyStateIllustration
              type={isFootball ? "bleachers" : "chairs"}
              caption={t.emptyParticipants + " " + t.emptyParticipantsHint}
            />
          ) : (bond.participants || [])
            .slice()
            .sort((a, b) => (b.completed_tasks?.length || 0) - (a.completed_tasks?.length || 0))
            .slice(0, 8)
            .map((p, idx) => (
              <div key={p.id} className="ledger-row flex items-center gap-3 py-2" role="listitem" data-testid={`bond-leaderboard-row-${idx}`} aria-label={`${p.display_name}: ${(p.completed_tasks || []).length} of ${bond.task_requirements.length} clauses completed`}>
                <div className="w-6 text-center font-serif-display text-[15px] text-ink-700">{idx + 1}</div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-parchment font-ui font-semibold text-[11px] border border-ink"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 font-serif-display text-[15px] text-ink">{p.display_name}</div>
                <div className="font-ui text-[12px] text-ink-600">
                  {(p.completed_tasks || []).length}/{bond.task_requirements.length} clauses
                </div>
                {(p.completed_tasks || []).length >= bond.task_requirements.length && (
                  <Check size={14} className="text-emerald-700" />
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40" role="toolbar" aria-label="Bond actions" style={{ background: isFootball ? "linear-gradient(0deg, rgba(26,10,18,1) 60%, rgba(26,10,18,0))" : "linear-gradient(0deg, rgba(255,251,242,1) 60%, rgba(255,251,242,0))" }}>
        <div className="mx-auto w-full max-w-[460px] px-4 py-3 flex items-center gap-2">
          {bond.status === "pending" && (
            <RibbonButton
              variant="wax"
              className="flex-1"
              onClick={join}
              disabled={joining || alreadyJoined}
              data-testid="bond-dashboard-join-button"
              style={{ opacity: alreadyJoined ? 0.6 : 1 }}
            >
              {alreadyJoined ? "Mark witnessed \u2713" : joining ? "Pressing wax..." : bond.category === "football" ? `Pledge ${bond.fundee_pledge_amount} cr & Join` : `Pledge ${bond.fundee_pledge_amount} cr & Join`}
            </RibbonButton>
          )}
          {bond.status === "active" && (
            <>
              {!alreadyJoined ? (
                <RibbonButton variant="wax" className="flex-1" onClick={join} data-testid="bond-dashboard-late-join-button">
                  Join late — pledge {bond.fundee_pledge_amount} cr
                </RibbonButton>
              ) : (
                <RibbonButton variant="wax" className="flex-1" onClick={() => submitProof(bond.task_requirements[0]?.id)} data-testid="bond-dashboard-submit-proof-button">
                  Log a clause
                </RibbonButton>
              )}
              <RibbonButton variant="gold" className="flex-1" onClick={goRelease} data-testid="bond-dashboard-check-release-button">
                <ReleaseIcon size={14} className="inline mr-1" /> Attempt Release
              </RibbonButton>
            </>
          )}
          {(bond.status === "released" || bond.status === "failed") && (
            <>
              <RibbonButton variant="gold" className="flex-1" onClick={goRelease} data-testid="bond-dashboard-view-release-button">
                <Trophy size={14} className="inline mr-1" /> View the {bond.status === "released" ? "release" : "outcome"}
              </RibbonButton>
              <RibbonButton variant="ghost" className="flex-1" onClick={() => nav("/explore")} data-testid="bond-dashboard-back-to-explore">
                <ProofIcon size={14} className="inline mr-1" /> Browse more bonds
              </RibbonButton>
            </>
          )}
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/40" onClick={() => setShowShare(false)} />
            <motion.div
              className="relative bg-parchment-50 border border-parchment-300 rounded-lg shadow-2xl w-full max-w-[400px] overflow-hidden"
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-300">
                <div className="font-serif-display text-[20px] text-ink">Share this bond</div>
                <button onClick={() => setShowShare(false)} className="text-ink-500 hover:text-ink" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {/* OG card preview */}
                <div className="ornate-frame p-2 mb-4">
                  <img
                    src={api.bondCardUrl(id)}
                    alt={`${bond.title} share card`}
                    className="w-full h-auto rounded"
                    data-testid="bond-share-card-preview"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
                <p className="font-ui text-[12px] text-ink-600 mb-3">
                  Share the sealed scroll card on socials, or copy the link to invite witnesses.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={shareNative}
                    className="w-full ribbon-btn ribbon-btn-gold text-[13px]"
                    data-testid="bond-share-native-button"
                  >
                    <Share2 size={14} className="inline mr-1" /> Share link
                  </button>
                  <button
                    onClick={downloadCard}
                    className="w-full px-4 py-2.5 border border-ink text-ink font-ui text-[13px] hover:bg-ink hover:text-parchment transition-colors"
                    data-testid="bond-share-download-button"
                  >
                    <Download size={14} className="inline mr-1" /> Download share card
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full px-4 py-2.5 border border-parchment-300 text-ink-600 font-ui text-[13px] hover:bg-parchment-200 transition-colors"
                    data-testid="bond-share-copy-button"
                  >
                    <Copy size={14} className="inline mr-1" /> Copy link
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function GuestWitnessBanner({ bond, onWitness, witnessing }) {
  const [name, setName] = useState("");
  return (
    <div className="mt-3 ornate-frame p-4" data-testid="guest-witness-banner">
      <div className="flex items-center gap-2 mb-2">
        <WitnessIcon size={16} className="text-emerald-800" />
        <span className="font-serif-display text-[16px] text-ink">You're witnessing a pledge</span>
      </div>
      <p className="font-ui text-[12px] text-ink-600 mb-3">
        Enter your name to follow this bond. We'll notify you when proof is logged or the vault opens. No account needed.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          data-testid="guest-witness-name-input"
          className="flex-1 px-3 py-2 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[14px] text-ink focus:border-wax transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && !witnessing) onWitness(name.trim());
          }}
        />
        <button
          onClick={() => name.trim() && !witnessing && onWitness(name.trim())}
          disabled={!name.trim() || witnessing}
          data-testid="guest-witness-submit"
          className="px-4 py-2 text-[13px] font-ui border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-parchment transition-colors disabled:opacity-40"
        >
          {witnessing ? "..." : "Witness"}
        </button>
      </div>
    </div>
  );
}

function MetaBox({ label, value, football = false }) {
  if (football) {
    return (
      <div className="stat-band stat-band--burgundy">
        <div className="stat-band__value font-mono-broadcast truncate">{value}</div>
        <div className="stat-band__label">{label}</div>
      </div>
    );
  }
  return (
    <div className="px-2 py-2 border border-parchment-300 bg-parchment-50">
      <div className="font-ui text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className="font-serif-display text-[15px] text-ink truncate">{value}</div>
    </div>
  );
}

function TaskRow({ task, bond, myPid, onSubmit, index }) {
  const isDone = !!myPid && !!bond.participants.find((p) => p.id === myPid && (p.completed_tasks || []).includes(task.id));
  const totalDone = bond.participants.reduce((n, p) => n + ((p.completed_tasks || []).includes(task.id) ? 1 : 0), 0);

  // Pull streak from session for this bond
  const streak = React.useMemo(() => {
    const streaks = getStreaks();
    return streaks[bond.id]?.current || 0;
  }, [bond.id]);

  return (
    <div className="py-3 flex items-start gap-3" data-testid={`bond-task-row-${index}`}>
      <div className="shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDone ? "bg-emerald-800 border-emerald-800 text-parchment" : "border-ink text-ink"}`}>
          {isDone ? <Check size={16} /> : <span className="font-serif-display text-[14px]">{index + 1}</span>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-serif-display text-[16px] text-ink leading-tight">{task.title}</div>
          <WaxStamp variant="gold" className="text-[9px] shrink-0">{task.verification.replace("_", " ")}</WaxStamp>
          {/* Streak badge — shown when user has an active streak on this bond */}
          {myPid && streak >= 2 && index === 0 && (
            <motion.div
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(234,88,12,0.12)", border: "1px solid rgba(234,88,12,0.3)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Flame size={10} className="text-orange-600" />
              <span className="font-ui text-[9px] font-semibold text-orange-700">{streak}d streak</span>
            </motion.div>
          )}
        </div>
        <div className="font-ui text-[11.5px] text-ink-500 mt-0.5">
          {totalDone}/{bond.participants.length} {bond.category === "football" ? "done" : "witnessed"} · {task.task_type.replace("_", " ")}
          {task.target ? ` · target ${task.target}${task.unit ? " " + task.unit : ""}` : ""}
        </div>
      </div>
      {bond.status === "active" && myPid && (
        <button
          onClick={onSubmit}
          data-testid={`bond-task-log-button-${index}`}
          className={`px-3 py-1.5 text-[12px] font-ui border ${isDone ? "text-ink-500 border-parchment-300" : "text-parchment bg-ink border-ink"}`}
        >
          {isDone ? "Logged" : "Log proof"}
        </button>
      )}
    </div>
  );
}
