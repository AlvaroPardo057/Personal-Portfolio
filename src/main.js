import "./style.css";
import "./station-experiences.css";
import "./station-life.css";
import "./interface-palette.css";
import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { WORLD_SCALE } from "./world-config.js";
import { createAtmosphere } from "./atmosphere.js";
import { createParkPlanting } from "./park-planting.js";
import { batchStaticRoot, moveInSteps } from "./render-optimizations.js";
import { enrichStationBackground } from "./station-backgrounds.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
import { landmarks, createPanelContent } from "./content.js";
import { guideCopy } from "./portfolio-data.js";
import { placeDashboard } from "./panel-layout.js";
import {
  box,
  sphere,
  cylinder,
  tree,
  character,
  landmarkModel,
  bar,
  mesh,
} from "./models.js";
import { moveWithCollision, findPath } from "./navigation.js";
import { animateCharacter } from "./character-animation.js";
import { requestCompanionReply, validateReply } from "./backend.js";
const $ = (s) => document.querySelector(s),
  world = $("#world"),
  labels = $("#labels");
const scene = new T.Scene();
scene.background = new T.Color(0x8ed0fa);
scene.fog = new T.Fog(0xa4d8f5, 85, 205);
const camera = new T.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 250);
let renderer;
try {
  renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
} catch {
  world.innerHTML =
    '<p style="padding:25vh 10vw">This little world needs WebGL. Please enable hardware acceleration or try a browser with 3D support.</p>';
  throw new Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
const studio = new RoomEnvironment();
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(studio, 0.04).texture;
scene.environmentIntensity = 0.55;
studio.dispose();
pmrem.dispose();
world.append(renderer.domElement);
const cssScene = new T.Scene(),
  css = new CSS3DRenderer();
css.setSize(innerWidth, innerHeight);
Object.assign(css.domElement.style, {
  position: "absolute",
  inset: "0",
  pointerEvents: "none",
});
world.append(css.domElement);
scene.add(new T.HemisphereLight(0xc9e8ff, 0x88ab63, 1.35));
const sun = new T.DirectionalLight(0xffedd1, 2.7);
sun.position.set(-18, 30, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -39,
  right: 39,
  top: 39,
  bottom: -39,
  far: 90,
});
sun.shadow.normalBias = 0.035;
sun.shadow.bias = -0.0002;
scene.add(sun);
const island = new T.Group();
scene.add(island);
cylinder(island, 19.5, 18.8, 1.4, 0xb7ba91, 0, -0.85);
cylinder(island, 19.6, 19.6, 0.24, 0xdfd9bf, 0, -0.13);
cylinder(island, 18.9, 18.9, 0.14, 0xe6e0c8, 0, 0.01);
cylinder(island, 5, 5, 0.03, 0xeee9d6, 0, 0.1);
// Inlaid rings and radial joints make the concrete plaza feel like a crafted town square.
for (const r of [4.9, 8, 11.6, 18.4]) {
  const ring = mesh(
    island,
    new T.RingGeometry(r, r + 0.035, 128),
    0xc9cbb1,
    0,
    0.095,
  );
  ring.rotation.x = -Math.PI / 2;
}
for (let i = 0; i < 48; i++) {
  const a = (i * Math.PI) / 24;
  bar(
    island,
    [Math.sin(a) * 5, 0.09, Math.cos(a) * 5],
    [Math.sin(a) * 18.5, 0.09, Math.cos(a) * 18.5],
    0.012,
    0xc9cbb1,
  );
}
const obstacles = [],
  places = [];
