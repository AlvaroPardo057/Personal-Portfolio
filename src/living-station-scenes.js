let sceneNumber = 0;
const reducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

// Interpolating curves keep every hobby anchored to its actual mountain summit.
function curve(points) {
  let path = "M" + points[0].join(" ");
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[i];
    const c = points[i + 1],
      d = points[Math.min(points.length - 1, i + 2)];
    path +=
      " C" +
      [
        b[0] + (c[0] - a[0]) * 0.14,
        b[1] + (c[1] - a[1]) * 0.14,
        c[0] - (d[0] - b[0]) * 0.14,
        c[1] - (d[1] - b[1]) * 0.14,
        c[0],
        c[1],
      ].join(" ");
  }
  return path;
}
export function cyclingStageScene(peaks) {
  const id = "stage-" + ++sceneNumber;
  const points = [[0, 269]];
  peaks.forEach(({ x, y }, i) => {
    points.push([x * 5.6, y * 3.2]);
    points.push([Math.min(540, (x + 12) * 5.6), 253 - i * 8]);
  });
  points.push([560, 265]);
  const road = curve(points);
  const forest = [];
  for (let i = 0; i < 42; i++) {
    const segment = 1 + (i % (points.length - 2));
    const from = points[segment],
      to = points[segment + 1];
    const t = 0.18 + (Math.floor(i / (points.length - 2)) % 4) * 0.2;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t + 27 + (i % 3) * 9;
    const size = 8 + (i % 5);
    if (y > 307) continue;
    forest.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M0 0v5" stroke="#6a6447" stroke-width="1.4"/><path d="M0-${size}L-${size * 0.4} 0H${size * 0.4}Z" fill="${["#315f47", "#3e7851", "#61925a"][i % 3]}"/><path d="M0-${size * 0.65}L-${size * 0.49} 3H${size * 0.49}Z" fill="${["#3c7650", "#4d8755", "#7aa36a"][i % 3]}"/></g>`,
    );
  }
  const faces = peaks
    .map(
      ({ x, y }, i) =>
        `<path d="M${x * 5.6} ${y * 3.2} L${Math.min(560, (x + 12) * 5.6)} ${253 - i * 8} L${x * 5.6 + 10} 320Z" fill="#183f3e" opacity=".16"/>`,
    )
    .join("");
  const ride = reducedMotion() ? `transform="translate(20 265)"` : "";
  const motion = reducedMotion()
    ? ""
    : `<animateMotion dur="30s" repeatCount="indefinite" path="${road}" rotate="auto"/>`;
  return `
    <defs>
      <linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="#8dcbe7"/><stop offset=".7" stop-color="#d8edf0"/><stop offset="1" stop-color="#ecf2e5"/></linearGradient>
      <linearGradient id="${id}-land" x2=".4" y2="1"><stop stop-color="#a6bd75"/><stop offset=".5" stop-color="#71a46c"/><stop offset="1" stop-color="#3c7c62"/></linearGradient>
      <linearGradient id="${id}-distance" x2="0" y2="1"><stop stop-color="#8faec1"/><stop offset="1" stop-color="#bad0ce"/></linearGradient>
      <filter id="${id}-terrain"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="6" result="grain"/><feColorMatrix in="grain" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in" result="texture"/><feBlend in="SourceGraphic" in2="texture" mode="soft-light"/></filter>
    </defs>
    <rect width="560" height="320" fill="url(#${id}-sky)"/>
    <circle cx="65" cy="47" r="24" fill="#fff5d5" opacity=".75"/>
    <g class="stage-clouds" fill="white" opacity=".64">
      <ellipse cx="146" cy="40" rx="28" ry="7"/><ellipse cx="130" cy="36" rx="13" ry="10"/><ellipse cx="149" cy="34" rx="16" ry="11"/>
      <ellipse cx="414" cy="58" rx="34" ry="6"/><ellipse cx="398" cy="53" rx="16" ry="10"/><ellipse cx="420" cy="50" rx="18" ry="12"/>
    </g>
    <path d="M0 194L43 128 66 154 104 101 137 147 170 116 201 165 237 122 270 158 311 97 337 132 374 83 409 133 441 104 490 160 521 124 560 167V320H0Z" fill="url(#${id}-distance)" opacity=".68"/>
    <path d="M0 232Q42 175 95 205T189 213T280 196T380 185T478 205T560 178V320H0Z" fill="#8cafa0" opacity=".65"/>
    <path d="${road} L560 320H0Z" fill="url(#${id}-land)" filter="url(#${id}-terrain)"/>
    ${faces}
    ${forest.join("")}
    <path d="${road}" fill="none" stroke="#e8dcc0" stroke-width="10" stroke-linejoin="round"/>
    <path d="${road}" fill="none" stroke="#63736e" stroke-width="6.3" stroke-linejoin="round"/>
    <path class="stage-road-marking" d="${road}" fill="none" stroke="#f9f1d8" stroke-width=".9" stroke-dasharray="5 8"/>
    <g class="cycling-rider" ${ride}>
      ${motion}
      <circle cx="-5" cy="-4" r="3.4" fill="#c8ddd7" stroke="#25483c" stroke-width="1.2"/>
      <circle cx="6" cy="-4" r="3.4" fill="#c8ddd7" stroke="#25483c" stroke-width="1.2"/>
      <path d="M-5-4L-1-11 2-4H-5L0-8 6-4 3-12" fill="none" stroke="#efb549" stroke-width="1.2"/>
      <path d="M-1-13L3-15 6-12 3-10" fill="none" stroke="#e36d4e" stroke-width="2.8"/>
      <path d="M0-12L-2-8 2-5M5-12L7-10" fill="none" stroke="#324c48" stroke-width="1.5"/>
      <circle cx="4" cy="-18" r="2.2" fill="#f1cfaa"/><path d="M1-19q3-4 6 0" fill="#e59c3c"/>
    </g>
    <g class="stage-birds" fill="none" stroke="#628b9d" stroke-width="1.4" stroke-linecap="round"><path d="M208 39q5-5 10 0q5-5 10 0M344 29q4-4 8 0q4-4 8 0"/></g>`;
}

