import test from "node:test";
import assert from "node:assert/strict";
import { createClassicSidepodGeometry } from "../src/classic-f1.js";
import { landmarkModel } from "../src/models.js";

test("classic F1 has an empty cockpit and outward-facing sculpted sidepods", () => {
  const model = landmarkModel("f1");
  assert.equal(model.userData.driver, false);
  assert.equal(model.userData.sidepodStyle, "flat-roof-tapered");
  for (const side of [-1, 1]) {
    const geometry = createClassicSidepodGeometry(side);
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    assert.ok(positions.array.every(Number.isFinite));
    assert.ok(normals.array.every(Number.isFinite));
    assert.ok(normals.getY(0) > 0);
    assert.ok(normals.getZ(2) * side > 0);
    // The flat top and narrow tail distinguish this from an elliptical tube.
    assert.equal(positions.getY(0), positions.getY(1));
    assert.ok(Math.abs(positions.getZ(2)) > Math.abs(positions.getZ(50)));
    geometry.dispose();
  }
});
