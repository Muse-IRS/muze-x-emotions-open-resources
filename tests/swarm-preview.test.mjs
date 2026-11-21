import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {getQuality,createClock} from "../swarm/app.mjs";
import {MODES,forceForMode,createParticles} from "../swarm/physics.mjs";
const html=readFileSync("swarm/index.html","utf8"), css=readFileSync("swarm/styles.css","utf8");
const app=readFileSync("swarm/app.mjs","utf8"), model=readFileSync("swarm/physics.mjs","utf8");
test("SWARM-only export: 7 visual markers and 4 deliberate controls",()=>{
  for(const name of ["PRIME","LOG","MOD","BOOL","SHANNON","HASH","CRYPTO"])assert.ok(html.includes(">"+name+"</strong>"));
  for(const mode of ["attraction","dispersion","vortex","calme"])assert.ok(html.includes('data-mode="'+mode+'"'));
  assert.match(html,/connect-src 'none'/);
  assert.doesNotMatch(html,/nomisma-leibniz|time\/henoch|numbers\/systems/);
});
test("tablet quality improves touch refresh under bounded pixels",()=>{
  const p=getQuality(1024,768,2,6,true,false);
  assert.equal(p.paintEvery,1);
  assert.ok(p.dpr<=1.65&&1024*768*p.dpr**2<=2200001);
  assert.ok(p.globalCount<=360&&p.localCount===112);
  const m=getQuality(390,844,3,4,true,false);
  assert.equal(m.paintEvery,2);assert.ok(m.dpr<=1.5);
  assert.equal(getQuality(1024,768,2,6,true,true).streaks,false);
});
test("field keeps separate attraction/dispersion/vortex forces",()=>{
  const p={x:20,y:20,z:0.8,team:0,phase:0}, t={x:120,y:20,radius:0};
  assert.ok(forceForMode(p,t,"attraction").x>0);
  assert.ok(forceForMode(p,t,"dispersion").x<0);
  assert.ok(Number.isFinite(forceForMode(p,t,"vortex").y));
  assert.ok(MODES.includes("vortex")&&createParticles(30,600,450).length===30);
});
test("tablet gesture bounded to field, no collection",()=>{
  assert.ok(css.includes("touch-action: none"));
  assert.ok(css.includes("pointer: coarse")&&css.includes("prefers-reduced-motion"));
  assert.ok(app.includes("event.clientX >= field.left"));
  for(const text of [app,model]) for(const word of ["fetch(", "localStorage", "sessionStorage", "XMLHttpRequest","sendBeacon","WebSocket"]) assert.equal(text.includes(word),false,word);
});
test("bounded time and honest scientific status",()=>{
  const clock=createClock();
  assert.equal(clock.advance(0),0);assert.ok(clock.advance(1000)<=3);
  assert.ok(html.includes("métaphore visuelle ≠ modèle scientifique"));
  assert.ok(html.includes("Apache-2.0"));
});
