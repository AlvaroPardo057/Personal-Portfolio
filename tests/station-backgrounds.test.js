import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { enrichStationBackground } from "../src/station-backgrounds.js";

test("all six backgrounds expand without replacing existing scenery", () => {
  for (const id of [
    "f1",
    "bike",
    "power-plant",
    "library",
    "notebook",
    "phone",
  ]) {
    const background = new T.Group();
    const existing = new T.Group();
    background.add(existing);
    const scenery = enrichStationBackground(background, id);
    assert.equal(existing.parent, background);
    assert.ok(background.scale.x > 1 && background.scale.z > 1);
    assert.ok(scenery.children.length > 0 && scenery.children.length < 30);
    scenery.traverse((object) => {
      if (!object.isMesh) return;
      assert.ok(
        object.geometry.attributes.position.array.every(Number.isFinite),
      );
      assert.ok(object.geometry.attributes.normal.array.every(Number.isFinite));
    });
  }
});
