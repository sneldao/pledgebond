/**
 * Category vocabulary mapper — gives each bond category its own
 * personality and language. Replaces footballVocab.js with a
 * multi-category system.
 *
 * Categories:
 * - football: transfer deal language (Fabrizio Romano style)
 * - fitness: training camp / athletic language
 * - project: startup / build / ship language
 * - custom: warm but generic
 * - default: formal pledge language
 *
 * Usage:
 *   const t = vocab(bond.category);
 *   t.participants  // "squad" | "the pack" | "the crew" | "the party"
 *   t.witnesses     // "the crew" | "the coaches" | "the investors" | "the witnesses"
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
  emptyParticipants: "No one in the squad yet.",
  emptyParticipantsHint: "Be the first to join the squad — stake your pledge and seal the deal.",
  emptyProofs: "No reps logged yet.",
  emptyProofsHint: "When the squad logs clauses, proof appears here for the crew to see.",
  tickerVerb: {
    sealed: "sealed his pledge",
    joined: "joined the squad",
    witnessed: "joined the crew",
    proof: "logged proof",
    released: "deal done",
    default: "made a move",
  },
};

const FITNESS_VOCAB = {
  participants: "the pack",
  witnesses: "the coaches",
  sealedActive: "Camp Open",
  released: "Goal Hit",
  failed: "DNF",
  pending: "Camp Pending",
  join: "Join the pack",
  witness: "Coach this pledge",
  pledge: "Commit",
  deadline: "Finish line",
  pool: "Pot",
  witnessCount: (n) => `${n} coaching`,
  participantCount: (n) => `${n} in the pack`,
  emptyParticipants: "The pack is empty.",
  emptyParticipantsHint: "Be the first to commit — lace up and join the training camp.",
  emptyProofs: "No reps logged yet.",
  emptyProofsHint: "When the pack logs sessions, proof appears here for the coaches to see.",
  tickerVerb: {
    sealed: "started training camp",
    joined: "joined the pack",
    witnessed: "stepped up to coach",
    proof: "logged a session",
    released: "hit the goal",
    default: "made a move",
  },
};

const PROJECT_VOCAB = {
  participants: "the crew",
  witnesses: "the investors",
  sealedActive: "Build Started",
  released: "Shipped",
  failed: "Sunk",
  pending: "Pitch Pending",
  join: "Join the build",
  witness: "Back this build",
  pledge: "Commit",
  deadline: "Launch day",
  pool: "Runway",
  witnessCount: (n) => `${n} backing`,
  participantCount: (n) => `${n} on the crew`,
  emptyParticipants: "The crew is empty.",
  emptyParticipantsHint: "Be the first to commit — join the build and ship before launch day.",
  emptyProofs: "No commits yet.",
  emptyProofsHint: "When the crew ships progress, proof appears here for the investors to see.",
  tickerVerb: {
    sealed: "started the build",
    joined: "joined the crew",
    witnessed: "backed the build",
    proof: "shipped progress",
    released: "shipped it",
    default: "made a move",
  },
};

const CUSTOM_VOCAB = {
  participants: "the party",
  witnesses: "the witnesses",
  sealedActive: "Sealed · Active",
  released: "Released",
  failed: "Broken",
  pending: "Awaiting seal",
  join: "Join the party",
  witness: "Witness this",
  pledge: "Pledge",
  deadline: "Deadline",
  pool: "Pool",
  witnessCount: (n) => `${n} witnessing`,
  participantCount: (n) => `${n} in the party`,
  emptyParticipants: "No one in the party yet.",
  emptyParticipantsHint: "Be the first to pledge — seal the vow and let others gather.",
  emptyProofs: "No proofs logged yet.",
  emptyProofsHint: "When the party logs proof, it appears here for all witnesses to see.",
  tickerVerb: {
    sealed: "sealed their pledge",
    joined: "joined the party",
    witnessed: "joined as witness",
    proof: "logged proof",
    released: "released the bond",
    default: "made a move",
  },
};

const DEFAULT_VOCAB = {
  participants: "participants",
  witnesses: "witnesses",
  sealedActive: "Sealed · Active",
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
  emptyParticipants: "No participants yet.",
  emptyParticipantsHint: "Be the first to pledge and seal the bond.",
  emptyProofs: "No proofs logged yet.",
  emptyProofsHint: "When participants log clauses, their proof appears here for all witnesses to see.",
  tickerVerb: {
    sealed: "sealed their pledge",
    joined: "joined the bond",
    witnessed: "joined as witness",
    proof: "logged proof",
    released: "released the bond",
    default: "made a move",
  },
};

const VOCAB_MAP = {
  football: FOOTBALL_VOCAB,
  fitness: FITNESS_VOCAB,
  project: PROJECT_VOCAB,
  custom: CUSTOM_VOCAB,
};

export function vocab(category) {
  return VOCAB_MAP[category] || DEFAULT_VOCAB;
}

/**
 * Activity ticker text for a proof/bond event.
 * Now supports all categories with category-specific verbs.
 */
export function tickerText(event) {
  const t = vocab(event.category);
  const name = event.display_name || event.funder_name || "Someone";
  const verb = t.tickerVerb[event.type] || t.tickerVerb.default;
  const prefix = event.category === "football" ? "\uD83D\uDEA8 " : event.category === "fitness" ? "\uD83C\uDFC3 " : event.category === "project" ? "\uD83D\uDE80 " : "\uD83D\uDCDC ";
  return `${prefix}${name} ${verb}`;
}

// Backward compat — keep the old export name working
export function fabrizioTickerText(event) {
  if (event.category !== "football") return null;
  return tickerText(event);
}
