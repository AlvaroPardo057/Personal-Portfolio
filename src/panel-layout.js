import * as T from "three";

const measurements = new WeakMap();
function panelSize(element) {
  let measurement = measurements.get(element);
  if (!measurement) {
    measurement = { dirty: true, width: 0, height: 0 };
    measurements.set(element, measurement);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        measurement.dirty = true;
      });
      observer.observe(element);
    }
  }
  if (measurement.dirty || !measurement.width || !measurement.height) {
    measurement.width = element.offsetWidth;
    measurement.height = element.offsetHeight;
    measurement.dirty = false;
  }
  return measurement;
}

export function placeDashboard(place, camera, width, height, worldScale) {
  const size = panelSize(place.faces[0].element);
  const signature = [
    width,
    height,
    size.width,
    size.height,
    Math.round(place.progress * 10000),
    ...camera.matrixWorld.elements.map((value) => Math.round(value * 10000)),
    ...camera.projectionMatrix.elements,
  ].join(",");
  const cached = place.layoutCache;
  if (cached?.signature === signature) {
    place.pivot.position.copy(cached.position);
    place.pivot.scale.copy(cached.scale);
    return;
  }
  fitPanelToViewport(place, camera, width, height);
  const fittedHeight = place.pivot.position.y;
  liftPanelWithinViewport(place, camera, height, 4.5 * worldScale);
  place.pivot.position.y =
    fittedHeight + (place.pivot.position.y - fittedHeight + 7 * worldScale) / 4;
  place.layoutCache = {
    signature,
    position: place.pivot.position.clone(),
    scale: place.pivot.scale.clone(),
  };
}

// Translate vertically only, limiting the lift before the top leaves the screen.
export function liftPanelWithinViewport(place, camera, height, lift) {
  const face = place.faces[0];
  const { width: w, height: h } = panelSize(face.element);
  if (!w || !h) return;
  const origin = place.pivot.position.y;
  const limit = 1 - 160 / height;
  let low = 0,
    high = lift;
  for (let i = 0; i < 16; i++) {
    const amount = (low + high) / 2;
    place.pivot.position.y = origin + amount;
    face.updateWorldMatrix(true, false);
    const top = Math.max(
      ...[-w / 2, w / 2].map(
        (x) =>
          new T.Vector3(x, h / 2, 0)
            .applyMatrix4(face.matrixWorld)
            .project(camera).y,
      ),
    );
    if (top <= limit) low = amount;
    else high = amount;
  }
  place.pivot.position.y = origin + low;
}

// Keep larger content panels inside the viewport while retaining their world
// orientation and their existing proximity animation. No billboard or modal.
export function fitPanelToViewport(place, camera, width, height) {
  const face = place.faces[0];
  const { width: w, height: h } = panelSize(face.element);
  if (!w || !h || place.progress < 0.05) return;
  const top = 1 - (2 * (width < 700 ? 100 : 100)) / height;
  const bottom = -1 + (2 * (width < 700 ? 150 : 95)) / height;
  const side = 1 - 36 / width;
  const corners = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [-w / 2, h / 2],
    [w / 2, h / 2],
  ];
  const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  function bounds() {
    face.updateWorldMatrix(true, false);
    const projected = corners.map(([x, y]) =>
      new T.Vector3(x, y, 0).applyMatrix4(face.matrixWorld).project(camera),
    );
    return {
      minX: Math.min(...projected.map((p) => p.x)),
      maxX: Math.max(...projected.map((p) => p.x)),
      minY: Math.min(...projected.map((p) => p.y)),
      maxY: Math.max(...projected.map((p) => p.y)),
    };
  }
  let box = bounds();
  const fit = Math.min(
    1,
    (2 * side) / (box.maxX - box.minX),
    (top - bottom) / (box.maxY - box.minY),
  );
  if (!Number.isFinite(fit) || fit <= 0) return;
  place.pivot.scale.multiplyScalar(fit);
  // Camera-plane translations have no depth change, so projection is linear.
  box = bounds();
  const center = new T.Vector3().setFromMatrixPosition(face.matrixWorld);
  const projected = center.clone().project(camera);
  const dx = center.clone().add(right).project(camera).x - projected.x;
  const dy = center.clone().add(up).project(camera).y - projected.y;
  const shiftX =
    box.minX < -side ? -side - box.minX : box.maxX > side ? side - box.maxX : 0;
  const shiftY =
    box.maxY > top ? top - box.maxY : box.minY < bottom ? bottom - box.minY : 0;
  if (Math.abs(dx) > 0.0001)
    place.pivot.position.addScaledVector(right, shiftX / dx);
  if (Math.abs(dy) > 0.0001)
    place.pivot.position.addScaledVector(up, shiftY / dy);
}
