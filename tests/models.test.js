import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { landmarkModel, character } from "../src/models.js";
import { animateCharacter } from "../src/character-animation.js";

test('both characters use one solid anime hairstyle',()=>{
  for(const guide of [true,false]){
    const model=character(guide),hair=[];
    model.traverse(object=>{if(object.name==='anime-hair-solid')hair.push(object);});
    assert.equal(hair.length,1);
    assert.ok(hair[0].geometry.attributes.position.array.every(Number.isFinite));
    assert.ok(!Array.isArray(hair[0].material));
  }
});

test("reference sculptures stay grounded and fit their collision footprint", () => {
  for (const id of [
    "f1",
    "power-plant",
    "library",
    "notebook",
    "bike",
    "phone",
  ]) {
    const model = landmarkModel(id),
      bounds = new T.Box3().setFromObject(model),
      size = bounds.getSize(new T.Vector3());
    assert.ok(
      bounds.max.y <= 3.22 && size.y > 1,
      `${id}: sculpture stays below the information panel`,
    );
    assert.ok(Math.abs(bounds.min.y) < 0.02, `${id}: grounded without tall display stems`);
    assert.ok(Math.max(size.x, size.z) < 4.72, `${id}: fits the pedestal`);
    model.traverse((object) => {
      if (!object.isMesh) return;
      for (const n of object.geometry.attributes.position.array)
        assert.ok(Number.isFinite(n), `${id}: finite geometry`);
    });
    if (id === "phone") {
      assert.equal(model.userData.screens.length, 2);
      for (const screen of model.userData.screens)
        assert.ok(screen.parent, "screen stays attached after static batching");
      assert.notEqual(
        model.userData.screens[0].material,
        model.userData.screens[1].material,
      );
    }
  }
});

test("character keeps complete leg assemblies available for walking", () => {
  for (const guide of [false, true]) {
    const model = character(guide);
    assert.equal(model.userData.legs.length, 2);
    for (const leg of model.userData.legs)
      assert.ok(leg.children.length > 5, "shoes and trousers move together");
    const size = new T.Box3().setFromObject(model).getSize(new T.Vector3());
    assert.ok(size.y > 2 && size.y < 2.4);
  }
});

test("walk cycle moves the rig while idle motion settles", () => {
  const guide = character(true);
  animateCharacter(guide, 0, false, 0.016);
  assert.equal(guide.userData.legs[0].rotation.x, 0);
  animateCharacter(guide, 0.12, true, 0.12);
  assert.ok(guide.userData.legs[0].rotation.x > 0.1);
  assert.ok(guide.userData.legs[1].rotation.x < -0.1);
  assert.ok(guide.userData.rig.arms[0].rotation.x < 0);
  assert.ok(guide.userData.rig.arms[1].rotation.x > 0);
  const phase = guide.userData.motion.phase;
  animateCharacter(guide, 0.4, false, 0.2);
  assert.equal(guide.userData.motion.phase, phase);
  assert.ok(
    guide.userData.rig.eyes.every((eye) => Number.isFinite(eye.scale.y)),
  );
});
