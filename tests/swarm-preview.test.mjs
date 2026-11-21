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

import {commonsPointerForce, commonsRingForce} from "../swarm/physics.mjs";

test("Open Learning Commons: exactly two teams, alternating cyan/violet in both regions",()=>{
  const globals=createParticles(20,800,500,2026);
  const locals=createParticles(20,500,300,2027);
  for(const group of [globals,locals]){
    assert.deepEqual(new Set(group.map(p=>p.team)),new Set([0,1]));
    assert.equal(group.filter(p=>p.team===0).length,10);
    assert.equal(group.filter(p=>p.team===1).length,10);
  }
  assert.match(app,/\"89, 222, 255\", \"190, 125, 255\"/);
  assert.match(html,/Essaim cyan · groupe A/);
  assert.match(html,/Essaim violet · groupe B/);
});
test("Commons pointer: attraction and dispersion reverse radial direction",()=>{
  const p={team:0,z:0.8,x:80,y:110};
  const pointer={active:true,x:200,y:110,pressure:0.6};
  assert.ok(commonsPointerForce(p,pointer,"attraction",700,500).x>0);
  assert.ok(commonsPointerForce(p,pointer,"dispersion",700,500).x<0);
  assert.deepEqual(commonsPointerForce(p,pointer,"calme",700,500),{x:0,y:0});
  assert.deepEqual(commonsPointerForce(p,{...pointer,active:false},"vortex",700,500),{x:0,y:0});
});
test("Commons vortex: opposite tangential rotation of cyan vs violet",()=>{
  const pointer={active:true,x:200,y:100,pressure:0};
  const a=commonsPointerForce({team:0,x:100,y:100,z:0.6},pointer,"vortex",800,600);
  const b=commonsPointerForce({team:1,x:100,y:100,z:0.6},pointer,"vortex",800,600);
  assert.ok(a.y>0&&b.y<0);
  assert.ok(a.x>0&&b.x>0);
  assert.ok(Math.abs(a.y+b.y)<1e-12);
});
test("Commons anchor: radial correction to the ring and team-dependent spin",()=>{
  const anchor={active:true,x:100,y:100,radius:50,strength:0.7};
  const outer=commonsRingForce({team:0,x:200,y:100,z:0.8},anchor);
  assert.ok(outer.x<0);
  const inner=commonsRingForce({team:0,x:120,y:100,z:0.8},anchor);
  assert.ok(inner.x>0);
  const onRingA=commonsRingForce({team:0,x:151.5,y:100,z:0.8},anchor);
  const onRingB=commonsRingForce({team:1,x:151.5,y:100,z:0.8},anchor);
  assert.ok(onRingA.y>0&&onRingB.y<0);
  assert.deepEqual(commonsRingForce({team:0,x:151,y:100,z:0.8},{...anchor,active:false}),{x:0,y:0});
});
test("Boundary: no private Lab source imported, content remains local and license is credited",()=>{
  assert.match(html,/Swarm Field Lab d’Open Learning Commons/);
  assert.match(html,/Deux essaims cyan et violet/);
  assert.match(model,/Commons/);
  assert.ok(app.includes('from "./physics.mjs"'));
  assert.ok(!html.includes('src="https://'));
});