const water = [];
for (const data of landmarks) {
  const i = data.sceneIndex;
  const x = Math.sin(data.angle) * 12.4,
    z = -Math.cos(data.angle) * 12.4;
  const model = landmarkModel(data.id);
  model.position.set(x, 0.27, z);
  model.rotation.y = -data.angle;
  scene.add(model);
  obstacles.push({ x, z, r: 2.25 });
  cylinder(scene, 2.65, 2.8, 0.2, 0xf3edd7, x, 0.15, z);
  const inset = mesh(
    scene,
    new T.RingGeometry(2.7, 2.84, 64),
    data.color,
    x,
    0.27,
    z,
  );
  inset.rotation.x = -Math.PI / 2;
  const label = document.createElement("div");
  label.className = "landmark-label";
  label.innerHTML = `<strong>${data.title} <span>↗</span></strong>`;
  labels.append(label);
  const pivot = new T.Group();
  pivot.position.set(x, 4.7, z);
  pivot.rotation.y = -data.angle;
  cssScene.add(pivot);
  const faces = [];
  {
    const el = createPanelContent(data),
      obj = new CSS3DObject(el);
    // Keep the dashboard proportional at 90% of its previously enlarged size.
    obj.scale.setScalar(0.0162);
    el.dataset.landmarkId = data.id;
    el.dataset.side = "front";
    obj.position.z = 0.012;
    pivot.add(obj);
    faces.push(obj);
    el.addEventListener("phone-power", () => {
      model.userData.screens?.forEach((s) => {
        s.material.color.set(0x8bcebd);
        s.material.emissive.set(0x4b9989);
        s.material.emissiveIntensity = 0.5;
      });
    });
    el.addEventListener("portfolio-navigate", (event) => {
      begin();
      keys.clear();
      document.activeElement?.blur();
      leadToStation(event.detail.objectId);
    });
  }
  pivot.visible = false;
  const place = {
    ...data,
    x,
    z,
    model,
    pivot,
    faces,
    label,
    progress: 0,
    active: false,
    visited: false,
  };
  places.push(place);
  const biome = new T.Group();
  biome.position.set(
    Math.sin(data.angle) * 18.1,
    0,
    -Math.cos(data.angle) * 18.1,
  );
  biome.rotation.y = -data.angle;
  biome.name = `background-${data.id}`;
  scene.add(biome);
  cylinder(
    biome,
    4.2,
    4.5,
    0.3,
    [0xa3b989, 0xa0bc7e, 0xd5c291, 0xabb58e, 0xc8c49b, 0xacb8a3][i],
    0,
    0.05,
  );
  if (data.id === "f1" || data.id === "phone" || data.id === "notebook") {
    box(
      biome,
      4,
      2.2,
      1.8,
      data.id === "notebook" ? 0xc3b390 : 0xa8b8b4,
      0,
      1.2,
      -1.3,
    );
    box(biome, 4.3, 0.2, 2, 0xe9e5cf, 0, 2.4, -1.3);
    for (let floor = 0; floor < 2; floor++)
      for (let j = 0; j < 6; j++)
        box(
          biome,
          0.4,
          0.55,
          0.03,
          0x648b8e,
          -1.6 + j * 0.64,
          0.8 + floor * 0.85,
          -0.38,
        );
    if (data.id === "notebook") {
      for (const x of [-1.6, 1.6])
        cylinder(biome, 0.18, 0.18, 2.3, 0xe8dcc1, x, 1.3, -0.15);
    }
    tree(biome, -3, 0, 0.85);
    tree(biome, 3, -0.3, 0.85);
  }
  if (data.id === "power-plant" || data.id === "bike") {
    const river = box(biome, 8, 0.07, 1.6, 0x7fb9bc, 0, 0.24, 1);
    water.push(river);
    for (let j = 0; j < 6; j++)
      box(
        biome,
        0.5,
        0.015,
        0.03,
        0xc2e0d3,
        -3 + j * 1.1,
        0.29,
        1 + Math.sin(j) * 0.5,
      );
    tree(biome, -2.8, -1, 1.1, true);
    tree(biome, 3, -1, 1, true);
    if (data.id === "bike")
      for (const x of [-1.5, 1.5]) {
        mesh(biome, new T.ConeGeometry(2, 3, 5), 0x92a28c, x, 1.6, -2.3);
        mesh(biome, new T.ConeGeometry(0.6, 0.9, 5), 0xeeeede, x, 2.75, -2.3);
      }
  }
  if (data.id === "library") {
    for (const x of [-2.7, 2.7]) {
      tree(biome, x, -1, 0.85, true);
      cylinder(biome, 0.25, 0.3, 2.4, 0xe8dab9, x, 1.3, 1);
      box(biome, 0.7, 0.17, 0.65, 0xece0c3, x, 2.55, 1);
    }
    box(biome, 2.8, 0.35, 1, 0xdcc9a0, 0, 0.3, -1);
  }
  enrichStationBackground(biome, data.id);
}
// Six garden pockets soften the transitions between the surrounding neighborhoods.
for (let i = 0; i < 6; i++) {
  const a = (i * Math.PI) / 3 + Math.PI / 6,
    x = Math.sin(a) * 14,
    z = -Math.cos(a) * 14;
  const pocket = new T.Group();
  pocket.position.set(x, 0, z);
  pocket.rotation.y = -a;
  scene.add(pocket);
  cylinder(pocket, 2.2, 2.35, 0.2, 0xb3c68e, 0, 0.12);
  tree(pocket, -0.6, 0, 1);
  tree(pocket, 0.85, -0.5, 0.75);
  obstacles.push({ x, z, r: 1.9 });
  for (let j = 0; j < 9; j++) {
    const q = j * 2.4;
    sphere(
      pocket,
      0.065,
      [0xfff0bb, 0xf2d191, 0xe6a591][j % 3],
      Math.sin(q) * 1.6,
      0.28,
      Math.cos(q) * 1.6,
    );
  }
  const bench = new T.Group();
  bench.position.set(Math.sin(a) * 8.4, 0, -Math.cos(a) * 8.4);
  bench.rotation.y = -a;
  scene.add(bench);
  for (let s = 0; s < 3; s++)
    box(bench, 1.7, 0.09, 0.16, 0xa47d50, 0, 0.55, -0.2 + s * 0.2);
  for (let s = 0; s < 2; s++)
    box(bench, 1.7, 0.16, 0.09, 0xa47d50, 0, 0.86 + s * 0.2, -0.33);
  for (const x of [-0.65, 0.65])
    bar(bench, [x, 0.08, 0], [x, 1.15, -0.35], 0.045, 0x53654e);
  obstacles.push({ x: bench.position.x, z: bench.position.z, r: 0.9 });
}
// Central compass mosaic, kept walkable.
for (let i = 0; i < 8; i++) {
  const a = (i * Math.PI) / 4;
  const tile = mesh(
    scene,
    new T.ConeGeometry(0.18, 1.3, 3),
    i % 2 ? 0xb8c19e : 0x879d75,
    Math.sin(a) * 0.72,
    0.13,
    Math.cos(a) * 0.72,
  );
  tile.rotation.set(Math.PI / 2, 0, -a);
  tile.scale.z = 0.05;
}
createParkPlanting(scene, obstacles);
// Scale only the static town, not lights or avatars. All navigation data and
// independent HTML anchors use the same factor.
for (const object of scene.children) {
  if (object.isLight) continue;
  object.position.multiplyScalar(WORLD_SCALE);
  object.scale.multiplyScalar(WORLD_SCALE);
}
for (const obstacle of obstacles) {
  obstacle.x *= WORLD_SCALE;
  obstacle.z *= WORLD_SCALE;
  obstacle.r *= WORLD_SCALE;
}
for (const place of places) {
  place.x *= WORLD_SCALE;
  place.z *= WORLD_SCALE;
  place.pivot.position.multiplyScalar(WORLD_SCALE);
}
const spinningObjects = [];
scene.traverse((object) => {
  if (object.userData.spin) spinningObjects.push(object);
});
let savedStaticDraws = 0;
for (const root of scene.children) {
  // Landmark meshes already have their own batching and interactive references
  // (e.g. the phone screen). Leave those references and animations untouched.
  if (root.isGroup && !places.some((place) => place.model === root))
    savedStaticDraws += batchStaticRoot(root);
}
const atmosphere = createAtmosphere(scene);
const player = character(false),
  guide = character(true);
