import { getSectionForObject } from "./portfolio-data.js";
import { createSectionPanel } from "./section-components.js";

// Preserve scene order, palette and object IDs used by navigation and the guide.
export const stations = [
  {
    id: "f1",
    objectLabel: "Formula 1 Car",
    color: 0xe06b52,
    angle: -Math.PI / 3,
  },
  {
    id: "power-plant",
    objectLabel: "Nuclear Reactor",
    color: 0x91b976,
    angle: 0,
  },
  {
    id: "library",
    objectLabel: "Library",
    color: 0xd4b67c,
    angle: Math.PI / 3,
  },
  {
    id: "notebook",
    objectLabel: "Notebook",
    color: 0x8ca7c5,
    angle: (2 * Math.PI) / 3,
  },
  { id: "bike", objectLabel: "Bicycle", color: 0xe6aa7c, angle: Math.PI },
  {
    id: "phone",
    objectLabel: "Smartphone",
    color: 0xa89ac3,
    angle: (4 * Math.PI) / 3,
  },
];
export const landmarks = stations
  .map((station, sceneIndex) => {
    const section = getSectionForObject(station.id);
    return {
      ...station,
      sceneIndex,
      visible: section.visible,
      sectionId: section.id,
      title: section.title,
      category: station.objectLabel,
      subtitle: section.subtitle,
      description: section.introduction,
    };
  })
  .filter((station) => station.visible !== false);
export function createPanelContent(station) {
  const section = getSectionForObject(station.id);
  return createSectionPanel({ ...section, objectLabel: station.objectLabel });
}
