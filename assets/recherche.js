"use strict";
/* Transparent, local-only filtering of bibliographic metadata and optional practices. */
(function(){
const studyHost=document.getElementById("research-list");
const practiceHost=document.getElementById("practice-list");
const search=document.getElementById("research-query");
const area=document.getElementById("research-area");
const type=document.getElementById("research-type");
const reset=document.getElementById("research-reset");
const status=document.getElementById("research-count");
if(!studyHost||!practiceHost||!search||!area||!type||!reset||!status)return;
let studies=[],practice=[],studyById=new Map();
const domains={cerveau:"Cerveau et régulation",nature:"Nature",activite:"Activité physique",contemplation:"Contemplation",yoga:"Yoga",respiration:"Respiration"};
const icon={nature:"✧",sport:"↗",contemplation:"◌",yoga:"◇",respiration:"≈",sommeil:"☾"};
function add(parent,tag,cls,label){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=label;parent.append(e);return e;}
function safe(url){try{const u=new URL(url);return u.protocol==="https:"?u.href:null;}catch(_){return null;}}
function external(parent,label,href,cls){const url=safe(href);if(!url)return;const a=document.createElement("a");a.href=url;a.textContent=label;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";if(cls)a.className=cls;parent.append(a);}
function drawStudies(){
  const term=search.value.trim().toLocaleLowerCase("fr");
  const rows=studies.filter(s=>(area.value==="all"||s.domain===area.value)&&(type.value==="all"||s.type===type.value)&&(!term||[s.shortTitle,s.authors,s.organisation_at_publication,s.title,s.result,s.limit,s.population,...s.practices.split(",")].join(" ").toLocaleLowerCase("fr").includes(term)));
  studyHost.replaceChildren();
  for(const s of rows){
    const card=document.createElement("article");card.className="study-card";card.id="paper-"+s.id;
    add(card,"span","tag",(domains[s.domain]||s.domain)+" · "+s.type);
    add(card,"h3","",s.shortTitle);
    add(card,"p","study-meta",s.authors+" · "+s.year);
    add(card,"p","study-meta",s.organisation_at_publication);
    add(card,"p","study-primary",s.result);
    const details=document.createElement("details");add(details,"summary","","Population, méthode et limites");
    add(details,"p","",s.population);add(details,"p","",s.limit);
    if(s.notes)add(details,"p","",s.notes);
    card.append(details);
    const links=document.createElement("div");links.className="study-links";
    external(links,"Publication ou source originale ↗",s.url);
    if(s.doi)add(links,"span","study-doi","DOI : "+s.doi);
    card.append(links);studyHost.append(card);
  }
  status.textContent=rows.length+" études et synthèses affichées sur "+studies.length+". Tri documentaire, sans classement de chercheurs ni profilage.";
}
function drawPractices(){
  practiceHost.replaceChildren();
  for(const p of practice){
    const card=document.createElement("article");card.className="practice-card";
    add(card,"span","practice-icon",icon[p.id]||"○");
    add(card,"h3","",p.title);
    add(card,"p","",p.description);
    add(card,"h4","","Ce que les études permettent de dire");add(card,"p","",p.whatWeKnow);
    add(card,"h4","","Une possibilité, sans obligation");add(card,"p","",p.tryExample);
    const details=document.createElement("details");add(details,"summary","","Précautions et limites");add(details,"p","",p.cautions);card.append(details);
    const links=document.createElement("div");links.className="practice-source";
    for(const id of p.studyRefs){const s=studyById.get(id);if(s)external(links,s.authors.split(",")[0]+" · "+s.year+" ↗",s.url);}
    card.append(links);practiceHost.append(card);
  }
}
fetch("./data/recherche.json",{credentials:"omit",cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Catalogue indisponible");return r.json();}).then(data=>{
  if(!Array.isArray(data.studies)||!Array.isArray(data.practices)||!data.studies.length)throw Error("Catalogue incomplet");
  studies=data.studies;practice=data.practices;studyById=new Map(studies.map(s=>[s.id,s]));
  for(const label of [...new Set(studies.map(s=>s.type))].sort((a,b)=>a.localeCompare(b,"fr"))){const opt=document.createElement("option");opt.value=label;opt.textContent=label;type.append(opt);}
  drawStudies();drawPractices();
}).catch(()=>{
  status.textContent="Catalogue détaillé momentanément indisponible. Trois sources et trois pratiques restent présentées ci-dessous.";
  for(const el of [search,area,type,reset])el.disabled=true;
});
search.addEventListener("input",()=>{if(studies.length)drawStudies();});
area.addEventListener("change",()=>{if(studies.length)drawStudies();});
type.addEventListener("change",()=>{if(studies.length)drawStudies();});
reset.addEventListener("click",()=>{search.value="";area.value="all";type.value="all";if(studies.length)drawStudies();});
})();