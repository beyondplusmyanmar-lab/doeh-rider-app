# doeh-rider-app

Public **reference** rider application for shop developers building on DOEH.

This repository is the rider analogue of the Orders contract system: it holds the
**governed Fulfillment Contract** (OpenAPI + golden fixtures + drift gate +
contract hierarchy) and — as it matures — a conservative Expo reference app that
consumes it. It demonstrates how to integrate a rider experience against DOEH
fulfillment.

> **This is not the production rider application.** DOEH's own rider app is a
> separate, private, first-party operational app. This repo is a public reference
> that consumes the same documented contract.

## Two stacks — read this first

The word "rider" appears in two unrelated DOEH surfaces. They are different
products:

| | Integration "rider jobs" | **Fulfillment (this repo)** |
|---|---|---|
| Resource model | jobs (`/v1/rider/jobs`) | deliveries (`/api/v1/rider/*`) |
| Auth | `sk_` key / edge gateway | **Sanctum** bearer token, POS-shop domain |
| Audience | third-party integrators | first-party rider apps |
| SDK | `@beyondplusmm/doehpos-sdk` (`rider` module) | none yet (see Roadmap) |

This repo documents the **fulfillment** contract only.

## Overview

A rider's lifecycle, as a governed contract:

- **auth** — login (multi-shop), register, verify/reset password
- **deliveries** — list (active / history), detail, advance status, QR scan,
  claim, quick-deliver, mark COD collected
- **profile / wallet** — rider profile, COD wallet balances
- **location** — live GPS updates
- **notifications** — in-app feed + FCM device registration

State machine (rider-allowed, linear; riders cannot cancel — only the shop can):

```
Pending → Accepted → Preparing → ReadyPickup → OutForDelivery → Delivered
                                                       └→ Failed
```

Money on this contract is **integer minor units** (`*_minor`).

## Quickstart

Today the repository is a **readable, CI-enforced contract**. To explore it:

```bash
npm install
npm test          # runs the contract drift gate (OpenAPI ⇄ fixtures + invariants)
```

- The contract: [`openapi/rider.yaml`](openapi/rider.yaml)
- The canonical examples: [`examples/golden-path/rider/`](examples/golden-path/rider/)
- Rendered docs are published at
  [`developers.doehpos.com/docs/fulfillment/`](https://developers.doehpos.com/docs/fulfillment/).

When the Expo reference app lands (see Roadmap), running it will look like:

```bash
cp .env.example .env      # set RIDER_API_URL to your shop / sandbox host
npm install
npm run dev               # then log in with a (demo) rider account
```

## Sandbox requirements

The reference app needs a **rider account** to log in. A rider is a real
`role='rider'` user in a shop. Self-serve **demo-rider provisioning** in a
sandbox does not exist yet — it is tracked as **Phase B** below. Until then, the
contract is fully readable and testable, but running an end-to-end app requires a
rider account in a shop you control.

## Contract hierarchy

Behavior is decided by the fixtures; structure by OpenAPI; everything else is a
projection. See [`docs/CONTRACT-HIERARCHY.md`](docs/CONTRACT-HIERARCHY.md) for the
layer model and the conflict-resolution rule. This mirrors the Orders contract
system — the two share one governance model.

## Golden fixtures

[`examples/golden-path/rider/`](examples/golden-path/rider/) holds the canonical
request/response for each operation. Each fixture carries provenance:

```json
"meta": {
  "source": "deterministic-golden-path-fixture",
  "captured_from_runtime": false,
  "money_representation": "minor-units",
  "pricing": "illustrative"
}
```

The drift gate ([`test/rider.drift.test.mjs`](test/rider.drift.test.mjs)) fails
if the OpenAPI examples and the fixtures diverge, if any `*_minor` field is not a
non-negative integer, or if a transition violates the state machine.

## Known limitations

- **No published rider client / SDK.** The contract is documented; there is no
  npm client yet. Code samples here describe the HTTP contract, not a shipped
  package.
- **Float⇄minor adapter (`INV-RIDER-1`) is not built.** The internal aggregate
  stores float major units; this contract exposes minor units. Serving the
  contract for real requires a boundary adapter (the rider analogue of the Orders
  `MoneyCodec`).
- **Fixtures are illustrative, not runtime-captured** (`captured_from_runtime:
  false`). They flip to captured values at Phase D.
- **Accepted temporary seam (A.6).** The developer portal renders a vendored copy
  at `developer-portal/docs/openapi/fulfillment.yaml`; the authoritative source is
  this repo's `openapi/rider.yaml`. A parity check is deferred until this repo is
  the published upstream — removal is planned as part of this repo's setup.

## Roadmap

| Phase | Item | Status |
|---|---|---|
| A | Governed contract (OpenAPI · fixtures · drift gate · hierarchy · portal page) | ✅ done |
| **B** | **Demo-rider provisioning** — [design spec](docs/PHASE-B-DEMO-RIDER-PROVISIONING.md) (Proposed); sandbox account so the app is runnable | ⏳ depends on operational sandbox |
| C | This public repository | ✅ in progress |
| D | Runtime-captured fixtures (flip `captured_from_runtime` after a real sandbox delivery) | ⏳ |
| INV-RIDER-1 | Float⇄minor adapter at the API boundary | ⏳ |

### Expo app posture

When the reference app is built it will stay **intentionally conservative** —
login, assigned deliveries, detail, accept, pickup, delivered, wallet,
notifications. It will **never** contain production secrets, real FCM config,
real tenants, or real rider credentials.
