# Demo Rider Quickstart

Run the rider (fulfillment) workflow against the **public DOEH sandbox** with a
shared demo account — no signup, no API key, no operator. This is the consumer
counterpart to the internal design in
[`PHASE-B-DEMO-RIDER-PROVISIONING.md`](PHASE-B-DEMO-RIDER-PROVISIONING.md).

> Provisioning model: **pooled credential** (Option B). Everyone shares one
> seeded demo rider in a disposable sandbox shop; the environment resets to a
> clean baseline on a schedule. Fully self-serve, per-developer riders (TTL,
> recycling) are a later step — see [Limits](#limits).

## What you get

| | |
|---|---|
| Host | `https://rider-sandbox.doehpos.com` |
| API base | `https://rider-sandbox.doehpos.com/api/v1/rider` |
| Demo rider | `rider@sandbox.test` / `sandbox-rider-pass` |
| Shop | `SBX-COFFEE-001` ("Sandbox Coffee") |
| Auth | Sanctum bearer token (no `sk_` key, no SDK) |

The sandbox is seeded with deliveries spanning the whole state machine, a wallet
with COD history, and notifications — so `GET /deliveries` is never empty and the
lifecycle is actually exercisable.

## 1. Log in → get a token

```bash
curl -s https://rider-sandbox.doehpos.com/api/v1/rider/login \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"email":"rider@sandbox.test","password":"sandbox-rider-pass"}'
```

```jsonc
{
  "token": "921|…",                         // ← Sanctum bearer token
  "rider": { "id": 1, "name": "Sandbox Rider", "email": null, "phone": null },
  "shops": [
    {
      "shop": { "id": 1, "shop_code": "SBX-COFFEE-001", "name": "Sandbox Coffee" },
      "user_id": 1, "rider_id": 1,
      "wallet": { "currency": "MMK", "balance_minor": 15000, "total_collected_minor": 15000 }
    }
  ]
}
```

Save the `token` and the first shop's `shop_code` — you need both for every
authenticated call.

## 2. The two headers every authenticated call needs

```
Authorization: Bearer <token>     ← who you are (the rider)
X-Shop-Code:   SBX-COFFEE-001     ← which shop you act in
```

> **The #1 mistake:** omitting `X-Shop-Code`. The bearer token authenticates the
> rider, but the server's `shop.auth` guard resolves the shop from this header.
> Without it, every authenticated call returns **401** ("not logged in").

```bash
TOKEN='921|…'
H=(-H "Authorization: Bearer $TOKEN" -H "X-Shop-Code: SBX-COFFEE-001" -H 'Accept: application/json')
BASE=https://rider-sandbox.doehpos.com/api/v1/rider
```

## 3. List your deliveries

```bash
curl -s "${H[@]}" "$BASE/deliveries"
```

```jsonc
[
  {
    "id": 6, "delivery_code": "DL-SBX-0006",
    "cod_amount_minor": 9000, "cod_collected": false, "is_cod": true,
    "status": 4, "status_label": "Ready for Pickup",
    "order_number": "SBX-ORD-0006", "shop_code": "SBX-COFFEE-001"
  }
  // …more, spanning statuses 2,4,5,6,8
]
```

`GET /deliveries` returns your **active** (non-terminal) deliveries. Pass
`?history=1` for delivered/cancelled/failed history.

## 4. Walk the lifecycle

Advance a delivery one step at a time with `PUT /deliveries/{id}/status`. Riders
follow a linear path and **cannot cancel** (only the shop can):

```
1 Pending → 2 Accepted → 3 Preparing → 4 ReadyPickup → 5 OutForDelivery → 6 Delivered
                                                                  └→ 8 Failed
```

Take delivery `6` (Ready for Pickup, COD 9000) from pickup to delivered:

```bash
# 4 → 5  pick up
curl -s "${H[@]}" -X PUT "$BASE/deliveries/6/status" \
  -H 'Content-Type: application/json' -d '{"status":5,"note":"picked up"}'

# 5 → 6  deliver  (auto-collects COD into your wallet)
curl -s "${H[@]}" -X PUT "$BASE/deliveries/6/status" \
  -H 'Content-Type: application/json' -d '{"status":6,"note":"delivered"}'
```

```jsonc
{ "id": 6, "status": 6, "status_label": "Delivered", "cod_collected": true }
```

Marking a COD delivery **Delivered** auto-collects the cash. The explicit
`PUT /deliveries/{id}/cod-collected` endpoint is only a fallback for deliveries
closed shop-side (it requires `status == 6` and `cod_collected == false`).

## 5. See the COD land in your wallet

```bash
curl -s "${H[@]}" "$BASE/wallet"
```

```jsonc
{ "currency": "MMK", "balance_minor": 24000, "total_collected_minor": 24000,
  "total_settled_minor": 0, "total_refunded_minor": 0 }
```

The balance moved `15000 → 24000` — the `9000` COD from delivery `6`.

## Money: integer minor units

Integrate against the `*_minor` integer fields (`balance_minor`,
`cod_amount_minor`, …) — they are the governed representation. The payloads
currently also carry major-unit companions (`balance`, `cod_amount`) for
convenience; prefer `*_minor`. **MMK is zero-decimal**, so the minor value equals
the displayed amount; for decimal currencies divide by 100.

## Endpoint reference (fulfillment)

| Method | Path | Purpose |
|---|---|---|
| POST | `/rider/login` | authenticate → token + shops |
| GET | `/rider/deliveries` | active deliveries (`?history=1` for past) |
| GET | `/rider/deliveries/{id}` | delivery detail (items, customer) |
| GET | `/rider/deliveries/scan/{code}` | look up by `delivery_code` (QR) |
| POST | `/rider/deliveries/{id}/claim` | claim an unassigned delivery |
| PUT | `/rider/deliveries/{id}/status` | advance one allowed transition |
| PUT | `/rider/deliveries/{id}/deliver` | quick-deliver (claim + deliver + COD) |
| PUT | `/rider/deliveries/{id}/cod-collected` | explicit COD collect (fallback) |
| GET | `/rider/wallet` | COD wallet balances |
| GET | `/rider/notifications/unread` | unread count |

Authoritative shapes: [`openapi/rider.yaml`](../openapi/rider.yaml).

## Run the reference app

The same workflow as a four-screen Expo app —
[`reference-app/`](../reference-app/). It defaults to this sandbox with the demo
rider prefilled:

```bash
cd reference-app && cp .env.example .env && npm install && npx expo start
```

## Limits

- **Shared & pooled.** One demo rider, one shop, used by everyone. Don't rely on
  any specific delivery state persisting — another developer (or the next reset)
  may have moved it.
- **Resets on a schedule.** Your status transitions and wallet changes are wiped
  back to the seeded baseline. This is a feature: the demo account always works.
- **Sandbox only.** No real customers, no real money, not for load testing.
- **Not yet self-serve.** Per-developer disposable riders with TTL/recycling are
  the remaining Phase B step. Until then, this pooled account is the on-ramp.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `401` on an authenticated call | missing/expired `Authorization`, or **missing `X-Shop-Code`** |
| `422` on a status change | transition not allowed from the current status (see the state machine) |
| `422` "Cannot collect COD before delivery…" | call `cod-collected` only after `status == 6` |
| empty `GET /deliveries` | all deliveries are terminal — try `?history=1`, or wait for the next reset |
