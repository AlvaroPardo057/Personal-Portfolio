import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
const mats = new Map();
export function material(color) {
  if (!mats.has(color))
    mats.set(color, new T.MeshStandardMaterial({ color, roughness: 0.78 }));
  return mats.get(color);
}
export function mesh(parent, geo, color, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, material(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (p, w, h, d, c, x = 0, y = 0, z = 0) =>
  mesh(
    p,
    Math.min(w, h, d) > 0.12
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12)
      : new T.BoxGeometry(w, h, d),
    c,
    x,
    y,
    z,
  );
export const sphere = (p, r, c, x = 0, y = 0, z = 0) =>
  mesh(p, new T.SphereGeometry(r, 16, 12), c, x, y, z);
export const cylinder = (p, r1, r2, h, c, x = 0, y = 0, z = 0) =>
  mesh(p, new T.CylinderGeometry(r1, r2, h, 32), c, x, y, z);
export function bar(p, a, b, r, c) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b),
    dir = end.clone().sub(start);
  const m = cylinder(p, r, r, dir.length(), c);
  m.position.copy(start.add(end).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  return m;
}
export function tree(parent, x, z, scale = 1, pine = false) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  cylinder(g, 0.15, 0.24, 1.6, 0x9b7854, 0, 0.8);
  if (pine) {
    for (let i = 0; i < 3; i++)
      mesh(
        g,
        new T.ConeGeometry(1 - i * 0.2, 1.8, 7),
        0x65865a,
        0,
        1.5 + i * 0.65,
      );
  } else {
    sphere(g, 1.05, 0x5c9848, 0, 2.2);
    sphere(g, 0.8, 0x79ad50, -0.5, 2);
    sphere(g, 0.8, 0x68a246, 0.5, 2.15);
  }
  return g;
}
export { createCharacter as character, createLandmark as landmarkModel } from "./detailed-models.js";
