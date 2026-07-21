import React, { useMemo } from "react";

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
    const isFootball = bond.category === "football";
    const name = p.participant_name || p.display_name || "Someone";
    const taskTitle = p.task_title || "a clause";
    const ago = timeAgo(p.submitted_at || p.created_at, now);
    items.push({
      text: isFootball
        ? `${firstName(name)} logged ${taskTitle.toLowerCase()}`
        : `${firstName(name)} submitted proof: ${taskTitle.toLowerCase()}`,
      timeAgo: ago,
    });
  }

  // From bonds — deadline day warnings for football bonds
  for (const b of bonds) {
    if (b.category !== "football" || b.status !== "active") continue;
    const hoursLeft = (new Date(b.deadline).getTime() - now) / 3600000;
    if (hoursLeft > 0 && hoursLeft < 48) {
      items.push({
        text: `${firstName(b.funder_name || "Someone")}'s deadline day in ${Math.floor(hoursLeft)}h`,
        timeAgo: null,
      });
    }
  }

  // From bonds — recently sealed deals
  for (const b of bonds) {
    if (b.category !== "football") continue;
    if (b.status === "active") {
      const createdAgo = timeAgo(b.created_at, now);
      if (createdAgo && createdAgo !== "just now") {
        items.push({
          text: `${firstName(b.funder_name || "Someone")} sealed a pledge: ${b.title?.replace(/^HERE WE GO:\s*/, "").slice(0, 30)}`,
          timeAgo: createdAgo,
        });
      }
    } else if (b.status === "released") {
      items.push({
        text: `${firstName(b.funder_name || "Someone")}'s deal is done — vault opened`,
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
