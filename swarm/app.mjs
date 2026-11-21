import {
  LIMITS, MODES, advanceParticles, clamp, constrainLocalParticle, createLocalBoundary,
  createParticles, rescaleParticles
} from "./physics.mjs";

export const STEP_MS = 1000 / 60;
export const MAX_STEPS = 3;
const SEED = 20261115;
const GLOBAL_CAP = 520;
const LOCAL_CAP = 134;
const TAP_HOLD_MS = 360;

const MODE_TEXT = {
  attraction: "Les particules convergent vers le cercle ou vers votre point d’action.",
  dispersion: "Les particules s’écartent du cercle ou de votre point d’action.",
  vortex: "Les deux groupes tournent en sens opposés.",
  calme: "Les particules ralentissent jusqu’à l’immobilité."
};

const PALETTES = [
  ["89, 222, 255", "190, 125, 255"],
  ["89, 222, 255", "190, 125, 255"]
];

export function createClock() {
  let previous = null;
  let remainder = 0;
  return {
    advance(now) {
      if (previous === null) {
        previous = now;
        return 0;
      }

      remainder = clamp(remainder + clamp(now - previous, 0, MAX_STEPS * STEP_MS), 0, MAX_STEPS * STEP_MS);
      previous = now;
      const steps = Math.floor((remainder + 1e-6) / STEP_MS);
      remainder = Math.max(0, remainder - steps * STEP_MS);
      return steps;
    },
    reset() {
      previous = null;
      remainder = 0;
    }
  };
}

export function getQuality(width, height, pixelRatio, cores, coarsePointer, reducedMotion) {
  // Tablette : rafraîchissement fluide avec plafond strict du budget de pixels.
  const tablet = coarsePointer && width >= 700 && height >= 500 && cores >= 4 && !reducedMotion;
  const compact = !tablet && (coarsePointer || width < 680 || cores <= 4 || reducedMotion);
  const pixelBudget = tablet ? 2_200_000 : compact ? 1_700_000 : 3_200_000;
  const ratioCap = tablet ? 1.65 : compact ? 1.5 : 1.8;
  const dpr = Math.min(pixelRatio || 1, ratioCap, Math.sqrt(pixelBudget / (width * height)), 4096 / Math.max(width, height));
  return {
    dpr, paintEvery: compact ? 2 : 1,
    globalCount: tablet ? 2 * Math.round(clamp(width * height / 6300, 160, 360) / 2)
      : 2 * Math.round(clamp(width * height / (compact ? 5800 : 5600), compact ? 88 : 128, compact ? 224 : GLOBAL_CAP) / 2),
    localCount: tablet ? 112 : compact ? 80 : LOCAL_CAP,
    streaks: !reducedMotion
  };
}

function visibleStrength(box, viewport) {
  const width = Math.max(0, Math.min(box.x + box.width, viewport.width) - Math.max(box.x, 0));
  const height = Math.max(0, Math.min(box.y + box.height, viewport.height) - Math.max(box.y, 0));
  return clamp(width * height / (Math.max(1, box.width * box.height) * 0.65), 0, 1);
}

function measureLayout(canvas, rectangle, circle, compactPointer, reducedMotion) {
  const frame = canvas.getBoundingClientRect();
  const viewport = {width: Math.max(1, frame.width), height: Math.max(1, frame.height), x: frame.left, y: frame.top};
  const {left, top, width: boxWidth, height: boxHeight} = rectangle.getBoundingClientRect();
  const width = Math.max(1, boxWidth);
  const height = Math.max(1, boxHeight);
  const orb = circle.getBoundingClientRect();
  const rect = {x: left - frame.left, y: top - frame.top, width, height};
  rect.strength = visibleStrength(rect, viewport);
  const orbBox = {x: orb.left - frame.left, y: orb.top - frame.top, width: orb.width, height: orb.height};
  const anchor = {
    x: orbBox.x + orbBox.width / 2,
    y: orbBox.y + orbBox.height / 2,
    radius: Math.min(orbBox.width, orbBox.height) / 2,
    strength: visibleStrength(orbBox, viewport) * 0.93,
    active: orbBox.width > 0 && orbBox.height > 0
  };
  const localBoundary = createLocalBoundary({x: 0, y: 0, width, height}, {
    ...anchor, x: anchor.x - rect.x, y: anchor.y - rect.y, strength: 1
  });
  const quality = getQuality(viewport.width, viewport.height, window.devicePixelRatio,
    navigator.hardwareConcurrency || 4, compactPointer, reducedMotion);

  return {viewport, rect, anchor, localBoundary, quality};
}

