import { clamp, createParticles, advanceParticles, MODES } from "./champ-physics.mjs";
const canvas = document.getElementById("champ-canvas");
const field = document.getElementById("champ-surface");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const modeText = document.getElementById("mode-description");
const status = document.getElementById("champ-status");
const speed = document.getElementById("champ-speed");
const intensity = document.getElementById("champ-intensity");
const density = document.getElementById("champ-density");
const speedOutput = document.getElementById("champ-speed-output");
const intensityOutput = document.getElementById("champ-intensity-output");
const densityOutput = document.getElementById("champ-density-output");
const play = document.getElementById("champ-play");
const reset = document.getElementById("champ-reset");
const slow = document.getElementById("champ-slow");
const air = document.getElementById("champ-air");
const recenter = document.getElementById("champ-recenter");
const descriptions = {
  attraction: "Les deux essaims sont attirés vers un point. Vous pouvez déplacer ce point ou modifier la force du mouvement.",
  vortex: "Les essaims circulent autour d'un point. Vous pouvez ralentir leur rotation et déplacer le centre.",
  dispersion: "Les essaims s'éloignent du centre dans le rectangle. Vous pouvez réduire leur vitesse ou leur nombre."
};
if (canvas && field && status && play && MODES.every(mode => modeButtons.some(button => button.dataset.mode === mode))) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    status.textContent = "La représentation graphique n'est pas prise en charge. Les explications restent accessibles.";
    play.disabled = true;
  } else {
    const reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const state = {
      mode: "attraction", running: false, width: 500, height: 360,
      dpr: 1, speed: 34, intensity: 42, density: 100,
      center: { x: 250, y: 180 }, particles: [], request: 0,
      lastDraw: 0, dragPointer: null
    };
    const tell = text => { status.textContent = text; };
    function updateControls() {
      for (const button of modeButtons) button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
      modeText.textContent = descriptions[state.mode];
      speed.value = state.speed; intensity.value = state.intensity; density.value = state.density;
      speedOutput.textContent = state.speed + " %";
      intensityOutput.textContent = state.intensity + " %";
      densityOutput.textContent = String(state.density);
      play.textContent = state.running ? "Mettre en pause" : "Démarrer le mouvement";
      play.setAttribute("aria-pressed", String(state.running));
    }
    function redraw() {
      const w = state.width, h = state.height, ctx = context;
      ctx.save(); ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.fillStyle = "#071b28"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#647c8a"; ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 8.5, w - 17, h - 17);
      const radius = Math.min(w, h) * 0.275;
      ctx.beginPath(); ctx.arc(state.center.x, state.center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(183,219,231,0.54)"; ctx.setLineDash([4, 10]); ctx.lineWidth = 1;
      ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(state.center.x, state.center.y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#e0eece"; ctx.lineWidth = 1.5; ctx.stroke();
      for (const p of state.particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.swarm ? "#d6b9ff" : "#85ecf1"; ctx.fill();
      }
      ctx.restore();
    }
    function stop(message) {
      state.running = false;
      if (state.request) cancelAnimationFrame(state.request);
      state.request = 0; state.lastDraw = 0;
      updateControls(); redraw();
      if (message) tell(message);
    }
    function tick(timestamp) {
      if (!state.running) return;
      if (document.hidden) { stop("Mouvement mis en pause lorsque la page n'est plus visible."); return; }
      state.request = requestAnimationFrame(tick);
      if (timestamp - state.lastDraw < 33) return;
      const elapsed = state.lastDraw ? (timestamp - state.lastDraw) / 1000 : 0.033;
      state.lastDraw = timestamp;
      advanceParticles(state.particles, state.width, state.height, state.center, state, elapsed);
      redraw();
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const oldWidth = state.width, oldHeight = state.height;
      state.width = Math.max(200, rect.width);
      state.height = Math.max(230, rect.height);
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      state.center.x = oldWidth ? clamp(state.center.x / oldWidth * state.width, 15, state.width - 15) : state.width / 2;
      state.center.y = oldHeight ? clamp(state.center.y / oldHeight * state.height, 15, state.height - 15) : state.height / 2;
      state.particles = createParticles(state.density, state.width, state.height);
      redraw();
    }
    function updateCenterFromPointer(e) {
      const rect = canvas.getBoundingClientRect();
      state.center.x = clamp(e.clientX - rect.left, 16, state.width - 16);
      state.center.y = clamp(e.clientY - rect.top, 16, state.height - 16);
      redraw();
    }
    for (const button of modeButtons) button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      for (const p of state.particles) { p.vx *= 0.3; p.vy *= 0.3; }
      updateControls(); redraw();
      tell("Mode " + button.textContent.trim() + ". " + descriptions[state.mode]);
    });
    play.addEventListener("click", () => {
      if (state.running) { stop("Mouvement en pause. Vos réglages restent visibles jusqu'à la fermeture de cette page."); return; }
      state.running = true; state.lastDraw = 0;
      updateControls(); tell("Mouvement activé. Le bouton Mettre en pause reste disponible.");
      state.request = requestAnimationFrame(tick);
    });
    speed.addEventListener("input", () => { state.speed = Number(speed.value); updateControls(); });
    intensity.addEventListener("input", () => { state.intensity = Number(intensity.value); updateControls(); });
    density.addEventListener("input", () => {
      state.density = Number(density.value);
      state.particles = createParticles(state.density, state.width, state.height);
      updateControls(); redraw();
    });
    slow.addEventListener("click", () => {
      state.speed = Math.max(10, state.speed - 20); updateControls();
      tell("Vitesse réduite à " + state.speed + " %. Ce réglage ne mesure pas votre état émotionnel.");
    });
    air.addEventListener("click", () => {
      state.density = Math.max(40, state.density - 20);
      state.particles = createParticles(state.density, state.width, state.height);
      updateControls(); redraw(); tell("Moins de particules affichées.");
    });
    recenter.addEventListener("click", () => {
      state.center = { x: state.width / 2, y: state.height / 2 };
      redraw(); tell("Centre replacé au milieu du rectangle.");
    });
    reset.addEventListener("click", () => {
      stop(); state.mode = "attraction"; state.speed = 34; state.intensity = 42;
      state.density = 100; state.center = { x: state.width / 2, y: state.height / 2 };
      state.particles = createParticles(state.density, state.width, state.height);
      updateControls(); redraw(); tell("Champ réinitialisé et immobile. Aucun réglage n'a été enregistré.");
    });
    canvas.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      state.dragPointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      updateCenterFromPointer(e);
    });
    canvas.addEventListener("pointermove", e => {
      if (state.dragPointer === e.pointerId) updateCenterFromPointer(e);
    });
    for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(eventName, e => { if (state.dragPointer === e.pointerId) state.dragPointer = null; });
    }
    canvas.addEventListener("keydown", e => {
      const step = e.shiftKey ? 24 : 12;
      if (e.key === "ArrowLeft") state.center.x -= step;
      else if (e.key === "ArrowRight") state.center.x += step;
      else if (e.key === "ArrowUp") state.center.y -= step;
      else if (e.key === "ArrowDown") state.center.y += step;
      else return;
      e.preventDefault();
      state.center.x = clamp(state.center.x, 16, state.width - 16);
      state.center.y = clamp(state.center.y, 16, state.height - 16);
      redraw();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.running) stop("Mouvement arrêté car l'onglet est masqué.");
    });
    window.addEventListener("pagehide", () => stop());
    if (reduce) {
      const onReduce = e => { if (e.matches && state.running) stop("Préférence de mouvement réduit détectée : champ mis en pause."); };
      if (reduce.addEventListener) reduce.addEventListener("change", onReduce);
      else if (reduce.addListener) reduce.addListener(onReduce);
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize, { passive: true });
    updateControls(); resize();
    tell(reduce && reduce.matches
      ? "Votre appareil préfère réduire les animations. Le champ reste immobile tant que vous ne démarrez pas le mouvement."
      : "Champ immobile à l'ouverture. Démarrez le mouvement uniquement si vous le souhaitez.");
  }
}