scene.add(player, guide);
player.position.set(0, 0.12, 4.5);
guide.position.set(1.2, 0.12, 3.9);
let exploring = false,
  yaw = 0,
  pitch = 0.66,
  zoom = 22,
  drag = null,
  joystick = { x: 0, y: 0 },
  muted = true,
  audioCtx = null;
const keys = new Set(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function begin() {
  exploring = true;
  document.body.classList.add("exploring");
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").style.opacity = 1;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").style.opacity = 0), 3000);
}
$("#explore").onclick = () => {
  begin();
  toast("WASD to wander · Drag to look around");
};
$("#help").onclick = () => {
  $("#help-dialog").showModal();
  keys.clear();
};
$(".close").onclick = () => $("#help-dialog").close();
$("#reset").onclick = () => {
  player.position.set(0, 0.12, 4.5);
  guide.position.set(1.2, 0.12, 3.9);
  guidePath = [];
  destination = null;
  following = false;
  yaw = 0;
  pitch = 0.66;
  $("#help-dialog").close();
};
$("#sound").onclick = () => {
  muted = !muted;
  $("#sound").setAttribute("aria-pressed", String(!muted));
  $("#sound").setAttribute(
    "aria-label",
    muted ? "Enable speaking sounds" : "Mute speaking sounds",
  );
  $("#sound").textContent = muted ? "♫" : "♪";
  if (!muted) {
    audioCtx ??= new AudioContext();
    audioCtx.resume();
  }
  toast(muted ? "Speaking sounds off" : "Speaking sounds on");
};
const isTyping = () =>
  ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) ||
  document.activeElement?.isContentEditable ||
  document.activeElement?.classList.contains("panel-body") ||
  document.activeElement?.classList.contains("station-world") ||
  document.activeElement?.tagName === "SUMMARY";