function syncLayout(state, layout, canvas, ctx) {
  const {viewport, rect, quality, localBoundary} = layout;
  const previous = state.layout;

  if (!previous) {
    state.global = createParticles(GLOBAL_CAP, viewport.width, viewport.height, SEED);
    state.local = createParticles(LOCAL_CAP, rect.width, rect.height, SEED + 1);
  } else {
    if (previous.viewport.width !== viewport.width || previous.viewport.height !== viewport.height) {
      rescaleParticles(state.global, previous.viewport, viewport, LIMITS.wrap);
    }
    if (previous.rect.width !== rect.width || previous.rect.height !== rect.height) {
      rescaleParticles(state.local, previous.rect, rect);
    }
  }
  for (const particle of state.local) constrainLocalParticle(particle, localBoundary);

  const width = Math.max(1, Math.floor(viewport.width * quality.dpr));
  const height = Math.max(1, Math.floor(viewport.height * quality.dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  ctx.setTransform(width / viewport.width, 0, 0, height / viewport.height, 0, 0);
  state.layout = layout;
}

function makeSprites() {
  return PALETTES.map(colors => colors.map(color => {
    const sprite = document.createElement("canvas");
    sprite.width = 32;
    sprite.height = 32;
    const ctx = sprite.getContext("2d");
    if (!ctx) return null;
    const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, "#f7fcff");
    glow.addColorStop(0.15, `rgba(${color}, 1)`);
    glow.addColorStop(0.32, `rgba(${color}, .53)`);
    glow.addColorStop(0.66, `rgba(${color}, .12)`);
    glow.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 32);
    return sprite;
  }));
}

function paintPopulation(ctx, particles, count, sprites, palette, streaks, local = false) {
  if (streaks) {
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = local ? 0.32 : 0.22;
    for (let team = 0; team < palette.length; team++) {
      ctx.strokeStyle = `rgb(${palette[team]})`;
      ctx.beginPath();
      for (let i = team; i < count; i += 2) {
        const p = particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * (2 + 5 * p.z), p.y - p.vy * (2 + 5 * p.z));
      }
      ctx.stroke();
    }
  }

  for (let i = 0; i < count; i++) {
    const p = particles[i];
    const diameter = local ? 5 + p.size * 3.3 : 4 + p.z * 12;
    ctx.globalAlpha = local ? 0.48 + p.z * 0.52 : 0.22 + p.z * 0.65;
    const sprite = sprites[p.team];
    if (sprite) {
      ctx.drawImage(sprite, p.x - diameter / 2, p.y - diameter / 2, diameter, diameter);
    } else {
      ctx.fillStyle = `rgb(${palette[p.team]})`;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }
  ctx.globalAlpha = 1;
}

