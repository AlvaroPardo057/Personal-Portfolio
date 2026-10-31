import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { refineLandmark } from "./landmark-refinements.js";
import { buildReferenceBike } from "./reference-vehicles.js";
import { buildClassicF1 } from "./classic-f1.js";

// Original parametric sculptures. Geometry, surface patterns and details are
// authored here, using the supplied images as visual references.
const surfaces = new Map();
let knitTexture;
function knit() {
  if (knitTexture || typeof document === "undefined") return knitTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, 128, 128);
  ctx.lineWidth = 2;
  for (let y = -8; y < 136; y += 8)
    for (let x = 0; x < 128; x += 8) {
      ctx.strokeStyle = "#aaa";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 5, y + 4, x + 2, y + 8);
      ctx.stroke();
      ctx.strokeStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(x + 5, y);
      ctx.quadraticCurveTo(x + 1, y + 4, x + 5, y + 8);
      ctx.stroke();
    }
  knitTexture = new T.CanvasTexture(canvas);
  knitTexture.wrapS = knitTexture.wrapT = T.RepeatWrapping;
  knitTexture.repeat.set(3, 3);
  return knitTexture;
}
function surface(name, color, roughness = 0.5, metalness = 0, options = {}) {
  if (!surfaces.has(name))
    surfaces.set(
      name,
      new T.MeshPhysicalMaterial({ color, roughness, metalness, ...options }),
    );
  return surfaces.get(name);
}
const paint = () =>
  surface("racing-red", 0xc91620, 0.24, 0.24, {
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
const rubber = () => surface("rubber", 0x14171b, 0.83);
const carbon = () => surface("carbon", 0x202630, 0.42, 0.35);
const steel = () => surface("steel", 0x9ea9b6, 0.29, 0.82);
const black = () => surface("black", 0x19202a, 0.53);
const white = () =>
  surface("ivory-paint", 0xf1f1e8, 0.32, 0.15, { clearcoat: 0.5 });
const blue = () => surface("energy-blue", 0x1776c6, 0.35, 0.22);
const stone = () => surface("limestone", 0xd4bf96, 0.92);
function add(p, geometry, mat, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
function rounded(
  p,
  w,
  h,
  d,
  mat,
  x = 0,
  y = 0,
  z = 0,
  r = Math.min(w, h, d) * 0.2,
) {
  return add(
    p,
    new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2)),
    mat,
    x,
    y,
    z,
  );
}
function ellipsoid(p, rx, ry, rz, mat, x = 0, y = 0, z = 0) {
  const m = add(p, new T.SphereGeometry(1, 28, 20), mat, x, y, z);
  m.scale.set(rx, ry, rz);
  return m;
}
function cyl(p, rt, rb, h, mat, x = 0, y = 0, z = 0, n = 40) {
  return add(p, new T.CylinderGeometry(rt, rb, h, n), mat, x, y, z);
}
function rod(p, a, b, r, mat, r2 = r) {
  const av = new T.Vector3(...a),
    bv = new T.Vector3(...b),
    delta = bv.clone().sub(av);
  const m = cyl(p, r, r2, delta.length(), mat);
  m.position.copy(av.add(bv).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return m;
}
function curve(p, points, r, mat, closed = false) {
  return add(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(
        points.map((v) => new T.Vector3(...v)),
        closed,
      ),
      Math.max(12, points.length * 5),
      r,
      7,
      closed,
    ),
    mat,
  );
}
function lock(p, points, width, depth, mat) {
  const path = new T.CatmullRomCurve3(points.map((a) => new T.Vector3(...a))),
    frames = path.computeFrenetFrames(24, false),
    positions = [],
    indices = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24,
      center = path.getPointAt(t),
      taper = 0.035 + 0.965 * Math.sin(Math.PI * t) ** 0.55;
    for (let j = 0; j < 10; j++) {
      const a = (j / 10) * Math.PI * 2,
        v = center
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * width * taper)
          .addScaledVector(frames.binormals[i], Math.sin(a) * depth * taper);
      positions.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < 24; i++)
    for (let j = 0; j < 10; j++) {
      const a = i * 10 + j,
        b = i * 10 + ((j + 1) % 10);
      indices.push(a, b, a + 10, b, b + 10, a + 10);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return add(p, geometry, mat);
}
function ring(p, r, t, mat, x, y, z) {
  return add(p, new T.TorusGeometry(r, t, 10, 48), mat, x, y, z);
}
function lathe(p, profile, mat, x = 0, y = 0, z = 0) {
  return add(
    p,
    new T.LatheGeometry(
      profile.map((v) => new T.Vector2(...v)),
      56,
    ),
    mat,
    x,
    y,
    z,
  );
}
function polygon(p, points, depth, mat, x = 0, y = 0, z = 0, bevel = 0.015) {
  const shape = new T.Shape();
  points.forEach(([a, b], i) => (i ? shape.lineTo(a, b) : shape.moveTo(a, b)));
  shape.closePath();
  return add(
    p,
    new T.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
    }),
    mat,
    x,
    y,
    z - depth / 2,
  );
}
// Smooth elliptical cross sections create the race car's tapered bodywork.
function loft(p, sections, mat) {
  const centerPath = new T.CatmullRomCurve3(
    sections.map(([x, y]) => new T.Vector3(x, y, 0)),
  );
  const radiusPath = new T.CatmullRomCurve3(
    sections.map(([, , h, w]) => new T.Vector3(h, w, 0)),
  );
  sections = Array.from({ length: (sections.length - 1) * 8 + 1 }, (_, i) => {
    const t = i / ((sections.length - 1) * 8),
      c = centerPath.getPoint(t),
      r = radiusPath.getPoint(t);
    return [c.x, c.y, Math.max(0.012, r.x), Math.max(0.012, r.y)];
  });
  const vertices = [],
    indices = [],
    segments = 32;
  sections.forEach(([x, y, halfHeight, halfWidth]) => {
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      vertices.push(x, y + Math.sin(a) * halfHeight, Math.cos(a) * halfWidth);
    }
  });
  for (let i = 0; i < sections.length - 1; i++)
    for (let j = 0; j < segments; j++) {
      const a = i * segments + j,
        b = i * segments + ((j + 1) % segments),
        c = a + segments,
        d = b + segments;
      indices.push(a, c, b, b, c, d);
    }
  for (let j = 1; j < segments - 1; j++) {
    indices.push(0, j, j + 1);
    const o = (sections.length - 1) * segments;
    indices.push(o, o + j + 1, o + j);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return add(p, geo, mat);
}
// Consolidate static details by material so extra detail does not imply thousands
// of draw calls. Screens, animated parts and their descendants stay independent.
function consolidate(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(),
    batches = new Map(),
    remove = [];
  root.traverse((m) => {
    if (!m.isMesh || Array.isArray(m.material)) return;
    for (let n = m; n && n !== root; n = n.parent) if (n.userData.keep) return;
    const geo = m.geometry.index
      ? m.geometry.toNonIndexed()
      : m.geometry.clone();
    geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    // All procedural surfaces need only positions/normals/UVs.
    for (const name of Object.keys(geo.attributes))
      if (!["position", "normal", "uv"].includes(name))
        geo.deleteAttribute(name);
    if (!geo.attributes.uv)
      geo.setAttribute(
        "uv",
        new T.Float32BufferAttribute(
          new Float32Array(geo.attributes.position.count * 2),
          2,
        ),
      );
    if (!batches.has(m.material)) batches.set(m.material, []);
    batches.get(m.material).push(geo);
    remove.push(m);
  });
  remove.forEach((m) => {
    m.removeFromParent();
    m.geometry.dispose();
  });
  for (const [mat, geos] of batches) {
    const geometry = mergeGeometries(geos);
    if (geometry) add(root, geometry, mat);
    geos.forEach((g) => g.dispose());
  }
}