window.addEventListener("keydown", (e) => {
  if (isTyping() || $("#help-dialog").open) return;
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ].includes(e.key.toLowerCase())
  ) {
    keys.add(e.key.toLowerCase());
    e.preventDefault();
    begin();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
  drag = null;
  joystick = { x: 0, y: 0 };
});
renderer.domElement.addEventListener("pointerdown", (e) => {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (drag?.id !== e.pointerId) return;
  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  yaw -= dx * 0.006;
  pitch = T.MathUtils.clamp(pitch + dy * 0.004, 0.32, 1.05);
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (Math.abs(dx) + Math.abs(dy) > 2) begin();
});
const release = () => (drag = null);
renderer.domElement.addEventListener("pointerup", release);
renderer.domElement.addEventListener("pointercancel", release);
renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    zoom = T.MathUtils.clamp(zoom + e.deltaY * 0.015, 14, 33);
    e.preventDefault();
  },
  { passive: false },
);
const stick = $("#joystick");
let stickId = null;
function setStick(e) {
  const r = stick.getBoundingClientRect(),
    x = e.clientX - r.left - 50,
    y = e.clientY - r.top - 50,
    mag = Math.max(32, Math.hypot(x, y));
  joystick = { x: x / mag, y: y / mag };
  stick.firstElementChild.style.transform = `translate(${joystick.x * 32}px,${joystick.y * 32}px)`;
}
stick.onpointerdown = (e) => {
  stickId = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  setStick(e);
  begin();
};
stick.onpointermove = (e) => {
  if (stickId === e.pointerId) setStick(e);
};
stick.onpointerup = stick.onpointercancel = () => {
  stickId = null;
  joystick = { x: 0, y: 0 };
  stick.firstElementChild.style.transform = "";
};
const chat = document.createElement("div");
chat.className = "chat";
chat.innerHTML =
  '<div class="chat-head">Álvaro <span>YOUR GUIDE · DEMO</span></div><div class="messages" aria-live="polite" aria-label="Conversation"></div><form><input aria-label="Message Álvaro" placeholder="What are you curious about?" maxlength="1000" required><button aria-label="Send message">↗</button></form>';
