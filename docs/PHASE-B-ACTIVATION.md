# Phase B — Demo Rider Provisioning Implementation (tracking)

> **In-repo tracking artifact.** This is the umbrella tracker for Phase B
> implementation. It lives in the repo (committed over SSH) because the GitHub
> Issues API is not available from the build environment; promote it to a real
> GitHub issue (same title/labels/body) when convenient — the body below is
> ready to paste.
>
> **Labels:** `epic` · `phase-b` · `sandbox` · `blocked` · `rider`
> **Status:** Blocked on operational sandbox availability.
> **Design:** [`PHASE-B-DEMO-RIDER-PROVISIONING.md`](PHASE-B-DEMO-RIDER-PROVISIONING.md)

---

## Background

Phase B design is documented in [`PHASE-B-DEMO-RIDER-PROVISIONING.md`](PHASE-B-DEMO-RIDER-PROVISIONING.md). This tracker covers **implementation** once the sandbox environment exists.

Phase B is an **operational capability**. It does **not** modify the rider OpenAPI, golden fixtures, drift gates, contract hierarchy, or portal projections — those are already complete.

## Objective

Allow an external developer with **no internal access** to:

- obtain demo credentials
- authenticate via Sanctum
- exercise the rider lifecycle
- run the public Expo reference application
- generate runtime-captured fixtures

…without operator assistance.

## Preconditions

- [ ] Operational sandbox exists
- [ ] Disposable seeded shops available
- [ ] Sandbox reset capability available
- [ ] Demo email domain strategy decided

## Workstream 1 — Provisioning (self-service preferred)

`Developer Portal → Request Demo Rider → sandbox provisions account → credentials returned → developer logs in`

- [ ] Provision demo rider account
- [ ] Associate rider with a seeded sandbox shop
- [ ] Generate temporary credentials
- [ ] Credential expiration policy
- [ ] Rider recycling strategy

## Workstream 2 — Seed data

The seed tenant must include deliveries, not just a rider account (otherwise `GET /rider/deliveries` is empty and the lifecycle can't be exercised).

- [ ] ≥1 claimable delivery
- [ ] ≥1 COD delivery
- [ ] ≥1 accepted delivery
- [ ] ≥1 out-for-delivery item
- [ ] Wallet history
- [ ] Notifications
- [ ] QR examples

## Workstream 3 — Expo reference app (blocked until provisioning works)

- [ ] Login screen
- [ ] SecureStore integration
- [ ] Delivery list
- [ ] Accept flow
- [ ] Pickup flow
- [ ] Delivery completion
- [ ] COD flow
- [ ] Wallet view

## Workstream 4 — Runtime fixture capture (enables Phase D)

- [ ] Capture first successful sandbox delivery
- [ ] Update fixture provenance: `captured_from_runtime=true`, `source=sandbox-capture`, `captured_at=…`, `capture_environment=sandbox`

## Acceptance criteria

A developer with **no internal access** can, **without operator assistance**:

- [ ] obtain demo credentials
- [ ] login (`POST /rider/login`)
- [ ] view deliveries
- [ ] accept a delivery
- [ ] mark picked up
- [ ] mark delivered
- [ ] exercise the COD workflow
- [ ] run the Expo reference app
- [ ] capture runtime fixtures

## Blockers

**Operational sandbox not yet available.** Phase B should not begin implementation until this blocker is removed.

---

_Umbrella tracker. Once the sandbox exists, this spawns implementation sub-issues per workstream (planned breakdown: [`PHASE-B-SUBISSUES.md`](PHASE-B-SUBISSUES.md), PB-01…PB-07); until then it is the authoritative activation point for the remaining rider workstream._
