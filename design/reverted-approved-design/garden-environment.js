import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const materials = new Map();
function material(color, metalness = 0) {
  const key = color + ":" + metalness;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: metalness ? 0.38 : 0.87,
        metalness,
      }),
    );
  return materials.get(key);
}
function add(parent, geometry, color, x = 0, y = 0, z = 0, metalness = 0) {
  const node = new T.Mesh(geometry, material(color, metalness));
  node.position.set(x, y, z);
  node.castShadow = true;
  node.receiveShadow = true;
  parent.add(node);
  return node;
}
function box(parent, w, h, d, color, x, y, z) {
  return add(parent, new T.BoxGeometry(w, h, d), color, x, y, z);
}
function cylinder(parent, r1, r2, h, color, x, y, z, segments = 12) {
  return add(
    parent,
    new T.CylinderGeometry(r1, r2, h, segments),
    color,
    x,
    y,
    z,
  );
}
function random(seed) {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1) + 0.5;
}
function noise(seed) {
  return Math.abs(random(seed)) % 1;
}
function bake(group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const bins = new Map();
  group.traverse((node) => {
    if (!node.isMesh) return;
    if (!bins.has(node.material)) bins.set(node.material, []);
    let geometry = node.geometry.clone();
    if (geometry.index) {
      const flat = geometry.toNonIndexed();
      geometry.dispose();
      geometry = flat;
    }
    bins
      .get(node.material)
      .push(geometry.applyMatrix4(inverse.clone().multiply(node.matrixWorld)));
  });
  const old = new Set();
  group.traverse((node) => {
    if (node.isMesh) old.add(node.geometry);
  });
  group.clear();
  for (const [mat, parts] of bins) {
    const geometry = mergeGeometries(parts, false);
    const node = new T.Mesh(geometry, mat);
    node.castShadow = true;
    node.receiveShadow = true;
    group.add(node);
    parts.forEach((part) => part.dispose());
  }
  old.forEach((geometry) => geometry.dispose());
}

// More natural tree silhouettes, kept separate from the six approved landmark models.
export function landscapeTree(parent, x, z, scale = 1, pine = false) {
  const group = new T.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
  cylinder(group, 0.11, 0.22, 1.8, 0x88694b, 0, 0.9, 0);
  if (pine) {
    for (let tier = 0; tier < 6; tier++) {
      const crown = add(
        group,
        new T.ConeGeometry(1.04 - tier * 0.14, 1.35, 11),
        tier % 2 ? 0x52783f : 0x658c4c,
        0,
        1.4 + tier * 0.36,
        0,
      );
      crown.rotation.y = tier * 0.7;
    }
  } else {
    for (let i = 0; i < 17; i++) {
      const angle = i * 2.39996,
        radius = 0.15 + noise(i + x * 17) * 0.65;
      const crown = add(
        group,
        new T.IcosahedronGeometry(0.58, 2),
        [0x719848, 0x89a958, 0x5d873e][i % 3],
        Math.cos(angle) * radius,
        1.75 + noise(i + z * 11) * 1.15,
        Math.sin(angle) * radius,
      );
      crown.scale.set(1, 0.73 + noise(i) * 0.45, 1);
    }
  }
  bake(group);
  return group;
}

