import * as T from "three";

// Flat roof and chamfered flanks, narrowing into the rear coke-bottle shape.
// Unlike an elliptical loft, these sections cannot form cylindrical pods.
export function createClassicSidepodGeometry(side) {
  const sections = [
    [-0.32, 0.18, -0.26, 0.72, 0.24],
    [-0.15, 0.23, -0.29, 0.77, 0.23],
    [0.25, 0.21, -0.29, 0.78, 0.23],
    [0.7, 0.16, -0.28, 0.73, 0.22],
    [1.05, 0.075, -0.26, 0.6, 0.2],
    [1.38, -0.035, -0.23, 0.4, 0.17],
    [1.6, -0.12, -0.21, 0.26, 0.14],
  ];
  const positions = [],
    indices = [];
  for (const [x, top, bottom, outer, inner] of sections) {
    const bevel = Math.min(0.055, (outer - inner) * 0.2);
    for (const [y, z] of [
      [top, inner + bevel],
      [top, outer - bevel],
      [top - bevel, outer],
      [bottom + bevel, outer - 0.035],
      [bottom, outer - 0.035 - bevel],
      [bottom, inner + bevel],
      [bottom + bevel, inner],
      [top - bevel, inner],
    ])
      positions.push(x, y, side * z);
  }
  for (let i = 0; i < sections.length - 1; i++)
    for (let j = 0; j < 8; j++) {
      const a = i * 8 + j,
        b = i * 8 + ((j + 1) % 8);
      indices.push(a, b, a + 8, b, b + 8, a + 8);
    }
  for (let j = 1; j < 7; j++) {
    indices.push(0, j + 1, j);
    const end = (sections.length - 1) * 8;
    indices.push(end, end + j, end + j + 1);
  }
  // Mirroring across the centerline reverses the winding on the left side.
  if (side < 0)
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Classic open-cockpit proportions authored from the user's October reference.
// Negative X is the nose; the original station placement is unchanged.
export function buildClassicF1(root, h) {
  const {
    group,
    add,
    loft,
    rounded,
    ellipsoid,
    cyl,
    rod,
    curve,
    ring,
    polygon,
    surface,
    rubber,
    steel,
  } = h;
  const car = group(root, 0, 0.52);
  car.name = "reference-classic-f1";
  root.userData.vehicleStyle = "classic-open-cockpit";
  const red = surface("classic-f1-red", 0xd80b16, 0.24, 0.18, {
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  });
  const white = surface("classic-f1-white", 0xfffaf0, 0.3, 0.1);
  const dark = surface("classic-f1-carbon", 0x17191c, 0.6, 0.15);
  const groove = surface("classic-f1-tire-groove", 0x080a0b, 0.95);
  rounded(car, 4.3, 0.06, 1.3, dark, 0.05, -0.34, 0, 0.02);

  // Raised slender nose, tapering to a rounded tip above the front wing.
  loft(
    car,
    [
      [-2.48, -0.19, 0.035, 0.065],
      [-2.2, -0.12, 0.055, 0.1],
      [-1.68, 0.04, 0.095, 0.16],
      [-1.1, 0.17, 0.13, 0.21],
      [-0.65, 0.22, 0.16, 0.24],
      [-0.34, 0.23, 0.17, 0.27],
      [0.25, 0.14, 0.19, 0.29],
      [1.5, -0.11, 0.12, 0.2],
    ],
    red,
  );
  for (const side of [-1, 1]) {
    add(car, createClassicSidepodGeometry(side), red).name = "sculpted-sidepod";
    const intake = new T.Shape();
    intake.moveTo(-0.17, -0.08);
    intake.lineTo(0.17, -0.08);
    intake.lineTo(0.17, 0.055);
    intake.quadraticCurveTo(0.17, 0.09, 0.13, 0.09);
    intake.lineTo(-0.13, 0.09);
    intake.quadraticCurveTo(-0.17, 0.09, -0.17, 0.055);
    intake.closePath();
    const inletGeometry = new T.ShapeGeometry(intake, 8);
    inletGeometry.rotateY(-Math.PI / 2);
    add(car, inletGeometry, dark, -0.322, 0.045, side * 0.48);
    // White period-style livery on the sidepod and low turning vane.
    ellipsoid(car, 0.26, 0.2, 0.015, white, 0.52, -0.035, side * 0.759);
    ellipsoid(car, 0.15, 0.14, 0.019, red, 0.52, -0.035, side * 0.773);
    polygon(
      car,
      [
        [-1.17, -0.33],
        [-1.12, -0.13],
        [-0.55, -0.06],
        [-0.29, -0.31],
      ],
      0.035,
      white,
      0,
      0,
      side * 0.62,
      0.008,
    );
    polygon(
      car,
      [
        [0.88, -0.3],
        [1.01, 0.23],
        [1.33, 0.3],
        [1.4, -0.25],
      ],
      0.025,
      red,
      0,
      0,
      side * 0.77,
      0.008,
    );
    rod(car, [-0.62, 0.29, side * 0.23], [-0.7, 0.49, side * 0.54], 0.016, red);
    rounded(car, 0.17, 0.085, 0.11, red, -0.7, 0.51, side * 0.54, 0.025);
    for (const axle of [-1.53, 1.42]) {
      for (const level of [-0.15, 0.06]) {
        rod(
          car,
          [axle - 0.31, level, side * 0.21],
          [axle, -0.035, side * 0.94],
          0.016,
          dark,
        );
        rod(
          car,
          [axle + 0.28, level, side * 0.21],
          [axle, -0.035, side * 0.94],
          0.016,
          dark,
        );
      }
      rod(
        car,
        [axle + 0.2, 0.22, side * 0.2],
        [axle, -0.09, side * 0.94],
        0.013,
        steel(),
      );
    }
  }

  // Empty cockpit: retain the seat and steering wheel, without a driver.
  ellipsoid(car, 0.34, 0.035, 0.23, dark, -0.17, 0.36);
  curve(
    car,
    [
      [-0.49, 0.35, -0.22],
      [-0.15, 0.38, -0.25],
      [0.12, 0.36, -0.2],
      [0.16, 0.36, 0.2],
      [-0.15, 0.38, 0.25],
      [-0.49, 0.35, 0.22],
    ],
    0.025,
    red,
  );
  rounded(car, 0.1, 0.15, 0.24, dark, 0.055, 0.38, 0, 0.025);
  ring(car, 0.09, 0.014, dark, -0.38, 0.36, 0).rotation.y = Math.PI / 2;

  // Tall tapered engine cover, white upper flanks and red airbox.
  loft(
    car,
    [
      [0.25, 0.48, 0.37, 0.19],
      [0.48, 0.56, 0.43, 0.22],
      [0.8, 0.4, 0.35, 0.23],
      [1.2, 0.18, 0.23, 0.2],
      [1.63, -0.02, 0.1, 0.12],
    ],
    red,
  );
  for (const side of [-1, 1])
    polygon(
      car,
      [
        [0.38, 0.61],
        [0.48, 0.97],
        [0.7, 0.9],
        [1.23, 0.44],
        [1.52, 0.18],
        [0.72, 0.28],
      ],
      0.018,
      white,
      0,
      0,
      side * 0.205,
      0.007,
    );
  ellipsoid(car, 0.13, 0.3, 0.17, red, 0.35, 0.83);
  ellipsoid(car, 0.025, 0.15, 0.11, dark, 0.225, 0.87);
  rounded(car, 0.22, 0.035, 0.34, red, 0.33, 1.13, 0, 0.015);

  // Smaller rear wing, scaled around its own mounting position only.
  const rearWing = group(car, 1.95 * 0.2, 0);
  rearWing.scale.set(0.8, 0.72, 0.85);
  rearWing.name = "compact-rear-wing";
  root.userData.driver = false;
  root.userData.sidepodStyle = "flat-roof-tapered";
  for (let i = 0; i < 2; i++) {
    const wing = rounded(
      car,
      0.38,
      0.045,
      2.03,
      i ? white : red,
      -2.12 + i * 0.16,
      -0.32 + i * 0.045,
      0,
      0.018,
    );
    wing.rotation.z = -0.06;
  }
  for (const side of [-1, 1]) {
    polygon(
      car,
      [
        [-2.45, -0.34],
        [-2.44, -0.08],
        [-2.07, -0.02],
        [-1.85, -0.14],
        [-1.87, -0.34],
      ],
      0.03,
      red,
      0,
      0,
      side * 1.02,
      0.01,
    );
    polygon(
      rearWing,
      [
        [1.7, -0.02],
        [1.68, 1.02],
        [2.2, 1.02],
        [2.25, -0.02],
      ],
      0.04,
      red,
      0,
      0,
      side * 0.82,
      0.012,
    );
    rounded(rearWing, 0.48, 0.15, 0.045, white, 1.96, 0.87, side * 0.846, 0.01);
    rod(
      rearWing,
      [1.45, -0.22, side * 0.24],
      [1.89, 0.72, side * 0.24],
      0.025,
      dark,
    );
  }
  rounded(rearWing, 0.53, 0.07, 1.65, white, 1.95, 0.96, 0, 0.025);
  rounded(rearWing, 0.24, 0.06, 1.65, white, 2.1, 0.78, 0, 0.02);
  rounded(rearWing, 0.27, 0.045, 1.5, dark, 1.91, 0.06, 0, 0.015);

  for (const axle of [-1.53, 1.42])
    for (const side of [-1, 1]) {
      const width = axle > 0 ? 0.46 : 0.39;
      const wheel = group(car, axle, -0.02, side * 0.98);
      const tire = add(
        wheel,
        new T.LatheGeometry(
          [
            [0.26, -width / 2],
            [0.38, -width / 2],
            [0.46, -width / 2 + 0.04],
            [0.49, -width / 2 + 0.09],
            [0.49, width / 2 - 0.09],
            [0.46, width / 2 - 0.04],
            [0.38, width / 2],
            [0.26, width / 2],
          ].map((p) => new T.Vector2(...p)),
          48,
        ),
        rubber(),
      );
      tire.rotation.x = Math.PI / 2;
      // Four dark circumferential grooves replace modern coloured tire bands.
      for (let j = 0; j < 4; j++)
        ring(wheel, 0.489, 0.006, groove, 0, 0, (j - 1.5) * 0.048);
      for (const face of [-1, 1]) {
        const z = face * (width / 2 + 0.007);
        const brake = cyl(
          wheel,
          0.3,
          0.3,
          0.018,
          dark,
          0,
          0,
          z - face * 0.035,
          32,
        );
        brake.rotation.x = Math.PI / 2;
        const hub = cyl(wheel, 0.065, 0.065, 0.025, steel(), 0, 0, z, 20);
        hub.rotation.x = Math.PI / 2;
        ring(wheel, 0.32, 0.012, steel(), 0, 0, z);
        ring(wheel, 0.365, 0.007, steel(), 0, 0, z);
        for (let spoke = 0; spoke < 8; spoke++) {
          const a = (spoke * Math.PI) / 4;
          rod(
            wheel,
            [Math.cos(a) * 0.065, Math.sin(a) * 0.065, z],
            [Math.cos(a + 0.1) * 0.31, Math.sin(a + 0.1) * 0.31, z],
            0.017,
            dark,
          );
        }
      }
    }
}