labels.append(chat);
const bubble = document.createElement("div");
bubble.className = "bubble";
bubble.innerHTML = "<div></div>";
labels.append(bubble);
bubble.hidden = true;
const history = [
  {
    role: "assistant",
    content: guideCopy.greeting,
  },
];
const messages = chat.querySelector(".messages");
function appendMessage(role, text) {
  const el = document.createElement("p");
  el.className = `message ${role}`;
  el.textContent = text;
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}
appendMessage("assistant", history[0].content);
let speaking = false,
  pending = false,
  bubbleUntil = 0,
  guidePath = [],
  destination = null,
  following = false,
  lastPath = 0;
function leadToStation(objectId) {
  const place = places.find((place) => place.id === objectId);
  if (!place) return;
  const target = { x: place.x * 0.72, z: place.z * 0.72 };
  const path = findPath(guide.position, target, obstacles);
  if (
    !path.length &&
    Math.hypot(guide.position.x - target.x, guide.position.z - target.z) > 1.5
  ) {
    toast("Move closer to the plaza and try again.");
    return;
  }
  destination = target;
  guidePath = path;
  toast(`Follow Álvaro to ${place.title}`);
}
function chirp(char) {
  if (muted || !audioCtx || !/[\p{L}\p{N}]/u.test(char)) return;
  const osc = audioCtx.createOscillator(),
    gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 370 + (char.codePointAt(0) % 11) * 28;
  gain.gain.setValueAtTime(0.028, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}
async function speak(text) {
  speaking = true;
  const el = appendMessage("assistant", "");
  bubble.firstChild.textContent = "";
  for (const char of text) {
    el.textContent += char;
    bubble.firstChild.textContent += char;
    messages.scrollTop = messages.scrollHeight;
    bubble.firstChild.scrollTop = bubble.firstChild.scrollHeight;
    chirp(char);
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        reduced
          ? 8
          : /[.!?\n]/.test(char)
            ? 260
            : /[,;:]/.test(char)
              ? 140
              : /\s/.test(char)
                ? 65
                : 28,
      ),
    );
  }
  speaking = false;
  bubbleUntil = performance.now() + 3000;
}
chat.querySelector("form").onsubmit = async (e) => {
  e.preventDefault();
  if (pending) return;
  const input = chat.querySelector("input"),
    value = input.value.trim();
  if (!value) return;
  begin();
  input.value = "";
  history.push({ role: "user", content: value });
  appendMessage("user", value);
  pending = true;
  chat.querySelector("button").disabled = true;
  try {
    const reply = validateReply(await requestCompanionReply([...history]));
    history.push({ role: "assistant", content: reply.message });
    if (reply.destination_object_id) {
      leadToStation(reply.destination_object_id);
    }
    await speak(reply.message);
  } catch (error) {
    appendMessage("assistant", "I couldn’t get a reply. Please try again.");
    console.error(error);
  } finally {
    pending = false;
    chat.querySelector("button").disabled = false;
  }
};
$("#dots").innerHTML = places.map(() => "<span></span>").join("");
function project(position, el, offsetY = 0) {
  const p = position.clone();
  p.y += offsetY;
  p.project(camera);
  let screenX = (p.x * 0.5 + 0.5) * innerWidth;
  let screenY = (-p.y * 0.5 + 0.5) * innerHeight;
  if (el === chat || el === bubble) {
    const halfWidth = (el === chat ? (innerWidth < 700 ? 280 : 320) : 255) / 2;
    screenX = T.MathUtils.clamp(
      screenX,
      halfWidth + 12,
      innerWidth - halfWidth - 12,
    );
    screenY = Math.max(screenY, (el.offsetHeight || 100) + 95);
  }
  el.style.left = `${screenX}px`;
  el.style.top = `${screenY}px`;
  return p.z < 1 && p.z > -1 && Math.abs(p.x) < 1.25 && Math.abs(p.y) < 1.25;
}
const clock = new T.Clock(),
  camTarget = new T.Vector3(),
  desiredCamera = new T.Vector3();
