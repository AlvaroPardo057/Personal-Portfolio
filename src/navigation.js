import { WORLD_SCALE } from './world-config.js';
export const PARK_RADIUS = 18.4 * WORLD_SCALE;
export function permitted(x, z, obstacles, margin = 0.42) {
  return (
    Math.hypot(x, z) < PARK_RADIUS - margin &&
    !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + margin)
  );
}
export function moveWithCollision(position, dx, dz, obstacles) {
  if (permitted(position.x + dx, position.z + dz, obstacles)) {
    position.x += dx;
    position.z += dz;
  } else {
    if (permitted(position.x + dx, position.z, obstacles)) position.x += dx;
    if (permitted(position.x, position.z + dz, obstacles)) position.z += dz;
  }
}
// Grid A* keeps the companion on the same walkable park surface as the visitor.
export function findPath(start, target, obstacles) {
  const cell = 0.7,
    key = (x, z) => `${x},${z}`,
    sx = Math.round(start.x / cell),
    sz = Math.round(start.z / cell),
    tx = Math.round(target.x / cell),
    tz = Math.round(target.z / cell);
  const open = [{ x: sx, z: sz, g: 0, f: 0 }],
    nodes = new Map(),
    closed = new Set();
  nodes.set(key(sx, sz), open[0]);
  let end = null;
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const n = open.shift(),
      k = key(n.x, n.z);
    if (closed.has(k)) continue;
    closed.add(k);
    if (Math.hypot(n.x - tx, n.z - tz) <= 1) {
      end = n;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const x = n.x + dx,
        z = n.z + dz,
        nk = key(x, z);
      if (closed.has(nk) || !permitted(x * cell, z * cell, obstacles, 0.65))
        continue;
      if (
        dx &&
        dz &&
        (!permitted((n.x + dx) * cell, n.z * cell, obstacles, 0.65) ||
          !permitted(n.x * cell, (n.z + dz) * cell, obstacles, 0.65))
      )
        continue;
      const g = n.g + Math.hypot(dx, dz);
      if (nodes.has(nk) && nodes.get(nk).g <= g) continue;
      const next = { x, z, g, f: g + Math.hypot(x - tx, z - tz), parent: n };
      nodes.set(nk, next);
      open.push(next);
    }
  }
  const path = [];
  while (end?.parent) {
    path.unshift({ x: end.x * cell, z: end.z * cell });
    end = end.parent;
  }
  return path;
}
