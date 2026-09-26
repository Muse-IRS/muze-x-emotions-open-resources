import test from "node:test";
import assert from "node:assert/strict";
import { attachFieldFullscreen } from "../assets/champ-fullscreen.mjs";

class Emitter {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) {
    const list = this.listeners.get(type) || [];
    list.push(fn);
    this.listeners.set(type, list);
  }
  async dispatch(type, event = {}) {
    for (const fn of this.listeners.get(type) || []) await fn(event);
  }
}
class Classes {
  constructor() { this.names = new Set(); }
  toggle(name, yes) { if (yes) this.names.add(name); else this.names.delete(name); }
  contains(name) { return this.names.has(name); }
}
function fixture(native = false) {
  const doc = new Emitter();
  doc.fullscreenElement = null;
  doc.body = { classList: new Classes() };
  const stage = new Emitter();
  stage.classList = new Classes();
  const button = new Emitter();
  button.attributes = {};
  button.setAttribute = (key, val) => { button.attributes[key] = val; };
  button.label = { textContent: "Plein écran" };
  button.querySelector = () => button.label;
  button.focus = () => {};
  const pause = new Emitter();
  pause.hidden = true;
  const events = { resize: 0, toggled: 0, messages: [] };
  if (native) {
    stage.requestFullscreen = async () => {
      doc.fullscreenElement = stage;
      await doc.dispatch("fullscreenchange");
    };
    doc.exitFullscreen = async () => {
      doc.fullscreenElement = null;
      await doc.dispatch("fullscreenchange");
    };
  }
  const control = attachFieldFullscreen({
    stage, button, pauseButton: pause, doc,
    onResize: () => { events.resize++; },
    onTogglePlay: () => { events.toggled++; },
    onStatus: msg => events.messages.push(msg)
  });
  return { doc, stage, button, pause, control, events };
}
test("Native fullscreen enters and exits with the same visible control", async () => {
  const f = fixture(true);
  await f.control.enter();
  assert.equal(f.control.isExpanded(), true);
  assert.equal(f.pause.hidden, false);
  assert.equal(f.button.attributes["aria-pressed"], "true");
  assert.equal(f.button.label.textContent, "Quitter le plein écran");
  await f.pause.dispatch("click");
  assert.equal(f.events.toggled, 1);
  await f.control.leave();
  assert.equal(f.control.isExpanded(), false);
  assert.equal(f.pause.hidden, true);
  assert.equal(f.button.attributes["aria-pressed"], "false");
});
test("Browser Escape leaving native fullscreen restores inline controls", async () => {
  const f = fixture(true);
  await f.control.enter();
  await f.doc.exitFullscreen();
  assert.equal(f.control.isExpanded(), false);
  assert.equal(f.button.attributes["aria-label"], "Afficher les essaims en plein écran");
});
test("CSS fallback restores scroll and layout with Escape", async () => {
  const f = fixture();
  await f.control.enter();
  assert.equal(f.control.isExpanded(), true);
  assert.ok(f.doc.body.classList.contains("champ-immersive-open"));
  let prevented = false;
  await f.doc.dispatch("keydown", { key: "Escape", preventDefault: () => { prevented = true; } });
  assert.ok(prevented);
  assert.equal(f.control.isExpanded(), false);
  assert.equal(f.doc.body.classList.contains("champ-immersive-open"), false);
  assert.equal(f.stage.classList.contains("is-fullscreen-fallback"), false);
});
test("Denied native fullscreen uses the CSS fallback", async () => {
  const f = fixture();
  f.stage.requestFullscreen = async () => { throw new Error("Not supported"); };
  await f.control.enter();
  assert.ok(f.stage.classList.contains("is-fullscreen-fallback"));
  await f.control.leave();
  assert.equal(f.control.isExpanded(), false);
});