export function createGardenEnvironment(scene, stations, obstacles) {
  const garden = new T.Group();
  garden.name = "sunlit-garden-environment";
  scene.add(garden);
  // A coherent floating stone island beneath the six existing garden lobes.
  cylinder(garden, 20.15, 17.4, 2.6, 0xa69d86, 0, -1.8, 0, 96);
  cylinder(garden, 20.25, 20.1, 0.16, 0xc9bda1, 0, -0.42, 0, 96);
  for (let i = 0; i < 82; i++) {
    const a = (i * Math.PI * 2) / 82,
      r = 19.55 + noise(i) * 0.6;
    const rock = add(
      garden,
      new T.IcosahedronGeometry(0.9, 0),
      [0xa99d86, 0xb8ab92, 0x918974, 0xc7b99c][i % 4],
      Math.sin(a) * r,
      -1.4 - noise(i + 7) * 1.4,
      -Math.cos(a) * r,
    );
    rock.scale.set(
      0.8 + noise(i),
      1.1 + noise(i + 3) * 1.5,
      0.65 + noise(i + 9),
    );
    rock.rotation.set(noise(i) * 2, noise(i + 1) * 2, noise(i + 2) * 2);
  }
  // Fine concentric paving joints read as stone blocks without creating obstacles.
  for (const radius of [
    5.8, 6.7, 7.6, 8.6, 9.6, 10.6, 11.6, 12.7, 13.8, 14.9, 16, 17.1, 18.2,
  ]) {
    const ring = add(
      garden,
      new T.RingGeometry(radius, radius + 0.018, 128),
      0xc9bea7,
      0,
      0.115,
      0,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
    const count = Math.round(radius * 6);
    for (let i = 0; i < count; i++) {
      const tile = add(
        garden,
        new T.RingGeometry(
          radius + 0.018,
          radius + 0.82,
          4,
          1,
          ((i + 0.5 * (Math.round(radius) % 2)) * Math.PI * 2) / count,
          (Math.PI * 2) / count - 0.004,
        ),
        [0xe8dac0, 0xe5d7ba, 0xeadcc2, 0xe1d2b4][
          Math.floor(noise(i + radius * 7) * 4)
        ],
        0,
        0.107,
        0,
      );
      tile.rotation.x = -Math.PI / 2;
      tile.castShadow = false;
      const a = ((i + 0.5 * (Math.round(radius) % 2)) * Math.PI * 2) / count;
      const seam = box(
        garden,
        0.015,
        0.008,
        0.84,
        0xc9bea7,
        Math.sin(a) * (radius + 0.44),
        0.115,
        -Math.cos(a) * (radius + 0.44),
      );
      seam.rotation.y = -a;
      seam.castShadow = false;
    }
  }
  // Stone posts and low balustrades stay outside the walkable navigation radius.
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI * 2) / 48,
      r = 19.45,
      x = Math.sin(a) * r,
      z = -Math.cos(a) * r;
    const post = new T.Group();
    post.position.set(x, 0, z);
    post.rotation.y = -a;
    garden.add(post);
    box(post, 0.32, 0.95, 0.32, 0xdfcfad, 0, 0.44, 0);
    box(post, 0.48, 0.12, 0.48, 0xf1e3c8, 0, 0.95, 0);
    box(post, 0.45, 0.12, 0.45, 0xd2bf9b, 0, 0.04, 0);
    const arc = add(
      garden,
      new T.TorusGeometry(r, 0.06, 5, 10, (Math.PI * 2) / 48),
      0xdfcfad,
      0,
      0.7,
      0,
    );
    arc.position.set(0, 0.7, 0);
    arc.rotation.set(Math.PI / 2, 0, -a);
  }
  // Small lamps beside benches; collision data includes the new solid posts.
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    const x = Math.sin(a) * 10.3 + Math.cos(a) * 1.1,
      z = -Math.cos(a) * 10.3 + Math.sin(a) * 1.1;
    cylinder(garden, 0.055, 0.095, 1.9, 0x384c43, x, 1, z);
    cylinder(garden, 0.16, 0.23, 0.12, 0x384c43, x, 0.14, z);
    box(garden, 0.29, 0.43, 0.29, 0xe8c67b, x, 2.08, z);
    const cap = add(
      garden,
      new T.ConeGeometry(0.24, 0.24, 4),
      0x384c43,
      x,
      2.4,
      z,
    );
    cap.rotation.y = Math.PI / 4;
    obstacles.push({ x, z, r: 0.19 });
  }
  // Clusters replace isolated flowers with layered borders and natural variation.
  const shrubs = [];
  for (let i = 0; i < 130; i++) {
    const a = i * 2.39996,
      r = 18.4 + noise(i) * 0.65;
    shrubs.push([
      Math.sin(a) * r,
      -Math.cos(a) * r,
      0.22 + noise(i + 5) * 0.22,
    ]);
  }
  for (let pocket = 0; pocket < 6; pocket++) {
    const angle = (pocket * Math.PI) / 3 + Math.PI / 6;
    for (let i = 0; i < 19; i++) {
      const a = i * 2.39996,
        r = 1.65 + noise(i) * 0.3;
      shrubs.push([
        Math.sin(angle) * 14 + Math.cos(a) * r,
        -Math.cos(angle) * 14 + Math.sin(a) * r,
        0.25,
      ]);
    }
  }
  shrubs.forEach(([x, z, r], i) => {
    const bush = add(
      garden,
      new T.IcosahedronGeometry(r, 1),
      [0x699447, 0x8ba953, 0x527e3d][i % 3],
      x,
      0.3 + r * 0.55,
      z,
    );
    bush.scale.set(1.3, 0.8, 1);
    for (let petal = 0; petal < 3; petal++) {
      const flower = add(
        garden,
        new T.SphereGeometry(0.047, 5, 4),
        [0xf8e8b3, 0xeab49f, 0xd0c1e3, 0xffffff][i % 4],
        x + Math.cos(petal * 2.1) * r * 0.6,
        0.36 + r,
        z + Math.sin(petal * 2.1) * r * 0.6,
      );
      flower.scale.y = 0.5;
      flower.castShadow = false;
    }
  });
  // Each station base carries the environment's thematic treatment.
  stations.forEach((data) => {
    const x = Math.sin(data.angle) * 12.4,
      z = -Math.cos(data.angle) * 12.4;
    if (data.id === "f1") {
      const asphalt = add(
        garden,
        new T.CircleGeometry(2.61, 64),
        0x394049,
        x,
        0.261,
        z,
      );
      asphalt.rotation.x = -Math.PI / 2;
      for (let segment = 0; segment < 32; segment++) {
        const curb = add(
          garden,
          new T.RingGeometry(
            2.47,
            2.64,
            64,
            1,
            (segment * Math.PI) / 16,
            Math.PI / 16,
          ),
          segment % 2 ? 0xf4eee5 : 0xd9483e,
          x,
          0.267,
          z,
        );
        curb.rotation.x = -Math.PI / 2;
      }
      const lane = add(
        garden,
        new T.RingGeometry(2.05, 2.07, 64),
        0xf0e4ce,
        x,
        0.268,
        z,
      );
      lane.rotation.x = -Math.PI / 2;
    } else if (data.id === "bike") {
      for (let i = 0; i < 7; i++) {
        const angle = data.angle + (i - 3) * 0.13;
        const rock = add(
          garden,
          new T.IcosahedronGeometry(0.32, 1),
          0xbab99f,
          Math.sin(angle) * 14.5,
          0.37,
          -Math.cos(angle) * 14.5,
        );
        rock.scale.y = 0.7;
      }
    } else if (data.id === "notebook" || data.id === "phone") {
      const edge = add(
        garden,
        new T.RingGeometry(2.63, 2.7, 64),
        data.id === "notebook" ? 0x7d9db2 : 0xaaa1b7,
        x,
        0.28,
        z,
      );
      edge.rotation.x = -Math.PI / 2;
    }
  });
  bake(garden);
  return garden;
}
