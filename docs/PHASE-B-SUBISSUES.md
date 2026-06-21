# Phase B — Sub-Issue Breakdown

> **Parent:** [`PHASE-B-ACTIVATION.md`](PHASE-B-ACTIVATION.md)
> **Status:** Planned — **not created until sandbox readiness is declared** (see PB-01).
> **Design:** [`PHASE-B-DEMO-RIDER-PROVISIONING.md`](PHASE-B-DEMO-RIDER-PROVISIONING.md)
>
> These are the implementation sub-issues the umbrella spawns once the operational
> sandbox exists. Until then they are a plan, not active work.

---

## PB-01 — Sandbox Readiness Verification

**Labels:** `phase-b` · `sandbox` · `blocking`

- [ ] Verify sandbox deployment exists
- [ ] Verify disposable seeded shops
- [ ] Verify sandbox reset endpoint
- [ ] Verify mail strategy
- [ ] Verify data retention policy

**Exit criteria:** the sandbox can be recreated without operator intervention.

---

## PB-02 — Demo Rider Provisioning Service

**Labels:** `phase-b` · `provisioning`

- [ ] Create demo rider accounts
- [ ] Associate with a seeded shop
- [ ] Generate temporary credentials
- [ ] TTL policy
- [ ] Rider recycling

**Exit criteria:** a developer receives usable credentials automatically.

---

## PB-03 — Seed Dataset

**Labels:** `phase-b` · `fixtures`

Seed deliveries spanning the contract's state machine
(`1 Pending → 2 Accepted → 3 Preparing → 4 ReadyPickup → 5 OutForDelivery → 6 Delivered`, `8 Failed`):

- [ ] claimable (unassigned, `rider_id` null)
- [ ] COD (`cod_amount_minor > 0`)
- [ ] accepted (status 2)
- [ ] ready for pickup (status 4)
- [ ] in-transit / out-for-delivery (status 5)
- [ ] delivered (status 6)
- [ ] failed (status 8)
- [ ] Seed wallet history
- [ ] Seed notifications
- [ ] Seed QR examples (`delivery_code`)

**Exit criteria:** a fresh rider account immediately sees realistic activity.

---

## PB-04 — Developer Portal Integration

**Labels:** `phase-b` · `portal`

Portal flow: `Request Demo Rider → credentials → open rider app`.

- [ ] Add "Request Demo Rider" action
- [ ] Return credentials
- [ ] Link onward to the rider app

**Exit criteria:** no manual support required.

---

## PB-05 — Expo Reference Rider App

**Labels:** `phase-b` · `expo`

- [ ] SecureStore
- [ ] Login
- [ ] Deliveries
- [ ] Accept
- [ ] Pickup
- [ ] Delivered
- [ ] COD
- [ ] Wallet

**Exit criteria:** a clean-room developer can complete the workflow.

---

## PB-06 — Runtime Fixture Capture

**Labels:** `phase-d` · `fixtures`

- [ ] Capture the first successful sandbox delivery
- [ ] Update provenance: `captured_from_runtime=true`, `source=sandbox-capture`, `captured_at=…`, `capture_environment=sandbox`

**Exit criteria:** illustrative fixtures retired (drift gate stays green on the captured values).

---

## PB-07 — End-to-End Validation

**Labels:** `phase-b` · `acceptance`

Scenario (fresh developer, no internal access):

`provision rider → login → accept → pickup → deliver → COD → fixture capture`

- [ ] Whole scenario completes without operator assistance

**Exit criteria:** the umbrella acceptance criteria in [`PHASE-B-ACTIVATION.md`](PHASE-B-ACTIVATION.md) are all satisfied.
