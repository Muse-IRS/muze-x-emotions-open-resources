"use strict";
(function(){
const list=document.getElementById("atlas-list"),status=document.getElementById("atlas-status"),search=document.getElementById("atlas-search"),period=document.getElementById("atlas-period"),family=document.getElementById("atlas-family"),reset=document.getElementById("atlas-reset"),buttons=Array.from(document.querySelectorAll("[data-topic]"));
if(!list||!status||!search||!period||!family||!reset)return;
let entries=[],topic="";
function node(parent,tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=content;parent.append(e);return e;}
function options(select,values){for(const value of [...new Set(values)].sort((a,b)=>a.localeCompare(b,"fr"))){const opt=document.createElement("option");opt.value=value;opt.textContent=value;select.append(opt);}}
function render(){
const q=search.value.trim().toLocaleLowerCase("fr");
const shown=entries.filter(r=>(!topic||r.topics.includes(topic))&&(period.value==="all"||r.period===period.value)&&(family.value==="all"||r.family===family.value)&&(!q||[r.title,r.region,r.family,r.question,r.summary,...r.topics].join(" ").toLocaleLowerCase("fr").includes(q)));
list.replaceChildren();
for(const r of shown){
const card=document.createElement("article");card.className="atlas-card";
node(card,"span","tag",r.region+" · "+r.period);node(card,"h3","",r.title);
node(card,"p","question",r.question);node(card,"p","",r.summary);
const details=document.createElement("details");node(details,"summary","","Précisions et limites");node(details,"p","",r.limit);card.append(details);
try{const u=new URL(r.source.url);if(u.protocol==="https:"){const a=document.createElement("a");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";a.textContent="Consulter la source ↗";card.append(a);node(card,"small","source-kind",r.source.title);}}catch(_){}
list.append(card);}
status.textContent=shown.length+" entrée(s) parmi "+entries.length+" · Catalogue introductif, non exhaustif, sans historique personnel.";
}
function sync(){buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.topic===topic)));}
for(const b of buttons){b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>{topic=topic===b.dataset.topic?"":b.dataset.topic;sync();render();document.getElementById("atlas").scrollIntoView({behavior:"auto",block:"start"});});}
for(const el of [search,period,family])el.addEventListener(el===search?"input":"change",render);
reset.addEventListener("click",()=>{topic="";search.value="";period.value="all";family.value="all";sync();render();});
fetch("./data/pensees.json",{credentials:"omit",cache:"no-store"}).then(r=>{if(!r.ok)throw Error("catalogue absent");return r.json();}).then(data=>{if(!Array.isArray(data.entries)||!data.entries.length)throw Error("catalogue invalide");entries=data.entries;options(period,entries.map(x=>x.period));options(family,entries.map(x=>x.family));render();}).catch(()=>{status.textContent="Catalogue détaillé momentanément indisponible. Trois exemples et leurs liens restent accessibles.";for(const x of [search,period,family,reset,...buttons])x.disabled=true;});
})();