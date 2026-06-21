# Rider Contract Hierarchy Map

This page answers one question for the rider stack:

> **When two surfaces disagree about how the rider API behaves, which one is right?**

It is a mental model, not an operations guide. It is the rider analogue of the
Orders contract hierarchy: Orders and Rider are parallel contract systems sharing
the same governance, provenance, and drift-prevention model.

## A note on authority that is split

The rider API is unusual: the **internal Laravel aggregate already exists and is
authoritative for runtime behavior** (the rider app is in production). This public
contract is a **governed projection** of that aggregate, with two deliberate
translations:

- **Money** — the aggregate stores float major units; this contract exposes
  integer **minor units** (`*_minor`). A backend float⇄minor adapter is the
  authority for that conversion.
- **Field surface** — the contract documents the public-facing shape, not every
  raw internal field.

So "behavioral truth" below means *the behavior this public contract promises*,
fixed by the golden fixtures — not a second source of runtime truth.

## The layers

| Layer | Surface | Authoritative for | Not authoritative for |
|-------|---------|-------------------|-----------------------|
| Behavioral truth | **Golden rider fixtures** | What a correct rider request/response looks like (in minor units) | — |
| Enforcement | **Drift gate** | Whether the projections still agree with the fixtures | The behavior itself |
| Structural contract | **`rider.yaml`** | Shapes, types, fields, status codes, the state machine | Concrete example values |
| Reference consumer | **`doeh-rider-app`** | How a rider experience is built against the API | What the API returns |
| Narrative | **Portal** | Explanation, onboarding story | Anything factual about behavior |

```
Golden rider fixtures   ← behavioral truth (what wins)
      │  checked by
Drift gate              ← enforcement
      │  binds together
rider.yaml · doeh-rider-app · portal   ← projections
```

## The resolution rule

1. **The golden fixtures are the source of truth for rider behavior.** Any
   surface that shows behavior the fixtures do not is wrong — not the fixtures.
2. **`rider.yaml` is the source of truth for structure** (including the lifecycle
   state machine), within the bounds the fixtures demonstrate.
3. **The reference app is never authoritative.** It shows how to *consume* the
   contract. Mock data or screens that diverge from the fixtures are bugs.
4. **The portal is never authoritative.** It explains; it does not define.

Shortest form:

> **Rider behavior is decided by the fixtures. Rider structure is decided by
> OpenAPI. Applications, portal pages, and examples are projections — they may be
> wrong, but they cannot redefine authority.**

## The two invariants the gate also guards

- **Money is minor units.** Every `*_minor` field is a non-negative integer.
  The contract never carries float major units; the backend adapter converts.
- **The lifecycle is the rider-allowed state machine.**
  `Pending → Accepted → Preparing → ReadyPickup → OutForDelivery → Delivered`
  (or `→ Failed` from OutForDelivery). Transitions are linear; non-adjacent jumps
  are rejected; **riders cannot cancel** — only the shop can.

## Tenant-scope invariant (INV-RIDER-2)

A rider token represents **exactly one shop context**, derived from the
authenticated (email) user's `shop_id`. There is **no secondary identity
resolution** in rider read paths — phone is a profile attribute, never a routing
key — and **no cross-shop data access**: every read and write is scoped to the
token's shop. A rider registered in multiple shops uses a separate login/token
per shop.

This is a **backend-enforced runtime invariant** (it governs which rows a request
may see), so it is not checked by the example/fixture drift gate the way money
and lifecycle are. It is enforced in the API implementation and asserted at the
contract level here so the boundary is explicit and cannot be silently widened.

## Relationship to Orders

This mirrors the Orders contract system exactly. The two share one governance
model; neither redefines the other. New rider work plugs into these extension
points rather than reopening them:

- runtime-captured fixtures replace the illustrative ones once a real sandbox
  delivery is observed (flip `meta.captured_from_runtime`), with no structural
  change;
- demo-rider provisioning makes the reference app runnable by outside developers;
- production governance follows at operational cutover.
