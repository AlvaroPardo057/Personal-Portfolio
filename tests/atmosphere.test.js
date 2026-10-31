import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { createAtmosphere } from "../src/atmosphere.js";

test("sunny atmosphere stays finite, batches flowers and respects reduced motion", () => {
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera();
  const atmosphere = createAtmosphere(scene);
  camera.position.set(12, 20, 30);
  atmosphere.update(0, camera, true);
  const poses = scene.children.map((object) => object.position.toArray());
  atmosphere.update(100, camera, true);
  assert.deepEqual(
    scene.children.map((object) => object.position.toArray()),
    poses,
  );
  assert.ok(
    scene.children.some(
      (object) => object.isGroup && object.children.length === 5,
    ),
  );
  atmosphere.update(100, camera, false);
  assert.notDeepEqual(
    scene.children.map((object) => object.position.toArray()),
    poses,
  );
  let meshes = 0;
  scene.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    const positions = object.geometry.attributes.position.array;
    assert.ok(positions.every(Number.isFinite));
  });
  assert.ok(meshes < 110, "decorations have a bounded draw count");
});
