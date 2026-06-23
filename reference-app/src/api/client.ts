import { RIDER_API_PREFIX, RIDER_API_URL, USER_AGENT } from "@/config/env";

// ── DOEH rider (fulfillment) API client ──────────────────────────────────────
// Transport is plain HTTPS + a Sanctum bearer token. There is NO SDK and NO
// API key on this contract — `sk_` keys and the edge gateway belong to the
// *integration* "rider jobs" surface, which is a different product.
//
// Two headers authenticate every call after login:
//
//   Authorization: Bearer <token>   ← returned by POST /rider/login
//   X-Shop-Code:   <shop_code>      ← REQUIRED. The server's shop.auth guard
//                                     resolves which shop the rider acts in from
//                                     this header. Omit it and every authed call
//                                     returns 401 — this is the single most
//                                     common integration mistake.
//
// Money on this contract is integer minor units (*_minor); see domain/delivery.ts.

const base = `${RIDER_API_URL}${RIDER_API_PREFIX}`;

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": USER_AGENT,
};

function authHeaders(token: string, shopCode: string) {
  return { ...jsonHeaders, Authorization: `Bearer ${token}`, "X-Shop-Code": shopCode };
}

export class RiderApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "RiderApiError";
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    // The API returns {"message": "..."} for 4xx/5xx (validation, auth, state).
    throw new RiderApiError(res.status, body?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

// ── Types — mirror openapi/rider.yaml (the governed contract) ─────────────────

export interface Wallet {
  currency: string;
  balance_minor: number;
  total_collected_minor: number;
  total_settled_minor?: number;
  total_refunded_minor?: number;
}

export interface ShopMembership {
  shop: { id: number; shop_code: string; name: string };
  user_id: number;
  rider_id: number;
  wallet: Wallet;
}

export interface LoginResult {
  token: string;
  rider: { id: number; name: string; email: string | null; phone: string | null };
  shops: ShopMembership[];
}

export interface Delivery {
  id: number;
  delivery_code: string;
  drop_address: string | null;
  cod_amount_minor: number;
  cod_collected: boolean;
  is_cod: boolean;
  status: number;
  status_label: string;
  order_number: string | null;
  shop_id: number;
  shop_name: string | null;
  shop_code: string | null;
  created_at: string;
}

export interface StatusResult {
  id: number;
  status: number;
  status_label: string;
  cod_collected: boolean;
}

// ── Operations ────────────────────────────────────────────────────────────────

export function login(email: string, password: string): Promise<LoginResult> {
  return fetch(`${base}/login`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
  }).then((r) => parse<LoginResult>(r));
}

export function listDeliveries(token: string, shopCode: string): Promise<Delivery[]> {
  return fetch(`${base}/deliveries`, { headers: authHeaders(token, shopCode) }).then((r) =>
    parse<Delivery[]>(r),
  );
}

export function getDelivery(token: string, shopCode: string, id: number): Promise<Delivery> {
  return fetch(`${base}/deliveries/${id}`, { headers: authHeaders(token, shopCode) }).then((r) =>
    parse<Delivery>(r),
  );
}

// Advance a delivery one step along the rider-allowed state machine
// (PUT /deliveries/{id}/status). Reaching "Delivered" on a COD order
// auto-collects the cash into the wallet — see domain/delivery.ts.
export function advanceStatus(
  token: string,
  shopCode: string,
  id: number,
  status: number,
  note?: string,
): Promise<StatusResult> {
  return fetch(`${base}/deliveries/${id}/status`, {
    method: "PUT",
    headers: authHeaders(token, shopCode),
    body: JSON.stringify({ status, note }),
  }).then((r) => parse<StatusResult>(r));
}

// Explicit COD collection — only valid once status === Delivered and the cash
// has not already been auto-collected. A fallback for shop-side completions.
export function markCodCollected(
  token: string,
  shopCode: string,
  id: number,
): Promise<{ cod_collected: boolean; amount_minor: number }> {
  return fetch(`${base}/deliveries/${id}/cod-collected`, {
    method: "PUT",
    headers: authHeaders(token, shopCode),
  }).then((r) => parse<{ cod_collected: boolean; amount_minor: number }>(r));
}

export function getWallet(token: string, shopCode: string): Promise<Wallet> {
  return fetch(`${base}/wallet`, { headers: authHeaders(token, shopCode) }).then((r) =>
    parse<Wallet>(r),
  );
}

export function getUnreadCount(
  token: string,
  shopCode: string,
): Promise<{ unread_count: number }> {
  return fetch(`${base}/notifications/unread`, { headers: authHeaders(token, shopCode) }).then(
    (r) => parse<{ unread_count: number }>(r),
  );
}
