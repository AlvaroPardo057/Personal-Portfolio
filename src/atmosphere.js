import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Decorative life stays outside the navigable plaza; no invisible obstacles.
export function createAtmosphere(scene) {
  const sky = new T.Mesh(
    new T.SphereGeometry(230, 32, 20),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 direction; void main(){float h=normalize(direction).y;vec3 low=vec3(.55,.82,.98);vec3 high=vec3(.10,.48,.88);gl_FragColor=vec4(mix(low,high,smoothstep(-.65,.85,h)),1.);}",
    }),
  );
  sky.renderOrder = -10;
  scene.add(sky);
  const white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  const cloudGeometry = new T.SphereGeometry(1, 12, 8);
  const clouds = [];
  for (let i = 0; i < 15; i++) {
    const cloud = new T.Group();
    const angle = (i * Math.PI * 2) / 15;
    cloud.position.set(
      Math.cos(angle) * (48 + (i % 3) * 9),
      9 + (i % 4) * 4,
      Math.sin(angle) * (48 + (i % 3) * 9),
    );
    for (let j = 0; j < 5; j++) {
      const puff = new T.Mesh(cloudGeometry, white);
      puff.position.set(
        (j - 2) * 2.1,
        Math.sin(j * 1.8) * 0.6,
        Math.cos(j) * 0.6,
      );
      puff.scale.set(2.8, 1.5 + (j % 3) * 0.5, 2);
      cloud.add(puff);
    }
    scene.add(cloud);
    clouds.push({ cloud, x: cloud.position.x });
  }
  const sun = new T.Mesh(
    new T.SphereGeometry(4, 24, 16),
    new T.MeshBasicMaterial({ color: 0xfff5cd, fog: false }),
  );
  sun.position.set(-48, 42, -65);
  scene.add(sun);
  const flowers = new T.Group();
  scene.add(flowers);
  const petals = [0xffcf49, 0xf98ab5, 0xad8bff, 0xffffff].map(
    (color) => new T.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  const stemMaterial = new T.MeshStandardMaterial({ color: 0x438a42 });
  const stemGeometry = new T.CylinderGeometry(0.025, 0.035, 0.32, 5);
  const petalGeometry = new T.SphereGeometry(0.09, 7, 5);
  for (let i = 0; i < 130; i++) {
    const angle = i * 2.399963,
      radius = 22.7 + Math.sin(i * 5.1) * 0.65;
    const x = Math.cos(angle) * radius,
      z = Math.sin(angle) * radius;
    const stem = new T.Mesh(stemGeometry, stemMaterial);
    stem.position.set(x, 0.26, z);
    flowers.add(stem);
    for (let j = 0; j < 5; j++) {
      const petal = new T.Mesh(petalGeometry, petals[i % 4]);
      petal.scale.set(1, 0.42, 1);
      petal.position.set(
        x + Math.cos(j * 1.257) * 0.1,
        0.43,
        z + Math.sin(j * 1.257) * 0.1,
      );
      flowers.add(petal);
    }
  }
  // Batch the flower bed into five draws instead of hundreds on mobile.
  flowers.updateMatrixWorld(true);
  const batches = new Map();
  for (const flower of flowers.children) {
    if (!batches.has(flower.material)) batches.set(flower.material, []);
    batches
      .get(flower.material)
      .push(flower.geometry.clone().applyMatrix4(flower.matrixWorld));
  }
  flowers.clear();
  for (const [material, geometries] of batches) {
    flowers.add(new T.Mesh(mergeGeometries(geometries), material));
    geometries.forEach((geometry) => geometry.dispose());
  }
  stemGeometry.dispose();
  petalGeometry.dispose();
  const birds = [];
  const birdMaterial = new T.MeshStandardMaterial({
    color: 0x375267,
    roughness: 0.85,
    side: T.DoubleSide,
  });
  const wingGeometry = new T.BufferGeometry();
  wingGeometry.setAttribute(
    "position",
    new T.Float32BufferAttribute([0, 0, 0, 0.65, 0, -0.18, 0.25, 0, 0.17], 3),
  );
  wingGeometry.computeVertexNormals();
  for (let i = 0; i < 7; i++) {
    const bird = new T.Group(),
      wings = [];
    for (const side of [-1, 1]) {
      const wing = new T.Mesh(wingGeometry, birdMaterial);
      wing.scale.x = side;
      bird.add(wing);
      wings.push(wing);
    }
    scene.add(bird);
    birds.push({ bird, wings });
  }
  return {
    update(time, camera, reduced = false) {
      sky.position.copy(camera.position);
      const t = reduced ? 0 : time;
      clouds.forEach(({ cloud, x }, i) => {
        cloud.position.x = x + Math.sin(t * 0.025 + i) * 3;
      });
      birds.forEach(({ bird, wings }, i) => {
        const a = t * 0.075 + i * 0.65;
        bird.position.set(
          Math.cos(a) * (28 + i),
          10 + i * 0.7,
          Math.sin(a) * (28 + i),
        );
        bird.rotation.y = -a;
        wings.forEach((wing, j) => {
          wing.rotation.z = (j ? 1 : -1) * Math.sin(t * 5 + i) * 0.45;
        });
      });
    },
  };
}
