/* Local-only catalogue filtering; no analytics, persistence or personal profiling. */
"use strict";
(function(){
  const search=document.getElementById("resource-search");
  const filter=document.getElementById("resource-filter");
  const list=document.getElementById("resource-list");
  const status=document.getElementById("resource-status");
  const print=document.getElementById("print-exercise");
  if(print){print.addEventListener("click",()=>window.print());}

  const ensureConcordance=()=>{
    const resourcesSection=document.getElementById("ressources");
    if(!resourcesSection||document.getElementById("concordance")){return;}

    const section=document.createElement("section");
    section.id="concordance";
    section.className="wrap section";

    const eyebrow=document.createElement("p");
    eyebrow.className="eyebrow";
    eyebrow.textContent="Méthode de lecture · Provenance · Concordance";

    const h=document.createElement("h2");
    h.textContent="Le vendeur de kebab : relier les traces au réel.";

    const lead=document.createElement("p");
    lead.className="section-lead";
    lead.textContent="« Le vendeur de kebab » est une expérience de pensée fictive. Elle rappelle qu'une parole, une étiquette, un document ou une URL constitue une trace, mais ne démontre pas automatiquement l'auteur, l'origine, le contenu ou le fait auquel on la rattache. La méthode examine les relations, leur provenance et leur indépendance avant de conclure.";

    const grid=document.createElement("div");
    grid.className="three-col";
    const cards=[
      ["01","Trace","Identifier ce qui existe réellement : déclaration, fichier, URL, objet ou document."],
      ["02","Provenance","Rechercher d'où vient l'information et distinguer plusieurs copies d'une même source de plusieurs sources réellement indépendantes."],
      ["03","Qualification","Conserver comme résultat possible une relation établie, divergente, indéterminée ou non recherchée, sans transformer l'incertitude en accusation."]
    ];
    for(const [number,title,description] of cards){
      const article=document.createElement("article");article.className="step";
      const no=document.createElement("span");no.className="step-no";no.textContent=number;
      const ch=document.createElement("h3");ch.textContent=title;
      const cp=document.createElement("p");cp.textContent=description;
      article.append(no,ch,cp);grid.append(article);
    }

    const note=document.createElement("div");
    note.className="note";
    const strong=document.createElement("strong");strong.textContent="Deux invariants :";
    note.append(strong,document.createElement("br"),document.createTextNode("TRACE ≠ FAIT"),document.createElement("br"),document.createTextNode("RÉPLICATION DOCUMENTAIRE ≠ CORROBORATION INDÉPENDANTE"));

    const actions=document.createElement("div");actions.className="actions";
    const conceptLink=document.createElement("a");conceptLink.className="button main-button";conceptLink.href="le-vendeur-de-kebab.html";conceptLink.textContent="Découvrir l'expérience de pensée ↗";
    const resourceLink=document.createElement("a");resourceLink.className="text-link";resourceLink.href="#ressources";resourceLink.textContent="Voir son application aux ressources →";
    actions.append(conceptLink,resourceLink);

    section.append(eyebrow,h,lead,grid,note,actions);
    resourcesSection.insertAdjacentElement("beforebegin",section);

    const nav=document.querySelector(".top nav");
    if(nav&&!nav.querySelector('a[href="#concordance"]')){
      const link=document.createElement("a");link.href="#concordance";link.textContent="Concordance";
      const resourcesLink=nav.querySelector('a[href="#ressources"]');
      if(resourcesLink){nav.insertBefore(link,resourcesLink);}else{nav.append(link);}
    }
  };
  ensureConcordance();

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
      card.append(badge,h,desc,link);
      const issueUrl=safeUrl(r.source_issue);
      if(issueUrl){
        const provenance=document.createElement("p");provenance.className="small";
        provenance.append(document.createTextNode("Provenance éditoriale : "));
        const issueLink=document.createElement("a");issueLink.href=issueUrl;issueLink.target="_blank";issueLink.rel="noopener noreferrer";issueLink.referrerPolicy="no-referrer";issueLink.textContent="proposition GitHub ↗";
        provenance.appendChild(issueLink);card.appendChild(provenance);
      }
      list.append(card);
    }
    status.textContent=matches.length+" ressource(s) publiée(s) après revue éditoriale. Publication ≠ validation scientifique intégrale.";
  };
  search.addEventListener("input",display);
  filter.addEventListener("change",display);
  fetch("./data/resources.json",{cache:"no-store",credentials:"omit"})
    .then(r=>{if(!r.ok)throw Error("catalogue unavailable");return r.json()})
    .then(data=>{if(!Array.isArray(data.resources))throw Error("invalid catalogue");resources=data.resources;display();})
    .catch(()=>{list.innerHTML=fallback;status.textContent="Catalogue local indisponible : trois sources accessibles ci-dessous. Ouvrez le site via GitHub Pages pour la recherche dynamique.";search.disabled=true;filter.disabled=true;});
})();
