# plan.md — Pledgebond

## 1) Objectives
- Deliver a mobile-first, screen-recordable demo of the full Pledgebond loop: **create bond → join/pledge → activate → complete tasks (auto-approved proof) → release/fail animation → share result**.
- Make the **vault/wax-seal metaphor** the primary UI element on every key screen (no generic SaaS dashboard layout).
- Implement **distinct audio cues** and a **signature release animation** (Framer Motion + SVG + canvas-confetti).
- Use **no auth**: role picker (Funder/Fundee/Organizer) + display name stored in `localStorage`.
- Backend is a simple ledger (no payments) with **seeded demo bonds**.

## 2) Implementation Steps (Phased)

### Phase 1 — Core Interaction POC (Isolation)
Focus: prove the identity-defining interaction works cleanly on mobile before building the full app.

**Deliverable:** a single-page “Vault Stage” prototype with hardcoded data.

User stories:
1. As a viewer, I can watch avatars fly in and orbit the seal when pledges are added.
2. As a funder, I can trigger “activation” and feel the seal snap shut with a clunk sound.
3. As a participant, I can feel deadline urgency via subtle vault strain + countdown ring.
4. As a group, when completion hits the goal, I see the seal crack and vault open with coins/confetti.
5. As a viewer, I can replay the release/fail sequence for screen recording.

Steps:
- Web research quick scan: best practices for **Framer Motion SVG morph/door swing**, **canvas-confetti layering**, and **mobile audio unlock** constraints.
- Build Vault POC (React only):
  - SVG wax seal + vault door (layered groups for crack/open states).
  - Orbiting avatar bubbles (Framer Motion) + “fly-in” pledge animation.
  - Activation transition: Pending→Active, seal “squash/bounce” + **seal-lock** audio.
  - Tension loop: subtle shake + ticking countdown ring.
  - Release transition: seal crack → door swing → light burst overlay → **canvas-confetti** coins stream to labeled pockets.
  - Fail transition: somber fade, vault stays shut, muted audio.
- Integrate audio cues via Howler.js (or Audio tag fallback): pledge-in, seal-lock, release.
- Validate on mobile viewport: 390×844 and 360×800; ensure 60fps feel and no layout jumps.
- Do not proceed until: animations are deterministic/replayable and audio triggers reliably after first user gesture.


### Phase 2 — V1 App Development (Frontend + Backend)
Focus: build the complete loop around the proven vault interaction.

User stories:
1. As a new user, I can pick a role + enter a display name and immediately use the app (no signup).
2. As a funder, I can create a bond (amount, threshold, deadline, tasks, payout split, cause) and see it in Explore.
3. As a fundee, I can join a pending bond, pledge, and see my avatar join the orbit.
4. As a fundee, I can submit proof (upload/log) and it immediately counts toward completion.
5. As a group, when completion conditions are met, I can trigger/observe the release screen and see payout split pockets fill.

Backend (FastAPI + MongoDB):
- Data models (MVP): `PledgeBond`, `FundeeParticipation`, `ProofSubmission`.
- Status transitions: Draft→Pending→Active (threshold reached)→Released / Failed (deadline passed unmet).
- Seed script on startup: 3–4 bonds (Pending, Active, near-Release, one near deadline).
- Endpoints (minimal):
  - `GET /bonds` (filters: status/category)
  - `GET /bonds/{id}`
  - `POST /bonds` (create)
  - `POST /bonds/{id}/join` (adds fundee + pledge)
  - `POST /bonds/{id}/proof` (auto-approve; increments completion)
  - `POST /bonds/{id}/release` (set Released if conditions met)
- File upload (MVP): store uploaded proof as local disk (dev) or simple gridfs; return URL for display.

Frontend (React):
- App shell: phone-first layout; parchment background; vault visual is the anchor.
- Role picker: store `{role, displayName}` in `localStorage`.
- Screens:
  1. Landing/Role Picker
  2. Explore Feed (seeded bonds; each card centered on mini seal + countdown)
  3. Create Bond (wizard: amounts→tasks→deadline→split→cause)
  4. Bond Dashboard (full Vault component + orbit participants + tasks/leaderboard)
  5. Join Bond (pledge + avatar entry)
  6. Proof Submission (upload/log number; instant success)
  7. Release Screen (signature animation + payout pockets + share card)
  8. Share panel (download/shareable image or copy link)
- Integrate Phase-1 Vault component as reusable:
  - Props: bond status, pledged totals, participant list, deadline, completion stats, payout split.
  - Events: onJoin, onActivate, onRelease.
- Ensure “no progress bar” rule: communicate progress via **seal thickness/tightness**, orbit density, and tension effects.

End Phase 2: one full end-to-end run using seed bond(s) and a newly created bond.


### Phase 3 — End-to-End Testing + Polish
Focus: stability, mobile feel, and ensuring the metaphor never breaks.

User stories:
1. As a user, I can refresh the page and the app restores my role/name without breaking flows.
2. As a participant, I can upload proof and immediately see it reflected in bond completion.
3. As a viewer, I can open any seeded bond and see correct vault state/animation for that status.
4. As a group, I can reliably reproduce Release and record it without glitches.
5. As a funder, I can see a clear “demo ledger” label so no one mistakes it for real payments.

Testing checklist:
- Contract tests for backend endpoints (create/join/proof/release) and status logic.
- UI state coverage: Draft/Pending/Active/Released/Failed.
- Mobile audio: verify first interaction unlocks sound; provide mute toggle.
- Performance: avoid re-render loops in orbit animation; memoize heavy SVG layers.
- Visual QA: typography, parchment textures, seal colors, no SaaS card-grid feel.
- Error handling: graceful toasts for late deadline, invalid joins, missing fields.


### Phase 4 — Feature Expansion (Post-V1, optional)
User stories:
1. As an organizer, I can monitor multiple bonds and quickly jump to the most urgent.
2. As a funder, I can customize seal style/theme per bond (corporate vs individual).
3. As a user, I can export a shareable “bond certificate” image.
4. As a participant, I can see ranked contributions and top streaks.
5. As a creator, I can create richer task templates (ranked/timed thresholds).

Candidates:
- Better proof gallery, richer task templates (ranked/timed)
- Deep-link share URLs
- More elaborate SVG art variants
- Optional lightweight real-time updates (polling) if needed

## 3) Next Actions
- Implement Phase 1 Vault POC page with replayable state machine (Pending→Active→Released/Failed).
- Choose and bundle 3 audio cues + implement mute toggle.
- Lock the vault SVG layer structure (seal, crack, door, light burst) and confirm it reads well on mobile.
- Once POC passes, scaffold FastAPI+Mongo + seed data and wire up Phase 2 screens.

## 4) Success Criteria
- The vault/seal interaction communicates progress/urgency **without a progress bar** and feels “physical.”
- Activation “clunk” and release burst are **screen-record clean** in vertical mobile framing.
- Full loop works end-to-end with seeded bonds and a newly created bond.
- No auth friction: role picker + display name persists and is sufficient for demo.
- Backend ledger is consistent and clearly labeled as a demo (no payments implied).