export function reactorRoomScene() {
  const id = "reactor-" + ++sceneNumber;
  const pipes = [52, 91, 469, 508]
    .map(
      (x, i) => `
    <path d="M${x} 0V${98 + (i % 2) * 26}Q${x} 140 ${x + (i < 2 ? 18 : -18)} 140V238" fill="none" stroke="#172f39" stroke-width="15"/>
    <path class="reactor-pipe-flow" d="M${x} 0V${98 + (i % 2) * 26}Q${x} 140 ${x + (i < 2 ? 18 : -18)} 140V238" fill="none" stroke="${i % 2 ? "#7b9d9d" : "#ae945d"}" stroke-width="8"/>
    <path d="M${x - 7} 42h14M${x - 7} 80h14" stroke="#d1b678" stroke-width="3"/>`,
    )
    .join("");
  const posts = [140, 187, 233, 280, 327, 373, 420]
    .map((x) => `<path d="M${x} 276v29" stroke="#c5a764" stroke-width="3"/>`)
    .join("");
  const consoles = [0, 1]
    .map(
      (side) => `<g transform="${side ? "translate(560 0) scale(-1 1)" : ""}">
    <path d="M17 220L118 210 151 246 33 261Z" fill="#507177" stroke="#90b0ae" stroke-width="1.5"/>
    <path d="M33 261L151 246V307L33 325Z" fill="#24424d" stroke="#385862"/>
    <path d="M30 221L110 217 129 239 42 249Z" fill="#0c2833" stroke="#739c9d"/>
    <path class="reactor-monitor-trace" d="M42 235l11-2 4-6 7 12 5-10 5 6 14-3 16 1" fill="none" stroke="#70d8ca" stroke-width="1.5"/>
    <path d="M51 259l64-9M51 266l64-9" stroke="#758d90" stroke-width="2"/>
    <circle class="reactor-status-light" cx="61" cy="286" r="3" fill="#e6bc65"/><circle cx="76" cy="283" r="3" fill="#78b9a8"/>
  </g>`,
    )
    .join("");
  return `
    <defs>
      <linearGradient id="${id}-wall" x2="0" y2="1"><stop stop-color="#183947"/><stop offset="1" stop-color="#28525b"/></linearGradient>
      <linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#31545e"/><stop offset="1" stop-color="#102c38"/></linearGradient>
      <linearGradient id="${id}-glass"><stop stop-color="#6fd4cc" stop-opacity=".3"/><stop offset=".4" stop-color="#9ef1db" stop-opacity=".12"/><stop offset="1" stop-color="#3ea5aa" stop-opacity=".4"/></linearGradient>
      <linearGradient id="${id}-beam"><stop stop-color="#4bc0bb" stop-opacity=".1"/><stop offset=".5" stop-color="#a7eed5"/><stop offset="1" stop-color="#4bc0bb" stop-opacity=".1"/></linearGradient>
      <radialGradient id="${id}-glow"><stop stop-color="#91f1d8" stop-opacity=".35"/><stop offset="1" stop-color="#91f1d8" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="560" height="340" rx="18" fill="url(#${id}-wall)"/>
    <path d="M0 78H560M0 161H560M150 0V220M410 0V220" stroke="#47707a" opacity=".4"/>
    <path d="M0 223H560V340H0Z" fill="url(#${id}-floor)"/>
    <path d="M280 222L0 340M280 222L100 340M280 222L460 340M280 222L560 340M0 254H560M0 289H560M0 327H560" stroke="#54727a" opacity=".35"/>
    ${pipes}
    <path d="M0 204H180M380 204H560" stroke="#b69c62" stroke-width="3"/>
    <ellipse cx="280" cy="206" rx="115" ry="112" fill="url(#${id}-glow)" class="reactor-aura"/>
    <ellipse cx="280" cy="278" rx="106" ry="29" fill="#102c37" stroke="#729092" stroke-width="2"/>
    <path d="M174 266v12q106 55 212 0v-12" fill="#355b64" stroke="#90a8a6"/>
    <ellipse cx="280" cy="265" rx="106" ry="28" fill="#426b71" stroke="#8bb4af" stroke-width="2"/>
    <path d="M217 196C217 151 239 126 280 115C321 126 343 151 343 196V240Q280 272 217 240Z" fill="url(#${id}-glass)" stroke="#8edbd0" stroke-width="2"/>
    <path d="M221 176Q280 149 339 176M218 224Q280 251 342 224M280 118C239 144 236 214 252 249M280 118C321 144 324 214 308 249" stroke="#7fccc4" fill="none" stroke-width="1.5"/>
    <ellipse cx="280" cy="119" rx="15" ry="6" fill="#366d73" stroke="#a4dcd1" stroke-width="2"/>
    <ellipse cx="280" cy="249" rx="62" ry="16" fill="#3b8888" stroke="#a4dcd1" stroke-width="2"/>
    <rect class="reactor-beam" x="267" y="131" width="26" height="118" rx="12" fill="url(#${id}-beam)"/>
    <path d="M245 145Q224 179 232 224" fill="none" stroke="#e0fff2" opacity=".43" stroke-width="3" stroke-linecap="round"/>
    <g class="reactor-particles" fill="#c2ffe9">
      <circle cx="272" cy="243" r="2" style="--particle-delay:0s"/>
      <circle cx="287" cy="243" r="1.7" style="--particle-delay:-1.3s"/>
      <circle cx="277" cy="243" r="1.5" style="--particle-delay:-2.6s"/>
      <circle cx="290" cy="243" r="2" style="--particle-delay:-3.8s"/>
    </g>
    <path class="reactor-energy" d="M280 119V39M240 181H111M320 181H449" stroke="#71cfc3" stroke-width="2" fill="none" stroke-dasharray="4 9" opacity=".7"/>
    <ellipse cx="280" cy="268" rx="145" ry="40" fill="none" stroke="#c5a764" stroke-width="3"/>
    ${posts}
    <path d="M135 279Q280 353 425 279" fill="none" stroke="#e1be74" stroke-width="3"/>
    ${consoles}
    <path d="M208 22h144M215 28h130" stroke="#9bad9e" stroke-width="2" stroke-linecap="round" opacity=".5"/>
  `;
}
