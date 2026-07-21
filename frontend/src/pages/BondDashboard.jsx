import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import VaultSeal from "@/components/VaultSeal";
import OrbitAvatars from "@/components/OrbitAvatars";
import WaxStamp from "@/components/WaxStamp";
import RibbonButton from "@/components/RibbonButton";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getSession, markJoined, getMyParticipantId } from "@/lib/session";
import { sfx, unlockAudio } from "@/lib/sound";
import { toast } from "sonner";
import { Check, Trophy, Share2, RotateCcw, Sparkles } from "lucide-react";

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
  const [tick, setTick] = useState(0);
  const myPid = getMyParticipantId(id);
  const [prevStatus, setPrevStatus] = useState(null);

  const load = async () => {
    try {
      const b = await api.getBond(id);
      setBond((old) => {
        if (old?.status !== b.status) {
          if (b.status === "active" && old?.status === "pending") sfx.sealLock();
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
  const deadlineRatio = useMemo(() => {
    if (!bond) return 0;
    const createdMs = new Date(bond.created_at).getTime();
    const deadlineMs = new Date(bond.deadline).getTime();
    const now = Date.now();
    const total = Math.max(1, deadlineMs - createdMs);
    const elapsed = Math.max(0, Math.min(total, now - createdMs));
    return elapsed / total;
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
      setBond(b);
      toast.success("Your mark is witnessed.", { description: `You pledged $${b.fundee_pledge_amount}.` });
      if (b.status === "active" && prevStatus === "pending") {
        setTimeout(() => sfx.sealLock(), 200);
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
    nav(`/bond/${id}/proof/${taskId}`);
  };

  const goRelease = async () => {
    nav(`/bond/${id}/release`);
  };

  const resetDemo = async () => {
    try {
      const b = await api.resetBond(id);
      setBond(b);
      toast.success("Bond reset to Pending (demo)");
    } catch (e) {
      toast.error("Reset failed");
    }
  };

  if (loading) return <AppShell><div className="pt-10 text-center font-ui text-ink-500">Fetching the ledger...</div></AppShell>;
  if (!bond) return <AppShell><div className="pt-10 text-center font-ui text-ink-500">Bond not found.</div></AppShell>;

  return (
    <AppShell showBack backTo="/explore">
      {/* Header */}
      <div className="pt-3">
        <div className="flex items-center gap-2 text-[11px] font-ui uppercase tracking-widest text-ink-500">
          <span>{bond.category === "corporate" ? "Corporate Program" : "Individual Challenge"}</span>
          <span>·</span>
          <span>Bond #{bond.id.slice(0, 6)}</span>
        </div>
        <h1 className="font-serif-display text-[28px] tracking-serif-tight text-ink leading-tight">{bond.title}</h1>
        <p className="font-serif-display italic text-[14px] text-ink-600 mt-1">In benefit of — <span className="not-italic text-ink">{bond.cause_name}</span></p>
      </div>

      {/* Hero vault */}
      <div className="mt-6 flex flex-col items-center relative">
        <div className="relative" style={{ width: 320, height: 320 }}>
          <VaultSeal
            status={bond.status}
            pledgeRatio={pledgeRatio}
            deadlineRatio={deadlineRatio}
            completionRatio={completionRatio}
            size={320}
            style={bond.seal_style || "burgundy"}
            onLockComplete={() => {}}
          />
          <OrbitAvatars
            participants={bond.participants || []}
            centerSize={320}
            ringRadius={175}
            maxSlots={18}
          />
        </div>

        {/* Meta strip */}
        <div className="mt-6 grid grid-cols-3 gap-2 w-full">
          <MetaBox label="At stake" value={`$${(bond.funder_amount || 0).toLocaleString()}`} />
          <MetaBox label="Pool" value={`$${totalPledged.toLocaleString()} / $${bond.activation_threshold.toLocaleString()}`} />
          <MetaBox label={bond.status === "pending" ? "Time to seal" : "Time remaining"} value={cdText} />
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 ornate-frame p-4">
        <div className="font-ui text-[11px] uppercase tracking-widest text-ink-500 mb-1">The pledge</div>
        <p className="font-serif-display text-[16px] text-ink leading-relaxed">{bond.description || "A bond of collective intent."}</p>
        <div className="mt-3 flex items-center gap-2 text-[12px] font-ui text-ink-600">
          <span>Funder — <b>{bond.funder_name || "Anonymous Patron"}</b></span>
          <span>·</span>
          <span>Match — <b>${bond.fundee_pledge_amount}</b></span>
        </div>
      </div>

      {/* Clauses */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-serif-display text-[20px] text-ink">Clauses of the bond</h2>
          <span className="ink-divider flex-1" />
        </div>
        <div className="divide-y divide-parchment-300">
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
        </div>
      </div>

      {/* Leaderboard (top 5) */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-serif-display text-[20px] text-ink">Witness ledger</h2>
          <span className="ink-divider flex-1" />
        </div>
        <div className="space-y-1">
          {(bond.participants || [])
            .slice()
            .sort((a, b) => (b.completed_tasks?.length || 0) - (a.completed_tasks?.length || 0))
            .slice(0, 8)
            .map((p, idx) => (
              <div key={p.id} className="ledger-row flex items-center gap-3 py-2" data-testid={`bond-leaderboard-row-${idx}`}>
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
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: "linear-gradient(0deg, rgba(255,251,242,1) 60%, rgba(255,251,242,0))" }}>
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
              {alreadyJoined ? "Mark witnessed \u2713" : joining ? "Pressing wax..." : `Pledge $${bond.fundee_pledge_amount} & Join`}
            </RibbonButton>
          )}
          {bond.status === "active" && (
            <>
              {!alreadyJoined ? (
                <RibbonButton variant="wax" className="flex-1" onClick={join} data-testid="bond-dashboard-late-join-button">
                  Join late — pledge ${bond.fundee_pledge_amount}
                </RibbonButton>
              ) : (
                <RibbonButton variant="wax" className="flex-1" onClick={() => submitProof(bond.task_requirements[0]?.id)} data-testid="bond-dashboard-submit-proof-button">
                  Log a clause
                </RibbonButton>
              )}
              <RibbonButton variant="gold" className="flex-1" onClick={goRelease} data-testid="bond-dashboard-check-release-button">
                <Sparkles size={14} className="inline mr-1" /> Attempt Release
              </RibbonButton>
            </>
          )}
          {(bond.status === "released" || bond.status === "failed") && (
            <>
              <RibbonButton variant="gold" className="flex-1" onClick={goRelease} data-testid="bond-dashboard-view-release-button">
                <Trophy size={14} className="inline mr-1" /> View the {bond.status === "released" ? "release" : "outcome"}
              </RibbonButton>
              <RibbonButton variant="ghost" onClick={resetDemo} data-testid="bond-dashboard-reset-button">
                <RotateCcw size={14} />
              </RibbonButton>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function MetaBox({ label, value }) {
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
  return (
    <div className="py-3 flex items-start gap-3" data-testid={`bond-task-row-${index}`}>
      <div className="shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDone ? "bg-emerald-800 border-emerald-800 text-parchment" : "border-ink text-ink"}`}>
          {isDone ? <Check size={16} /> : <span className="font-serif-display text-[14px]">{index + 1}</span>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-serif-display text-[16px] text-ink leading-tight">{task.title}</div>
          <WaxStamp variant="gold" className="text-[9px] shrink-0">{task.verification.replace("_", " ")}</WaxStamp>
        </div>
        <div className="font-ui text-[11.5px] text-ink-500 mt-0.5">
          {totalDone}/{bond.participants.length} witnessed · {task.task_type.replace("_", " ")}
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
