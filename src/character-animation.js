// A small animation rig shared by the visitor and the guide. Movement comes
// from actual position changes, so walking against a collision stays idle.
export function animateCharacter(character, elapsed, moving, dt) {
  const rig = character.userData.rig;
  if (!rig) return;
  const motion = (character.userData.motion ??= { phase: 0, weight: 0 });
  motion.weight += (Number(moving) - motion.weight) * (1 - Math.exp(-dt * 9));
  if (moving) motion.phase += dt * 10.5;
  const step = Math.sin(motion.phase),
    bounce = Math.sin(motion.phase * 2);
  rig.head.rotation.z =
    Math.sin(elapsed * 1.15) * 0.012 + step * 0.022 * motion.weight;
  rig.head.rotation.x =
    Math.sin(elapsed * 0.8) * 0.01 +
    Math.cos(motion.phase) * 0.017 * motion.weight;
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const stride = Math.sin(motion.phase + i * Math.PI) * motion.weight;
    const leg = character.userData.legs[i],
      arm = rig.arms[i];
    leg.rotation.x = stride * 0.43;
    leg.position.y = 0.77 + Math.max(0, stride) * 0.035;
    arm.rotation.x = -stride * 0.32;
    arm.rotation.z = side * (0.15 + 0.02 * Math.sin(elapsed * 1.5));
  }
  const blink = Math.pow(
    Math.max(
      0,
      Math.sin(elapsed * 0.95 + (character.userData.isGuide ? 1.7 : 0)),
    ),
    34,
  );
  for (const eye of rig.eyes) eye.scale.y = Math.max(0.09, 1 - blink * 0.91);
  character.position.y =
    0.12 +
    0.027 * Math.max(0, bounce) * motion.weight +
    0.006 * Math.sin(elapsed * 1.8);
}
