import { test } from "node:test";
import assert from "node:assert/strict";
import {
  portfolioSections,
  portfolioEntities,
  visibleInOrder,
  stationSectionOrder,
  getStationNeighbors,
} from "../src/portfolio-data.js";
import { landmarks } from "../src/content.js";
import { requestCompanionReply } from "../src/backend.js";

test("section mappings and content references stay complete and stable", () => {
  assert.deepEqual(landmarks.map((item) => item.sectionId), stationSectionOrder);
  assert.deepEqual(getStationNeighbors("education").map(({section, direction}) =>
    [section.id, direction]), [["projects", "left"], ["hobbies", "right"]]);
  for (const id of stationSectionOrder) {
    const neighbors = getStationNeighbors(id);
    assert.equal(neighbors.length, 2);
    assert.ok(neighbors.every(({section}) => section.id !== id));
  }
  const mapping = {
    f1: "about-me",
    "power-plant": "interests",
    library: "projects",
    notebook: "education",
    phone: "contact",
    bike: "hobbies",
  };
  assert.equal(new Set(portfolioSections.map((s) => s.id)).size, 6);
  const groupIds = [];
  for (const section of portfolioSections) {
    assert.equal(mapping[section.objectId], section.id);
    assert.ok(section.title && section.subtitle && section.introduction);
    for (const target of section.relatedSectionIds)
      assert.ok(portfolioSections.some((s) => s.id === target));
    for (const group of section.groups) {
      groupIds.push(group.id);
      for (const id of group.entityIds)
        assert.equal(portfolioEntities[id]?.id, id, `${id}: entity exists`);
    }
  }
  assert.equal(new Set(groupIds).size, groupIds.length);
  for (const [id, item] of Object.entries(portfolioEntities)) {
    assert.equal(item.id, id);
    for (const related of item.relatedIds)
      assert.ok(portfolioEntities[related]);
  }
  assert.deepEqual(
    landmarks.map((s) => s.id),
    ["f1", "power-plant", "library", "notebook", "bike", "phone"],
  );
});

test("unprovided facts stay empty and marked placeholders stay unpublished", () => {
  for (const item of Object.values(portfolioEntities)) {
    assert.equal(item.date, null);
    if (["mechanical-engineering-eia", "finance-minor-eia"].includes(item.id)) {
      assert.equal(item.period, "2022–2026");
      assert.equal(item.subtitle, "Universidad EIA");
    } else assert.equal(item.period, null);
    if (item.isPlaceholder) {
      assert.equal(item.visible, false);
      assert.match(item.title, /Placeholder/);
    }
  }
  const shown = visibleInOrder(Object.values(portfolioEntities));
  assert.ok(shown.every((item) => !item.isPlaceholder));
  assert.deepEqual(
    visibleInOrder([
      { id: "later", displayOrder: 20 },
      { id: "hidden", visible: false },
      { id: "earlier", displayOrder: 10 },
    ]).map((item) => item.id),
    ["earlier", "later"],
  );
});

test("guide routes new content meanings without substring matches", async () => {
  for (const [text, id] of [
    ["tell me about AI", "power-plant"],
    ["show me projects", "library"],
    ["mechanical engineering", "notebook"],
    ["finance minor", "notebook"],
    ["about me", "f1"],
    ["LinkedIn", "phone"],
    ["running", "bike"],
    ["learning", "bike"],
    ["engineering", "power-plant"],
  ]) {
    const reply = await requestCompanionReply([
      { role: "user", content: text },
    ]);
    assert.equal(reply.destination_object_id, id, text);
  }
  assert.equal(
    (await requestCompanionReply([{ role: "user", content: "I said hello" }]))
      .destination_object_id,
    null,
  );
});
