import {
  portfolioEntities,
  portfolioSections,
  panelCopy,
  visibleInOrder,
  getStationNeighbors,
} from "./portfolio-data.js";
import { createStationExperience } from "./station-experiences.js";

// Native DOM components remain interactive in the existing CSS3D panels.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function externalLink(link) {
  if (link.visible === false || !link.url) return null;
  let url;
  try {
    url = new URL(link.url);
  } catch {
    return null;
  }
  if (!["https:", "http:", "mailto:"].includes(url.protocol)) return null;
  const anchor = element("a", "content-link", link.title || url.hostname);
  anchor.href = url.href;
  if (link.newTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  return anchor;
}
function supportingContent(node, item) {
  for (const image of visibleInOrder(item.images || [])) {
    if (!image.src || !image.alt) continue;
    const img = element("img", "content-image");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = "lazy";
    node.append(img);
  }
  const links = element("div", "content-links");
  for (const link of visibleInOrder(item.links || [])) {
    const anchor = externalLink(link);
    if (anchor) links.append(anchor);
  }
  if (links.childElementCount) node.append(links);
}
function card(item) {
  const node = element("article", `content-card content-${item.type}`);
  node.dataset.entityId = item.id;
  if (item.isPlaceholder)
    node.append(element("span", "content-meta", panelCopy.placeholderLabel));
  if (item.status) node.append(element("span", "content-status", item.status));
  node.append(element("h4", "", item.title));
  if (item.subtitle)
    node.append(element("p", "content-subtitle", item.subtitle));
  const info = [item.category, item.period || item.date].filter(Boolean);
  if (info.length) node.append(element("p", "content-meta", info.join(" · ")));
  if (item.description) node.append(element("p", "", item.description));
  supportingContent(node, item);
  return node;
}
const renderers = {
  quote(item) {
    const node = element("figure", "content-quote");
    node.dataset.entityId = item.id;
    node.append(element("blockquote", "", `“${item.text}”`));
    if (item.attribution)
      node.append(element("figcaption", "", item.attribution));
    supportingContent(node, item);
    return node;
  },
  topic(item) {
    const node = element("li", "content-topic");
    node.dataset.entityId = item.id;
    node.append(element("span", "", item.title));
    if (item.description) node.append(element("p", "", item.description));
    supportingContent(node, item);
    return node;
  },
  project: card,
  education: card,
  contact: card,
  paragraph(item) {
    const node = element("div", "content-paragraph");
    node.dataset.entityId = item.id;
    if (item.title) node.append(element("h4", "", item.title));
    if (item.description) node.append(element("p", "", item.description));
    supportingContent(node, item);
    return node;
  },
};
function contentGroup(group, entities) {
  const items = visibleInOrder(
    group.entityIds.map((id) => entities[id]).filter(Boolean),
  );
  if (!items.length) return null;
  const listLayout = ["list", "tiles", "route"].includes(group.layout);
  const node = element("section", "content-group");
  node.dataset.groupId = group.id;
  if (group.title) node.append(element("h3", "", group.title));
  const list = element(
    listLayout ? "ul" : "div",
    `content-items content-${group.layout || "stack"}`,
  );
  for (const item of items) {
    const view = (renderers[item.type] || card)(item);
    if (listLayout && view.tagName !== "LI") {
      const li = element("li");
      li.append(view);
      list.append(li);
    } else if (!listLayout && view.tagName === "LI") {
      const ul = element("ul", "content-list");
      ul.append(view);
      list.append(ul);
    } else list.append(view);
  }
  node.append(list);
  return node;
}
function createPersonalNote() {
  const box = element("div", "personal-note"),
    label = element("label", "", panelCopy.noteLabel),
    note = element("textarea");
  note.id = "education-personal-note";
  label.htmlFor = note.id;
  note.placeholder = panelCopy.notePlaceholder;
  try {
    note.value = localStorage.getItem("portfolio-note") || "";
  } catch {}
  note.addEventListener("input", () => {
    try {
      localStorage.setItem("portfolio-note", note.value);
    } catch {}
  });
  box.append(
    label,
    note,
    element("small", "content-meta", panelCopy.notePrivacy),
  );
  return box;
}
export function createSectionPanel(
  section,
  { entities = portfolioEntities, sections = portfolioSections } = {},
) {
  const panel = element("section", "panel station-experience");
  panel.dataset.sectionId = section.id;
  panel.dataset.objectId = section.objectId;
  const headingId = `section-${section.id}-title`;
  panel.setAttribute("aria-labelledby", headingId);
  const header = element("header", "panel-header"),
    title = element("h2", "", section.title);
  title.id = headingId;
  const sectionIndex = visibleInOrder(sections).findIndex(
    (item) => item.id === section.id,
  );
  const masthead = element("div", "panel-masthead"),
    identity = element("div", "panel-station-identity");
  identity.append(
    element(
      "span",
      "panel-station-index",
      `STATION ${String(sectionIndex + 1).padStart(2, "0")}`,
    ),
  );
  masthead.append(identity);
  header.append(masthead, title);
  if (section.subtitle)
    header.append(element("p", "panel-subtitle", section.subtitle));
  const stationRule = element("div", "panel-station-rule");
  stationRule.setAttribute("aria-hidden", "true");
  visibleInOrder(sections).forEach((item, index) => {
    const marker = element("span");
    if (item.id === section.id) marker.className = "is-current";
    marker.title = `Station ${String(index + 1).padStart(2, "0")}`;
    stationRule.append(marker);
  });
  header.append(stationRule);
  const body = element("div", "panel-body");
  body.tabIndex = 0;
  body.setAttribute("aria-label", `${section.title} content`);
  if (section.introduction)
    body.append(element("p", "section-introduction", section.introduction));
  supportingContent(body, section);
  for (const group of visibleInOrder(section.groups || [])) {
    const view = contentGroup(group, entities);
    if (view) body.append(view);
  }
  if (section.id === "contact") {
    const button = element("button", "phone-action", panelCopy.phoneAction);
    button.type = "button";
    button.addEventListener("click", () => {
      panel.dispatchEvent(new CustomEvent("phone-power", { bubbles: true }));
      button.textContent = panelCopy.phoneAwake;
    });
    body.append(button);
  }
  const experience = createStationExperience(section, entities, {
    renderItem: (item) => (renderers[item.type] || card)(item),
    createPersonalNote,
    panel,
  });
  panel.append(header, experience || body);
  const targets = getStationNeighbors(section.id, sections);
  if (targets.length) {
    const nav = element("nav", "panel-related");
    nav.setAttribute("aria-label", `Stations beside ${section.title}`);
    nav.append(element("span", "content-meta", panelCopy.relatedHeading));
    const links = element("div", "related-links");
    for (const { section: target, direction } of targets) {
      const button = element("button", "related-link",
        direction === "left" ? `← ${target.title}` : `${target.title} →`);
      button.type = "button";
      button.dataset.direction = direction;
      button.setAttribute("aria-label", panelCopy.visit(target.title));
      button.dataset.targetSection = target.id;
      button.addEventListener("click", () =>
        panel.dispatchEvent(
          new CustomEvent("portfolio-navigate", {
            bubbles: true,
            detail: { sectionId: target.id, objectId: target.objectId },
          }),
        ),
      );
      links.append(button);
    }
    nav.append(links);
    panel.append(nav);
  }
  return panel;
}
