import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { box, cylinder, mesh, tree, bar } from "./models.js";

// Background coordinates remain behind each landmark. Never scale the landmark
// or its panel; expand only the existing garden and its scenic additions.
export function enrichStationBackground(biome, id) {
  biome.scale.set(1.22, 1.08, 1.25);
  const scenery = new T.Group();
  scenery.name = `scenic-extension-${id}`;
  biome.add(scenery);
  cylinder(scenery, 4.65, 4.85, 0.22, 0x809b67, 0, -0.08, -0.65);
  cylinder(scenery, 4.5, 4.65, 0.12, 0xb5c895, 0, 0.07, -0.65);

  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    tree(
      scenery,
      Math.cos(a) * 4.05,
      Math.sin(a) * 2.4 - 1,
      0.65 + (i % 3) * 0.13,
      id === "bike" || id === "power-plant",
    );
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = Math.cos(a) * 4.25,
      z = Math.sin(a) * 3.4 - 0.6;
    const shrub = mesh(
      scenery,
      new T.IcosahedronGeometry(0.3, 1),
      i % 2 ? 0x6f9853 : 0x88aa61,
      x,
      0.33,
      z,
    );
    shrub.scale.y = 0.7;
    cylinder(
      scenery,
      0.06,
      0.06,
      0.12,
      [0xf4d391, 0xe7a49c, 0xece7c9][i % 3],
      x,
      0.58,
      z,
    );
  }

  if (id === "f1") {
    // A miniature paddock behind the original car and garage.
    box(scenery, 7, 0.05, 1.1, 0x59666b, 0, 0.22, 1.1);
    for (let i = 0; i < 12; i++) {
      box(
        scenery,
        0.52,
        0.07,
        0.18,
        i % 2 ? 0xf4eee0 : 0xc85d4d,
        -3.1 + i * 0.56,
        0.26,
        1.72,
      );
    }
    for (const x of [-3, 3]) {
      for (let tier = 0; tier < 3; tier++)
        box(
          scenery,
          1.25,
          0.22,
          0.38,
          0x9faeae,
          x,
          0.36 + tier * 0.24,
          -1.3 - tier * 0.33,
        );
      box(scenery, 1.6, 0.1, 1.5, 0xe5d5b4, x, 1.8, -1.65);
      for (const dx of [-0.65, 0.65])
        cylinder(scenery, 0.035, 0.035, 1.6, 0x657b7b, x + dx, 0.95, -2.2);
    }
  } else if (id === "bike") {
    for (const [x, height] of [
      [-2.9, 3.7],
      [0, 4.5],
      [2.8, 3.4],
    ]) {
      mesh(
        scenery,
        new T.ConeGeometry(1.65, height, 7),
        0x819581,
        x,
        height / 2 + 0.15,
        -3.0,
      );
      mesh(
        scenery,
        new T.ConeGeometry(0.49, height * 0.3, 7),
        0xe6ece0,
        x,
        height * 0.85 + 0.15,
        -3.0,
      );
    }
    for (let i = 0; i < 10; i++)
      box(
        scenery,
        0.45,
        0.04,
        0.85,
        0xccb68d,
        -2.1 + i * 0.46,
        0.34,
        2.1 + Math.sin(i * 0.55) * 0.35,
      );
  } else if (id === "power-plant") {
    // Surrounding energy campus, not another reactor model.
    for (const x of [-2.8, 2.8]) {
      box(scenery, 1.5, 0.8, 1.5, 0xd5e0d9, x, 0.6, -2.0);
      for (let j = 0; j < 3; j++) {
        const panel = box(
          scenery,
          0.4,
          0.05,
          1.05,
          0x487b93,
          x - 0.48 + j * 0.48,
          1.08,
          -2.0,
        );
        panel.rotation.x = -0.18;
      }
    }
    for (const x of [-3.5, 3.5]) {
      bar(scenery, [x, 0.3, 0.2], [x, 0.3, 1.8], 0.09, 0xa9bdbe);
      cylinder(scenery, 0.3, 0.38, 0.5, 0xe5dfbb, x, 0.4, 1.8);
    }
  } else if (id === "library" || id === "notebook") {
    // Reading courtyard / academic cloister, framing the existing station.
    for (const x of [-3, 3]) {
      for (const z of [-2.6, -1.4, -0.2]) {
        cylinder(scenery, 0.14, 0.18, 1.9, 0xe5d9ba, x, 1.1, z);
        box(scenery, 0.42, 0.12, 0.42, 0xf0e7d1, x, 2.1, z);
      }
      box(scenery, 0.58, 0.18, 3.3, 0xd9c6a4, x, 2.25, -1.4);
      box(scenery, 0.65, 0.22, 1.6, 0xb59569, x, 0.48, 1.15);
    }
    cylinder(scenery, 0.8, 0.95, 0.24, 0xd8ccb0, 0, 0.26, -2.9);
    cylinder(scenery, 0.68, 0.68, 0.03, 0x86b9ba, 0, 0.4, -2.9);
    if (id === "notebook")
      box(scenery, 2.2, 0.18, 0.85, 0xe0c79e, 0, 0.8, -1.5);
  } else if (id === "phone") {
    for (const [x, h] of [
      [-3, 2.5],
      [-1.5, 3.4],
      [1.5, 2.9],
      [3, 2.3],
    ]) {
      box(scenery, 1.0, h, 1.1, 0xa1b8bc, x, h / 2 + 0.2, -2.65);
      for (let floor = 0; floor < Math.floor(h / 0.55); floor++)
        box(scenery, 0.65, 0.2, 0.025, 0xe9d5a0, x, 0.6 + floor * 0.55, -2.085);
    }
    for (const x of [-2.6, 2.6]) {
      cylinder(scenery, 0.04, 0.06, 1.6, 0x617b7c, x, 1, 1.3);
      mesh(scenery, new T.SphereGeometry(0.16, 10, 8), 0xffe5ac, x, 1.86, 1.3);
    }
  }

  // Batch static additions by material so richer scenery stays affordable.
  scenery.updateMatrixWorld(true);
  const inverse = scenery.matrixWorld.clone().invert();
  const batches = new Map();
  scenery.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.applyMatrix4(
      new T.Matrix4().multiplyMatrices(inverse, object.matrixWorld),
    );
    geometry.deleteAttribute("uv");
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
  });
  scenery.clear();
  for (const [material, geometries] of batches) {
    const combined = new T.Mesh(mergeGeometries(geometries), material);
    combined.castShadow = combined.receiveShadow = true;
    scenery.add(combined);
    geometries.forEach((geometry) => geometry.dispose());
  }
  return scenery;
}
