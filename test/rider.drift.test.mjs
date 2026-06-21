// Rider golden-path drift gate.
//
// openapi/rider.yaml and examples/golden-path/rider/*.json are kept in lockstep:
// every fixture's request/response must equal the corresponding OpenAPI example.
// This is the rider analogue of the Orders drift gate — same governance model.
//
// It also enforces two internal-consistency invariants:
//   • money: every *_minor field is a non-negative integer (minor-units contract).
//   • lifecycle: each transition fixture moves along the rider-allowed state machine;
//     a non-adjacent jump (e.g. Pending → Delivered) is rejected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const spec = yaml.load(readFileSync(join(root, "openapi/rider.yaml"), "utf8"));
const fixture = (name) =>
  JSON.parse(readFileSync(join(root, "examples/golden-path/rider", name), "utf8"));

const jsonOf = (node) => node.content["application/json"];
const op = (path, method) => spec.paths[path][method];

// fixture ⇄ OpenAPI example binding
const CASES = [
  { file: "login.json",               path: "/rider/login",                       method: "post", req: "golden",    res: "golden" },
  { file: "assigned-deliveries.json", path: "/rider/deliveries",                  method: "get",                    res: "golden" },
  { file: "delivery-detail.json",     path: "/rider/deliveries/{id}",             method: "get",                    res: "golden" },
  { file: "accept.json",              path: "/rider/deliveries/{id}/status",      method: "put",  req: "accept",    res: "accept" },
  { file: "pickup.json",              path: "/rider/deliveries/{id}/status",      method: "put",  req: "pickup",    res: "pickup" },
  { file: "delivered.json",           path: "/rider/deliveries/{id}/status",      method: "put",  req: "delivered", res: "delivered" },
  { file: "cod-collected.json",       path: "/rider/deliveries/{id}/cod-collected", method: "put",                  res: "golden" },
  { file: "wallet.json",              path: "/rider/wallet",                      method: "get",                    res: "golden" },
];

for (const c of CASES) {
  test(`OpenAPI examples equal the golden fixture — ${c.file}`, () => {
    const fx = fixture(c.file);
    const o = op(c.path, c.method);

    if (c.req !== undefined) {
      const ex = jsonOf(o.requestBody).examples[c.req].value;
      assert.deepStrictEqual(ex, fx.request, `${c.file} request drift`);
    }
    const resEx = jsonOf(o.responses["200"]).examples[c.res].value;
    assert.deepStrictEqual(resEx, fx.response, `${c.file} response drift`);
  });
}

// ── money: every *_minor field is a non-negative integer ─────────────────────
const walkMinor = (node, hit) => {
  if (Array.isArray(node)) return node.forEach((n) => walkMinor(n, hit));
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k.endsWith("_minor")) hit(k, v);
      else walkMinor(v, hit);
    }
  }
};

test("all *_minor money fields are non-negative integers", () => {
  let checked = 0;
  for (const c of CASES) {
    walkMinor(fixture(c.file).response, (k, v) => {
      assert.ok(Number.isInteger(v) && v >= 0, `${c.file}: ${k}=${v} must be a non-negative integer`);
      checked++;
    });
  }
  assert.ok(checked > 0, "expected at least one *_minor field across fixtures");
});

// ── lifecycle: rider-allowed state machine ───────────────────────────────────
// 1=Pending 2=Accepted 3=Preparing 4=ReadyPickup 5=OutForDelivery 6=Delivered 8=Failed
const ALLOWED = { 1: [2], 2: [3], 3: [4], 4: [5], 5: [6, 8] };
const canTransition = (from, to) => (ALLOWED[from] ?? []).includes(to);

for (const file of ["accept.json", "pickup.json", "delivered.json"]) {
  test(`transition fixture follows the state machine — ${file}`, () => {
    const fx = fixture(file);
    const { from, to } = fx.transition;
    assert.strictEqual(fx.request.status, to, `${file}: request.status must equal transition.to`);
    assert.strictEqual(fx.response.status, to, `${file}: response.status must equal transition.to`);
    assert.ok(canTransition(from, to), `${file}: ${from} → ${to} is not a rider-allowed transition`);
  });
}

test("non-adjacent jump is rejected (Pending → Delivered)", () => {
  assert.ok(!canTransition(1, 6), "Pending → Delivered must not be allowed");
});

test("riders cannot cancel (no transition targets Cancelled)", () => {
  const targets = Object.values(ALLOWED).flat();
  assert.ok(!targets.includes(7), "no rider transition may target Cancelled (7)");
});
