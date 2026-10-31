# Álvaro’s world

An original procedural Three.js portfolio. Detailed sculptures and characters are authored in `src/detailed-models.js`; scenery and placement live in `src/models.js` and `src/main.js`. No stock 3D assets are used. The supplied images inform the silhouettes, construction details, clothing and materials.

The park and landmarks are 22% larger than the initial version. `src/world-config.js` controls the shared scale for scenery, collision footprints, navigation boundaries, proximity distances and panel anchors. Models use separate paint, metal, rubber, glass, stone, paper and fabric materials, with a procedural studio environment for reflections. Static details are batched by material; interactive screens and animated limbs remain independent.

The reference-detail pass adds aerofoil wing profiles, intake lips, brake rotors, carbon finishes, a tapered bike saddle and derailleur pulleys, fluted Corinthian columns, carved reliefs and construction props, a correctly oriented turbine hall, layered page edges, cortical folds and surface-projected holographic circuits, and phone hinge/port details. Model normalization includes the final sprite bounds to keep the notebook below its information panel. Clothing folds, sneaker seams, backpack buckles and a watch attached to the animated arm refine both characters while preserving the requested solid anime hair.

The guide follows the supplied chibi portrait's large gray eyes, warm skin, navy half-zip top, jeans, white shoes and backpack. Both characters now have a single closed anime-style hair mesh with angular fringe and side points, following the additional hairstyle reference while retaining their chestnut and dark-brown colors. The character rig in `src/character-animation.js` adds a walk cycle, arm swing, head motion, blinking and subtle idle breathing. It responds to real ground movement, so a character standing at a collision remains idle.

`src/atmosphere.js` provides the blue sky, warm sun, drifting clouds, birds and batched perimeter flowers. Cloud and bird motion respects the reduced-motion preference.

For close-up model inspection, open `/tests/model-review.html` on the development server. Browser checks are in `tests/browser.mjs`; model-size and navigation checks run with `npm test`.

The six-section content mapping and editing workflow are documented in `CONTENT_ARCHITECTURE.md`. `/tests/content-review.html` previews all six station panels without moving through the world.

## Run

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm run build
npm test
```

To use the existing preview address, run `npm run dev -- --port 5175 --strictPort` and open `http://localhost:5175/`.

WASD / arrows move, drag rotates, wheel changes camera distance. Touch users have a movement joystick and drag-to-look. Move close to reveal a landmark; nothing happens when you click a sculpture. The circular park boundary and sculpture/garden/bench collisions apply to both characters.

## Content and backend integration

Edit `src/portfolio-data.js` for section copy, groups and entities. `src/content.js` maps the content to the six objects; `src/section-components.js` renders reusable native HTML inside their front panels. Unprovided details stay empty or explicitly marked as hidden placeholders. Related-section buttons ask the existing guide to lead visitors to another station. Optional images and external links can be added through data. CSS3D and WebGL are separate render layers; HTML has no pixel-perfect occlusion behind 3D geometry.

Replace **only `requestCompanionReply(messages)` in `src/backend.js`** with the eventual FastAPI client. It currently returns clearly labeled local demo replies and makes no network calls. Preserve the response contract:

```json
{ "message": "Follow me!", "destination_object_id": "power-plant" }
```

Stable IDs: `f1`, `power-plant`, `library`, `notebook`, `bike`, `phone`. Use `null` for no destination. Unknown destination IDs are ignored; invalid messages show a retryable error. No server, API key, FastAPI implementation, or deployment is included.

The guide follows outside a 6-unit tolerance radius and stops within 4.5 units. Chat opens within 1.5 units (one quarter of the tolerance radius), collapses when you leave, and moves into a three-line scrolling speech bubble while a reply is being typed; the bubble stays for three seconds afterward. Character typing pauses at punctuation and whitespace. Optional synthesized speech chirps only play for letters/numbers after the user enables sound. A* navigation routes the guide around scenery. Messages are session-only; notebook text saves locally when browser storage is available.

The six surrounding scenes are geometry-based transitions, rather than abrupt global biome switches. The phone wakes from its proximity panel’s explicit button. Fonts use Google Fonts with system fallbacks. Reduced-motion preference accelerates typing and removes panel overshoot. The missing `environment/` reference folder was not needed to run the implementation.

## Rendering performance

Opaque stationary scenery is batched by material and shadow state, without
reducing geometry or changing materials. Landmark meshes and their interactive
references remain untouched. Shadow maps retain their original 2048 resolution
and refresh at up to 30 Hz independently of the rendering frame rate. Panel
measurements are invalidated by ResizeObserver and layout results are reused
while the camera, viewport and reveal animation are unchanged. Walking uses
short collision-tested substeps to avoid slowing down at lower frame rates.

`window.portfolio.getPerformance()` exposes read-only render counters and the
number of static mesh submissions removed by batching. These are diagnostics,
not a guarantee of a particular frame rate on every GPU.
