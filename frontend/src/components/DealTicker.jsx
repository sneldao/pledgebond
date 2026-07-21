import React, { useMemo } from "react";
import { tickerText } from "@/lib/categoryVocab";

/**
 * DealTicker — a thin scrolling ticker at the top of Explore showing
 * recent activity in Fabrizio Romano transfer-ticker style.
 *
 * Items look like:
 *   🚨 Marco sealed his 5K pledge · 2h ago
 *   🚨 Luca's deadline day in 18h
 *   🚨 Diego joined the squad
 *
 * Props:
 *  - bonds: array of bond objects
 *  - proofs: array of proof objects (from /api/proofs)
 */
export default function DealTicker({ bonds = [], proofs = [] }) {
  const items = useMemo(() => buildTickerItems(bonds, proofs), [bonds, proofs]);

  if (items.length === 0) return null;

  // Duplicate items for seamless scroll loop
  const loopItems = [...items, ...items];

  return (
    <div
      className="overflow-hidden border-y border-wax/30 py-1.5 flex items-center"
      style={{ background: "linear-gradient(90deg, rgba(155, 31, 61, 0.04) 0%, rgba(196, 154, 58, 0.04) 100%)" }}
      data-testid="deal-ticker"
    >
      <span className="shrink-0 flex items-center gap-1.5 px-3 font-mono-broadcast text-[9px] uppercase tracking-widest text-wax">
        <span className="live-dot" /> Live
      </span>
      <div className="flex items-center gap-8 whitespace-nowrap overflow-hidden" style={{ animation: "ticker-scroll 40s linear infinite" }}>
        {loopItems.map((item, i) => (
          <span key={i} className="font-ui text-[11.5px] text-ink-600 inline-flex items-center gap-1.5">
            <span className="text-wax">{"\uD83D\uDEA8"}</span>
            <span>{item.text}</span>
            {item.timeAgo && <span className="text-ink-400">· {item.timeAgo}</span>}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function buildTickerItems(bonds, proofs) {
  const items = [];
  const now = Date.now();

  // From proofs — recent proof submissions
  for (const p of proofs.slice(0, 8)) {
    const bond = bonds.find((b) => b.id === p.bond_id);
    if (!bond) continue;
    const name = p.participant_name || p.display_name || "Someone";
    const taskTitle = p.task_title || "a clause";
    const ago = timeAgo(p.submitted_at || p.created_at, now);
    const prefix = bond.category === "football" ? "\uD83D\uDEA8" : bond.category === "fitness" ? "\uD83C\uDFC3" : bond.category === "project" ? "\uD83D\uDE80" : "\uD83D\uDCDC";
    items.push({
      text: `${prefix} ${firstName(name)} logged ${taskTitle.toLowerCase()}`,
      timeAgo: ago,
    });
  }

  // From bonds — deadline warnings for active bonds
  for (const b of bonds) {
    if (b.status !== "active") continue;
    const hoursLeft = (new Date(b.deadline).getTime() - now) / 3600000;
    if (hoursLeft > 0 && hoursLeft < 48) {
      const t = tickerText({ category: b.category, display_name: b.funder_name, type: "default" });
      items.push({
        text: `${firstName(b.funder_name || "Someone")}'s ${b.category === "football" ? "deadline day" : b.category === "fitness" ? "finish line" : b.category === "project" ? "launch day" : "deadline"} in ${Math.floor(hoursLeft)}h`,
        timeAgo: null,
      });
    }
  }

  // From bonds — recently sealed
  for (const b of bonds) {
    if (b.status === "active") {
      const createdAgo = timeAgo(b.created_at, now);
      if (createdAgo && createdAgo !== "just now") {
        items.push({
          text: tickerText({ category: b.category, display_name: b.funder_name, type: "sealed" }),
          timeAgo: createdAgo,
        });
      }
    } else if (b.status === "released") {
      items.push({
        text: tickerText({ category: b.category, display_name: b.funder_name, type: "released" }),
        timeAgo: timeAgo(b.created_at, now),
      });
    }
  }

  return items.slice(0, 12);
}

function firstName(full) {
  if (!full) return "Someone";
  return full.split(" ")[0];
}

function timeAgo(iso, now) {
  if (!iso) return null;
  const ms = now - new Date(iso).getTime();
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