function powerPlant(root) {
  const concrete = surface("cooling-concrete", 0xe5e7e5, 0.84),
    seam = surface("concrete-seam", 0xc5cecd, 0.9),
    glass = surface("plant-windows", 0x1269a9, 0.23, 0.4);
  rounded(
    root,
    4.4,
    0.13,
    3.05,
    surface("plant-lawn", 0x599349, 0.93),
    0,
    0.065,
    0,
    0.07,
  );
  const tx = -1.4,
    tz = -0.35;
  const radius = (y) => 0.56 + 0.48 * ((y - 1.95) / 1.95) ** 2;
  const profile = Array.from({ length: 33 }, (_, i) => {
    const y = 0.48 + (i / 32) * 2.57;
    return [radius(y), y];
  });
  lathe(
    root,
    [...profile, [radius(3.05) - 0.085, 3.05], [radius(2.8) - 0.085, 2.8]],
    concrete,
    tx,
    0,
    tz,
  );
  for (const [y, h] of [
    [2.79, 0.15],
    [2.58, 0.055],
  ])
    cyl(
      root,
      radius(y + h / 2) + 0.008,
      radius(y - h / 2) + 0.008,
      h,
      blue(),
      tx,
      y,
      tz,
    );
  const lip = ring(root, radius(3.05), 0.055, concrete, tx, 3.05, tz);
  lip.rotation.x = Math.PI / 2;
  cyl(root, 0.57, 0.57, 0.04, black(), tx, 2.67, tz);
  cyl(
    root,
    0.6,
    0.6,
    0.015,
    surface("cooling-interior", 0x606d75, 0.95),
    tx,
    2.89,
    tz,
  );
  for (let j = 0; j < 24; j++) {
    const a = (j * Math.PI) / 12;
    curve(
      root,
      profile
        .filter((_, i) => i % 4 === 0)
        .map(([r, y]) => [
          tx + (r + 0.006) * Math.cos(a),
          y,
          tz + (r + 0.006) * Math.sin(a),
        ]),
      0.004,
      seam,
    );
  }
  for (let j = 0; j < 16; j++) {
    const a = (j * Math.PI) / 8;
    rod(
      root,
      [tx + Math.cos(a) * 0.86, 0.13, tz + Math.sin(a) * 0.86],
      [
        tx + Math.cos(a + 0.12) * radius(0.36),
        0.5,
        tz + Math.sin(a + 0.12) * radius(0.36),
      ],
      0.045,
      concrete,
    );
  }
  // Containment dome, turbine hall with barrel roof and administration wing.
  cyl(root, 0.68, 0.68, 1.15, concrete, 0.55, 0.74, -0.35);
  add(
    root,
    new T.SphereGeometry(0.68, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    concrete,
    0.55,
    1.31,
    -0.35,
  );
  cyl(root, 0.69, 0.69, 0.13, blue(), 0.55, 1.24, -0.35);
  cyl(root, 0.19, 0.19, 0.23, steel(), 0.55, 1.96, -0.35);
  rounded(root, 2.2, 0.67, 1.1, concrete, 1.6, 0.49, 0.3, 0.025);
  const arch = new T.Shape();
  arch.moveTo(-0.55, 0);
  arch.absarc(0, 0, 0.55, Math.PI, 0, true);
  arch.closePath();
  const roofGeometry = new T.ExtrudeGeometry(arch, {
    depth: 2.2,
    bevelEnabled: false,
    curveSegments: 32,
  });
  roofGeometry.translate(0, 0, -1.1);
  roofGeometry.rotateY(Math.PI / 2);
  add(root, roofGeometry, blue(), 1.6, 0.83, 0.3);
  for (let j = 0; j < 13; j++)
    rounded(
      root,
      0.125,
      0.2,
      0.018,
      glass,
      0.69 + j * 0.15,
      0.65,
      0.858,
      0.006,
    );
  rounded(root, 1.72, 0.48, 0.67, concrete, -0.42, 0.37, 1.05, 0.025);
  for (let j = 0; j < 9; j++)
    rounded(
      root,
      0.13,
      0.16,
      0.019,
      glass,
      -1.13 + j * 0.18,
      0.49,
      1.395,
      0.005,
    );
  rounded(root, 0.19, 0.25, 0.025, steel(), -0.4, 0.265, 1.4, 0.008);
  for (const x of [0.06, 0.34]) {
    cyl(root, 0.115, 0.115, 0.45, steel(), x, 0.42, 0.52);
    ellipsoid(root, 0.115, 0.09, 0.115, steel(), x, 0.69, 0.52);
  }
  curve(
    root,
    [
      [0.2, 0.4, 0.58],
      [0.2, 0.93, 0.58],
      [0.38, 1.02, 0.58],
      [0.56, 1.02, 0.38],
    ],
    0.04,
    steel(),
  );
  curve(
    root,
    [
      [0.95, 0.4, -0.7],
      [1.05, 0.4, -0.7],
      [1.05, 2.13, -0.7],
    ],
    0.05,
    steel(),
  );
  for (const x of [-1.9, -1.65, -1.4, 0.8, 1.15, 1.6, 1.9])
    ellipsoid(
      root,
      0.14,
      0.18,
      0.15,
      surface("plant-bushes", 0x44843c, 0.9),
      x,
      0.24,
      1.43,
    );
}

function column(p, x, y, z, height = 0.95) {
  const marble = surface("column-marble", 0xe8d9b8, 0.85);
  const shaft = new T.CylinderGeometry(0.095, 0.12, height, 80, 8);
  const vertices = shaft.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const vx = vertices.getX(i),
      vz = vertices.getZ(i),
      radius = Math.hypot(vx, vz);
    if (radius < 0.01) continue;
    const angle = Math.atan2(vz, vx),
      flute = 0.005 * (0.5 + 0.5 * Math.cos(angle * 20));
    vertices.setXYZ(
      i,
      (vx * (radius - flute)) / radius,
      vertices.getY(i),
      (vz * (radius - flute)) / radius,
    );
  }
  shaft.computeVertexNormals();
  add(p, shaft, marble, x, y + height / 2, z);
  for (const dy of [0, height]) {
    rounded(p, 0.29, 0.07, 0.29, marble, x, y + dy, z, 0.018);
    cyl(p, 0.135, 0.135, 0.045, marble, x, y + dy + (dy ? -0.06 : 0.06), z);
  }
  for (let row = 0; row < 2; row++)
    for (let j = 0; j < 8; j++) {
      const angle = ((j + row * 0.5) * Math.PI) / 4;
      const leaf = ellipsoid(
        p,
        0.025,
        0.05,
        0.013,
        marble,
        x + Math.cos(angle) * 0.105,
        y + height - 0.07 + row * 0.038,
        z + Math.sin(angle) * 0.105,
      );
      leaf.rotation.y = -angle + Math.PI / 2;
      leaf.rotation.z = Math.cos(angle) * 0.22;
    }
  for (const s of [-1, 1]) {
    const volute = ring(
      p,
      0.044,
      0.012,
      marble,
      x + s * 0.12,
      y + height - 0.02,
      z + 0.11,
    );
    volute.scale.y = 0.8;
  }
}
function library(root) {
  const darkStone = surface("masonry-shadows", 0xaf9c7c, 0.92),
    wood = surface("scaffold-planks", 0x91704c, 0.92),
    yellow = surface("crane-yellow", 0xe4a51e, 0.48, 0.3);
  rounded(root, 4.4, 0.2, 2.9, stone(), 0, 0.1, 0, 0.04);
  rounded(root, 4, 0.63, 2.25, darkStone, 0, 0.5, -0.17, 0.02);
  // Individual masonry blocks and inset arched lower openings.
  for (let row = 0; row < 4; row++)
    for (let j = 0; j < 14; j++) {
      const x = -1.86 + j * 0.28 + (row % 2) * 0.06;
      if (Math.abs(x) < 0.58) continue;
      rounded(
        root,
        0.265,
        0.137,
        0.06,
        stone(),
        x,
        0.23 + row * 0.15,
        1.0,
        0.009,
      );
    }
  for (const x of [-1.5, 1.5]) {
    rounded(root, 0.32, 0.38, 0.022, black(), x, 0.41, 1.041, 0.13);
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI) / 6;
      const brick = rounded(
        root,
        0.15,
        0.12,
        0.09,
        stone(),
        x + Math.cos(a) * 0.23,
        0.53 + Math.sin(a) * 0.23,
        1.04,
        0.008,
      );
      brick.rotation.z = a;
    }
  }
  for (let j = 0; j < 8; j++)
    rounded(
      root,
      1.16,
      0.085,
      1.05 - j * 0.1,
      stone(),
      0,
      0.24 + j * 0.085,
      1.12 - j * 0.045,
      0.012,
    );
  rounded(root, 2.0, 1.05, 1.08, darkStone, 0, 1.35, -0.34, 0.02);
  // Shadowed interior shelving visible between the columns.
  for (const x of [-0.65, 0, 0.65]) {
    rounded(root, 0.46, 0.86, 0.045, wood, x, 1.43, 0.22, 0.005);
    for (let row = 0; row < 4; row++) {
      rounded(
        root,
        0.47,
        0.025,
        0.09,
        stone(),
        x,
        1.015 + row * 0.235,
        0.25,
        0.002,
      );
      for (let j = 0; j < 7; j++)
        rounded(
          root,
          0.035,
          0.135 + (j % 3) * 0.018,
          0.035,
          surface(
            `book-spine-${j % 5}`,
            [0x8c4d37, 0x687154, 0xd1a859, 0x836e56, 0x686b7d][j % 5],
            0.9,
          ),
          x - 0.19 + j * 0.06,
          1.11 + row * 0.235,
          0.267,
          0.003,
        );
    }
  }
  for (const x of [-0.93, -0.56, -0.19, 0.19, 0.56, 0.93])
    column(root, x, 0.85, 0.55, 1.13);
  rounded(root, 2.38, 0.16, 1.57, stone(), 0, 2.08, -0.05, 0.02);
  polygon(
    root,
    [
      [-1.22, 0],
      [1.22, 0],
      [0, 0.55],
    ],
    1.63,
    stone(),
    0,
    2.17,
    -0.07,
  );
  polygon(
    root,
    [
      [-0.93, 0.05],
      [0.93, 0.05],
      [0, 0.43],
    ],
    0.026,
    darkStone,
    0,
    2.2,
    0.77,
    0.005,
  );
  // Small sculpted reliefs in the pediment.
  for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) {
    ellipsoid(
      root,
      0.043,
      0.052,
      0.025,
      stone(),
      x,
      2.43 - Math.abs(x) * 0.2,
      0.8,
    );
    rod(
      root,
      [x, 2.29, 0.8],
      [x, 2.39 - Math.abs(x) * 0.2, 0.8],
      0.038,
      stone(),
    );
  }
  for (const s of [-1, 1]) {
    rounded(root, 1.02, 0.94, 0.84, stone(), s * 1.62, 1.32, -0.3, 0.02);
    for (const x of [s * 1.26, s * 1.63, s * 1.99])
      column(root, x, 0.87, 0.33, 0.93);
    rounded(root, 1.18, 0.12, 1.05, stone(), s * 1.62, 1.91, -0.13, 0.018);
    // Incomplete upper masonry makes the active construction legible.
    for (let j = 0; j < 3; j++)
      rounded(
        root,
        0.26,
        0.18,
        0.4,
        stone(),
        s * (1.23 + j * 0.31),
        2.08 + (j === 0 ? 0.13 : 0),
        -0.32,
        0.012,
      );
  }
  // Full scaffold bays with decks, diagonal braces and ladders.
  for (const x of [-2.15, -1.58])
    for (const z of [-0.6, 0.75])
      rod(root, [x, 0.14, z], [x, 2.66, z], 0.022, steel());
  for (let y = 0.5; y < 2.7; y += 0.53) {
    rounded(root, 0.73, 0.045, 1.48, wood, -1.88, y, 0.07, 0.004);
    rod(root, [-2.15, y, 0.77], [-1.58, y + 0.5, 0.77], 0.018, steel());
    rod(root, [-2.15, y + 0.5, 0.77], [-1.58, y, 0.77], 0.018, steel());
  }
  for (let y = 0.26; y < 2.45; y += 0.17)
    rod(root, [-2.12, y, 0.82], [-1.93, y, 0.82], 0.013, steel());
  // Lattice tower crane, counterweight, cable and suspended stone block.
  const cx = 1.93,
    cz = -0.81;
  for (const dx of [-0.12, 0.12])
    for (const dz of [-0.12, 0.12])
      rod(
        root,
        [cx + dx, 0.15, cz + dz],
        [cx + dx, 3.15, cz + dz],
        0.022,
        yellow,
      );
  for (let y = 0.2; y < 3.1; y += 0.3) {
    rod(
      root,
      [cx - 0.12, y, cz + 0.12],
      [cx + 0.12, y + 0.3, cz + 0.12],
      0.018,
      yellow,
    );
    rod(
      root,
      [cx + 0.12, y, cz - 0.12],
      [cx + 0.12, y + 0.3, cz + 0.12],
      0.018,
      yellow,
    );
  }
  for (const y of [3.05, 3.27])
    rod(root, [-0.15, y, cz], [2.48, y, cz], 0.029, yellow);
  for (let x = -0.15; x < 2.4; x += 0.25)
    rod(root, [x, 3.05, cz], [x + 0.25, 3.27, cz], 0.018, yellow);
  rounded(root, 0.39, 0.35, 0.34, steel(), 2.32, 2.89, cz, 0.015);
  rod(root, [0.15, 3.08, cz], [0.15, 2.16, cz], 0.008, black());
  rounded(root, 0.3, 0.28, 0.3, stone(), 0.15, 2.02, cz, 0.012);
  for (const x of [1.38, 1.67, 1.96]) {
    cyl(
      root,
      0.025,
      0.085,
      0.22,
      surface("safety-orange", 0xde782f, 0.6),
      x,
      0.26,
      1.2,
      16,
    );
    rounded(root, 0.19, 0.025, 0.19, black(), x, 0.14, 1.2, 0.005);
  }
}

