# Phase B — Demo Rider Provisioning

**Status:** Proposed
**Scope:** operational (sandbox only) — does **not** change the rider contract.

Phase B is the sole prerequisite for *external runnability* of the fulfillment
stack. It lets an outside developer authenticate into the first-party rider API
and exercise the lifecycle without any production access or staff intervention.

It is written **before** the sandbox exists on purpose: so the sandbox becomes a
consumer of the already-settled contract, rather than the sandbox accidentally
becoming the contract.

## Context

The rider contract is complete and governed (OpenAPI + golden fixtures + drift
gate + contract hierarchy + portal projection). The reference app
(`doeh-rider-app`) can be cloned and read today, but it cannot be *run* end to
end because logging in requires a real rider account — a `role='rider'` user in a
shop, authenticating via Sanctum (`POST /rider/login`). There is no self-serve
way for an external developer to obtain one.

## Goal

Allow an external developer to, **without operator assistance**:

1. Create or obtain a demo rider identity.
2. Log in through the documented Sanctum API.
3. Exercise the rider lifecycle (list → accept → pickup → delivered, COD, wallet).
4. Run the public reference application.
5. Produce runtime-captured fixtures (enables Phase D).

…without production shops, production riders, internal database access, or staff
intervention.

## Invariants

These are the reason this is a governance spec, not implementation notes.

1. **Sandbox only.** Demo riders MUST never authenticate against production.
   Provisioning is scoped to the sandbox environment and issues sandbox-only
   identities.
2. **First-party trust model preserved.** A demo rider is an ordinary rider
   account (Sanctum bearer token). Phase B introduces **no** API keys and does
   **not** expose rider capabilities through the integration SDK. The rider stack
   stays distinct from the `sk_`/edge integration stack.
3. **Contract isolation.** Provisioning is purely operational. It MUST NOT modify
   the OpenAPI authority, the golden fixtures, the drift gates, or the contract
   hierarchy. The contract remains authoritative and closed; Phase B only supplies
   *credentials and data* to exercise it.

## Proposed architecture

```
Sandbox environment
   └── Demo shop (seeded)
        ├── Demo rider account(s)        → Sanctum login (/rider/login)
        └── Seeded demo deliveries       → something to list/accept/deliver
                     │
                     ▼
        Public rider reference app  →  runtime-captured fixtures (Phase D)
```

Each developer receives access to a **seeded demo tenant**: a demo shop, at least
one demo rider linked to it, and — critically — **seeded demo deliveries** in
varied states (including a COD delivery and an unassigned/claimable one).

> A rider account alone is not enough. `GET /rider/deliveries` returns assigned /
> claimable deliveries; without seeded deliveries the demo rider logs into an
> empty app and cannot exercise accept/pickup/deliver/COD/wallet. **Seeding the
> deliveries is part of provisioning, not an afterthought.**

Illustrative shape:

| Field | Example (sandbox) |
|---|---|
| Shop | `demo-shop-001` |
| Rider | `demo.rider.001@example.com` |
| Password | one-time generated |
| Environment | sandbox only |
| Seeded deliveries | ≥1 claimable, ≥1 COD, ≥1 mid-lifecycle |

This aligns with the broader operational-sandbox direction (disposable seeded
shops + a `POST /sandbox/reset`); demo-rider provisioning is the rider-specific
slice of that.

## Provisioning methods

### Option A — Self-service (preferred)

Developer requests a demo rider from the Developer Portal → backend provisions a
rider (and seeds its deliveries) → temporary credentials returned → developer
logs in.

- **Pros:** zero manual work, scalable, reproducible.
- **Recommended.** It is the only option that fully satisfies "without operator
  assistance" at scale.

### Option B — Seed pool

A fixed set of pre-generated rider accounts (`demo-rider-01@…`, `02`, `03`); the
portal allocates an unused one.

- **Pros:** simplest to implement.
- **Cons:** finite inventory; needs recycling; concurrent developers contend.

### Option C — Invite flow

Developer enters an email; the system creates a rider and issues a verification
email.

- **Pros:** most realistic onboarding.
- **Cons:** higher operational cost (email deliverability), slower.

## Data lifecycle

- Demo riders and their seeded data are **ephemeral**, with a TTL (suggested
  **7–30 days**).
- Expired demo identities and deliveries may be recycled / reset (naturally via
  the sandbox reset).

## Relationship to Phase D (runtime fixture capture)

Phase B is what *unblocks* Phase D. The first successful sandbox delivery against
a demo rider produces an observed response that replaces the illustrative golden
fixtures, flipping their provenance:

```json
"meta": {
  "captured_from_runtime": true,
  "source": "sandbox-capture",
  "captured_at": "…",
  "capture_environment": "sandbox"
}
```

No structural change — the `meta` shape already anticipates this; only values and
provenance change, and the drift gate confirms the projections still agree.

## Acceptance criteria

A developer with **no internal access** can:

- ✓ obtain credentials
- ✓ log in (`/rider/login`)
- ✓ list deliveries
- ✓ accept a delivery
- ✓ mark picked up
- ✓ mark delivered (and collect COD)
- ✓ run the Expo reference app
- ✓ generate runtime-captured fixtures

…all without operator assistance.

## Out of scope

Production rider onboarding · RBAC redesign · SDK rider capability · fleet
integrations · production provisioning · push-notification scaling · payment
settlement. These belong to future operational epics.

## Notes on implementation

This spec is contract-level and lives in the public reference repo. The actual
provisioning implementation (sandbox backend, seeding, the portal "request demo
rider" action) lands in the product repo when the operational sandbox exists, and
should reference this document.
