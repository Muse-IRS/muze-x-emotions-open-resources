/* Moteur de particules en pixels CSS, avec un pas nominal de 1/60 s. */
export const MODES = Object.freeze(["attraction", "dispersion", "vortex", "calme"]);
export const LIMITS = Object.freeze({
  particles: 900,
  acceleration: 0.24,
  speed: 4.8,
  wrap: 24,
  rectanglePadding: 5,
  circlePadding: 5
});

const DAMPING = 0.953;
const CALM_DAMPING = 0.88;
const RESTITUTION = 0.72;
const SEPARATION_REACH = 16;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function isFiniteParticle(p) {
  return Number.isFinite(p.x) && Number.isFinite(p.y) &&
    Number.isFinite(p.vx) && Number.isFinite(p.vy) &&
    Number.isFinite(p.z) && Number.isFinite(p.mass);
}

export function seededRandom(seed = 20261115) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createParticles(count, width, height, seed = 20261115, region = null) {
  const random = seededRandom(seed);
  const box = region ?? {x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height)};
  return Array.from({length: Math.round(clamp(count, 0, LIMITS.particles))}, (_, i) => ({
    team: i % 2,
    x: box.x + random() * box.width,
    y: box.y + random() * box.height,
    z: 0.15 + random() * 0.85,
    vx: (random() - 0.5) * 0.9,
    vy: (random() - 0.5) * 0.9,
    mass: 0.7 + random() * 0.9,
    phase: random() * 2 * Math.PI,
    drift: 0.45 + random(),
    size: 1.3 + random() * 2.3,
    separationX: 0,
    separationY: 0
  }));
}

export function rescaleParticles(particles, previous, next, padding = 0) {
  const scaleX = (next.width + 2 * padding) / (previous.width + 2 * padding);
  const scaleY = (next.height + 2 * padding) / (previous.height + 2 * padding);
  for (const p of particles) {
    p.x = (p.x + padding) * scaleX - padding;
    p.y = (p.y + padding) * scaleY - padding;
  }
}

export function forceForMode(p, target, mode, reach = 340) {
  if (!target || mode === "calme" || !MODES.includes(mode)) return {x: 0, y: 0};

  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const distance = Math.hypot(dx, dy);
  const falloff = clamp(1 - distance / Math.max(1, reach), 0, 1);
  if (falloff === 0) return {x: 0, y: 0};

  // Au centre exact, la phase ensemencée fournit une direction reproductible.
  const nx = distance > 0 ? dx / distance : Math.cos(p.phase ?? 0);
  const ny = distance > 0 ? dy / distance : Math.sin(p.phase ?? 0);
  const strength = falloff * (0.075 + 0.06 * p.z);
  const radius = target.radius ?? 0;

  if (mode === "attraction") {
    const radial = strength * clamp((distance - radius) / Math.max(34, radius * 0.55), -1, 1);
    return {x: nx * radial, y: ny * radial};
  }
  if (mode === "dispersion") {
    return {x: -nx * strength * 1.24, y: -ny * strength * 1.24};
  }

  const orbit = radius || reach * 0.27;
  const radial = strength * 1.8 * clamp((distance - orbit) / Math.max(24, orbit * 0.6), -1, 1);
  const spin = p.team === 1 ? -1 : 1;
  const tangent = strength * spin * Math.min(distance / Math.max(1, orbit * 0.25), 1);
  return {x: nx * radial - ny * tangent, y: ny * radial + nx * tangent};
}

export function createLocalBoundary(region, anchor) {
  const padX = Math.min(LIMITS.rectanglePadding, region.width / 2);
  const padY = Math.min(LIMITS.rectanglePadding, region.height / 2);
  const left = region.x + padX;
  const right = region.x + region.width - padX;
  const top = region.y + padY;
  const bottom = region.y + region.height - padY;

  // L'exclusion circulaire doit rester entièrement dans la zone utilisable.
  const radius = anchor?.active ? Math.min(
    anchor.radius + LIMITS.circlePadding,
    anchor.x - left, right - anchor.x, anchor.y - top, bottom - anchor.y
  ) : 0;
  const circle = radius > 0 ? {...anchor, radius} : null;
  return {left, right, top, bottom, circle};
}

export function constrainLocalParticle(p, boundary) {
  const {left, right, top, bottom, circle} = boundary;
  if (p.x < left || p.x > right) {
    p.x = clamp(p.x, left, right);
    if ((p.x === left && p.vx < 0) || (p.x === right && p.vx > 0)) p.vx *= -RESTITUTION;
  }
  if (p.y < top || p.y > bottom) {
    p.y = clamp(p.y, top, bottom);
    if ((p.y === top && p.vy < 0) || (p.y === bottom && p.vy > 0)) p.vy *= -RESTITUTION;
  }
  if (!circle) return;

  const dx = p.x - circle.x;
  const dy = p.y - circle.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= circle.radius) return;

  const nx = distance > 0 ? dx / distance : Math.cos(p.phase ?? 0);
  const ny = distance > 0 ? dy / distance : Math.sin(p.phase ?? 0);
  p.x = clamp(circle.x + nx * circle.radius, left, right);
  p.y = clamp(circle.y + ny * circle.radius, top, bottom);
  const inwardSpeed = p.vx * nx + p.vy * ny;
  if (inwardSpeed < 0) {
    p.vx -= (1 + RESTITUTION) * inwardSpeed * nx;
    p.vy -= (1 + RESTITUTION) * inwardSpeed * ny;
  }
}

