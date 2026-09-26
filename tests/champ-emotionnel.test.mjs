import test from "node:test";
import assert from "node:assert/strict";
import { clamp, createParticles, advanceParticles, MODES } from "../assets/champ-physics.mjs";

test("Only the three declared visual modes are accepted", () => {
  assert.deepEqual(MODES, ["attraction", "vortex", "dispersion"]);
  assert.throws(() => advanceParticles([], 320, 280, {x:160,y:140}, {mode:"diagnosis",speed:30,intensity:50}, .03), RangeError);
});
test("A reset can reproduce the same anonymous visual frame", () => {
  const a = createParticles(80, 540, 380);
  const b = createParticles(80, 540, 380);
  assert.deepEqual(a, b);
  assert.equal(a.length, 80);
  assert.deepEqual(new Set(a.map(p => p.swarm)), new Set([0,1]));
});
test("Attraction moves a stationary particle toward its center", () => {
  const p = [{x:270,y:120,vx:0,vy:0,phase:0,swarm:0,size:1.5}];
  advanceParticles(p, 420, 300, {x:160,y:120}, {mode:"attraction",speed:50,intensity:60}, .05);
  assert.ok(p[0].vx < 0);
});
test("Vortex creates a tangential movement while retaining a center", () => {
  const p = [{x:270,y:120,vx:0,vy:0,phase:0,swarm:0,size:1.5}];
  advanceParticles(p, 420, 300, {x:160,y:120}, {mode:"vortex",speed:50,intensity:60}, .05);
  assert.ok(p[0].vy < 0);
});
test("Dispersion pushes outward and particles stay within the rectangle", () => {
  const p = [{x:270,y:120,vx:0,vy:0,phase:0,swarm:1,size:1.5}];
  for(let i=0;i<2000;i++) advanceParticles(p, 420, 300, {x:160,y:120}, {mode:"dispersion",speed:80,intensity:75}, .033);
  assert.ok(p[0].x >= 8 && p[0].x <= 412);
  assert.ok(p[0].y >= 8 && p[0].y <= 292);
});
test("Motion does not advance if dt is zero", () => {
  const p = createParticles(30, 320, 250);
  const before = structuredClone(p);
  advanceParticles(p, 320, 250, {x:160,y:120}, {mode:"vortex",speed:50,intensity:50}, 0);
  assert.deepEqual(p, before);
});
test("Population and controls stay in bounded public ranges", () => {
  assert.equal(createParticles(999999, 320, 280).length, 180);
  assert.equal(createParticles(0, 320, 280).length, 20);
  assert.equal(clamp(Infinity,10,100),10);
  for (const mode of MODES) {
    const p = createParticles(90, 320, 280);
    for (let n=0;n<1000;n++) advanceParticles(p,320,280,{x:0,y:1000},{mode,speed:1000,intensity:1000},.1);
    assert.ok(p.every(x => Number.isFinite(x.x) && Number.isFinite(x.y) && x.x >= 8 && x.x <= 312 && x.y >=8 && x.y <=272),mode);
  }
});
