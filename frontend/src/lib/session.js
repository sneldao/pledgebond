const KEY = "pledgebond.session.v1";

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

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
