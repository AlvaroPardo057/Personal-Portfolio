import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const palettes = {
  bark: 0x85664b,
  oak: [0x47773b, 0x63954b, 0x88aa56],
  pine: [0x426b3c, 0x5c8548, 0x729652],
};
function noise(seed) {
  const value = Math.sin(seed * 127.1 + 17.3) * 43758.5453;
  return value - Math.floor(value);
}
// All new planting is additive. Existing buildings, rivers and mountains stay in place.
export function createParkPlanting(scene, obstacles) {
  const planting = new T.Group();
  planting.name = "additional-park-planting";
  scene.add(planting);
  const bins = new Map();
  const dummy = new T.Object3D();
  function part(
    geometry,
    color,
    x,
    y,
    z,
    sx = 1,
    sy = 1,
    sz = 1,
    rotation = 0,
  ) {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(0, rotation, 0);
    dummy.updateMatrix();
    let shape = geometry.clone();
    if (shape.index) {
      const flat = shape.toNonIndexed();
      shape.dispose();
      shape = flat;
    }
    shape.applyMatrix4(dummy.matrix);
    if (!bins.has(color)) bins.set(color, []);
    bins.get(color).push(shape);
  }
  const leaf = new T.IcosahedronGeometry(1, 2);
  const trunk = new T.CylinderGeometry(0.09, 0.15, 1, 8);
  const cone = new T.ConeGeometry(1, 1, 11);
  const petal = new T.SphereGeometry(1, 6, 4);
  const stem = new T.CylinderGeometry(0.012, 0.018, 0.23, 5);
  let count = 0;
  function tree(x, z, scale, pine, seed) {
    const trunkHeight = 1.45 * scale;
    part(
      trunk,
      palettes.bark,
      x,
      trunkHeight / 2 + 0.15,
      z,
      scale,
      trunkHeight,
      scale,
    );
    if (pine) {
      for (let tier = 0; tier < 5; tier++) {
        const width = (0.83 - tier * 0.12) * scale;
        part(
          cone,
          palettes.pine[tier % 3],
          x,
          (1.35 + tier * 0.42) * scale,
          z,
          width,
          1.35 * scale,
          width,
          tier * 0.8,
        );
      }
    } else {
      for (let cluster = 0; cluster < 15; cluster++) {
        const angle = cluster * 2.399963;
        const radius = 0.22 + noise(seed + cluster) * 0.48;
        part(
          leaf,
          palettes.oak[cluster % 3],
          x + Math.cos(angle) * radius * scale,
          (1.65 + noise(seed + cluster * 3) * 0.95) * scale,
          z + Math.sin(angle) * radius * scale,
          0.53 * scale,
          (0.45 + noise(cluster) * 0.16) * scale,
          0.54 * scale,
        );
      }
    }
    obstacles.push({ x, z, r: 0.23 * scale });
    count++;
  }
  for (let garden = 0; garden < 6; garden++) {
    const angle = (garden * Math.PI) / 3 + Math.PI / 6;
    // Groves sit between station backdrops, leaving the radial routes open.
    for (let i = 0; i < 3; i++) {
      const a = angle + (i - 1) * 0.105;
      const radius = [17.1, 18.15, 17.65][i];
      tree(
        Math.sin(a) * radius,
        -Math.cos(a) * radius,
        0.73 + noise(garden * 13 + i) * 0.38,
        (garden + i) % 3 === 0,
        garden * 37 + i * 11,
      );
    }
    for (let i = 0; i < 20; i++) {
      const a = angle + (noise(garden * 91 + i) - 0.5) * 0.37;
      const radius = 17.3 + noise(garden * 31 + i * 3) * 1.5;
      const x = Math.sin(a) * radius,
        z = -Math.cos(a) * radius;
      const size = 0.15 + noise(i * 4 + garden) * 0.18;
      part(
        leaf,
        [0x527a3d, 0x719449, 0x95ac61][i % 3],
        x,
        size + 0.13,
        z,
        size * 1.3,
        size * 0.8,
        size,
      );
      if (i % 2 === 0) {
        for (let flower = 0; flower < 3; flower++) {
          const fx = x + Math.cos(flower * 2.1) * 0.16;
          const fz = z + Math.sin(flower * 2.1) * 0.16;
          part(stem, 0x557e43, fx, 0.36, fz);
          part(
            petal,
            [0xffe8a8, 0xe9b6ce, 0xb7a5dc, 0xffffff][(i + garden) % 4],
            fx,
            0.49,
            fz,
            0.065,
            0.025,
            0.065,
          );
        }
      }
    }
    // Flower ribbons around the existing garden pockets.
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      const x = Math.sin(angle) * 14 + Math.cos(a) * 1.86;
      const z = -Math.cos(angle) * 14 + Math.sin(a) * 1.86;
      part(leaf, 0x74934c, x, 0.26, z, 0.17, 0.13, 0.16);
      part(
        petal,
        [0xf4d487, 0xc9b6e5, 0xf6eadd][i % 3],
        x,
        0.4,
        z,
        0.07,
        0.026,
        0.07,
      );
    }
  }
  for (const [color, pieces] of bins) {
    const mesh = new T.Mesh(
      mergeGeometries(pieces),
      new T.MeshStandardMaterial({ color, roughness: 0.9 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    planting.add(mesh);
    pieces.forEach((geometry) => geometry.dispose());
  }
  [leaf, trunk, cone, petal, stem].forEach((geometry) => geometry.dispose());
  planting.userData.addedTrees = count;
  return planting;
}
