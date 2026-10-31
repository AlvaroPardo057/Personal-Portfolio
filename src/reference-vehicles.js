import * as T from "three";

let fiberTexture;
function carbonFinish(material) {
  if (typeof document === "undefined") return;
  if (!fiberTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#777";
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 8)
      for (let x = 0; x < 128; x += 8) {
        const horizontal = (x / 8 + y / 8) % 2 === 0;
        for (let j = 0; j < 4; j++) {
          ctx.fillStyle = j % 2 ? "#8c8c8c" : "#686868";
          ctx.fillRect(
            x + (horizontal ? 0 : j * 2),
            y + (horizontal ? j * 2 : 0),
            horizontal ? 8 : 1,
            horizontal ? 1 : 8,
          );
        }
      }
    fiberTexture = new T.CanvasTexture(canvas);
    fiberTexture.wrapS = fiberTexture.wrapT = T.RepeatWrapping;
    fiberTexture.repeat.set(5, 5);
  }
  material.bumpMap = fiberTexture;
  material.bumpScale = 0.0025;
}

// Vehicle geometry authored from the two September 29 reference images.
export function buildReferenceBike(root, h) {
  const {
    add,
    group,
    rod,
    curve,
    ring,
    cyl,
    ellipsoid,
    rounded,
    polygon,
    surface,
    carbon,
    rubber,
    steel,
  } = h;
  const b = group(root);
  b.name = "reference-triathlon-bike";
  const white = surface("aero-pearl-white", 0xf6f7f5, 0.23, 0.18, {
    clearcoat: 1,
    clearcoatRoughness: 0.2,
  });
  const dark = surface("bike-satin-carbon", 0x24272b, 0.48, 0.25);
  const rim = surface("bike-deep-carbon", 0x32363c, 0.38, 0.35);
  carbonFinish(dark);
  carbonFinish(rim);
  const axle = (parent, r, depth, mat, x, y, z = 0) => {
    const m = cyl(parent, r, r, depth, mat, x, y, z, 64);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const rear = -1.3,
    front = 1.3,
    wy = 0.91;
  for (const x of [rear, front]) {
    ring(b, 0.855, 0.043, rubber(), x, wy, 0);
    for (const side of [-1, 1])
      ring(b, 0.814, 0.008, steel(), x, wy, side * 0.05);
    if (x === rear) {
      axle(b, 0.813, 0.085, dark, x, wy);
      for (const side of [-1, 1])
        for (let j = 0; j < 6; j++) {
          const sector = new T.CircleGeometry(
            0.802,
            18,
            (j * Math.PI) / 3,
            Math.PI / 3,
          );
          const m = add(b, sector, j % 2 ? dark : rim, x, wy, side * 0.044);
          if (side < 0) m.rotation.y = Math.PI;
        }
    } else {
      // An annular deep rim, with an open centre and crossed spokes.
      const profile = [
        [0.635, -0.043],
        [0.66, -0.062],
        [0.8, -0.055],
        [0.82, -0.025],
        [0.82, 0.025],
        [0.8, 0.055],
        [0.66, 0.062],
        [0.635, 0.043],
        [0.635, -0.043],
      ];
      const wheel = add(
        b,
        new T.LatheGeometry(
          profile.map((p) => new T.Vector2(...p)),
          80,
        ),
        rim,
        x,
        wy,
      );
      wheel.rotation.x = Math.PI / 2;
      for (let j = 0; j < 20; j++) {
        const a = (j * Math.PI) / 10,
          side = j % 2 ? 1 : -1;
        rod(
          b,
          [
            x + Math.cos(a + 0.25) * 0.055,
            wy + Math.sin(a + 0.25) * 0.055,
            side * 0.075,
          ],
          [x + Math.cos(a) * 0.648, wy + Math.sin(a) * 0.648, 0],
          0.0045,
          dark,
        );
      }
    }
    axle(b, 0.065, 0.24, steel(), x, wy);
    for (const side of [-1, 1]) axle(b, 0.032, 0.012, dark, x, wy, side * 0.13);
  }
  // A continuous aero frame with a real, rounded triangular opening.
  const frame = new T.Shape();
  frame.moveTo(-0.72, 2.08);
  frame.lineTo(0.7, 2.07);
  frame.quadraticCurveTo(0.89, 2.06, 0.91, 1.8);
  frame.lineTo(0.02, 0.68);
  frame.quadraticCurveTo(-0.09, 0.6, -0.27, 0.68);
  frame.lineTo(-0.49, 1.43);
  frame.quadraticCurveTo(-0.59, 1.58, -0.72, 2.08);
  const opening = new T.Path();
  opening.moveTo(-0.39, 1.91);
  opening.quadraticCurveTo(-0.5, 1.91, -0.45, 1.72);
  opening.lineTo(-0.21, 1.01);
  opening.quadraticCurveTo(-0.18, 0.91, -0.09, 1.01);
  opening.lineTo(0.56, 1.78);
  opening.quadraticCurveTo(0.65, 1.89, 0.49, 1.9);
  opening.lineTo(-0.39, 1.91);
  frame.holes.push(opening);
  const geo = new T.ExtrudeGeometry(frame, {
    depth: 0.17,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 4,
    curveSegments: 20,
  });
  geo.translate(0, 0, -0.085);
  add(b, geo, white);
  for (const s of [-1, 1]) {
    polygon(
      b,
      [
        [-0.51, 1.65],
        [-0.4, 1.42],
        [-1.3, 0.87],
        [-1.34, 0.94],
      ],
      0.045,
      white,
      0,
      0,
      s * 0.105,
      0.017,
    );
    polygon(
      b,
      [
        [-1.32, 0.91],
        [-0.15, 0.7],
        [-0.13, 0.6],
        [-1.31, 0.83],
      ],
      0.055,
      white,
      0,
      0,
      s * 0.11,
      0.018,
    );
    polygon(
      b,
      [
        [0.71, 2.04],
        [0.91, 1.91],
        [1.34, 0.89],
        [1.25, 0.85],
        [0.82, 1.62],
      ],
      0.073,
      white,
      0,
      0,
      s * 0.12,
      0.025,
    );
  }
  polygon(
    b,
    [
      [-0.76, 2.52],
      [-0.56, 2.5],
      [-0.42, 2.04],
      [-0.64, 2.04],
    ],
    0.1,
    dark,
    0,
    0,
    0,
    0.02,
  );
  // Tapered saddle: broad rounded rear, raised tail and a slim long nose.
  const saddle = new T.SphereGeometry(1, 40, 24),
    sv = saddle.attributes.position;
  for (let i = 0; i < sv.count; i++) {
    const x = sv.getX(i),
      y = sv.getY(i),
      z = sv.getZ(i);
    sv.setXYZ(
      i,
      x * 0.36,
      y * 0.042 + 0.018 * Math.max(0, -x),
      z * 0.135 * (1 - 0.52 * Math.max(0, x)),
    );
  }
  saddle.computeVertexNormals();
  add(b, saddle, dark, -0.66, 2.55);
  for (const s of [-1, 1])
    curve(
      b,
      [
        [-0.92, 2.53, s * 0.065],
        [-0.72, 2.43, s * 0.075],
        [-0.45, 2.51, s * 0.055],
      ],
      0.013,
      steel(),
    );
  polygon(
    b,
    [
      [0.66, 2.03],
      [0.83, 2.02],
      [0.9, 2.18],
      [0.65, 2.2],
    ],
    0.19,
    dark,
    0,
    0,
    0,
    0.026,
  );
  for (const s of [-1, 1]) {
    curve(
      b,
      [
        [0.76, 2.16, 0],
        [0.9, 2.12, s * 0.23],
        [1.27, 2.1, s * 0.34],
      ],
      0.039,
      white,
    );
    curve(
      b,
      [
        [1.12, 2.11, s * 0.34],
        [1.38, 2.11, s * 0.34],
        [1.39, 2.02, s * 0.34],
        [1.31, 1.96, s * 0.34],
      ],
      0.032,
      dark,
    );
    curve(
      b,
      [
        [0.7, 2.22, s * 0.12],
        [1.03, 2.24, s * 0.12],
        [1.49, 2.3, s * 0.12],
        [1.61, 2.47, s * 0.12],
      ],
      0.028,
      dark,
    );
    rounded(b, 0.24, 0.055, 0.16, dark, 0.82, 2.3, s * 0.15, 0.025);
    rod(b, [0.82, 2.2, s * 0.15], [0.82, 2.28, s * 0.15], 0.019, steel());
    for (let j = 0; j < 6; j++)
      ring(
        b,
        0.033,
        0.0015,
        steel(),
        1.49 + j * 0.014,
        2.3 + j * 0.02,
        s * 0.12,
      ).rotation.y = Math.PI / 2;
    polygon(
      b,
      [
        [-0.52, 1.73],
        [-0.43, 1.57],
        [-0.33, 1.27],
        [-0.38, 1.48],
      ],
      0.004,
      dark,
      0,
      0,
      s * 0.109,
      0.002,
    );
  }
  const crank = [-0.13, 0.7];
  axle(b, 0.275, 0.042, dark, ...crank, 0.18);
  ring(b, 0.268, 0.009, steel(), ...crank, 0.211);
  for (let j = 0; j < 48; j++) {
    const a = (j * Math.PI) / 24;
    rod(
      b,
      [crank[0] + Math.cos(a) * 0.263, crank[1] + Math.sin(a) * 0.263, 0.21],
      [crank[0] + Math.cos(a) * 0.282, crank[1] + Math.sin(a) * 0.282, 0.21],
      0.006,
      steel(),
    );
  }
  for (let j = 0; j < 6; j++)
    axle(b, 0.125 - j * 0.013, 0.014, steel(), rear, wy, 0.1 + j * 0.017);
  const chainPath = new T.CatmullRomCurve3(
    [
      [-1.3, 1.02, 0.225],
      [-0.13, 0.98, 0.225],
      [0.146, 0.7, 0.225],
      [-0.13, 0.42, 0.225],
      [-1.34, 0.45, 0.225],
      [-1.42, 0.57, 0.225],
      [-1.3, 0.8, 0.225],
    ].map((p) => new T.Vector3(...p)),
    true,
    "centripetal",
  );
  add(b, new T.TubeGeometry(chainPath, 140, 0.009, 5, true), steel());
  for (let i = 0; i < 100; i++) {
    const p = chainPath.getPointAt(i / 100);
    ellipsoid(b, 0.014, 0.011, 0.014, steel(), p.x, p.y, p.z);
  }
  rod(b, [-1.3, 0.84, 0.19], [-1.4, 0.57, 0.22], 0.035, dark);
  for (const [x, y] of [
    [-1.34, 0.74],
    [-1.4, 0.57],
  ]) {
    axle(b, 0.055, 0.035, dark, x, y, 0.22);
    axle(b, 0.018, 0.038, steel(), x, y, 0.225);
    ring(b, 0.051, 0.003, steel(), x, y, 0.241);
  }
  rod(b, [-1.34, 0.74, 0.245], [-1.4, 0.57, 0.245], 0.014, dark);
  for (const s of [-1, 1]) {
    polygon(
      b,
      [
        [crank[0] - 0.034, crank[1] + 0.035],
        [crank[0] + s * 0.33, crank[1] + 0.005],
        [crank[0] + s * 0.33, crank[1] - 0.073],
        [crank[0] - 0.034, crank[1] - 0.035],
      ],
      0.045,
      dark,
      0,
      0,
      s * 0.24,
      0.013,
    );
    rounded(
      b,
      0.12,
      0.055,
      0.17,
      dark,
      crank[0] + s * 0.34,
      crank[1] - 0.035,
      s * 0.3,
      0.015,
    );
    axle(b, 0.033, 0.048, steel(), ...crank, s * 0.24);
    axle(b, 0.023, 0.005, dark, ...crank, s * 0.267);
    axle(
      b,
      0.018,
      0.006,
      steel(),
      crank[0] + s * 0.31,
      crank[1] - 0.035,
      s * 0.267,
    );
  }
}

export function buildReferenceF1(root, h) {
  const {
    add,
    group,
    rounded,
    ellipsoid,
    cyl,
    rod,
    curve,
    ring,
    polygon,
    loft,
    surface,
    paint,
    carbon,
    rubber,
    steel,
  } = h;
  const car = group(root, 0, 0.5);
  car.name = "reference-f1";
  const red = surface("reference-f1-scarlet", 0xd50913, 0.19, 0.3, {
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const graphite = surface("f1-graphite", 0x17191c, 0.4, 0.35),
    silver = surface("f1-silver-livery", 0xe7e6de, 0.28, 0.5);
  carbonFinish(graphite);
  // Long low chassis; exposed suspension connects it to four separate slicks.
  rounded(car, 4.65, 0.065, 1.45, graphite, 0, -0.26, 0, 0.026);
  loft(
    car,
    [
      [-2.43, -0.21, 0.026, 0.065],
      [-2.04, -0.1, 0.045, 0.12],
      [-1.45, 0.1, 0.1, 0.17],
      [-0.87, 0.24, 0.15, 0.25],
      [-0.3, 0.21, 0.125, 0.35],
      [0.3, 0.24, 0.2, 0.34],
      [1.3, 0.06, 0.15, 0.23],
      [1.98, -0.08, 0.06, 0.13],
    ],
    red,
  );
  for (const s of [-1, 1]) {
    const pod = group(car, 0, 0, s * 0.48);
    loft(
      pod,
      [
        [-0.6, 0.09, 0.16, 0.19],
        [-0.35, 0.14, 0.23, 0.3],
        [0.18, 0.11, 0.24, 0.34],
        [0.8, 0.04, 0.2, 0.26],
        [1.39, -0.11, 0.075, 0.1],
      ],
      red,
    );
    ellipsoid(car, 0.028, 0.11, 0.19, graphite, -0.61, 0.11, s * 0.48);
    // Elliptical intake lip and dark duct, facing the nose of the car.
    const intake = new T.Shape();
    intake.absellipse(0, 0, 0.205, 0.12, 0, Math.PI * 2, false, 0);
    const inner = new T.Path();
    inner.absellipse(0, 0, 0.166, 0.088, 0, Math.PI * 2, true, 0);
    intake.holes.push(inner);
    const duct = new T.ExtrudeGeometry(intake, {
      depth: 0.033,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
      bevelSegments: 3,
      curveSegments: 32,
    });
    duct.rotateY(-Math.PI / 2);
    add(car, duct, red, -0.6, 0.11, s * 0.48);
    curve(
      car,
      [
        [-0.38, -0.09, s * 0.77],
        [0.18, -0.19, s * 0.79],
        [0.9, -0.05, s * 0.65],
        [1.37, 0.01, s * 0.51],
      ],
      0.025,
      silver,
    );
    curve(
      car,
      [
        [-0.38, -0.135, s * 0.775],
        [0.18, -0.235, s * 0.79],
        [0.9, -0.095, s * 0.65],
        [1.37, -0.035, s * 0.51],
      ],
      0.012,
      graphite,
    );
    for (const x of [-1.5, 1.43]) {
      for (const y of [-0.13, 0.06])
        for (const offset of [-0.3, 0.25])
          rod(
            car,
            [x + offset, y, s * 0.24],
            [x, -0.035, s * 0.98],
            0.018,
            graphite,
          );
      rod(car, [x + 0.2, 0.23, s * 0.23], [x, -0.11, s * 0.97], 0.016, steel());
    }
    rod(car, [-0.52, 0.35, s * 0.28], [-0.56, 0.47, s * 0.63], 0.018, graphite);
    rounded(car, 0.22, 0.095, 0.13, red, -0.56, 0.49, s * 0.63, 0.035);
    rounded(car, 0.014, 0.064, 0.1, steel(), -0.441, 0.49, s * 0.63, 0.006);
    for (let j = 0; j < 6; j++)
      rounded(
        car,
        0.17,
        0.012,
        0.024,
        graphite,
        0.4 + j * 0.12,
        0.25 - j * 0.028,
        s * 0.63,
        0.006,
      );
    polygon(
      car,
      [
        [-0.72, -0.25],
        [-0.61, -0.06],
        [-0.42, -0.12],
        [-0.4, -0.25],
      ],
      0.018,
      graphite,
      0,
      0,
      s * 0.71,
      0.01,
    );
    polygon(
      car,
      [
        [0.65, -0.27],
        [1.05, -0.08],
        [1.69, -0.12],
        [1.86, -0.27],
      ],
      0.02,
      graphite,
      0,
      0,
      s * 0.55,
      0.009,
    );
    // Front wheel deflector curves around the top of the slick.
    curve(
      car,
      Array.from({ length: 17 }, (_, j) => {
        const a = 0.44 + (j / 16) * 1.54;
        return [
          -1.5 + Math.cos(a) * 0.518,
          -0.02 + Math.sin(a) * 0.518,
          s * 0.93,
        ];
      }),
      0.025,
      graphite,
    );
  }
  // Recessed cockpit opening, seat and the raised halo.
  ellipsoid(car, 0.38, 0.035, 0.255, graphite, -0.22, 0.45);
  curve(
    car,
    [
      [-0.59, 0.425, -0.235],
      [-0.21, 0.43, -0.27],
      [0.12, 0.425, -0.235],
      [0.15, 0.415, 0],
      [0.12, 0.425, 0.235],
      [-0.21, 0.43, 0.27],
      [-0.59, 0.425, 0.235],
    ],
    0.018,
    red,
  );
  rounded(car, 0.15, 0.24, 0.24, graphite, 0.06, 0.48, 0, 0.045);
  curve(
    car,
    [
      [0.12, 0.49, -0.24],
      [0.04, 0.72, -0.28],
      [-0.45, 0.76, -0.26],
      [-0.66, 0.68, 0],
      [-0.45, 0.76, 0.26],
      [0.04, 0.72, 0.28],
      [0.12, 0.49, 0.24],
    ],
    0.034,
    red,
  );
  rod(car, [-0.66, 0.43, 0], [-0.66, 0.68, 0], 0.023, red);
  ring(car, 0.1, 0.017, graphite, -0.44, 0.49, 0).rotation.y = Math.PI / 2;
  loft(
    car,
    [
      [0.16, 0.59, 0.18, 0.18],
      [0.35, 0.68, 0.26, 0.21],
      [0.65, 0.52, 0.27, 0.2],
      [1.08, 0.27, 0.17, 0.13],
      [1.67, 0.07, 0.07, 0.07],
    ],
    red,
  );
  ellipsoid(car, 0.019, 0.105, 0.123, graphite, 0.145, 0.71, 0);
  const intakeLip = ring(car, 0.114, 0.016, red, 0.134, 0.71, 0);
  intakeLip.rotation.y = Math.PI / 2;
  intakeLip.scale.set(1, 0.93, 1.08);
  curve(
    car,
    [
      [0.19, 0.85, 0.04],
      [0.52, 0.88, 0.055],
      [0.86, 0.56, 0.06],
      [1.35, 0.25, 0.045],
      [1.66, 0.14, 0.025],
    ],
    0.018,
    silver,
  );
  rod(car, [0.32, 0.9, 0], [0.32, 1.01, 0], 0.019, graphite);
  rounded(car, 0.16, 0.024, 0.36, graphite, 0.32, 1.025, 0, 0.012);
  // Continuous swept aerofoils, curved across their span.
  function wing(x, y, width, chord, mat, sweep = 0) {
    const section = [
      [-0.5, 0],
      [-0.43, 0.017],
      [-0.26, 0.026],
      [0, 0.023],
      [0.28, 0.011],
      [0.5, -0.007],
      [0.27, -0.014],
      [0, -0.02],
      [-0.27, -0.02],
      [-0.43, -0.012],
    ];
    const count = section.length;
    const positions = [],
      indices = [],
      n = 40;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1,
        z = (u * width) / 2,
        bend = Math.abs(u) ** 2;
      for (const [px, py] of section)
        positions.push(x + px * chord + sweep * bend, y + py + 0.07 * bend, z);
      if (i < n)
        for (let j = 0; j < count; j++) {
          const a = i * count + j,
            b = i * count + ((j + 1) % count);
          indices.push(a, b, a + count, b, b + count, a + count);
        }
    }
    for (let j = 1; j < count - 1; j++)
      indices.push(0, j + 1, j, n * count, n * count + j, n * count + j + 1);
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    add(car, g, mat);
  }
  for (let i = 0; i < 4; i++)
    wing(
      -2.2 + i * 0.14,
      -0.25 + i * 0.045,
      2.3 - i * 0.05,
      0.2,
      i % 2 ? red : graphite,
      0.11,
    );
  for (const s of [-1, 1]) {
    polygon(
      car,
      [
        [-2.5, -0.23],
        [-2.31, 0.24],
        [-1.84, 0.3],
        [-1.94, -0.17],
      ],
      0.045,
      red,
      0,
      0,
      s * 1.12,
      0.018,
    );
    polygon(
      car,
      [
        [1.66, 0.15],
        [1.79, 0.77],
        [2.24, 0.82],
        [2.14, 0.2],
      ],
      0.045,
      red,
      0,
      0,
      s * 0.9,
      0.016,
    );
    curve(
      car,
      [
        [1.43, -0.08, s * 0.24],
        [1.7, 0.2, s * 0.24],
        [1.82, 0.75, s * 0.24],
      ],
      0.034,
      graphite,
    );
    curve(
      car,
      [
        [1.8, 0.69, s * 0.925],
        [2.1, 0.74, s * 0.925],
      ],
      0.015,
      silver,
    );
  }
  wing(1.94, 0.7, 1.85, 0.42, graphite, 0.03);
  wing(2.06, 0.82, 1.86, 0.23, red, 0.035);
  wing(1.8, 0.22, 1.52, 0.28, graphite);
  for (const x of [-1.5, 1.43])
    for (const s of [-1, 1]) {
      const width = x > 0 ? 0.46 : 0.39,
        w = group(car, x, -0.02, s * 1.0);
      const profile = [
        [0.31, -width / 2],
        [0.43, -width / 2 + 0.016],
        [0.49, -width / 2 + 0.075],
        [0.5, -width / 2 + 0.11],
        [0.5, width / 2 - 0.11],
        [0.49, width / 2 - 0.075],
        [0.43, width / 2 - 0.016],
        [0.31, width / 2],
        [0.31, -width / 2],
      ];
      const tire = add(
        w,
        new T.LatheGeometry(
          profile.map((p) => new T.Vector2(...p)),
          72,
        ),
        rubber(),
      );
      tire.rotation.x = Math.PI / 2;
      for (const side of [-1, 1]) {
        const z = side * (width / 2 + 0.006);
        const rotor = cyl(
          w,
          0.288,
          0.288,
          0.018,
          surface("f1-brake-rotor", 0x4a4d50, 0.65, 0.5),
          0,
          0,
          z - side * 0.05,
          48,
        );
        rotor.rotation.x = Math.PI / 2;
        for (let j = 0; j < 20; j++) {
          const a = (j * Math.PI) / 10;
          ellipsoid(
            w,
            0.009,
            0.009,
            0.003,
            graphite,
            Math.cos(a) * 0.253,
            Math.sin(a) * 0.253,
            z - side * 0.038,
          );
        }
        ring(w, 0.403, 0.012, red, 0, 0, z);
        ring(w, 0.32, 0.009, steel(), 0, 0, z + 0.004 * side);
        const hub = cyl(w, 0.071, 0.071, 0.04, steel(), 0, 0, z, 32);
        hub.rotation.x = Math.PI / 2;
        for (let j = 0; j < 10; j++) {
          const a = (j * Math.PI) / 5;
          const spoke = polygon(
            w,
            [
              [Math.cos(a - 0.055) * 0.075, Math.sin(a - 0.055) * 0.075],
              [Math.cos(a + 0.18) * 0.297, Math.sin(a + 0.18) * 0.297],
              [Math.cos(a + 0.28) * 0.297, Math.sin(a + 0.28) * 0.297],
              [Math.cos(a + 0.09) * 0.075, Math.sin(a + 0.09) * 0.075],
            ],
            0.012,
            graphite,
            0,
            0,
            z,
            0.002,
          );
        }
        ring(
          w,
          0.065,
          0.012,
          surface("wheel-lock-gold", 0xb89236, 0.25, 0.75),
          0,
          0,
          z + side * 0.025,
        );
      }
    }
}
