// Mirrors the server's rider-allowed state machine
// (RiderDeliveryController::riderAllowedTransitions). The app only ever offers a
// transition the API will accept; riders can never cancel (status 7) — only the
// shop can. Keeping this in one place is the contract's teaching value.

export const Status = {
  Pending: 1,
  Accepted: 2,
  Preparing: 3,
  ReadyPickup: 4,
  OutForDelivery: 5,
  Delivered: 6,
  Cancelled: 7,
  Failed: 8,
} as const;

export type StatusCode = (typeof Status)[keyof typeof Status];

export const STATUS_LABEL: Record<number, string> = {
  1: "Pending",
  2: "Accepted",
  3: "Preparing",
  4: "Ready for Pickup",
  5: "Out for Delivery",
  6: "Delivered",
  7: "Cancelled",
  8: "Failed",
};

const TERMINAL: number[] = [Status.Delivered, Status.Cancelled, Status.Failed];
export const isTerminal = (status: number): boolean => TERMINAL.includes(status);

// The single forward action a rider may take from a given status, labelled for
// the UI. Returns null at a terminal status.
export function nextRiderAction(status: number): { status: number; label: string } | null {
  switch (status) {
    case Status.Pending:
      return { status: Status.Accepted, label: "Accept" };
    case Status.Accepted:
      return { status: Status.Preparing, label: "Mark preparing" };
    case Status.Preparing:
      return { status: Status.ReadyPickup, label: "Mark ready for pickup" };
    case Status.ReadyPickup:
      return { status: Status.OutForDelivery, label: "Pick up" };
    case Status.OutForDelivery:
      return { status: Status.Delivered, label: "Mark delivered" };
    default:
      return null;
  }
}

// Money on the rider contract is integer minor units (*_minor). MMK is a
// zero-decimal currency, so minor == major; decimal currencies divide by 100.
const ZERO_DECIMAL = new Set(["MMK", "JPY", "KRW", "VND"]);

export function formatMinor(minor: number, currency: string): string {
  const value = ZERO_DECIMAL.has(currency) ? minor : minor / 100;
  return `${currency} ${value.toLocaleString()}`;
}
