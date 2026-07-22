const KEY = "pledgebond.session.v1";
const CREDITS_KEY = "pledgebond.credits.v1";

// ─── Reputation tiers ────────────────────────────────────────────────────────
export const REPUTATION_TIERS = [
  {
    name: "Bronze",
    minCredits: 0,
    maxCredits: 99,
    seal: "bronze",
    color: "#8B6534",
    description: "Starting your journey",
    maxBondCredits: 100,
  },
  {
    name: "Silver",
    minCredits: 100,
    maxCredits: 299,
    seal: "silver",
    color: "#8C8C9A",
    description: "Proven reliable",
    maxBondCredits: 500,
  },
  {
    name: "Gold",
    minCredits: 300,
    maxCredits: 799,
    seal: "gold",
    color: "#A77D2A",
    description: "Trusted by the ledger",
    maxBondCredits: 5000,
  },
  {
    name: "Platinum",
    minCredits: 800,
    maxCredits: Infinity,
    seal: "platinum",
    color: "#4A5568",
    description: "Bond master",
    maxBondCredits: Infinity,
  },
];

export function getReputationTier(credits) {
  return (
    [...REPUTATION_TIERS].reverse().find((t) => credits >= t.minCredits) ||
    REPUTATION_TIERS[0]
  );
}

// ─── Credit store ─────────────────────────────────────────────────────────────
export function getCredits() {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw === null) return null; // uninitialized
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function initCredits() {
  const existing = getCredits();
  if (existing !== null) return existing;
  const initial = { balance: 100, history: [], initializedAt: new Date().toISOString() };
  localStorage.setItem(CREDITS_KEY, JSON.stringify(initial));
  return initial;
}

export function adjustCredits(amount, reason) {
  const store = getCredits() || initCredits();
  const newBalance = Math.max(0, store.balance + amount);
  const updated = {
    ...store,
    balance: newBalance,
    history: [
      { amount, reason, balanceAfter: newBalance, at: new Date().toISOString() },
      ...(store.history || []).slice(0, 49), // keep last 50 events
    ],
  };
  localStorage.setItem(CREDITS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Streak tracking ──────────────────────────────────────────────────────────
const STREAK_KEY = "pledgebond.streaks.v1";

export function getStreaks() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Record a proof submission for streak tracking.
 * Returns { current, longest, broken, creditsAwarded }
 */
export function recordProofForStreak(bondId) {
  const streaks = getStreaks();
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const entry = streaks[bondId] || { current: 0, longest: 0, lastDate: null };

  const lastDate = entry.lastDate;
  let current = entry.current;
  let broken = false;

  if (lastDate === today) {
    // Already logged today — no change
    return { current, longest: entry.longest, broken: false, creditsAwarded: 0 };
  }

  if (lastDate) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastDate === yesterday.toISOString().slice(0, 10);
    if (wasYesterday) {
      current += 1;
    } else {
      // Streak broken — penalize -5 credits, reset to 1
      broken = true;
      current = 1;
      adjustCredits(-5, `streak broken on bond ${bondId}`);
    }
  } else {
    current = 1;
  }

  const longest = Math.max(entry.longest, current);

  // Bonus credits for milestones: 3, 7, 14, 30-day streaks
  let creditsAwarded = 0;
  if (!broken) {
    if (current === 3) { adjustCredits(5, `3-day streak on bond ${bondId}`); creditsAwarded = 5; }
    else if (current === 7) { adjustCredits(15, `7-day streak on bond ${bondId}`); creditsAwarded = 15; }
    else if (current === 14) { adjustCredits(30, `14-day streak on bond ${bondId}`); creditsAwarded = 30; }
    else if (current === 30) { adjustCredits(75, `30-day streak on bond ${bondId}`); creditsAwarded = 75; }
  }

  streaks[bondId] = { current, longest, lastDate: today };
  localStorage.setItem(STREAK_KEY, JSON.stringify(streaks));

  return { current, longest, broken, creditsAwarded };
}

// ─── Bond settlement (release/fail) ───────────────────────────────────────────
const SETTLED_KEY = "pledgebond.settled.v1";

/**
 * Settle a bond's credit payout for the current user.
 * On success: awards 2× the pledge (you get your stake back + equal bonus).
 * On failure: nothing (stake was already deducted at join time).
 * Idempotent — calling twice for the same bond is a no-op.
 * Returns { settled, creditsAwarded, reason } or { settled: false, reason: "already" }.
 */
export function settleBond(bondId, pledgeAmount, success) {
  try {
    const settled = JSON.parse(localStorage.getItem(SETTLED_KEY) || "{}");
    if (settled[bondId]) {
      return { settled: false, reason: "already" };
    }
    let creditsAwarded = 0;
    if (success) {
      creditsAwarded = pledgeAmount * 2;
      adjustCredits(creditsAwarded, `bond ${bondId} released — stake returned + bonus`);
    }
    settled[bondId] = { success, creditsAwarded, at: new Date().toISOString() };
    localStorage.setItem(SETTLED_KEY, JSON.stringify(settled));
    return { settled: true, creditsAwarded, success };
  } catch {
    return { settled: false, reason: "error" };
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────
export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.displayName || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession({ displayName, role, color }) {
  // Ensure credits are initialized on first session
  initCredits();
  const s = {
    displayName: (displayName || "").trim(),
    role: role || "fundee",
    color: color || "#7B1730",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function joinedBonds() {
  try {
    return JSON.parse(localStorage.getItem("pledgebond.joined.v1") || "{}");
  } catch {
    return {};
  }
}

export function markJoined(bondId, participantId) {
  const j = joinedBonds();
  j[bondId] = { participantId, joinedAt: new Date().toISOString() };
  localStorage.setItem("pledgebond.joined.v1", JSON.stringify(j));
}

export function getMyParticipantId(bondId) {
  return joinedBonds()[bondId]?.participantId || null;
}

// Witnessed bonds tracking (zero-friction tier)
const WITNESS_KEY = "pledgebond.witnessed.v1";

export function witnessedBonds() {
  try {
    return JSON.parse(localStorage.getItem(WITNESS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markWitnessed(bondId) {
  const w = witnessedBonds();
  w[bondId] = { witnessedAt: new Date().toISOString() };
  localStorage.setItem(WITNESS_KEY, JSON.stringify(w));
}

export function isWitnessing(bondId) {
  return !!witnessedBonds()[bondId];
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