let first = true, nextShadowUpdate = 0, lastDiscoveredCount = -1;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.15),
    time = clock.elapsedTime;
  let mx = 0,
    mz = 0;
  if (!isTyping() && !$("#help-dialog").open) {
    mx =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
      joystick.x;
    mz =
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
      joystick.y;
  }
  const magnitude = Math.max(1, Math.hypot(mx, mz));
  mx /= magnitude;
  mz /= magnitude;
  const dx = (mx * Math.cos(yaw) + mz * Math.sin(yaw)) * 8.4 * dt,
    dz = (-mx * Math.sin(yaw) + mz * Math.cos(yaw)) * 8.4 * dt;
  const previousPlayerX = player.position.x,
    previousPlayerZ = player.position.z;
  moveInSteps(player.position, dx, dz, obstacles, moveWithCollision);
  const playerMoved =
    Math.hypot(
      player.position.x - previousPlayerX,
      player.position.z - previousPlayerZ,
    ) > 0.0001;
  if (mx || mz) player.rotation.y = Math.atan2(dx, dz);
  else if (drag) player.rotation.y = yaw + Math.PI;
  const previousGuideX = guide.position.x,
    previousGuideZ = guide.position.z;
  const distance = guide.position.distanceTo(player.position);
  if (!destination) {
    if (distance > 6) following = true;
    if (distance <= 4.5) {
      following = false;
      guidePath = [];
    }
    if (following && time - lastPath > 0.65) {
      guidePath = findPath(guide.position, player.position, obstacles);
      lastPath = time;
    }
  }
  if (guidePath.length) {
    const target = guidePath[0],
      gx = target.x - guide.position.x,
      gz = target.z - guide.position.z,
      d = Math.hypot(gx, gz);
    if (d < 0.15) guidePath.shift();
    else
      moveWithCollision(
        guide.position,
        (gx / d) * Math.min(d, dt * 3.4),
        (gz / d) * Math.min(d, dt * 3.4),
        obstacles,
      );
  } else {
    if (destination) destination = null;
  }
  animateCharacter(player, time, playerMoved, dt);
  animateCharacter(
    guide,
    time,
    Math.hypot(
      guide.position.x - previousGuideX,
      guide.position.z - previousGuideZ,
    ) > 0.0001,
    dt,
  );
  guide.rotation.y = Math.atan2(
    player.position.x - guide.position.x,
    player.position.z - guide.position.z,
  );
  camTarget.copy(
    exploring
      ? player.position
      : new T.Vector3(innerWidth < 700 ? 0 : -5.5, 0, 0),
  );
  camTarget.y = exploring ? 2.5 : 1.6;
  const distanceCamera = exploring
    ? zoom
    : (innerWidth < 700 ? 115 : 58) * WORLD_SCALE;
  desiredCamera
    .set(
      Math.sin(yaw) * Math.cos(pitch) * distanceCamera,
      Math.sin(pitch) * distanceCamera,
      Math.cos(yaw) * Math.cos(pitch) * distanceCamera,
    )
    .add(camTarget);
  camera.position.lerp(desiredCamera, first ? 1 : 1 - Math.exp(-dt * 3));
  camera.lookAt(camTarget);
  first = false;
  camera.updateMatrixWorld();
  let found = 0;
  // A single nearby station owns the dashboard layer. Keep the current one
  // until another is meaningfully closer to avoid flicker at the boundary.
  const nearest = places.reduce((best, place) => {
    const distance = Math.hypot(player.position.x - place.x, player.position.z - place.z);
    return !best || distance < best.distance ? { place, distance } : best;
  }, null);
  const current = places.find((place) => place.active);
  const currentDistance = current
    ? Math.hypot(player.position.x - current.x, player.position.z - current.z)
    : Infinity;
  const activeStation = current && currentDistance < 6.4 * WORLD_SCALE &&
    currentDistance <= nearest.distance + 0.6 * WORLD_SCALE
    ? current
    : nearest.distance < 5.6 * WORLD_SCALE ? nearest.place : null;
  for (const p of places) {
    p.active = p === activeStation;
    if (p.active && !p.visited) {
      p.visited = true;
      toast(`Discovered · ${p.title}`);
    }
    if (p.visited) found++;
    p.progress = T.MathUtils.damp(p.progress, p.active ? 1 : 0, 7, dt);
    p.pivot.visible = p.active && p.progress > 0.01;
    p.pivot.position.set(p.x, (2.8 + p.progress * 1.25) * WORLD_SCALE, p.z);
    const s = reduced ? p.progress : 1 + Math.sin(p.progress * Math.PI) * 0.15;
    p.pivot.scale.setScalar(Math.max(0.001, p.progress * s));
    if (p.active) {
      placeDashboard(p, camera, innerWidth, innerHeight, WORLD_SCALE);
    }
    for (let i = 0; i < p.faces.length; i++) {
      const face = p.faces[i];
      const normal = new T.Vector3(0, 0, i === 0 ? 1 : -1).applyAxisAngle(
        new T.Vector3(0, 1, 0),
        p.pivot.rotation.y,
      );
      const facing =
        normal.dot(camera.position.clone().sub(p.pivot.position)) > 0;
      face.element.style.pointerEvents = p.active && facing ? "auto" : "none";
      face.element.style.visibility = p.active && facing ? "visible" : "hidden";
      face.element.inert = !p.active || !facing;
    }
    const onScreen = project(
      new T.Vector3(p.x, 0.65, p.z + 2.8 * WORLD_SCALE),
      p.label,
    );
    p.label.style.opacity = onScreen && !p.active ? "1" : "0";
  }
  if (found !== lastDiscoveredCount) {
    $("#count").textContent = `${found} / ${places.length}`;
    [...$("#dots").children].forEach((dot, i) =>
      dot.classList.toggle("found", places[i].visited),
    );
    lastDiscoveredCount = found;
  }
  const chatOnScreen = project(guide.position, chat, 2.35),
    bubbleOnScreen = project(guide.position, bubble, 2.35);
  const close = distance <= 1.5;
  chat.hidden = !exploring || !close || !chatOnScreen;
  chat.inert = chat.hidden;
  bubble.hidden =
    close || !bubbleOnScreen || (!speaking && performance.now() > bubbleUntil);
  if (chat.hidden && chat.contains(document.activeElement))
    document.activeElement.blur();
  for (const object of spinningObjects) object.rotation.y = time * 0.5;
  atmosphere.update(time, camera, reduced);
  if (time >= nextShadowUpdate) {
    renderer.shadowMap.needsUpdate = true;
    nextShadowUpdate = time + 1 / 30;
  }
  renderer.render(scene, camera);
  css.render(cssScene, camera);
}
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  css.setSize(innerWidth, innerHeight);
});
frame();
// Read-only state for lightweight integration checks and embedding diagnostics.
window.portfolio = {
  getPerformance: () => ({
    savedStaticDraws,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    shadowResolution: sun.shadow.mapSize.x,
    pixelRatio: renderer.getPixelRatio(),
  }),
  getState: () => ({
    player: player.position.toArray(),
    guide: guide.position.toArray(),
    visited: places.filter((p) => p.visited).map((p) => p.id),
    speaking,
    destination,
    activePanels: places.filter((p) => p.active).map((p) => p.id),
  }),
};
