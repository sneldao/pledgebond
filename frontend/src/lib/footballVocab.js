/**
 * Football vocabulary mapper — translates app language to football language
 * for football-category bonds. Returns default app language for other categories.
 *
 * Usage:
 *   const t = vocab(bond.category);
 *   t.participants  // "squad" or "participants"
 *   t.witnesses     // "the crew" or "witnesses"
 *   t.sealed        // "Deal Sealed" or "Sealed · Active"
 */

const FOOTBALL_VOCAB = {
  participants: "squad",
  witnesses: "the crew",
  sealedActive: "Deal Sealed",
  released: "Deal Done",
  failed: "Deal Off",
  pending: "Deal Pending",
  join: "Join the squad",
  witness: "Join the crew",
  pledge: "Stake",
  deadline: "Deadline day",
  pool: "Stake pool",
  witnessCount: (n) => `${n} watching`,
  participantCount: (n) => `${n} in the squad`,
};

const DEFAULT_VOCAB = {
  participants: "participants",
  witnesses: "witnesses",
  sealedActive: "Sealed \u00B7 Active",
  released: "Released",
  failed: "Broken",
  pending: "Awaiting seal",
  join: (amt) => `Pledge $${amt} & Join`,
  witness: "Witness",
  pledge: "Pledge",
  deadline: "Deadline",
  pool: "Pool",
  witnessCount: (n) => `${n} witnesses`,
  participantCount: (n) => `${n} participants`,
};

export function vocab(category) {
  return category === "football" ? FOOTBALL_VOCAB : DEFAULT_VOCAB;
}

/**
 * Fabrizio-style activity ticker text for a proof/bond event.
 * Returns null for non-football bonds.
 */
export function fabrizioTickerText(event) {
  if (event.category !== "football") return null;
  const name = event.display_name || event.funder_name || "Someone";
  const action = event.type === "sealed"
    ? "sealed his pledge"
    : event.type === "joined"
    ? "joined the squad"
    : event.type === "witnessed"
    ? "joined the crew"
    : event.type === "proof"
    ? "logged proof"
    : event.type === "released"
    ? "deal done"
    : "made a move";
  return `\uD83D\uDEA8 ${name} ${action}`;
}
