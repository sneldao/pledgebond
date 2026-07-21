import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import VaultSeal from "@/components/VaultSeal";
import WaxStamp from "@/components/WaxStamp";
import RibbonButton from "@/components/RibbonButton";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { motion } from "framer-motion";
import { Plus, Clock } from "lucide-react";

const STATUS_LABELS = {
  pending: "Awaiting Seal",
  active: "Sealed \u00B7 Active",
  released: "Released",
  failed: "Broken",
};

function fmtDeadline(iso) {
  try {
    const dt = new Date(iso);
    const now = new Date();
    const ms = dt - now;
    if (ms < 0) return "deadline passed";
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  } catch {
    return "";
  }
}

export default function Explore() {
  const nav = useNavigate();
  const session = getSession();
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.listBonds();
        setBonds(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = bonds.filter((b) => (filter === "all" ? true : b.status === filter));

  return (
    <AppShell>
      <div className="pt-4">
        {/* Ritual masthead */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-ink-500">
              {session ? `Welcome, ${session.displayName}` : "Guest witness"}
            </p>
            <h1 className="font-serif-display text-[32px] leading-[1.05] tracking-serif-tight text-ink">Open Bonds</h1>
            <p className="font-serif-display italic text-[14px] text-ink-600 mt-1">
              Contracts of tension, awaiting hands.
            </p>
          </div>
          <button
            onClick={() => nav("/create")}
            className="ribbon-btn ribbon-btn-gold text-[13px]"
            data-testid="explore-create-bond-fab"
          >
            <span className="inline-flex items-center gap-1"><Plus size={14} /> Draft a Pledge</span>
          </button>
        </div>

        {/* Filter chips */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { k: "all", label: "All" },
            { k: "pending", label: "Awaiting seal" },
            { k: "active", label: "Sealed \u00B7 Active" },
            { k: "released", label: "Released" },
            { k: "failed", label: "Broken" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              data-testid={`explore-filter-${f.k}`}
              className={`px-3 py-1.5 rounded-full text-[12px] border font-ui whitespace-nowrap transition-colors ${
                filter === f.k
                  ? "bg-ink text-parchment border-ink"
                  : "bg-transparent text-ink border-parchment-300 hover:bg-parchment-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 ink-divider" />

        {loading ? (
          <div className="space-y-4 mt-4" role="status" aria-label="Loading bonds">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded bg-parchment-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ornate-frame mt-6 py-10 px-6 text-center">
            <div className="font-serif-display text-[22px] text-ink">No open bonds under this seal.</div>
            <p className="font-ui text-[13px] text-ink-600 mt-2">Draft the first pledge and let others gather.</p>
            <div className="mt-4 flex justify-center">
              <RibbonButton onClick={() => nav("/create")} data-testid="explore-empty-create-button">
                Draft a Pledge
              </RibbonButton>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-1" role="list" aria-label="Bond list">
            {filtered.map((b, idx) => (
              <BondRow key={b.id} bond={b} onOpen={() => nav(`/bond/${b.id}`)} index={idx} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function BondRow({ bond, onOpen, index }) {
  const totalPledged = (bond.participants?.length || 0) * (bond.fundee_pledge_amount || 0);
  const pledgeRatio = Math.min(1, totalPledged / Math.max(1, bond.activation_threshold || 1));

  // deadline ratio (rough, assumes 30d default window)
  const now = Date.now();
  const deadlineMs = new Date(bond.deadline).getTime();
  const total = 30 * 86400000;
  const remaining = deadlineMs - now;
  const deadlineRatio = Math.max(0, Math.min(1, 1 - remaining / total));

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      className="w-full text-left ledger-row flex items-center gap-4 py-4 group"
      data-testid={`explore-bond-row-${bond.id}`}
    >
      <div className="shrink-0">
        <VaultSeal
          status={bond.status}
          pledgeRatio={pledgeRatio}
          deadlineRatio={deadlineRatio}
          size={82}
          style={bond.seal_style || "burgundy"}
          showTension={false}
          hidePill
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif-display text-[19px] text-ink leading-tight truncate">{bond.title}</h3>
          <WaxStamp
            variant={bond.status === "released" ? "gold" : bond.status === "failed" ? "ink" : "burgundy"}
            className="shrink-0"
          >
            {STATUS_LABELS[bond.status]}
          </WaxStamp>
        </div>
        <p className="font-ui text-[12.5px] text-ink-600 mt-1 line-clamp-2">{bond.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[11.5px] font-ui text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {fmtDeadline(bond.deadline)}
          </span>
          <span>•</span>
          <span>${(bond.funder_amount || 0).toLocaleString()} at stake</span>
          <span>•</span>
          <span>{bond.participants?.length || 0} witnesses</span>
        </div>
      </div>
    </motion.button>
  );
}
