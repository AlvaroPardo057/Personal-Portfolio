import * as T from "three";

// Reference-specific modelling details. All landmarks remain orbitable 3D meshes.
function roundedSlab(w, h, d, r) {
  const s = new T.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new T.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    bevelSegments: 2,
    curveSegments: 16,
    steps: 1,
  });
  g.translate(0, 0, -d / 2);
  return g;
}

function surfacePattern(kind) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d");
  c.fillStyle = kind === "carbon" ? "#525252" : "#969696";
  c.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4)
    for (let x = 0; x < 256; x += 4) {
      const n = (Math.sin(x * 19.13 + y * 73.41) * 43758.5453) % 1;
      const v =
        kind === "carbon"
          ? ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 100 : 55) + n * 12
          : 145 + n * 30;
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(x, y, 4, 4);
    }
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(kind === "carbon" ? 10 : 3, kind === "carbon" ? 10 : 3);
  return texture;
}
let carbonBump, stoneBump;

export function refineLandmark(id, root, h) {
  const {
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
  } = h;
  carbonBump ??= surfacePattern("carbon");
  stoneBump ??= surfacePattern("stone");
  carbon().bumpMap = carbonBump;
  carbon().bumpScale = 0.006;
  stone().bumpMap = stoneBump;
  stone().bumpScale = 0.012;
  const asphalt = surface("service-road", 0x576168, 0.94);
  const leaves = surface("reference-foliage", 0x4c8c22, 0.9);
  function shrub(parent, x, y, z, size = 0.13) {
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.399;
      ellipsoid(
        parent,
        size * 0.65,
        size * 0.75,
        size * 0.65,
        leaves,
        x + Math.cos(angle) * size * 0.4,
        y + Math.sin(i * 1.7) * size * 0.23,
        z + Math.sin(angle) * size * 0.4,
      );
    }
  }
  function cypress(parent, x, y, z, height = 0.8) {
    cyl(
      parent,
      0.018,
      0.028,
      height * 0.8,
      surface("cypress-bark", 0x775c39, 0.95),
      x,
      y + height * 0.4,
      z,
    );
    for (let i = 0; i < 7; i++)
      ellipsoid(
        parent,
        0.095 * (1 - i * 0.1),
        height * 0.16,
        0.095 * (1 - i * 0.1),
        leaves,
        x + Math.sin(i) * 0.012,
        y + height * (0.2 + i * 0.115),
        z,
      );
  }
  if (id === "power-plant") {
    const concrete = surface("cooling-concrete", 0xe5e7e5, 0.84),
      seam = surface("concrete-seam", 0xc5cecd, 0.9);
    concrete.bumpMap = stoneBump;
    concrete.bumpScale = 0.006;
    // Oval landscaped campus and road ring around the buildings.
    root.children[0].geometry.dispose();
    root.children[0].geometry = new T.CylinderGeometry(1, 1, 0.13, 96);
    root.children[0].scale.set(3.35, 1, 1.68);
    root.children[0].position.x = 0.34;
    const road = add(
      root,
      new T.RingGeometry(0.89, 1, 96),
      asphalt,
      0.34,
      0.139,
      0,
    );
    road.rotation.x = -Math.PI / 2;
    road.scale.set(3.16, 1.51, 1);
    for (const radius of [0.89, 1]) {
      const line = curve(
        root,
        Array.from({ length: 65 }, (_, i) => [
          0.34 + Math.cos((i / 64) * Math.PI * 2) * 3.16 * radius,
          0.147,
          Math.sin((i / 64) * Math.PI * 2) * 1.51 * radius,
        ]),
        0.011,
        white(),
        true,
      );
      line.receiveShadow = true;
    }
    const towerRadius = (y) => 0.56 + 0.48 * ((y - 1.95) / 1.95) ** 2;
    for (let y = 0.66; y < 3.02; y += 0.17) {
      const seamRing = ring(
        root,
        towerRadius(y) + 0.002,
        0.0027,
        seam,
        -1.4,
        y,
        -0.35,
      );
      seamRing.rotation.x = Math.PI / 2;
    }
    // Five white ribs over the blue barrel roof.
    for (let x = 0.52; x <= 2.7; x += 0.43)
      curve(
        root,
        Array.from({ length: 25 }, (_, j) => {
          const a = (j / 24) * Math.PI;
          return [x, 0.83 + Math.sin(a) * 0.558, 0.3 + Math.cos(a) * 0.558];
        }),
        0.026,
        concrete,
      );
    rounded(root, 1.76, 0.055, 0.69, blue(), -0.42, 0.56, 1.05, 0.008);
    rounded(root, 1.2, 0.44, 0.46, concrete, 1.78, 0.36, 1.06, 0.015);
    for (const x of [1.44, 1.92]) {
      rounded(root, 0.25, 0.27, 0.018, blue(), x, 0.285, 1.3, 0.004);
      for (let j = 0; j < 6; j++)
        rounded(
          root,
          0.21,
          0.012,
          0.009,
          seam,
          x,
          0.17 + j * 0.035,
          1.314,
          0.002,
        );
    }
    for (const x of [-0.92, -0.61])
      for (let j = 0; j < 5; j++)
        rounded(
          root,
          0.19,
          0.014,
          0.008,
          seam,
          x,
          0.21 + j * 0.025,
          1.416,
          0.002,
        );
    for (const [x, y, z] of [
      [0.04, 2.28, -0.68],
      [0.97, 2.03, -0.68],
      [1.15, 1.91, -0.59],
    ]) {
      cyl(root, 0.037, 0.037, y - 0.35, steel(), x, (y + 0.35) / 2, z);
      const rim = ring(root, 0.04, 0.009, steel(), x, y, z);
      rim.rotation.x = Math.PI / 2;
    }
    for (const side of [-1, 1]) {
      curve(
        root,
        [
          [0.55 + side * 0.55, 0.45, 0.05],
          [0.55 + side * 0.55, 1.18, 0.05],
          [0.55 + side * 0.4, 1.31, 0.05],
          [0.55 + side * 0.27, 1.31, 0.05],
        ],
        0.044,
        steel(),
      );
      cyl(root, 0.16, 0.16, 0.55, concrete, 0.55 + side * 0.22, 0.415, 0.86);
      cyl(root, 0.162, 0.162, 0.06, blue(), 0.55 + side * 0.22, 0.59, 0.86);
      ellipsoid(
        root,
        0.16,
        0.07,
        0.16,
        steel(),
        0.55 + side * 0.22,
        0.72,
        0.86,
      );
    }
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI) / 5;
      curve(
        root,
        Array.from({ length: 18 }, (_, j) => {
          const t = ((j / 17) * Math.PI) / 2;
          return [
            0.55 + Math.cos(a) * 0.683 * Math.sin(t),
            1.31 + 0.683 * Math.cos(t),
            -0.35 + Math.sin(a) * 0.683 * Math.sin(t),
          ];
        }),
        0.003,
        seam,
      );
    }
    // Transmission pylon and substation on the right of the campus.
    const px = 2.69,
      pz = -0.51;
    for (const dx of [-1, 1])
      for (const dz of [-1, 1])
        rod(
          root,
          [px + dx * 0.22, 0.14, pz + dz * 0.18],
          [px + dx * 0.025, 1.62, pz + dz * 0.025],
          0.013,
          steel(),
        );
    for (let j = 0; j < 6; j++) {
      const y = 0.23 + j * 0.2,
        w = 0.21 * (1 - y / 1.7);
      for (const side of [-1, 1]) {
        rod(
          root,
          [px - w, y, pz + side * w],
          [px + w * 0.82, y + 0.2, pz + side * w * 0.82],
          0.009,
          steel(),
        );
        rod(
          root,
          [px + w, y, pz + side * w],
          [px - w * 0.82, y + 0.2, pz + side * w * 0.82],
          0.009,
          steel(),
        );
      }
    }
    for (const y of [0.86, 1.14, 1.4]) {
      rod(root, [px - 0.38, y, pz], [px + 0.38, y, pz], 0.016, steel());
      rod(root, [px, y + 0.15, pz], [px - 0.38, y, pz], 0.01, steel());
      rod(root, [px, y + 0.15, pz], [px + 0.38, y, pz], 0.01, steel());
      for (const side of [-1, 1])
        curve(
          root,
          [
            [px + side * 0.37, y, pz],
            [3.02, y - 0.15, 0.12],
            [3.21, y - 0.19, 0.49],
          ],
          0.005,
          black(),
        );
    }
    rounded(root, 0.67, 0.3, 0.5, concrete, 2.65, 0.3, 0.62, 0.01);
    for (let i = 0; i < 4; i++) {
      cyl(root, 0.028, 0.028, 0.46, steel(), 2.4 + i * 0.16, 0.52, 0.62);
      for (let j = 0; j < 6; j++)
        cyl(
          root,
          0.043,
          0.043,
          0.025,
          surface("insulator", 0x697679, 0.55),
          2.4 + i * 0.16,
          0.49 + j * 0.04,
          0.62,
        );
    }
    for (let i = 0; i < 24; i++) {
      const a = i * 2.399;
      shrub(
        root,
        0.34 + Math.cos(a) * 3.13,
        0.25,
        Math.sin(a) * 1.42,
        0.11 + (i % 3) * 0.025,
      );
    }
    for (const [x, z] of [
      [-2.53, 0.28],
      [-2.2, -0.86],
      [1.94, 1.18],
      [2.29, -1.16],
    ]) {
      cyl(
        root,
        0.027,
        0.04,
        0.35,
        surface("plant-tree-bark", 0x755436, 0.9),
        x,
        0.28,
        z,
      );
      shrub(root, x, 0.57, z, 0.22);
    }
  }
  if (id === "library") {
    const wood = surface("scaffold-planks", 0x91704c, 0.92),
      yellow = surface("crane-yellow", 0xe4a51e, 0.48, 0.3);
    const masonry = surface("site-marble", 0xdcc6a4, 0.88);
    masonry.bumpMap = stoneBump;
    masonry.bumpScale = 0.015;
    const glass = surface("construction-glass", 0x244247, 0.2, 0.3);
    rounded(root, 5.1, 0.08, 3.95, masonry, 0, 0.06, 0.32, 0.045);
    // Replace eight thick steps with the broad, finely stepped entrance.
    for (const m of [...root.children])
      if (
        m.isMesh &&
        Math.abs(m.geometry.parameters?.width - 1.16) < 0.001 &&
        Math.abs(m.geometry.parameters?.height - 0.085) < 0.001
      ) {
        m.removeFromParent();
        m.geometry.dispose();
      }
    for (let i = 0; i < 19; i++)
      rounded(
        root,
        1.49,
        0.041,
        1.25 - i * 0.052,
        masonry,
        0,
        0.24 + i * 0.033,
        1.24 - i * 0.025,
        0.006,
      );
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++)
        rounded(
          root,
          0.24,
          0.17,
          0.26,
          masonry,
          side * 0.87,
          0.35 + i * 0.16,
          1.69 - i * 0.19,
          0.014,
        );
      for (let j = 0; j < 6; j++)
        rounded(
          root,
          0.26,
          0.2,
          0.26,
          masonry,
          side * (1.19 + j * 0.2),
          0.9 + (j % 2) * 0.035,
          0.73,
          0.012,
        );
      cypress(root, side * 1.17, 0.76, 0.6, 1.13);
    }
    // Unfinished rear towers and block joints on the upper wings.
    for (const [x, height] of [
      [-1.79, 2.77],
      [1.76, 2.27],
    ]) {
      rounded(
        root,
        0.62,
        height - 0.72,
        0.77,
        masonry,
        x,
        (height + 0.72) / 2,
        -0.77,
        0.018,
      );
      for (let row = 0; row < 9; row++)
        for (let j = 0; j < 3; j++)
          rounded(
            root,
            0.195,
            0.14,
            0.027,
            stone(),
            x - 0.2 + j * 0.205,
            1.05 + row * 0.17,
            -0.365,
            0.007,
          );
      for (let j = 0; j < 3; j++)
        rounded(
          root,
          0.19,
          0.15 + (j % 2) * 0.13,
          0.32,
          stone(),
          x - 0.2 + j * 0.205,
          height + 0.05,
          -0.75,
          0.01,
        );
    }
    function scaffold(x, z, width, height, depth = 0.38) {
      for (const dx of [-width / 2, width / 2])
        for (const dz of [-depth / 2, depth / 2])
          rod(
            root,
            [x + dx, 0.13, z + dz],
            [x + dx, height, z + dz],
            0.011,
            wood,
          );
      for (let y = 0.4; y < height; y += 0.38) {
        rounded(root, width + 0.08, 0.025, depth + 0.1, wood, x, y, z, 0.003);
        for (const side of [-1, 1]) {
          rod(
            root,
            [x - width / 2, y, z + (side * depth) / 2],
            [x + width / 2, Math.min(y + 0.38, height), z + (side * depth) / 2],
            0.009,
            wood,
          );
          rod(
            root,
            [x + width / 2, y, z + (side * depth) / 2],
            [x - width / 2, Math.min(y + 0.38, height), z + (side * depth) / 2],
            0.009,
            wood,
          );
        }
        rod(
          root,
          [x - width / 2, y + 0.12, z + depth / 2],
          [x + width / 2, y + 0.12, z + depth / 2],
          0.009,
          wood,
        );
      }
    }
    scaffold(-1.01, 1.06, 0.48, 2.78, 0.36);
    scaffold(-2.16, -0.03, 0.34, 2.91, 0.9);
    scaffold(2.08, 0.56, 0.38, 2.38, 0.55);
    // Carved figures above the pediment and beside the stairway.
    function statue(x, y, z, scale = 0.23) {
      rounded(root, 0.2, 0.08, 0.2, masonry, x, y, z, 0.008);
      ellipsoid(
        root,
        (0.055 * scale) / 0.23,
        (0.13 * scale) / 0.23,
        (0.045 * scale) / 0.23,
        stone(),
        x,
        y + scale * 0.75,
        z,
      );
      ellipsoid(root, 0.035, 0.044, 0.035, stone(), x, y + scale * 1.42, z);
      for (const s of [-1, 1])
        rod(
          root,
          [x + s * 0.025, y + 0.045, z],
          [x + s * 0.019, y + scale * 0.7, z],
          0.022,
          stone(),
        );
      rod(
        root,
        [x - 0.041, y + scale * 1.1, z],
        [x - 0.086, y + scale * 0.67, z + 0.025],
        0.018,
        stone(),
      );
      rod(
        root,
        [x + 0.041, y + scale * 1.1, z],
        [x + 0.069, y + scale * 0.85, z + 0.035],
        0.018,
        stone(),
      );
    }
    for (const [x, y, z] of [
      [0, 2.75, -0.04],
      [-1.1, 2.29, 0.78],
      [1.1, 2.29, 0.78],
      [-0.86, 0.96, 1.12],
      [0.86, 0.96, 1.12],
    ])
      statue(x, y, z);
    for (let i = 0; i < 18; i++)
      rounded(
        root,
        0.058,
        0.052,
        0.09,
        stone(),
        -0.99 + i * 0.117,
        2.095,
        0.78,
        0.004,
      );
    // Square crane jib with bracing on both sides, cab and hoisted pallet.
    const cz = -0.81;
    for (const z of [cz - 0.09, cz + 0.09]) {
      for (const y of [3.05, 3.27])
        rod(root, [-0.18, y, z], [2.49, y, z], 0.018, yellow);
      for (let x = -0.18; x < 2.4; x += 0.21)
        rod(root, [x, 3.05, z], [x + 0.21, 3.27, z], 0.013, yellow);
    }
    rounded(root, 0.24, 0.25, 0.32, yellow, 1.72, 2.94, cz + 0.03, 0.013);
    rounded(root, 0.19, 0.14, 0.012, glass, 1.72, 2.98, cz + 0.2, 0.006);
    for (const end of [-0.16, 2.49])
      rod(root, [1.93, 3.46, cz], [end, 3.25, cz], 0.009, steel());
    rod(root, [1.93, 3.12, cz], [1.93, 3.46, cz], 0.018, yellow);
    for (const side of [-1, 1])
      rod(
        root,
        [0.15, 3.06, cz + side * 0.08],
        [0.15, 2.21, cz + side * 0.08],
        0.004,
        black(),
      );
    rounded(root, 0.39, 0.028, 0.38, wood, 0.15, 1.85, cz, 0.004);
    // Construction vehicles reproduce the excavator, forklift and mixer silhouettes.
    function tyre(parent, x, y, z, r) {
      const w = cyl(parent, r, r, 0.08, rubber(), x, y, z);
      w.rotation.x = Math.PI / 2;
      const hub = cyl(parent, r * 0.5, r * 0.5, 0.09, steel(), x, y, z);
      hub.rotation.x = Math.PI / 2;
    }
    const excavator = group(root, -1.71, 0.15, 1.51);
    excavator.scale.setScalar(0.64);
    for (const side of [-1, 1]) {
      rounded(
        excavator,
        0.91,
        0.17,
        0.14,
        carbon(),
        0,
        0.09,
        side * 0.24,
        0.07,
      );
      for (let j = 0; j < 6; j++) {
        tyre(excavator, -0.34 + j * 0.135, 0.09, side * 0.25, 0.073);
        rounded(
          excavator,
          0.058,
          0.025,
          0.16,
          steel(),
          -0.36 + j * 0.14,
          0.18,
          side * 0.24,
          0.003,
        );
      }
    }
    rounded(excavator, 0.68, 0.23, 0.43, yellow, 0, 0.31, 0, 0.026);
    rounded(excavator, 0.29, 0.34, 0.34, yellow, 0.04, 0.58, 0, 0.025);
    rounded(excavator, 0.23, 0.25, 0.35, glass, 0.025, 0.6, 0, 0.014);
    for (const side of [-1, 1])
      rod(
        excavator,
        [0.16, 0.46, side * 0.18],
        [0.16, 0.75, side * 0.18],
        0.023,
        yellow,
      );
    rod(excavator, [-0.26, 0.43, 0], [-0.67, 1.1, 0], 0.075, yellow);
    rod(excavator, [-0.67, 1.1, 0], [-1.06, 0.4, 0], 0.055, yellow);
    rod(excavator, [-0.25, 0.5, 0.07], [-0.62, 0.99, 0.07], 0.025, steel());
    polygon(
      excavator,
      [
        [-1.17, 0.39],
        [-0.96, 0.36],
        [-0.89, 0.16],
        [-1.18, 0.15],
        [-1.26, 0.27],
      ],
      0.26,
      steel(),
      0,
      0,
      0,
      0.018,
    );
    const forklift = group(root, -0.46, 0.15, 1.84);
    forklift.scale.setScalar(0.48);
    rounded(forklift, 0.59, 0.22, 0.4, yellow, 0, 0.27, 0, 0.05);
    for (const x of [-0.2, 0.2])
      for (const s of [-1, 1]) tyre(forklift, x, 0.14, s * 0.22, 0.13);
    for (const x of [-0.2, 0.17])
      for (const s of [-1, 1])
        rod(forklift, [x, 0.35, s * 0.16], [x, 0.83, s * 0.16], 0.018, black());
    rounded(forklift, 0.43, 0.035, 0.38, white(), 0, 0.83, 0, 0.018);
    for (const s of [-1, 1]) {
      rod(
        forklift,
        [0.37, 0.13, s * 0.14],
        [0.37, 0.83, s * 0.14],
        0.027,
        steel(),
      );
      rod(
        forklift,
        [0.37, 0.13, s * 0.14],
        [0.7, 0.13, s * 0.14],
        0.02,
        steel(),
      );
    }
    rounded(forklift, 0.3, 0.28, 0.38, stone(), 0.58, 0.29, 0, 0.014);
    const mixer = group(root, 1.78, 0.16, 1.67);
    mixer.scale.setScalar(0.64);
    rounded(mixer, 1.12, 0.1, 0.42, carbon(), 0, 0.2, 0, 0.015);
    for (const x of [-0.4, -0.1, 0.43])
      for (const s of [-1, 1]) tyre(mixer, x, 0.17, s * 0.24, 0.16);
    rounded(mixer, 0.34, 0.39, 0.43, white(), 0.42, 0.47, 0, 0.035);
    rounded(mixer, 0.02, 0.18, 0.34, glass, 0.597, 0.54, 0, 0.008);
    for (const s of [-1, 1])
      rounded(mixer, 0.23, 0.18, 0.018, glass, 0.41, 0.54, s * 0.222, 0.014);
    const drum = group(mixer, -0.2, 0.57, 0);
    drum.rotation.z = -1.22;
    lathe(
      drum,
      [
        [0.1, -0.4],
        [0.22, -0.25],
        [0.245, 0.03],
        [0.19, 0.3],
        [0.09, 0.4],
      ],
      white(),
    );
    cyl(drum, 0.248, 0.24, 0.14, yellow, 0, -0.05, 0);
    // Pallets, rubble and crates distributed along the front edge.
    for (let i = 0; i < 7; i++) {
      const x = -2.16 + i * 0.65,
        z = 2.0 + (i % 2) * 0.08;
      rounded(root, 0.4, 0.035, 0.3, wood, x, 0.14, z, 0.004);
      for (let j = 0; j < 3; j++)
        rounded(
          root,
          0.11,
          0.13,
          0.24,
          masonry,
          x - 0.125 + j * 0.125,
          0.22 + (i % 3) * 0.02,
          z,
          0.009,
        );
    }
    for (let i = 0; i < 18; i++)
      ellipsoid(
        root,
        0.06 + (i % 3) * 0.018,
        0.04,
        0.055,
        masonry,
        -2.1 + Math.sin(i * 2.3) * 0.27,
        0.17,
        1.0 + Math.cos(i * 1.3) * 0.32,
      );
    // Warm recessed wall panels, cut stone courses and arched terrace vaults.
    for (const side of [-1, 1]) {
      rounded(
        root,
        0.82,
        0.7,
        0.035,
        surface("library-terracotta", 0x8f5140, 0.92),
        side * 1.61,
        1.32,
        0.139,
        0.004,
      );
      for (let row = 0; row < 4; row++)
        for (let j = 0; j < 4; j++) {
          const x = side * (1.16 + j * 0.245);
          rounded(
            root,
            0.23,
            0.14,
            0.05,
            row % 2 ? masonry : stone(),
            x,
            0.23 + row * 0.151,
            1.033,
            0.008,
          );
        }
      const wall = new T.Shape();
      wall.moveTo(-0.43, 0);
      wall.lineTo(0.43, 0);
      wall.lineTo(0.43, 0.72);
      wall.lineTo(-0.43, 0.72);
      wall.closePath();
      const opening = new T.Path();
      opening.moveTo(-0.17, 0);
      opening.lineTo(-0.17, 0.36);
      opening.absarc(0, 0.36, 0.17, Math.PI, 0, true);
      opening.lineTo(0.17, 0);
      opening.closePath();
      wall.holes.push(opening);
      add(
        root,
        new T.ExtrudeGeometry(wall, {
          depth: 0.15,
          bevelEnabled: false,
          curveSegments: 16,
        }),
        masonry,
        side * 1.73,
        0.13,
        1.1,
      );
      for (let j = 0; j < 9; j++) {
        const a = (j / 8) * Math.PI;
        const brick = rounded(
          root,
          0.105,
          0.085,
          0.18,
          stone(),
          side * 1.73 + Math.cos(a) * 0.218,
          0.49 + Math.sin(a) * 0.218,
          1.17,
          0.005,
        );
        brick.rotation.z = a;
      }
    }
  }
  if (id === "library") {
    const limestone = surface("column-marble", 0xe8d9b8, 0.85);
    const cloth = surface("construction-canvas", 0xc5a579, 0.98, 0, {
      side: T.DoubleSide,
    });
    const orange = surface("safety-orange", 0xde782f, 0.6);
    // Broad carved pediment scene: separate heads, robes and gestures.
    for (let i = 0; i < 9; i++) {
      const x = -0.76 + i * 0.19,
        top = 2.64 - Math.abs(x) * 0.37;
      ellipsoid(root, 0.021, 0.028, 0.018, limestone, x, top, 0.811);
      const robe = ellipsoid(
        root,
        0.032,
        0.072,
        0.021,
        limestone,
        x,
        top - 0.09,
        0.811,
      );
      robe.rotation.z = Math.sin(i * 1.7) * 0.22;
      rod(
        root,
        [x - 0.014, top - 0.055, 0.813],
        [x - 0.068, top - 0.102, 0.813],
        0.012,
        limestone,
      );
      rod(
        root,
        [x + 0.014, top - 0.055, 0.813],
        [x + 0.06, top - 0.08 + Math.sin(i) * 0.03, 0.813],
        0.012,
        limestone,
      );
    }
    // Small cornice dentils and shelves with individual book bindings.
    for (const side of [-1, 1])
      for (let j = 0; j < 13; j++)
        rounded(
          root,
          0.048,
          0.034,
          0.058,
          limestone,
          side * 1.62 - 0.55 + j * 0.09,
          1.856,
          0.415,
          0.004,
        );
    function tarp(x, y, z, w, height) {
      const g = new T.PlaneGeometry(w, height, 20, 10),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const px = p.getX(i),
          py = p.getY(i),
          u = px / w + 0.5;
        p.setXYZ(
          i,
          px,
          py - 0.045 * Math.sin(u * Math.PI) * (1 - (py / height + 0.5)),
          0.02 * Math.sin(u * 6 * Math.PI),
        );
      }
      g.computeVertexNormals();
      add(root, g, cloth, x, y, z);
      for (const side of [-1, 1])
        rod(
          root,
          [x + side * w * 0.47, y + height * 0.5, z],
          [x + side * w * 0.47, y + height * 0.5 + 0.08, z],
          0.005,
          black(),
        );
    }
    tarp(-1.01, 1.53, 1.26, 0.43, 0.25);
    tarp(-2.14, 1.89, 0.47, 0.32, 0.22);
    tarp(2.08, 1.52, 0.852, 0.34, 0.24);
    // Stair guardians and detailed bases, following the stone lions in the photo.
    for (const side of [-1, 1]) {
      const x = side * 0.87,
        y = 1.02,
        z = 1.16;
      rounded(root, 0.22, 0.09, 0.32, limestone, x, y, z, 0.01);
      ellipsoid(root, 0.085, 0.075, 0.14, limestone, x, y + 0.12, z);
      ellipsoid(root, 0.058, 0.074, 0.058, limestone, x, y + 0.2, z + 0.065);
      ellipsoid(root, 0.045, 0.032, 0.04, limestone, x, y + 0.19, z + 0.11);
      for (const s of [-1, 1])
        rod(
          root,
          [x + s * 0.046, y + 0.12, z + 0.045],
          [x + s * 0.052, y + 0.065, z + 0.11],
          0.023,
          limestone,
        );
      curve(
        root,
        [
          [x + side * 0.06, y + 0.1, z - 0.12],
          [x + side * 0.12, y + 0.13, z - 0.15],
          [x + side * 0.12, y + 0.18, z - 0.12],
        ],
        0.012,
        limestone,
      );
    }
    for (const x of [-2.26, -0.94, 0.68, 2.25]) {
      rounded(root, 0.16, 0.027, 0.16, black(), x, 0.14, 2.15, 0.004);
      cyl(root, 0.012, 0.058, 0.19, orange, x, 0.247, 2.15, 18);
      cyl(root, 0.033, 0.043, 0.039, white(), x, 0.239, 2.15, 18);
    }
    for (const x of [-1.26, 0.43]) {
      cyl(
        root,
        0.071,
        0.071,
        0.21,
        surface("site-barrel", 0xc89021, 0.63, 0.2),
        x,
        0.255,
        1.7,
      );
      for (const y of [0.19, 0.29, 0.35]) {
        const hoop = ring(root, 0.073, 0.005, steel(), x, y, 1.7);
        hoop.rotation.x = Math.PI / 2;
      }
    }
    // Block pallets have slatted bases, joints and retaining straps.
    for (let i = 0; i < 7; i++) {
      const x = -2.16 + i * 0.65,
        z = 2.0 + (i % 2) * 0.08;
      for (const offset of [-0.11, 0, 0.11])
        rounded(
          root,
          0.42,
          0.018,
          0.065,
          surface("scaffold-planks", 0x91704c, 0.92),
          x,
          0.125,
          z + offset,
          0.002,
        );
      for (const offset of [-0.13, 0.13])
        rounded(root, 0.014, 0.16, 0.255, steel(), x + offset, 0.21, z, 0.002);
    }
    // A ladder stands against the terrace rather than floating in front of it.
    for (const side of [-1, 1])
      rod(
        root,
        [0.98 + side * 0.075, 0.13, 1.87],
        [0.98 + side * 0.075, 0.83, 1.23],
        0.01,
        surface("scaffold-planks", 0x91704c, 0.92),
      );
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      rod(
        root,
        [0.905, 0.17 + t * 0.66, 1.83 - t * 0.6],
        [1.055, 0.17 + t * 0.66, 1.83 - t * 0.6],
        0.008,
        steel(),
      );
    }
  }
  if (id === "notebook") {
    const book = root.getObjectByName("open-book"),
      brain = root.getObjectByName("holographic-brain");
    brain.rotation.set(0, -0.28, -0.1);
    surface("ruled-lines", 0x839ab5, 0.85).color.set(0x779bce);
    // Continuous, folded cortex replaces the regular rings of the earlier model.
    for (const mesh of [...brain.children]) {
      mesh.removeFromParent();
      mesh.geometry?.dispose();
    }
    const cortex = surface("reference-crystal-cortex", 0xa9cee9, 0.085, 0.24, {
      transmission: 0.58,
      thickness: 0.18,
      ior: 1.43,
      clearcoat: 1,
      clearcoatRoughness: 0.065,
    });
    for (const side of [-1, 1]) {
      const g = new T.SphereGeometry(1, 88, 60),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          y = p.getY(i),
          z = p.getZ(i);
        const phi = Math.atan2(z, x),
          theta = Math.acos(T.MathUtils.clamp(y, -1, 1));
        const field =
          9 * theta +
          2.5 * Math.sin(phi * 4 + theta * 1.5) +
          0.9 * Math.sin(phi * 7 - theta * 3);
        const folds =
          0.03 * Math.cos(field) * Math.sin(theta) ** 0.6 +
          0.011 * Math.cos(phi * 5 - theta * 6);
        p.setXYZ(
          i,
          side * 0.245 + x * (0.455 + folds),
          y * (0.54 + folds),
          z * (0.59 + folds),
        );
      }
      g.computeVertexNormals();
      add(brain, g, cortex);
    }
    ellipsoid(brain, 0.2, 0.17, 0.23, cortex, -0.17, -0.4, 0.24);
    rod(brain, [0, -0.4, 0.05], [0.035, -0.68, 0.11], 0.065, cortex, 0.1);
    // Flat satin ribbon with a swallowtail instead of the old round cord.
    const oldRibbon = book.children.find(
      (m) =>
        m.isMesh &&
        m.material.name === "" &&
        m.material === surface("bookmark-satin", 0xe1aa24, 0.38, 0.4),
    );
    if (oldRibbon) {
      oldRibbon.removeFromParent();
      oldRibbon.geometry.dispose();
    }
    const ribbon = polygon(
      book,
      [
        [-0.085, 0.27],
        [0.085, 0.27],
        [0.085, -0.34],
        [0, -0.27],
        [-0.085, -0.34],
      ],
      0.012,
      surface("bookmark-satin", 0xe1aa24, 0.38, 0.4),
      0,
      0,
      1.1,
      0.003,
    );
    ribbon.rotation.x = -0.48;
    const neural = surface("neural-cyan", 0x35ddff, 0.2, 0, {
      emissive: 0x05bfff,
      emissiveIntensity: 1.6,
      toneMapped: false,
    });
    const amber = surface("neural-amber", 0xffec9a, 0.2, 0, {
      emissive: 0xffb82f,
      emissiveIntensity: 1.8,
      toneMapped: false,
    });
    // Project angular circuit routes onto the actual convex hemisphere surface.
    const routes = [
      [
        [-0.48, 0.27],
        [-0.39, 0.18],
        [-0.48, 0.09],
        [-0.43, -0.1],
      ],
      [
        [-0.25, 0.39],
        [-0.12, 0.27],
        [-0.18, 0.16],
        [-0.09, 0.04],
      ],
      [
        [0.1, 0.43],
        [0.24, 0.31],
        [0.18, 0.16],
        [0.33, 0.03],
        [0.33, -0.17],
      ],
      [
        [0.49, 0.26],
        [0.54, 0.12],
        [0.45, -0.03],
        [0.51, -0.17],
      ],
      [
        [-0.57, -0.12],
        [-0.44, -0.19],
        [-0.32, -0.16],
        [-0.22, -0.33],
      ],
      [
        [0.05, -0.02],
        [0.15, -0.13],
        [0.11, -0.32],
        [0.21, -0.42],
      ],
      [
        [0.55, -0.22],
        [0.41, -0.3],
        [0.3, -0.36],
      ],
    ];
    function projectCortex(x, y) {
      const side = x < 0 ? -1 : 1,
        local = (x - side * 0.245) / 0.455,
        vertical = y / 0.54;
      const z =
        0.59 *
        Math.sqrt(Math.max(0.035, 1 - local * local - vertical * vertical));
      return new T.Vector3(x, y, z + 0.045);
    }
    for (let i = 0; i < routes.length; i++) {
      const points = [];
      for (let j = 0; j < routes[i].length - 1; j++)
        for (let k = 0; k < 9; k++) {
          const a = routes[i][j],
            b = routes[i][j + 1],
            t = k / 9;
          points.push(
            projectCortex(
              T.MathUtils.lerp(a[0], b[0], t),
              T.MathUtils.lerp(a[1], b[1], t),
            ),
          );
        }
      points.push(projectCortex(...routes[i].at(-1)));
      const path = new T.CurvePath();
      for (let j = 0; j < points.length - 1; j++)
        path.add(new T.LineCurve3(points[j], points[j + 1]));
      add(
        brain,
        new T.TubeGeometry(path, points.length * 2, 0.007, 6, false),
        neural,
      );
      const node = projectCortex(...routes[i][0]),
        { x, y, z } = node;
      ellipsoid(brain, 0.025, 0.025, 0.025, i % 3 ? neural : amber, x, y, z);
      if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 48;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.16, "rgba(255,255,255,.9)");
        gradient.addColorStop(0.4, "rgba(255,255,255,.25)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 48, 48);
        const halo = new T.Sprite(
          new T.SpriteMaterial({
            map: new T.CanvasTexture(canvas),
            color: i % 3 ? 0x08dfff : 0xffcc20,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
            toneMapped: false,
          }),
        );
        halo.position.copy(node);
        halo.scale.setScalar(0.15);
        brain.add(halo);
      }
    }
    const cerebellum = group(brain, -0.21, -0.38, 0.25);
    for (let i = 0; i < 9; i++) {
      const r = 0.19 * Math.sin(((i + 1) / 10) * Math.PI);
      const fold = ring(
        cerebellum,
        r,
        0.012,
        surface("brain-folds", 0xa5d9f5, 0.15, 0.3),
        0,
        -i * 0.02,
        0,
      );
      fold.rotation.x = Math.PI / 2;
      fold.scale.z = 0.65;
    }
    // Transparent tapered beams rise from the crease of the book.
    const beamMaterial = new T.MeshBasicMaterial({
      color: 0x68dfff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
    });
    for (let i = 0; i < 6; i++) {
      const x = -0.83 + i * 0.33;
      const g = new T.BufferGeometry();
      g.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [0, 0.38, 0, x - 0.13, 1.25, 0.2, x + 0.13, 1.25, 0.2],
          3,
        ),
      );
      g.computeVertexNormals();
      add(root, g, beamMaterial);
      rod(root, [0, 0.39, 0], [x, 1.24, 0.2], 0.006, neural);
    }
  }
  if (id === "phone") {
    const titanium = surface("phone-titanium", 0xb6aa94, 0.22, 0.92);
    for (const half of root.children.filter((c) =>
      c.name.startsWith("phone-"),
    )) {
      for (const [i, w, h, d, r] of [
        [0, 1.08, 2.61, 0.115, 0.14],
        [1, 1.025, 2.54, 0.018, 0.12],
      ]) {
        half.children[i].geometry.dispose();
        half.children[i].geometry = roundedSlab(w, h, d, r);
      }
      const side = half.name === "phone-left" ? -1 : 1;
      for (const mesh of [...half.children])
        if (
          mesh.isMesh &&
          (mesh.material === surface("lens", 0x183948, 0.12, 0.4) ||
            (mesh.geometry.type === "SphereGeometry" && mesh.scale.y === 0.005))
        ) {
          mesh.removeFromParent();
          mesh.geometry.dispose();
        }
      // Polished metal edging, matching the warm frame in the supplied photo.
      const bezel = new T.EdgesGeometry(
        roundedSlab(1.073, 2.6, 0.116, 0.135),
        35,
      );
      const line = new T.LineSegments(
        bezel,
        new T.LineBasicMaterial({
          color: 0xe1d7c4,
          transparent: true,
          opacity: 0.66,
        }),
      );
      line.position.set(side * 0.55, 1.305, 0);
      half.add(line);
      for (const y of [0.08, 2.53]) {
        cyl(half, 0.047, 0.047, 0.065, titanium, 0, y, 0);
        const seam = ring(half, 0.047, 0.004, black(), 0, y, 0);
        seam.rotation.x = Math.PI / 2;
      }
      // Broad dim reflection in the glass, clipped inside the screen boundary.
      const reflection = polygon(
        half,
        [
          [-0.43, 1.08],
          [0.04, 1.08],
          [0.44, 0.17],
          [0.44, -0.31],
        ],
        0.0001,
        new T.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.055,
          depthWrite: false,
        }),
        side * 0.55,
        1.305,
        0.078,
        0,
      );
      reflection.castShadow = false;
      reflection.receiveShadow = false;
      const screen = root.userData.screens.find((s) => s.parent === half);
      if (screen) {
        screen.material.color.set(0x010101);
        screen.material.roughness = 0.095;
        screen.material.metalness = 0;
        screen.material.envMapIntensity = 0.11;
        screen.material.clearcoat = 0.65;
      }
      // Fine antenna gaps, recessed speaker perforations and hinge fasteners.
      for (const y of [0.2, 2.4])
        rounded(
          half,
          0.014,
          0.009,
          0.116,
          surface("phone-antenna-insert", 0xd5caba, 0.82),
          side * 1.094,
          y,
          0,
          0.002,
        );
      for (let j = 0; j < 5; j++)
        ellipsoid(
          half,
          0.006,
          0.003,
          0.013,
          black(),
          side * 0.55 - 0.09 + j * 0.045,
          0.001,
          0.028,
        );
      rounded(
        half,
        0.145,
        0.008,
        0.033,
        black(),
        side * 0.55,
        0.001,
        -0.015,
        0.006,
      );
      for (const y of [0.086, 2.524]) {
        const screw = cyl(
          half,
          0.009,
          0.009,
          0.006,
          steel(),
          side * 0.026,
          y,
          0.038,
          12,
        );
        screw.rotation.x = Math.PI / 2;
        rounded(
          half,
          0.013,
          0.002,
          0.002,
          black(),
          side * 0.026,
          y,
          0.043,
          0.0005,
        );
      }
    }
  }
}