function notebook(root) {
  const paper = surface("warm-paper", 0xfff6df, 0.92),
    cover = surface("blue-leather", 0x1242a0, 0.44, 0.12),
    ink = surface("ruled-lines", 0x839ab5, 0.85),
    gold = surface("bookmark-satin", 0xe1aa24, 0.38, 0.4);
  const book = group(root, 0, 0.08);
  book.name = "open-book";
  book.rotation.x = 0.12;
  for (const s of [-1, 1]) {
    const page = group(book);
    page.rotation.z = s * 0.11;
    rounded(page, 1.6, 0.1, 2.16, cover, s * 0.8, 0, 0, 0.035);
    // Curved page stack, fanned at the outer corners.
    for (let i = 0; i < 16; i++) {
      const geometry = new T.PlaneGeometry(1.48, 2.04, 32, 16),
        a = geometry.attributes.position;
      for (let j = 0; j < a.count; j++) {
        const u = (a.getX(j) + 0.74) / 1.48;
        const v = a.getY(j) / 1.02;
        const corner = 0.07 * Math.max(0, (Math.abs(v) - 0.92) / 0.08) ** 2;
        a.setXYZ(
          j,
          s * (0.02 + u * (1.48 - corner)),
          0.065 + i * 0.011 + 0.19 * Math.sin(u * Math.PI) + 0.04 * u * u,
          a.getY(j),
        );
      }
      geometry.computeVertexNormals();
      const sheet = add(page, geometry, paper);
      sheet.material = surface("paper-double", 0xfff6df, 0.92, 0, {
        side: T.DoubleSide,
      });
      if (i < 15)
        sheet.material = surface("paper-stack", 0xf0e3cc, 0.94, 0, {
          side: T.DoubleSide,
        });
      for (const edge of [-1, 1])
        curve(
          page,
          Array.from({ length: 25 }, (_, j) => {
            const u = j / 24;
            return [
              s * (0.02 + u * 1.41),
              0.065 + i * 0.011 + 0.19 * Math.sin(u * Math.PI) + 0.04 * u * u,
              edge * 1.02,
            ];
          }),
          0.0015,
          surface("page-edge-shadow", 0xd7c6aa, 0.96),
        );
    }
    for (let j = 0; j < 8; j++)
      curve(
        page,
        Array.from({ length: 12 }, (_, i) => {
          const u = 0.14 + (i / 11) * 0.77;
          return [
            s * (0.02 + u * 1.48),
            0.237 + 0.19 * Math.sin(u * Math.PI) + 0.04 * u * u,
            -0.78 + j * 0.215,
          ];
        }),
        0.003,
        ink,
      );
  }
  curve(
    book,
    [
      [0, 0.2, -1.03],
      [0, 0.18, -0.1],
      [0, 0.15, 0.85],
      [0, 0.01, 1.2],
      [0.06, -0.2, 1.25],
    ],
    0.045,
    gold,
  );
  // Translucent paired hemispheres with individually traced cortical folds.
  const brain = group(root, 0, 1.93, -0.18);
  brain.name = "holographic-brain";
  brain.scale.set(1.6, 1.48, 1.35);
  brain.userData.keep = true;
  const tissue = surface("brain-glass", 0xb9e0f7, 0.13, 0.08, {
    transparent: true,
    opacity: 0.75,
    transmission: 0.55,
    thickness: 0.22,
    ior: 1.4,
    clearcoat: 1,
    depthWrite: false,
  });
  const folds = surface("brain-folds", 0xa5d9f5, 0.15, 0.3, {
    clearcoat: 1,
    emissive: 0x245c85,
    emissiveIntensity: 0.12,
  });
  for (const s of [-1, 1]) {
    ellipsoid(brain, 0.44, 0.54, 0.57, tissue, s * 0.29, 0);
    for (let j = 0; j < 9; j++) {
      const phi = 0.16 + (j / 8) * 2.83;
      const points = Array.from({ length: 27 }, (_, i) => {
        const theta = -1.35 + (i / 26) * 2.7;
        const wave = 0.045 * Math.sin(i * 0.7 + j * 1.8);
        return [
          s * 0.29 + Math.sin(theta) * (0.44 + wave),
          Math.cos(theta) *
            Math.cos(phi + 0.09 * Math.sin(i * 0.9 + j)) *
            (0.54 + wave),
          Math.cos(theta) * Math.sin(phi) * (0.57 + wave) - 0.04,
        ];
      });
      curve(brain, points, 0.043, folds);
    }
  }
  ellipsoid(brain, 0.23, 0.18, 0.22, tissue, 0, -0.46, -0.28);
  rod(brain, [0, -0.48, -0.12], [0.04, -0.75, -0.03], 0.08, tissue, 0.12);
  const glow = surface("neural-nodes", 0xffe895, 0.24, 0.2, {
    emissive: 0xffca42,
    emissiveIntensity: 1.4,
  });
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399,
      x = Math.sin(a) * 0.58,
      y = Math.cos(a) * 0.35,
      z = 0.39;
    ellipsoid(brain, 0.028, 0.028, 0.028, glow, x, y, z);
  }
}

