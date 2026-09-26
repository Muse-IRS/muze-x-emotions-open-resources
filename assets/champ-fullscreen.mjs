/**
 * Fullscreen for the public visual field. The native Fullscreen API is used
 * when available; a viewport-sized CSS fallback supports browsers that do
 * not allow arbitrary HTML elements to enter native fullscreen.
 * No telemetry, storage, or network requests.
 */
export function attachFieldFullscreen({ stage, button, pauseButton, doc, onResize, onTogglePlay, onStatus }) {
  let fallback = false;
  let nativeSession = false;
  const label = button.querySelector("[data-fullscreen-label]");
  const expanded = () => fallback || doc.fullscreenElement === stage;
  function sync() {
    const active = expanded();
    stage.classList.toggle("is-fullscreen", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "Quitter le plein écran" : "Afficher les essaims en plein écran");
    button.title = active ? "Revenir à la présentation initiale" : "Agrandir le champ comme une vidéo";
    if (label) label.textContent = active ? "Quitter le plein écran" : "Plein écran";
    pauseButton.hidden = !active;
    onResize();
  }
  function setFallback(active) {
    fallback = active;
    stage.classList.toggle("is-fullscreen-fallback", active);
    doc.body.classList.toggle("champ-immersive-open", active);
  }
  const refocus = () => { if (typeof button.focus === "function") button.focus({ preventScroll: true }); };
  async function enter() {
    // Called synchronously by a genuine click; the browser retains user activation.
    if (typeof stage.requestFullscreen === "function") {
      try {
        await stage.requestFullscreen({ navigationUI: "hide" });
        if (doc.fullscreenElement === stage) {
          nativeSession = true;
          sync();
          onStatus("Champ en plein écran. Échap ou le bouton Quitter le plein écran rétablit la présentation initiale.");
          refocus();
          return;
        }
      } catch (_) { /* Not permitted: switch to the visible CSS alternative. */ }
    }
    setFallback(true);
    sync();
    onStatus("Champ agrandi à la fenêtre. Utilisez Quitter le plein écran, ou Échap sur un clavier.");
    refocus();
  }
  async function leave() {
    if (fallback) {
      setFallback(false);
      sync();
      onStatus("Présentation initiale retrouvée. Vos réglages et les essaims sont conservés.");
      refocus();
      return;
    }
    if (doc.fullscreenElement === stage && typeof doc.exitFullscreen === "function") {
      try {
        await doc.exitFullscreen();
        nativeSession = false;
        sync();
        onStatus("Présentation initiale retrouvée. Vos réglages et les essaims sont conservés.");
        refocus();
      } catch (_) {
        onStatus("Le navigateur n'a pas pu quitter le plein écran. Utilisez la touche Échap.");
      }
    }
  }
  button.addEventListener("click", () => expanded() ? leave() : enter());
  pauseButton.addEventListener("click", onTogglePlay);
  doc.addEventListener("fullscreenchange", () => {
    if (nativeSession && doc.fullscreenElement !== stage) {
      nativeSession = false;
      sync();
      onStatus("Présentation initiale retrouvée. Vos réglages et les essaims sont conservés.");
      refocus();
    } else sync();
  });
  doc.addEventListener("keydown", event => {
    if (event.key === "Escape" && fallback) {
      event.preventDefault();
      return leave();
    }
  });
  sync();
  return { isExpanded: expanded, enter, leave };
}
