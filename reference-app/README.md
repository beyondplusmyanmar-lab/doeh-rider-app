# doeh-rider-reference (Expo)

A conservative, **fork-and-go** rider app that consumes the first-party DOEH
rider (fulfillment) API. It is the runnable companion to the governed contract in
the repository root (`openapi/rider.yaml` + golden fixtures + drift gate).

> **Not the production rider app.** This is a public reference. It contains no
> production secrets, no real FCM config, and no real tenants — only the
> published sandbox demo rider.

## What it demonstrates (PB-05)

The whole rider workflow on four screens:

| Screen | File | Contract surface |
|---|---|---|
| Login | `app/index.tsx` | `POST /rider/login` → token + shops |
| My deliveries | `app/deliveries.tsx` | `GET /rider/deliveries`, `GET /rider/wallet` |
| Delivery detail + actions | `app/delivery/[id].tsx` | `PUT /rider/deliveries/{id}/status`, `PUT …/cod-collected` |
| Wallet | `app/wallet.tsx` | `GET /rider/wallet`, `GET /rider/notifications/unread` |

The teaching core is **`src/api/client.ts`** — a tiny typed `fetch` client, no SDK.

## Two things every integrator gets wrong

1. **`X-Shop-Code` is required on every authenticated call.** The bearer token
   authenticates the *rider*; the `X-Shop-Code` header tells the server which
   shop they are acting in. Omit it and you get `401`. See `authHeaders()` in
   `src/api/client.ts`.
2. **Money is integer minor units (`*_minor`).** Never the float fields. MMK is
   zero-decimal, so minor equals the displayed amount; decimal currencies divide
   by 100. See `formatMinor()` in `src/domain/delivery.ts`.

The rider state machine is linear and riders cannot cancel — `nextRiderAction()`
in `src/domain/delivery.ts` mirrors the server's allowed transitions, so the UI
only ever offers a step the API will accept.

## Run it

```bash
cd reference-app
cp .env.example .env       # defaults already point at the public sandbox
npm install
npx expo start             # press i (iOS), a (Android), or w (web)
```

Sign in with the prefilled sandbox demo rider (`rider@sandbox.test`), open a
delivery, advance it to **Delivered** — the COD amount lands in the wallet. The
sandbox resets to a clean baseline on a schedule, so feel free to experiment.

To point at your own shop instead, set `EXPO_PUBLIC_RIDER_API_URL` to your POS
host and sign in with a real `role='rider'` account.

```bash
npm run typecheck          # strict TypeScript, no emit
```

## Posture

- The bearer token + active `shop_code` live in `expo-secure-store` (Keychain /
  Keystore), never plain AsyncStorage — see `src/store/session.tsx`.
- Everything in `.env` is `EXPO_PUBLIC_*` (inlined at build time). There are no
  secrets to leak.
- No push/FCM, no maps, no background location — intentionally out of scope. The
  point is the contract, not product UX.
