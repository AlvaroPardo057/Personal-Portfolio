import { visibleInOrder, panelCopy } from "./portfolio-data.js";
import {
  cyclingStageScene,
  reactorRoomScene,
} from "./living-station-scenes.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function drawing(markup, viewBox = "0 0 560 270") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("experience-drawing");
  svg.innerHTML = markup;
  return svg;
}
function button(text, className, action) {
  const node = el("button", className, text);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}
function position(node, x, y) {
  node.style.left = x + "%";
  node.style.top = y + "%";
}
export function createStationExperience(section, entities, helpers) {
  const items = visibleInOrder(
    (section.groups || []).flatMap((group) =>
      group.entityIds.map((id) => entities[id]).filter(Boolean),
    ),
  );
  const root = el("div", "station-world world-" + section.id);
  root.tabIndex = 0;
  root.setAttribute("aria-label", section.title + " content");
  const { renderItem, createPersonalNote, panel } = helpers;

  if (section.id === "about-me") {
    const circuit = el("div", "circuit-map");
    circuit.append(
      drawing(`
      <path d="M90 220 Q30 220 40 150 L75 60 Q88 27 137 34 L238 55 Q265 60 288 36 Q315 12 360 30 L478 70 Q535 90 520 140 L492 209 Q480 245 425 227 L326 193 Q300 184 270 218 Q250 245 211 238Z" fill="none" stroke="#f56555" stroke-width="43"/>
      <path d="M90 220 Q30 220 40 150 L75 60 Q88 27 137 34 L238 55 Q265 60 288 36 Q315 12 360 30 L478 70 Q535 90 520 140 L492 209 Q480 245 425 227 L326 193 Q300 184 270 218 Q250 245 211 238Z" fill="none" stroke="#303640" stroke-width="33"/>
      <path d="M90 220 Q30 220 40 150 L75 60 Q88 27 137 34 L238 55 Q265 60 288 36 Q315 12 360 30 L478 70 Q535 90 520 140 L492 209 Q480 245 425 227 L326 193 Q300 184 270 218 Q250 245 211 238Z" fill="none" stroke="#ffffff80" stroke-width="1.5" stroke-dasharray="6 9"/>
      <path d="M132 209v29M137 210v30M142 212v29" stroke="white" stroke-width="2"/>
      <text x="280" y="127" fill="#c2c6cd" text-anchor="middle" font-size="12" letter-spacing="5">CURIOSITY CIRCUIT</text>
      <text x="280" y="151" fill="#777f8a" text-anchor="middle" font-size="10">Choose a stop along the track</text>`),
    );
    const info = el("div", "track-information");
    info.setAttribute("aria-live", "polite");
    const sentences = section.introduction.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [
      section.introduction,
    ];
    const stops = sentences.map((text, index) => ({
      title: ["Curiosity", "Experience", "Growth"][index] || "About me",
      text: text.trim(),
    }));
    for (const item of items) stops.push({ title: "A guiding thought", item });
    const anchors = [
      [15, 24],
      [66, 15],
      [86, 73],
      [37, 85],
    ];
    const controls = [];
    const select = (index) => {
      info.replaceChildren(
        el(
          "span",
          "experience-caption",
          "STOP " + String(index + 1).padStart(2, "0"),
        ),
        el("h3", "", stops[index].title),
      );
      info.append(
        stops[index].item
          ? renderItem(stops[index].item)
          : el("p", "", stops[index].text),
      );
      controls.forEach((control, i) =>
        control.setAttribute("aria-pressed", String(i === index)),
      );
    };
    stops.forEach((stop, index) => {
      const control = button(
        String(index + 1).padStart(2, "0"),
        "track-stop",
        () => select(index),
      );
      control.setAttribute("aria-label", stop.title);
      const anchor = anchors[index % anchors.length];
      position(control, ...anchor);
      circuit.append(control);
      controls.push(control);
    });
    select(0);
    root.append(circuit, info);
  } else if (section.id === "hobbies") {
    panel.classList.add("living-stage");
    root.append(el("p", "stage-introduction", section.introduction));
    const profile = el("div", "stage-profile");
    const peaks = items.map((item, index) => ({
      item,
      x: 14 + index * (72 / Math.max(1, items.length - 1)),
      y: [50, 30, 16][index % 3],
    }));
    profile.append(drawing(cyclingStageScene(peaks), "0 0 560 320"));
    profile.querySelector("svg").setAttribute("preserveAspectRatio", "none");
    peaks.forEach(({ item, x, y }, index) => {
      const summit = el("div", "summit");
      position(summit, x, y);
      summit.append(
        el("span", "summit-flag", String(index + 1).padStart(2, "0")),
        el("strong", "", item.title),
      );
      summit.dataset.entityId = item.id;
      if (item.description) summit.append(el("p", "", item.description));
      profile.append(summit);
    });
    root.append(
      profile,
      el("div", "stage-finish", "START  · · ·  PERSONAL STAGE  · · ·  FINISH"),
    );
  } else if (section.id === "education") {
    const book = el("div", "open-book");
    const left = el("div", "book-page page-left"),
      right = el("div", "book-page page-right");
    left.append(
      el("span", "experience-caption", "LEARNING JOURNEY"),
      el("p", "", section.introduction),
    );
    items.forEach((item, index) =>
      (index % 2 ? right : left).append(renderItem(item)),
    );
    left.append(el("span", "page-number", "01"));
    right.append(el("span", "page-number", "02"));
    book.append(left, right);
    root.append(book);
  } else if (section.id === "projects") {
    root.append(el("p", "library-introduction", section.introduction));
    const shelves = el("div", "library-shelves");
    const shelf = el("div", "project-shelf");
    for (let i = 0; i < 4; i++) {
      const spine = el("span", "decorative-spine");
      spine.setAttribute("aria-hidden", "true");
      spine.style.setProperty("--spine-index", i);
      shelf.append(spine);
    }
    items.forEach((item) => {
      const volume = renderItem(item);
      volume.classList.add("project-volume");
      shelf.append(volume);
    });
    shelves.append(shelf);
    const lower = el("div", "project-shelf lower-shelf");
    lower.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 9; i++) {
      const spine = el("span", "decorative-spine");
      spine.style.setProperty("--spine-index", i);
      lower.append(spine);
    }
    shelves.append(lower);
    root.append(shelves);
  } else if (section.id === "interests") {
    panel.classList.add("living-reactor");
    const chamber = el("div", "reactor-chamber");
    chamber.append(drawing(reactorRoomScene(), "0 0 560 340"));
    const info = el("div", "reactor-readout", section.introduction);
    info.setAttribute("aria-live", "polite");
    items.forEach((item, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / items.length;
      const control = button(item.title, "reactor-node", () => {
        chamber.classList.add("reactor-engaged");
        info.replaceChildren(el("strong", "", item.title));
        if (item.description) info.append(el("p", "", item.description));
        chamber
          .querySelectorAll("button")
          .forEach((other) =>
            other.setAttribute("aria-pressed", String(other === control)),
          );
      });
      control.dataset.entityId = item.id;
      position(control, 50 + Math.cos(angle) * 35, 50 + Math.sin(angle) * 37);
      control.setAttribute("aria-pressed", "false");
      chamber.append(control);
    });
    root.append(chamber, info);
  } else if (section.id === "contact") {
    root.append(el("div", "phone-status", "CONNECTED  ·  ●●●"));
    const screen = el("div", "contact-screen");
    screen.append(
      el("div", "contact-avatar", "AP"),
      el("p", "", section.introduction),
    );
    items.forEach((item) => screen.append(renderItem(item)));
    const wake = button(panelCopy.phoneAction, "phone-action", () => {
      panel.dispatchEvent(new CustomEvent("phone-power", { bubbles: true }));
      wake.textContent = panelCopy.phoneAwake;
      root.classList.add("screen-awake");
    });
    screen.append(wake);
    root.append(screen);
  } else return null;
  return root;
}
