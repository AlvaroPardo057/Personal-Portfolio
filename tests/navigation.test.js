import { test } from "node:test";
import assert from "node:assert/strict";
import { permitted, moveWithCollision, findPath, PARK_RADIUS } from "../src/navigation.js";
import { requestCompanionReply, validateReply } from "../src/backend.js";
test("visitor remains inside park and outside sculpture footprints", () => {
  assert.equal(permitted(PARK_RADIUS + .1, 0, []), false);
  assert.equal(permitted(0, 0, [{ x: 0, z: 0, r: 2 }]), false);
  const p = { x: PARK_RADIUS - .5, z: 0 };
  moveWithCollision(p, 2, 0, []);
  assert.equal(p.x, PARK_RADIUS - .5);
});
test("guide routes around an obstacle", () => {
  const obs = [{ x: 0, z: 0, r: 2 }];
  const path = findPath({ x: -5, z: 0 }, { x: 5, z: 0 }, obs);
  assert.ok(path.length > 0);
  assert.ok(path.every((p) => permitted(p.x, p.z, obs, 0.65)));
  assert.ok(path.some((p) => Math.abs(p.z) > 2));
  assert.ok(Math.hypot(path.at(-1).x - 5, path.at(-1).z) < 1.5);
});
test("demo returns stable destination IDs and rejects malformed replies", async () => {
  const result = await requestCompanionReply([
    { role: "user", content: "Show me clean energy" },
  ]);
  assert.equal(result.destination_object_id, "power-plant");
  assert.equal(
    validateReply({ message: "Hello", destination_object_id: "unknown" })
      .destination_object_id,
    null,
  );
  assert.throws(() => validateReply({ message: 4 }));
});
