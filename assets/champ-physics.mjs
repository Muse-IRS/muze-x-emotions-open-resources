/**
 * Champ de réflexion émotionnelle : dynamique visuelle publique et autonome.
 * Métaphore d'interface, pas modèle du cerveau ni mesure d'une émotion.
 * Aucune API réseau, aucun stockage, aucune dépendance.
 */
export const MODES = Object.freeze(["attraction", "vortex", "dispersion"]);
export function clamp(value, lower, upper) {
  return Math.min(upper, Math.max(lower, Number.isFinite(value) ? value : lower));
}
function randomFromSeed(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function createParticles(count, width, height, seed = 1409) {
  const rng = randomFromSeed(seed);
  const number = Math.floor(clamp(count, 20, 180));
  const w = Math.max(60, width), h = Math.max(60, height);
  const r = Math.min(w, h) * 0.29;
  const particles = [];
  for (let i = 0; i < number; i += 1) {
    const swarm = i % 2;
    const angle = rng() * Math.PI * 2;
    const radial = Math.sqrt(rng()) * r;
    const x = w * (swarm ? 0.57 : 0.43) + Math.cos(angle) * radial;
    const y = h * 0.5 + Math.sin(angle) * radial;
    particles.push({
      x: clamp(x, 10, w - 10),
      y: clamp(y, 10, h - 10),
      vx: 0,
      vy: 0,
      swarm,
      phase: rng() * Math.PI * 2,
      size: 1.25 + rng() * 1.45
    });
  }
  return particles;
}
export function advanceParticles(particles, width, height, center, config, dt) {
  if (!MODES.includes(config.mode)) throw new RangeError("Unknown visual mode");
  const w = Math.max(60, width), h = Math.max(60, height);
  const step = clamp(dt, 0, 0.055) * (0.3 + 1.3 * clamp(config.speed, 0, 100) / 100);
  if (step <= 0) return particles;
  const strength = 0.25 + 0.75 * clamp(config.intensity, 0, 100) / 100;
  const radius = Math.min(w, h) * 0.27;
  const damping = Math.exp(-1.1 * step);
  const padding = 8;
  const cx = clamp(center.x, padding, w - padding);
  const cy = clamp(center.y, padding, h - padding);
  for (const p of particles) {
    const dx = cx - p.x, dy = cy - p.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const ux = dx / dist, uy = dy / dist;
    const spring = Math.min(dist / Math.max(20, radius), 1.3);
    let ax = 0, ay = 0;
    if (config.mode === "attraction") {
      const force = (45 + strength * 115) * spring;
      ax = ux * force;
      ay = uy * force;
    } else if (config.mode === "vortex") {
      const turn = (65 + strength * 105) * Math.min(dist / 28, 1);
      const gather = (20 + strength * 36) * spring;
      ax = -uy * turn + ux * gather;
      ay = ux * turn + uy * gather;
    } else {
      const force = (45 + strength * 115) * Math.min(dist / 22, 1);
      ax = -ux * force + Math.sin(p.phase) * 17;
      ay = -uy * force + Math.cos(p.phase) * 17;
    }
    p.phase += step * 0.14;
    p.vx = (p.vx + ax * step) * damping;
    p.vy = (p.vy + ay * step) * damping;
    const v = Math.hypot(p.vx, p.vy);
    if (v > 150) {
      p.vx = p.vx / v * 150;
      p.vy = p.vy / v * 150;
    }
    p.x += p.vx * step;
    p.y += p.vy * step;
    // Bords contenus dans le rectangle, sans tunnel hors écran.
    if (p.x < padding) { p.x = padding; p.vx = Math.abs(p.vx) * 0.64; }
    if (p.x > w - padding) { p.x = w - padding; p.vx = -Math.abs(p.vx) * 0.64; }
    if (p.y < padding) { p.y = padding; p.vy = Math.abs(p.vy) * 0.64; }
    if (p.y > h - padding) { p.y = h - padding; p.vy = -Math.abs(p.vy) * 0.64; }
  }
  return particles;
}

/** Preserve swarm positions, velocities and identity when the canvas resizes.
 * Entering or leaving fullscreen never re-seeds the existing particles. */
export function rescaleParticles(particles, oldWidth, oldHeight, newWidth, newHeight) {
  const sx = Math.max(60, newWidth) / Math.max(60, oldWidth);
  const sy = Math.max(60, newHeight) / Math.max(60, oldHeight);
  for (const p of particles) {
    p.x = clamp(p.x * sx, 8, Math.max(60, newWidth) - 8);
    p.y = clamp(p.y * sy, 8, Math.max(60, newHeight) - 8);
    p.vx *= sx;
    p.vy *= sy;
  }
  return particles;
}
