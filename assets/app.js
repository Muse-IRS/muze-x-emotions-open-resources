/* Local-only catalogue filtering; no analytics, persistence or personal profiling. */
"use strict";
(function(){
  const search=document.getElementById("resource-search");
  const filter=document.getElementById("resource-filter");
  const list=document.getElementById("resource-list");
  const status=document.getElementById("resource-status");
  const print=document.getElementById("print-exercise");
  if(print){print.addEventListener("click",()=>window.print());}
  if(!search||!filter||!list||!status){return;}
  const fallback=list.innerHTML;
  const labels={reference:"Référence",fiche:"Fiche",video:"Vidéo",podcast:"Podcast",article:"Article",course:"Cours"};
  let resources=null;
  const safeUrl=(u)=>{try{const v=new URL(u);return v.protocol==="https:"?v.href:null;}catch(_){return null;}};
  const display=()=>{
    if(!resources){return;}
    const q=search.value.trim().toLocaleLowerCase("fr");
    const type=filter.value;
    const matches=resources.filter(r=>(type==="all"||r.kind===type)&&(!q||[r.title,r.creator,r.description,...(r.topics||[])].join(" ").toLocaleLowerCase("fr").includes(q)));
    list.replaceChildren();
    for(const r of matches){
      const url=safeUrl(r.url);if(!url)continue;
      const card=document.createElement("article");card.className="resource";
      const badge=document.createElement("span");badge.className="tag";badge.textContent=labels[r.kind]||r.kind||"Ressource";
      const h=document.createElement("h3");h.textContent=r.title;
      const desc=document.createElement("p");desc.textContent=(r.creator?r.creator+" · ":"")+r.description;
      const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.referrerPolicy="no-referrer";link.textContent="Consulter la source ↗";
      card.append(badge,h,desc,link);list.append(card);
    }
    status.textContent=matches.length+" ressource(s) affichée(s). Sources indexées et non automatiquement approuvées.";
  };
  search.addEventListener("input",display);
  filter.addEventListener("change",display);
  fetch("./data/resources.json",{cache:"no-store",credentials:"omit"})
    .then(r=>{if(!r.ok)throw Error("catalogue unavailable");return r.json()})
    .then(data=>{if(!Array.isArray(data.resources))throw Error("invalid catalogue");resources=data.resources;display();})
    .catch(()=>{list.innerHTML=fallback;status.textContent="Catalogue local indisponible : trois sources accessibles ci-dessous. Ouvrez le site via GitHub Pages pour la recherche dynamique.";search.disabled=true;filter.disabled=true;});
})();