function foldingPhone(root) {
  const titanium = surface("phone-titanium", 0xb6aa94, 0.22, 0.92),
    glass = surface("screen-off", 0x05090e, 0.12, 0.22, {
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
  root.userData.screens = [];
  for (const s of [-1, 1]) {
    const half = group(root, 0, 0, 0);
    half.name = s < 0 ? "phone-left" : "phone-right";
    half.rotation.y = -s * 0.38;
    rounded(half, 1.08, 2.61, 0.115, titanium, s * 0.55, 1.305, 0, 0.055);
    rounded(half, 1.025, 2.54, 0.018, black(), s * 0.55, 1.305, 0.065, 0.009);
    // Screen geometry has rounded corners in XY, independent from the thin depth.
    const shape = new T.Shape(),
      w = 0.976,
      h = 2.45,
      r = 0.095;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const screen = add(
      half,
      new T.ShapeGeometry(shape, 18),
      glass.clone(),
      s * 0.55,
      1.305,
      0.076,
    );
    screen.userData.keep = true;
    root.userData.screens.push(screen);
    ellipsoid(
      half,
      0.021,
      0.021,
      0.006,
      surface("lens", 0x183948, 0.12, 0.4),
      s * 0.55,
      2.48,
      0.083,
    );
    for (let j = 0; j < 6; j++)
      ellipsoid(
        half,
        0.015,
        0.005,
        0.006,
        black(),
        s * 0.55 - 0.09 + j * 0.035,
        2.58,
        0.06,
      );
    rounded(half, 0.018, 0.24, 0.045, titanium, s * 1.098, 1.78, 0, 0.009);
    rounded(half, 0.019, 0.13, 0.045, titanium, s * 1.098, 1.43, 0, 0.008);
    rounded(half, 0.2, 0.012, 0.06, black(), s * 0.55, 0.002, 0, 0.006);
    // Antenna breaks and the rear camera module remain visible from behind.
    for (const y of [0.2, 2.4])
      rounded(
        half,
        0.013,
        0.017,
        0.113,
        surface("antenna-band", 0x343b43, 0.75),
        s * 1.09,
        y,
        0,
        0.004,
      );
    if (s < 0) {
      rounded(half, 0.24, 0.7, 0.06, black(), -0.83, 2.07, -0.084, 0.026);
      for (const y of [1.85, 2.07, 2.29]) {
        const camera = cyl(
          half,
          0.075,
          0.075,
          0.025,
          titanium,
          -0.83,
          y,
          -0.13,
        );
        camera.rotation.x = Math.PI / 2;
        ellipsoid(
          half,
          0.056,
          0.056,
          0.012,
          surface("camera-glass", 0x101b27, 0.1, 0.5),
          -0.83,
          y,
          -0.147,
        );
      }
    }
  }
  cyl(root, 0.049, 0.049, 2.55, titanium, 0, 1.305, -0.028);
}

function person(isGuide) {
  const root = new T.Group();
  root.userData.isGuide = isGuide;
  const headRig = group(root, 0, 1.8, 0);
  headRig.userData.keep = true;
  const face = group(headRig, 0, -1.68, 0);
  root.userData.rig = { head: headRig, arms: [], eyes: [] };
  const skin = surface("skin-peach", 0xe4ab85, 0.68, 0, { clearcoat: 0.04 });
  const blush = surface("skin-warm", 0xd38e71, 0.78);
  const hair = surface(
    isGuide ? "hair-chestnut" : "visitor-hair",
    isGuide ? 0x64422d : 0x473427,
    0.62,
  );
  const navy = surface(
    isGuide ? "navy-knit" : "visitor-jacket",
    isGuide ? 0x24374f : 0x38536c,
    0.91,
  );
  navy.bumpMap = knit();
  navy.bumpScale = 0.008;
  const ribs = surface(
    isGuide ? "navy-ribs" : "visitor-ribs",
    isGuide ? 0x1d2d41 : 0x293e55,
    0.96,
  );
  const denim = surface("denim", 0x34485e, 0.9),
    denimLight = surface("denim-seams", 0x6b7e90, 0.9);
  const sneaker = surface("sneaker", 0xf2eee4, 0.74),
    sole = surface("shoe-sole", 0xcacaca, 0.8);
  // Chibi proportions follow the reference: large expressive face, compact body.
  ellipsoid(root, 0.32, 0.36, 0.22, navy, 0, 1.02);
  cyl(root, 0.115, 0.13, 0.2, skin, 0, 1.36);
  // One continuous sculpted surface: tapered jaw, soft cheeks and recessed sockets.
  const faceGeometry = new T.SphereGeometry(1, 64, 48);
  const vertices = faceGeometry.attributes.position;
  const colors = [];
  const warm = new T.Color(0xe4ab85),
    rosy = new T.Color(0xdc987e);
  for (let i = 0; i < vertices.count; i++) {
    const u = vertices.getX(i),
      v = vertices.getY(i),
      w = vertices.getZ(i);
    const x = u * 0.4 * (v < 0 ? 1 + v * 0.19 : 1);
    const y = 1.68 + v * 0.435;
    let z = 0.015 + w * 0.345;
    const cheek = Math.exp(
      -((Math.abs(x) - 0.22) ** 2 / 0.009 + (y - 1.54) ** 2 / 0.008),
    );
    if (w > 0) {
      z += 0.036 * cheek;
      z -=
        0.026 *
        Math.exp(
          -((Math.abs(x) - 0.158) ** 2 / 0.008 + (y - 1.69) ** 2 / 0.008),
        );
      z += 0.045 * Math.exp(-((x * x) / 0.014 + (y - 1.46) ** 2 / 0.012));
    }
    vertices.setXYZ(i, x, y, z);
    const color = warm.clone().lerp(rosy, w > 0 ? cheek * 0.4 : 0);
    colors.push(color.r, color.g, color.b);
  }
  faceGeometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  faceGeometry.computeVertexNormals();
  add(
    face,
    faceGeometry,
    surface("sculpted-skin", 0xffffff, 0.7, 0, { vertexColors: true }),
  );
  for (const s of [-1, 1]) {
    ellipsoid(face, 0.084, 0.12, 0.067, skin, s * 0.398, 1.62, 0.01);
    ellipsoid(face, 0.041, 0.075, 0.025, blush, s * 0.421, 1.625, 0.061);
    // Orbital rims, whites, gray irises, pupils and two catchlights per eye.
    const eye = group(face, s * 0.158, 1.69, 0.283);
    eye.userData.keep = true;
    root.userData.rig.eyes.push(eye);
    ellipsoid(eye, 0.118, 0.104, 0.025, skin, 0, 0.006, 0);
    ellipsoid(
      eye,
      0.109,
      0.091,
      0.031,
      surface("eye-white", 0xfffbf3, 0.3),
      0,
      0,
      0.019,
    );
    ellipsoid(
      eye,
      0.056,
      0.071,
      0.012,
      surface("iris-gray", 0x596263, 0.28),
      -0.003,
      -0.006,
      0.048,
    );
    ellipsoid(eye, 0.032, 0.047, 0.009, black(), -0.003, -0.01, 0.059);
    ellipsoid(eye, 0.014, 0.018, 0.005, white(), -0.019, 0.025, 0.068);
    ellipsoid(eye, 0.006, 0.008, 0.003, white(), 0.018, -0.026, 0.068);
    curve(
      eye,
      [
        [-0.102, 0.015, 0.027],
        [-0.065, 0.077, 0.039],
        [0.01, 0.092, 0.039],
        [0.083, 0.051, 0.03],
        [0.106, 0.004, 0.018],
      ],
      0.009,
      hair,
    );
    curve(
      eye,
      [
        [-0.099, -0.016, 0.025],
        [-0.055, -0.073, 0.035],
        [0.035, -0.08, 0.033],
        [0.099, -0.019, 0.024],
      ],
      0.012,
      skin,
    );
    curve(
      face,
      [
        [s * 0.065, 1.859, 0.311],
        [s * 0.145, 1.89, 0.317],
        [s * 0.231, 1.867, 0.286],
      ],
      0.022,
      hair,
    );
  }
  ellipsoid(face, 0.061, 0.052, 0.06, skin, 0, 1.575, 0.362);
  for (const s of [-1, 1])
    ellipsoid(face, 0.012, 0.008, 0.006, blush, s * 0.026, 1.553, 0.407);
  curve(
    face,
    [
      [-0.112, 1.478, 0.332],
      [-0.044, 1.452, 0.358],
      [0.045, 1.455, 0.357],
      [0.116, 1.493, 0.327],
    ],
    0.01,
    surface("smile", 0x985f4d, 0.8),
  );
  // One closed volume: angular fringe and swept crown spikes share the scalp.
  const cap = new T.SphereGeometry(1, 192, 100);
  const angularDistance = (a, b) =>
    Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const point = (a, center, width) =>
    Math.max(0, 1 - angularDistance(a, center) / width);
  const fringe = [
    [0.1, 0.18, 0.48],
    [0.39, 0.13, 0.62],
    [0.7, 0.15, 0.48],
    [1.03, 0.19, 0.59],
    [1.46, 0.25, 0.85],
    [1.9, 0.18, 0.56],
    [2.22, 0.17, 0.68],
    [2.58, 0.17, 0.52],
    [2.94, 0.16, 0.64],
    [-0.32, 0.16, 0.46],
    [-2.84, 0.18, 0.52],
    [-1.7, 0.2, 0.34],
  ];
  const crown = [
    [0.12, 1.14, 0.1],
    [2.95, 1.08, 0.12],
    [-0.55, 1.22, 0.09],
    [2.5, 0.3, 0.08],
    [1.8, 0.5, 0.045],
    [-2.2, 0.95, 0.085],
  ];
  const capVertices = cap.attributes.position;
  for (let i = 0; i < capVertices.count; i++) {
    const x = capVertices.getX(i),
      y = capVertices.getY(i),
      z = capVertices.getZ(i);
    const azimuth = Math.atan2(z, x);
    const front = Math.max(0, Math.sin(azimuth));
    const t = Math.acos(T.MathUtils.clamp(y, -1, 1)) / Math.PI;
    const bang = Math.max(
      ...fringe.map(
        ([center, width, height]) => point(azimuth, center, width) * height,
      ),
    );
    const limit = 1.92 - front * 1.02 + bang;
    const outer = Math.min(t / 0.72, 1);
    const theta = outer * limit;
    // Diagonal flow produces pointed anime locks, not a symmetrical bowl cut.
    const swept = azimuth + 0.2 * Math.sin(outer * Math.PI) * front;
    const underside =
      t > 0.72 ? Math.cos((((t - 0.72) / 0.28) * Math.PI) / 2) : 1;
    const crest = Math.max(
      0,
      ...crown.map(
        ([angle, elevation, height]) =>
          height *
          Math.max(
            0,
            1 -
              angularDistance(swept, angle) / 0.42 -
              Math.abs(theta - elevation) / 0.31,
          ),
      ),
    );
    const ridge =
      0.016 *
      Math.abs(Math.sin(azimuth * 8 + outer * 2)) *
      Math.sin(outer * Math.PI);
    capVertices.setXYZ(
      i,
      (0.435 + crest + ridge) * Math.sin(theta) * Math.cos(swept) * underside -
        0.055 * (1 - outer),
      t <= 0.72
        ? (0.395 + crest) * Math.cos(theta)
        : T.MathUtils.lerp(0.395 * Math.cos(limit), -0.045, (t - 0.72) / 0.28),
      (0.4 + crest + ridge) * Math.sin(theta) * Math.sin(swept) * underside,
    );
  }
  cap.computeVertexNormals();
  const hairstyle = add(face, cap, hair, 0, 1.775, -0.028);
  hairstyle.name = "anime-hair-solid";
  // Half-zip jumper, turned collar, ribbed waistband and backpack straps.
  rounded(root, 0.19, 0.09, 0.035, sneaker, 0, 1.285, 0.185, 0.016);
  for (const s of [-1, 1]) {
    const collar = rounded(
      root,
      0.15,
      0.17,
      0.068,
      navy,
      s * 0.125,
      1.33,
      0.155,
      0.024,
    );
    collar.rotation.z = s * 0.42;
    collar.rotation.y = s * -0.3;
  }
  curve(
    root,
    [
      [0, 1.365, 0.212],
      [0, 1.16, 0.21],
      [0, 1.075, 0.197],
    ],
    0.009,
    steel(),
  );
  rounded(root, 0.024, 0.045, 0.018, steel(), 0.016, 1.178, 0.227, 0.006);
  rounded(root, 0.47, 0.09, 0.31, ribs, 0, 0.79, 0.003, 0.035);
  for (let j = 0; j < 19; j++)
    rod(
      root,
      [-0.215 + j * 0.024, 0.767, 0.16],
      [-0.215 + j * 0.024, 0.818, 0.165],
      0.0035,
      navy,
    );
  root.userData.legs = [];
  for (const s of [-1, 1]) {
    const leg = group(root, s * 0.129, 0.77, 0);
    leg.scale.y = 1.3;
    leg.userData.keep = true;
    root.userData.legs.push(leg);
    const trousers = ellipsoid(leg, 0.113, 0.255, 0.119, denim, 0, -0.225);
    const trouserVertices = trousers.geometry.attributes.position;
    for (let i = 0; i < trouserVertices.count; i++) {
      const y = trouserVertices.getY(i),
        fold =
          1 + 0.023 * Math.sin(y * 31) * Math.exp(-((y + 0.25) ** 2) / 0.08);
      trouserVertices.setXYZ(
        i,
        trouserVertices.getX(i) * fold,
        y,
        trouserVertices.getZ(i) * fold,
      );
    }
    trousers.geometry.computeVertexNormals();
    rounded(leg, 0.205, 0.08, 0.225, denimLight, 0, -0.424, 0.006, 0.028);
    curve(
      leg,
      [
        [s * 0.091, -0.03, 0.065],
        [s * 0.099, -0.2, 0.072],
        [s * 0.087, -0.39, 0.083],
      ],
      0.005,
      denimLight,
    );
    curve(
      leg,
      [
        [s * 0.065, -0.015, 0.099],
        [s * 0.075, -0.057, 0.114],
        [s * 0.042, -0.1, 0.116],
        [-s * 0.015, -0.115, 0.112],
      ],
      0.0025,
      denimLight,
    );
    rounded(leg, 0.24, 0.07, 0.4, sole, 0, -0.54, 0.087, 0.027);
    ellipsoid(leg, 0.119, 0.102, 0.195, sneaker, 0, -0.48, 0.078);
    for (const side of [-1, 1]) {
      curve(
        leg,
        [
          [side * 0.112, -0.487, -0.042],
          [side * 0.115, -0.464, 0.053],
          [side * 0.106, -0.5, 0.188],
        ],
        0.0027,
        sole,
      );
      rounded(leg, 0.01, 0.06, 0.08, denim, side * 0.113, -0.46, -0.035, 0.004);
      for (let j = 0; j < 4; j++)
        ellipsoid(
          leg,
          0.007,
          0.004,
          0.007,
          sole,
          side * 0.07,
          -0.404 - j * 0.013,
          0.029 + j * 0.036,
        );
    }
    curve(
      leg,
      [
        [-0.088, -0.492, 0.2],
        [0, -0.46, 0.253],
        [0.088, -0.492, 0.2],
      ],
      0.0027,
      sole,
    );
    rounded(leg, 0.135, 0.037, 0.14, sneaker, 0, -0.388, 0.035, 0.014);
    for (let j = 0; j < 4; j++)
      rod(
        leg,
        [-0.071, -0.407 - j * 0.013, 0.03 + j * 0.035],
        [0.071, -0.415 - j * 0.013, 0.058 + j * 0.035],
        0.008,
        white(),
      );
    const arm = group(root, s * 0.267, 1.165, 0);
    arm.rotation.z = s * 0.15;
    arm.userData.keep = true;
    arm.userData.side = s;
    root.userData.rig.arms.push(arm);
    ellipsoid(arm, 0.103, 0.224, 0.108, navy, s * 0.024, -0.172, 0.005);
    for (const dy of [-0.24, -0.29])
      curve(
        arm,
        [
          [s * 0.024 - 0.072, dy, 0.073],
          [s * 0.024, dy + 0.016, 0.11],
          [s * 0.024 + 0.072, dy - 0.008, 0.073],
        ],
        0.004,
        ribs,
      );
    rounded(arm, 0.177, 0.065, 0.18, ribs, s * 0.04, -0.352, 0.015, 0.02);
    ellipsoid(arm, 0.083, 0.105, 0.067, skin, s * 0.04, -0.445, 0.024);
    ellipsoid(arm, 0.032, 0.059, 0.033, skin, s * 0.1, -0.423, 0.067);
    for (let j = 0; j < 3; j++)
      curve(
        arm,
        [
          [s * 0.018 + j * 0.016, -0.444, 0.086],
          [s * 0.018 + j * 0.016, -0.48, 0.078],
        ],
        0.0018,
        blush,
      );
    if (isGuide && s < 0) {
      const band = ring(arm, 0.086, 0.012, black(), s * 0.04, -0.385, 0.024);
      band.rotation.x = Math.PI / 2;
      rounded(
        arm,
        0.094,
        0.082,
        0.027,
        steel(),
        s * 0.04,
        -0.385,
        0.104,
        0.014,
      );
      rounded(
        arm,
        0.078,
        0.064,
        0.008,
        black(),
        s * 0.04,
        -0.385,
        0.121,
        0.013,
      );
    }
    if (isGuide) {
      curve(
        root,
        [
          [s * 0.18, 1.2, -0.16],
          [s * 0.228, 1.18, 0.105],
          [s * 0.226, 0.86, 0.186],
          [s * 0.2, 0.73, 0.11],
        ],
        0.026,
        black(),
      );
      rounded(root, 0.064, 0.058, 0.02, steel(), s * 0.223, 0.99, 0.194, 0.008);
      rounded(root, 0.041, 0.033, 0.022, black(), s * 0.223, 0.99, 0.2, 0.005);
    }
  }
  if (isGuide) {
    rounded(
      root,
      0.41,
      0.5,
      0.2,
      surface("backpack", 0x242c35, 0.85),
      0,
      1.02,
      -0.249,
      0.078,
    );
    rounded(root, 0.32, 0.24, 0.075, black(), 0, 0.94, -0.365, 0.035);
    curve(
      root,
      [
        [-0.14, 0.76, -0.4],
        [-0.14, 0.99, -0.4],
        [0.14, 0.99, -0.4],
        [0.14, 0.76, -0.4],
      ],
      0.007,
      steel(),
    );
    curve(
      root,
      [
        [-0.082, 1.245, -0.23],
        [-0.078, 1.315, -0.265],
        [0.078, 1.315, -0.265],
        [0.082, 1.245, -0.23],
      ],
      0.013,
      black(),
    );
  }
  consolidate(root);
  return root;
}

export function createCharacter(guide = false) {
  return person(guide);
}
export function createLandmark(id) {
  const root = new T.Group();
  const builders = {
    f1: (root) => buildClassicF1(root, vehicleHelpers),
    "power-plant": powerPlant,
    library: library,
    notebook: notebook,
    bike: (root) => buildReferenceBike(root, vehicleHelpers),
    phone: foldingPhone,
  };
  if (!builders[id]) throw new Error(`Unknown landmark: ${id}`);
  const vehicleHelpers = {
    add,
    group,
    rounded,
    ellipsoid,
    cyl,
    rod,
    curve,
    ring,
    lathe,
    loft,
    polygon,
    surface,
    paint,
    rubber,
    carbon,
    steel,
    black,
    white,
  };
  builders[id](root);
  if (id !== "f1" && id !== "bike")
    refineLandmark(id, root, {
      add,
      group,
      rounded,
      ellipsoid,
      cyl,
      rod,
      curve,
      ring,
      lathe,
      polygon,
      surface,
      paint,
      rubber,
      carbon,
      steel,
      black,
      white,
      blue,
      stone,
      column,
    });
  // Match the broad architectural silhouettes before normalizing to the plaza.
  if (id === "power-plant" || id === "library") {
    const pieces = [...root.children],
      assembly = group(root);
    for (const piece of pieces) assembly.add(piece);
    assembly.scale.set(
      id === "power-plant" ? 1.13 : 1.12,
      id === "library" ? 0.97 : 1,
      id === "library" ? 0.92 : 1,
    );
  }
  consolidate(root);
  // Include independent holographic sprites in the final rendered footprint.
  const bounds = new T.Box3().setFromObject(root);
  const size = bounds.getSize(new T.Vector3());
  root.scale.setScalar(Math.min(3.2 / size.y, 4.7 / Math.max(size.x, size.z)));
  for (const child of root.children) child.position.y -= bounds.min.y;
  root.userData.landmarkId = id;
  return root;
}
