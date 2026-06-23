// All configuration here is build-time PUBLIC (EXPO_PUBLIC_* is inlined by Expo).
// This app holds no secrets: the sandbox host is public, and the demo credential
// is the *published* pooled sandbox rider (Phase B PB-02a). A real shop points
// RIDER_API_URL at its own host and the rider types their own credentials.

export const RIDER_API_URL =
  process.env.EXPO_PUBLIC_RIDER_API_URL ?? "https://rider-sandbox.doehpos.com";

// The first-party rider (fulfillment) API lives under this prefix on the
// POS-shop domain.
export const RIDER_API_PREFIX = "/api/v1/rider";

// Login-screen prefill — the published demo rider. Safe to commit; empty for a
// real shop.
export const PREFILL_EMAIL =
  process.env.EXPO_PUBLIC_RIDER_DEMO_EMAIL ?? "rider@sandbox.test";
export const PREFILL_PASSWORD =
  process.env.EXPO_PUBLIC_RIDER_DEMO_PASSWORD ?? "sandbox-rider-pass";

export const USER_AGENT = "doeh-rider-reference/0.1.0";