function rectangleForce(p, rectangle) {
  const {x: left, y: top, width, height, strength} = rectangle;
  const right = left + width;
  const bottom = top + height;
  let x = clamp(p.x, left, right);
  let y = clamp(p.y, top, bottom);
  if (x === p.x && y === p.y) {
    const nearest = Math.min(p.x - left, right - p.x, p.y - top, bottom - p.y);
    if (nearest === p.x - left) x = left;
    else if (nearest === right - p.x) x = right;
    else if (nearest === p.y - top) y = top;
    else y = bottom;
  }

  const dx = x - p.x;
  const dy = y - p.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.max(72, Math.min(width, height) * 0.42);
  const falloff = clamp(1 - distance / reach, 0, 1);
  const weight = strength * 0.021 * falloff / Math.max(distance, 13);
  return {x: dx * weight, y: dy * weight};
}

function wrap(value, span) {
  const min = -LIMITS.wrap;
  const max = span + LIMITS.wrap;
  if (value >= min && value < max) return value;
  const length = max - min;
  return min + (((value - min) % length) + length) % length;
}

export function integrateParticle(p, env) {
  const {width, height, dt = 1, now = 0, mode = "attraction", pointer, anchor, rectangle, region} = env;
  const step = clamp(dt, 0, 2);
  if (step === 0) return p;

  const boundary = env.boundary ?? (region ? createLocalBoundary(region, anchor) : null);
  const calm = mode === "calme";
  let fx = 0;
  let fy = 0;

  if (!calm) {
    const phase = p.team === 0 ? 0 : Math.PI;
    const baseX = width * (0.5 + 0.27 * Math.sin(now * 0.000091 + phase));
    const baseY = height * (0.5 + 0.25 * Math.cos(now * 0.000074 + phase));
    const spring = boundary ? 0.000025 : 0.000009;
    fx = (baseX - p.x) * spring + Math.cos(now * 0.00044 * p.drift + p.phase) * 0.031;
    fy = (baseY - p.y) * spring + Math.sin(now * 0.00037 * p.drift + p.phase) * 0.031;

    if (pointer?.active) {
      const force = forceForMode(p, pointer, mode, clamp(Math.min(width, height) * 0.65, 150, 490));
      fx += force.x;
      fy += force.y;
    }
    const target = boundary ? boundary.circle : anchor;
    if (target?.active && target.strength > 0) {
      const force = forceForMode(p, target, mode, Math.max(240, target.radius * 4.4));
      fx += force.x * target.strength;
      fy += force.y * target.strength;
    }
    if (rectangle?.strength > 0) {
      const force = rectangleForce(p, rectangle);
      fx += force.x;
      fy += force.y;
    }
    if (boundary) {
      fx += p.separationX ?? 0;
      fy += p.separationY ?? 0;
    }
  }

  const mass = Math.max(0.25, p.mass);
  const accelerationScale = step / Math.max(mass, Math.hypot(fx, fy) / LIMITS.acceleration);
  const damping = Math.pow(calm ? CALM_DAMPING : DAMPING, step);
  p.vx = (p.vx + fx * accelerationScale) * damping;
  p.vy = (p.vy + fy * accelerationScale) * damping;
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > LIMITS.speed) {
    p.vx *= LIMITS.speed / speed;
    p.vy *= LIMITS.speed / speed;
  } else if (calm && speed < 0.004) {
    p.vx = 0;
    p.vy = 0;
  }

  p.x += p.vx * step;
  p.y += p.vy * step;
  if (boundary) constrainLocalParticle(p, boundary);
  else {
    p.x = wrap(p.x, width);
    p.y = wrap(p.y, height);
  }
  return p;
}

function prepareSeparation(particles, count) {
  for (let i = 0; i < count; i++) {
    particles[i].separationX = 0;
    particles[i].separationY = 0;
  }
  // Le plafond du groupe local borne le nombre de paires à examiner.
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    for (let j = i + 1; j < count; j++) {
      const q = particles[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const squared = dx * dx + dy * dy;
      if (squared >= SEPARATION_REACH * SEPARATION_REACH) continue;

      const distance = Math.sqrt(squared);
      const nx = distance > 0 ? dx / distance : Math.cos(p.phase);
      const ny = distance > 0 ? dy / distance : Math.sin(p.phase);
      const strength = 0.021 * (1 - distance / SEPARATION_REACH);
      const fx = nx * strength;
      const fy = ny * strength;
      p.separationX += fx;
      p.separationY += fy;
      q.separationX -= fx;
      q.separationY -= fy;
    }
  }
}

export function advanceParticles(particles, count, env) {
  if (env.boundary && env.mode !== "calme") prepareSeparation(particles, count);
  for (let i = 0; i < count; i++) integrateParticle(particles[i], env);
}
