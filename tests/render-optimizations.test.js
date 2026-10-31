import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { batchStaticRoot, moveInSteps } from "../src/render-optimizations.js";
import { moveWithCollision, permitted } from "../src/navigation.js";

test("static batching preserves bounds, triangles, materials and dynamic meshes", () => {
  const root = new T.Group();
  root.position.set(3, 0, -2);
  root.rotation.y = 0.4;
  const material = new T.MeshStandardMaterial({ color: 0x557799 });
  for (const x of [-2, 2]) {
    const mesh = new T.Mesh(new T.BoxGeometry(1, 2, 3), material);
    mesh.position.x = x;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  const spinning = new T.Mesh(new T.BoxGeometry(), material);
  spinning.userData.spin = true;
  root.add(spinning);
  root.updateMatrixWorld(true);
  const before = new T.Box3().setFromObject(root);
  assert.equal(batchStaticRoot(root), 1);
  root.updateMatrixWorld(true);
  const after = new T.Box3().setFromObject(root);
  assert.ok(before.min.distanceTo(after.min) < 0.000001);
  assert.ok(before.max.distanceTo(after.max) < 0.000001);
  assert.equal(spinning.parent, root);
  assert.equal(spinning.matrixAutoUpdate, true);
  const combined = root.getObjectByName("batched-static-scenery");
  assert.equal(combined.material, material);
  assert.equal(combined.geometry.attributes.position.count / 3, 24);
  assert.equal(combined.castShadow, true);
});

test("low-frame-rate movement keeps distance and cannot tunnel through obstacles", () => {
  const position = new T.Vector3();
  moveInSteps(position, 8.4 * 0.1, 0, [], moveWithCollision);
  assert.ok(Math.abs(position.x - 0.84) < 0.000001);
  const obstacles = [{ x: 2, z: 0, r: 0.3 }];
  moveInSteps(position, 4, 0, obstacles, moveWithCollision);
  assert.ok(permitted(position.x, position.z, obstacles));
  assert.ok(position.x < 2);
});
