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

> **Shipped as Option B (pooled credential), not a self-service service.** A
> single seeded demo rider (`rider@sandbox.test`) lives in the disposable sandbox
> shop and is recycled by the scheduled reset — so the self-service items below
> are intentionally deferred. The developer-facing usage guide (PB-02c) is
> [`DEMO-RIDER-QUICKSTART.md`](DEMO-RIDER-QUICKSTART.md).

- [x] Demo rider account — pooled, seeded (`rider@sandbox.test`)
- [x] Associate with a seeded shop — `SBX-COFFEE-001` (Sandbox Coffee)
- [x] Published credential (PB-02a) + dev docs (PB-02c → quickstart)
- [ ] Temporary per-developer credentials _(self-service, deferred)_
- [ ] TTL policy _(self-service, deferred)_
- [ ] Rider recycling — _via scheduled sandbox reset (pooled model)_

**Exit criteria:** a developer receives usable credentials automatically.
_Met for the pooled model: the credential is published and documented. Automatic
per-developer issuance remains the deferred self-service step._

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

Scaffolded in [`reference-app/`](../reference-app/) (Expo SDK 52, expo-router,
four screens). All eight surfaces are implemented against the live contract; the
HTTP lifecycle they drive is verified end-to-end (PB-07). On-device / simulator
run-through is the remaining step.

- [x] SecureStore — `src/store/session.tsx` (token + shop_code in Keychain/Keystore)
- [x] Login — `app/index.tsx` → `POST /rider/login`
- [x] Deliveries — `app/deliveries.tsx` → `GET /rider/deliveries`
- [x] Accept — `app/delivery/[id].tsx` (state-machine transition)
- [x] Pickup — `app/delivery/[id].tsx` (ReadyPickup → OutForDelivery)
- [x] Delivered — `app/delivery/[id].tsx` (auto-collects COD)
- [x] COD — `markCodCollected()` fallback + wallet delta on delivered
- [x] Wallet — `app/wallet.tsx` → `GET /rider/wallet`

**Exit criteria:** a clean-room developer can complete the workflow.
_Code complete; pending a device/simulator run-through to tick the exit box._

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