function paintField(ctx, state, sprites, pointer) {
  const {viewport, rect, quality} = state.layout;
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.globalCompositeOperation = "lighter";
  const streaks = quality.streaks && !state.paused;
  paintPopulation(ctx, state.global, quality.globalCount, sprites[0], PALETTES[0], streaks);

  if (rect.strength > 0) {
    ctx.save();
    ctx.translate(rect.x, rect.y);
    ctx.beginPath();
    ctx.rect(0, 0, rect.width, rect.height);
    ctx.clip();
    paintPopulation(ctx, state.local, quality.localCount, sprites[1], PALETTES[1], streaks, true);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "source-over";
  if (pointer && pointer.kind !== "mouse") {
    ctx.strokeStyle = "#a2e3f8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 9, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function pointerPosition(state, timestamp) {
  const pointer = state.pointer;
  if (!pointer) return null;
  if (pointer.expires !== undefined && timestamp >= pointer.expires) {
    state.pointer = null;
    return null;
  }

  const {viewport, rect} = state.layout;
  const keyboard = pointer.kind === "keyboard";
  return {
    active: true,
    kind: pointer.kind,
    x: keyboard ? rect.x + pointer.x * rect.width : pointer.x - viewport.x,
    y: keyboard ? rect.y + pointer.y * rect.height : pointer.y - viewport.y,
    pressure: clamp(pointer.pressure ?? 0, 0, 1)
  };
}

function advanceField(state, steps, pointer) {
  const {viewport, rect, anchor, localBoundary, quality} = state.layout;
  const globalEnv = {width: viewport.width, height: viewport.height, mode: state.mode, pointer, anchor, rectangle: rect};
  const localPointer = pointer && {...pointer, x: pointer.x - rect.x, y: pointer.y - rect.y};
  const localEnv = {width: rect.width, height: rect.height, mode: state.mode, pointer: localPointer, boundary: localBoundary};

  for (let i = 0; i < steps; i++) {
    state.time += STEP_MS;
    globalEnv.now = localEnv.now = state.time;
    advanceParticles(state.global, quality.globalCount, globalEnv);
    if (rect.strength > 0) advanceParticles(state.local, quality.localCount, localEnv);
  }
}

function bindFieldInput(rectangle, state) {
  const passive = {passive: true};

  function track(event) {
    if (!event.isPrimary || state.paused || !state.canvasReady) return;
    const touch = event.pointerType !== "mouse";
    if (touch && event.type === "pointermove" && state.pointer?.id !== event.pointerId) return;
    if (event.target instanceof Element && event.target.closest("a, button, nav")) {
      state.pointer = null;
      return;
    }
    const field = rectangle.getBoundingClientRect();
    const inside = event.clientX >= field.left && event.clientX <= field.right &&
      event.clientY >= field.top && event.clientY <= field.bottom;
    if (!inside) {
      if (state.pointer?.kind === "mouse") state.pointer = null;
      return;
    }
    const rx = (event.clientX - field.left) / Math.max(1, field.width) - 0.5;
    const ry = (event.clientY - field.top) / Math.max(1, field.height) - 0.5;
    rectangle.style.setProperty("--swarm-tilt-x", (ry * -7).toFixed(2) + "deg");
    rectangle.style.setProperty("--swarm-tilt-y", (rx * 7).toFixed(2) + "deg");
    state.pointer = {x: event.clientX, y: event.clientY, kind: touch ? "touch" : "mouse",
      id: event.pointerId, pressure: clamp(event.pressure ?? 0, 0, 1)};
  }

  const resetTilt = () => { rectangle.style.setProperty("--swarm-tilt-x", "0deg"); rectangle.style.setProperty("--swarm-tilt-y", "0deg"); };
  window.addEventListener("pointerdown", track, passive);
  window.addEventListener("pointermove", track, passive);
  window.addEventListener("pointerup", event => {
    if (state.pointer?.kind === "touch" && state.pointer.id === event.pointerId) {
      state.pointer.expires = performance.now() + TAP_HOLD_MS;
      resetTilt();
    }
  }, passive);
  window.addEventListener("pointercancel", event => {
    if (state.pointer?.id === event.pointerId) state.pointer = null;
    resetTilt();
  }, passive);
  window.addEventListener("pointerout", event => {
    if (event.relatedTarget === null && state.pointer?.kind === "mouse") state.pointer = null;
  }, passive);
  window.addEventListener("blur", () => { state.pointer = null; resetTilt(); });

  rectangle.addEventListener("keydown", event => {
    if (event.target !== rectangle || state.paused || !state.layout || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey) return;

    if (event.key === "Escape" && state.pointer?.kind === "keyboard") {
      state.pointer = null;
      return;
    }
    const {rect, viewport} = state.layout;
    const left = clamp((10 - rect.x) / rect.width, 0.04, 0.96);
    const right = clamp((viewport.width - 10 - rect.x) / rect.width, left, 0.96);
    const top = clamp((10 - rect.y) / rect.height, 0.04, 0.96);
    const bottom = clamp((viewport.height - 10 - rect.y) / rect.height, top, 0.96);
    const dx = (Number(event.key === "ArrowRight") - Number(event.key === "ArrowLeft")) * 20 / Math.max(1, rect.width);
    const dy = (Number(event.key === "ArrowDown") - Number(event.key === "ArrowUp")) * 20 / Math.max(1, rect.height);
    if (!dx && !dy) return;

    event.preventDefault();
    const pointer = state.pointer?.kind === "keyboard" ? state.pointer : {x: 0.25, y: 0.5, kind: "keyboard"};
    state.pointer = {...pointer, x: clamp(pointer.x + dx, left, right), y: clamp(pointer.y + dy, top, bottom)};
  });
  rectangle.addEventListener("blur", () => {
    if (state.pointer?.kind === "keyboard") state.pointer = null;
  });
}

export function bindFullscreen(button, circle, onChange, view = window) {
  const doc = view.document;
  const root = doc.documentElement;
  let scrollPosition = null;
  let nativeFullscreen = false;

  function setExpanded(expanded) {
    root.toggleAttribute("data-swarm-expanded", expanded);
    button.textContent = expanded ? "Quitter" : "Plein écran";
    button.setAttribute("aria-label", expanded ? "Quitter le plein écran" : "Plein écran");
    button.setAttribute("aria-expanded", String(expanded));
    onChange();
  }

  function close(restorePosition = true) {
    const previous = scrollPosition;
    if (!previous) return;

    scrollPosition = null;
    setExpanded(false);
    const restore = () => {
      if (!restorePosition || scrollPosition) return;
      view.scrollTo(previous.x, previous.y);
      button.focus({preventScroll: true});
    };
    if (doc.fullscreenElement === root) void doc.exitFullscreen().then(restore, restore);
    else restore();
  }

  button.addEventListener("click", async () => {
    if (scrollPosition) {
      close();
      return;
    }

    scrollPosition = {x: view.scrollX, y: view.scrollY};
    setExpanded(true);
    if (!doc.fullscreenEnabled || !root.requestFullscreen) return;
    try {
      await root.requestFullscreen({navigationUI: "hide"});
    } catch {
      // La mise en page étendue reste active si le navigateur refuse le plein écran natif.
    }
  });

  doc.addEventListener("fullscreenchange", () => {
    const wasNative = nativeFullscreen;
    nativeFullscreen = doc.fullscreenElement === root;
    if (nativeFullscreen && !scrollPosition) void doc.exitFullscreen().catch(() => {});
    else if (wasNative && !nativeFullscreen && scrollPosition) close();
    else onChange();
  });
  doc.addEventListener("keydown", event => {
    if (scrollPosition && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  circle.addEventListener("click", event => {
    if (!event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey &&
        !event.metaKey && !event.shiftKey) close(false);
  });

  return close;
}

function initSwarm() {
  const canvas = document.getElementById("swarm-canvas");
  const status = document.getElementById("swarm-status");
  let ctx;
  try {
    ctx = canvas.getContext?.("2d");
  } catch {
    // Certains navigateurs ou réglages peuvent refuser un contexte Canvas.
  }
  if (!ctx) {
    status.textContent = "Canvas 2D est indisponible. La méthode reste accessible dans le cercle.";
    return;
  }

  const rectangle = document.getElementById("geometry");
  const circle = document.getElementById("swarm-anchor");
  const controls = document.getElementById("swarm-controls");
  const fieldHint = document.getElementById("field-hint");
  const pauseButton = document.getElementById("pause-field");
  const modeButtons = controls.querySelectorAll("[data-mode]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const clock = createClock();
  const sprites = makeSprites();
  const state = {
    mode: "attraction", paused: reduced.matches, canvasReady: true,
    layout: null, needsLayout: true, needsPaint: true, pointer: null, frame: null, time: 0, sincePaint: 0
  };

  function queue() {
    if (state.frame === null && state.canvasReady && !document.hidden &&
        (!state.paused || state.needsLayout || state.needsPaint)) {
      state.frame = requestAnimationFrame(tick);
    }
  }

  function tick(timestamp) {
    state.frame = null;
    if (document.hidden || !state.canvasReady) return;

    if (state.needsLayout) {
      const layout = measureLayout(canvas, rectangle, circle, coarse.matches, reduced.matches);
      syncLayout(state, layout, canvas, ctx);
      state.needsLayout = false;
      state.needsPaint = true;
    }

    const pointer = pointerPosition(state, timestamp);
    const steps = state.paused ? 0 : clock.advance(timestamp);
    if (steps) advanceField(state, steps, pointer);
    state.sincePaint += steps;
    if (state.needsPaint || state.sincePaint >= state.layout.quality.paintEvery) {
      paintField(ctx, state, sprites, pointer);
      state.needsPaint = false;
      state.sincePaint = 0;
    }
    queue();
  }

  function invalidateLayout() {
    state.needsLayout = true;
    queue();
  }

  function stopClock() {
    if (state.frame !== null) cancelAnimationFrame(state.frame);
    state.frame = null;
    state.pointer = null;
    state.sincePaint = 0;
    clock.reset();
  }

  function updateControls() {
    controls.hidden = fieldHint.hidden = !state.canvasReady;
    rectangle.tabIndex = state.canvasReady ? 0 : -1;
    if (state.canvasReady) rectangle.setAttribute("aria-describedby", fieldHint.id);
    else rectangle.removeAttribute("aria-describedby");
    pauseButton.textContent = state.paused ? "Reprendre" : "Mettre en pause";
    for (const button of modeButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    }
    if (!state.canvasReady) {
      status.textContent = "Canvas 2D est indisponible. La méthode reste accessible dans le cercle.";
    } else {
      status.textContent = state.paused ? "Champ en pause. Reprenez l’animation pour appliquer le mouvement choisi."
        : MODE_TEXT[state.mode];
    }
  }

  function pause(value) {
    state.paused = value;
    stopClock();
    state.needsPaint = true;
    updateControls();
    queue();
  }

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (!MODES.includes(mode)) return;
      state.mode = mode;
      updateControls();
    });
  }
  pauseButton.addEventListener("click", () => { pause(!state.paused); });
  bindFieldInput(rectangle, state);
  const closeFullscreen = bindFullscreen(document.getElementById("swarm-screen"), circle, () => {
    state.pointer = null;
    invalidateLayout();
  });

  window.addEventListener("scroll", invalidateLayout, {passive: true});
  window.addEventListener("resize", invalidateLayout, {passive: true});
  window.visualViewport?.addEventListener("resize", invalidateLayout, {passive: true});
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(invalidateLayout);
    observer.observe(rectangle);
    observer.observe(circle);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopClock();
    else invalidateLayout();
  });

  function watchMedia(query, handler) {
    if (query.addEventListener) query.addEventListener("change", handler);
    else query.addListener?.(handler);
  }
  watchMedia(reduced, event => {
    if (event.matches) pause(true);
    invalidateLayout();
  });
  watchMedia(coarse, invalidateLayout);

  canvas.addEventListener("contextlost", () => {
    state.canvasReady = false;
    closeFullscreen();
    stopClock();
    updateControls();
  });
  canvas.addEventListener("contextrestored", () => {
    state.canvasReady = true;
    updateControls();
    invalidateLayout();
  });

  updateControls();
  queue();
}

if (typeof document !== "undefined") initSwarm();
