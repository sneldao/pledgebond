# Pledgebond Feature Flags

All optional integrations are **off by default** so the app runs as a frictionless, screen-recordable demo (no auth, no payments, no external deps).

Flip a flag in `/app/backend/.env` and restart the backend (`sudo supervisorctl restart backend`) to enable it.

## Flags

| Env Var | What it does | Extra config needed |
|---|---|---|
| `ENABLE_AUTH` | Mounts `/api/auth/*` (JWT + bcrypt). `ProtectedRoute` becomes strict. Login/Register pages appear. | `JWT_SECRET` |
| `ENABLE_PAYMENTS` | Mounts `/api/payments/*` (Stripe). Requires Stripe keys or the router returns 5xx. | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PLATFORM_FEE_PERCENT` |
| `ENABLE_WEBSOCKETS` | Exposes `/ws/bonds/{bond_id}` and turns `emit_bond_event` from a no-op into a real broadcast. | — |
| `ENABLE_REFERRALS` | Mounts `/api/referrals/*` (invite codes, trust boosts). | — |
| `ENABLE_LEADERBOARDS` | Mounts `/api/leaderboards/*` (global/streak rankings). | — |
| `ENABLE_TEMPLATES` | Mounts `/api/templates/*` (curated bond templates seeded on startup). | — |
| `ENABLE_STORAGE` | Mounts `/api/storage/*` (S3 file uploads for proofs). Falls back to noop if boto3 or creds missing. | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |

## How the frontend adapts

On boot, the frontend calls `GET /api/config` and receives the current flag state. The `AuthContext` propagates this via `useAuth()`:

```js
const { features, authEnabled, demoMode } = useAuth();
```

- When `auth` is **off**: `ProtectedRoute` requires only a display-name session (role picker on `/`). Login/Register routes redirect home.
- When `auth` is **on**: `ProtectedRoute` enforces a real JWT session. Login/Register routes are live.

## Demo bypass in auth-required modules

Routes protected via `Depends(require_user)` still work with `ENABLE_AUTH=0` — they receive a synthetic demo user built from the `X-Demo-Name` / `X-Demo-Role` headers (or a `Guest Witness` default). This lets `templates`, `payments` (when enabled without auth), etc. continue to function during the demo.

## Sanity check

After starting the backend you should see one of these lines in the logs:

```
Pledgebond ready. Enabled features: ['(none — demo mode)']
# or
Pledgebond ready. Enabled features: ['auth', 'websockets']
```

And hitting `/api/config` returns:

```json
{ "features": { "auth": false, "payments": false, ... }, "demo_mode": true }
```
