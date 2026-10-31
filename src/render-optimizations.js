import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Only opaque, stationary meshes with identical render state are combined.
// Vertex positions, normals, material, shadow flags and silhouette are retained.
export function batchStaticRoot(root) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const bins = new Map();
  function visit(object) {
    if (object.userData.spin || !object.visible) return;
    if (
      object.isMesh &&
      !Array.isArray(object.material) &&
      !object.material.transparent &&
      !object.isSkinnedMesh &&
      object.visible
    ) {
      const attributes = Object.keys(object.geometry.attributes)
        .sort()
        .join(",");
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${object.renderOrder}:${attributes}`;
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(object);
    }
    for (const child of object.children) visit(child);
  }
  visit(root);
  let saved = 0;
  for (const objects of bins.values()) {
    if (objects.length < 2) continue;
    const parts = objects.map((object) => {
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      geometry.applyMatrix4(
        new T.Matrix4().multiplyMatrices(inverse, object.matrixWorld),
      );
      return geometry;
    });
    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!geometry) continue;
    const source = objects[0];
    const combined = new T.Mesh(geometry, source.material);
    combined.castShadow = source.castShadow;
    combined.receiveShadow = source.receiveShadow;
    combined.renderOrder = source.renderOrder;
    combined.name = "batched-static-scenery";
    for (const object of objects) object.removeFromParent();
    root.add(combined);
    saved += objects.length - 1;
  }
  root.traverse((object) => {
    if (!object.userData.spin) {
      object.updateMatrix();
      object.matrixAutoUpdate = false;
    }
  });
  return saved;
}

// Preserve elapsed walking time at low FPS without stepping through obstacles.
export function moveInSteps(position, dx, dz, obstacles, move) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12));
  for (let i = 0; i < steps; i++)
    move(position, dx / steps, dz / steps, obstacles);
}
