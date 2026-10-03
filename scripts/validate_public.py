#!/usr/bin/env python3
"""Static checks for public content; no network or external dependencies."""
from pathlib import Path
import json
from html.parser import HTMLParser
from urllib.parse import urlparse

REQUIRED = [
    "README.md", "LICENSE", "CONTENT_LICENSE.md", "NOTICE.md",
    "VALUES.md", "DATA_RIGHTS.md", "CONTRIBUTING.md", "SECURITY.md",
    "index.html", "privacy.html", "valeurs.html", "pensees.html", "recherche.html", "le-vendeur-de-kebab.html", "assets/styles.css",
    "assets/pensees.css", "assets/pensees.js", "data/pensees.json",
    "assets/recherche.css", "assets/recherche.js", "data/recherche.json", "RESEARCH_POLICY.md",
    "champ-emotionnel.html", "assets/champ-emotionnel.css",
    "assets/champ-emotionnel.mjs", "assets/champ-physics.mjs",
    "tests/champ-emotionnel.test.mjs", "tests/champ-fullscreen.test.mjs",
    "assets/champ-fullscreen.mjs", "CHAMP_EMOTIONNEL_DESIGN.md",
    "assets/app.js", "data/resources.json", ".nojekyll",
    ".github/ISSUE_TEMPLATE/proposer-ressource.yml",
    ".github/workflows/publish-resource-proposal.yml",
    "scripts/process_resource_issue.py",
]
for name in REQUIRED:
    assert Path(name).is_file(), f"Missing public file: {name}"

class PublicHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.bad = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            assert a["id"] not in self.ids, f"Duplicate id: {a['id']}"
            self.ids.add(a["id"])
        if tag == "script" and a.get("src", "").startswith(("http://", "https://")):
            self.bad.append("third-party script")
        if tag in {"iframe", "form"}:
            self.bad.append("remote embed or form")
        if tag == "a":
            self.links.append(a.get("href", ""))

HTML_PAGES = (
    "index.html", "privacy.html", "valeurs.html", "pensees.html", "recherche.html",
    "champ-emotionnel.html", "le-vendeur-de-kebab.html",
)
for page in HTML_PAGES:
    text = Path(page).read_text(encoding="utf-8")
    parser = PublicHTML()
    parser.feed(text)
    assert not parser.bad, (page, parser.bad)
    assert 'lang="fr"' in text
    assert "Content-Security-Policy" in text
    assert "referrer" in text
    for link in parser.links:
        if link.startswith(("./", "https://", "#")):
            continue
        assert Path(link.split("#")[0]).is_file(), (page, link)

concept = Path("le-vendeur-de-kebab.html").read_text(encoding="utf-8")
for marker in (
    "Le vendeur de kebab", "expérience de pensée fictive", "TRACE ≠ FAIT",
    "PROPOSER → QUALIFIER", "plateforme d’hébergement",
):
    assert marker in concept, f"Missing public concordance explanation: {marker}"

catalog = json.loads(Path("data/resources.json").read_text(encoding="utf-8"))
assert catalog["version"] and isinstance(catalog["resources"], list)
ids = set()
urls = set()
issues = set()
for row in catalog["resources"]:
    assert {"id","kind","title","creator","url","description","rights","status"} <= row.keys()
    assert urlparse(row["url"]).scheme == "https"
    assert row["id"] not in ids
    assert row["url"] not in urls
    ids.add(row["id"])
    urls.add(row["url"])
    if row["id"].startswith("issue-"):
        assert row.get("source_issue"), "Issue-derived resource must preserve provenance"
        assert urlparse(row["source_issue"]).scheme == "https"
        assert row["source_issue"] not in issues
        assert row.get("reviewed_on"), "Issue-derived resource must preserve review date"
        issues.add(row["source_issue"])

proposal_script = Path("scripts/process_resource_issue.py").read_text(encoding="utf-8")
compile(proposal_script, "scripts/process_resource_issue.py", "exec")
for marker in (
    "HOSTING_PLATFORMS", "NEEDS_INFORMATION", "source_issue",
    "Cette issue a déjà été publiée", "plateforme d'hébergement",
):
    assert marker in proposal_script, f"Missing proposal gate marker: {marker}"
workflow = Path(".github/workflows/publish-resource-proposal.yml").read_text(encoding="utf-8")
assert "workflow_dispatch" in workflow
assert "contents: write" in workflow and "issues: write" in workflow
assert "process_resource_issue.py" in workflow
assert "gh issue comment" in workflow
assert "git push origin HEAD:main" in workflow

# Guard against unintentionally publishing private research or case files.
for path in Path(".").rglob("*"):
    if ".git" in path.parts or not path.is_file():
        continue
    assert path.suffix.lower() not in {".zip", ".pdf", ".xlsx", ".docx", ".har"}
    if path.suffix.lower() in {".html", ".js", ".mjs", ".css", ".json", ".md", ".yml", ".py"}:
        content = path.read_text(encoding="utf-8")
        for forbidden in ("PGC-IA-Collaborative", "rsa-formation-data-evidence-control",
                          "BEGIN PRIVATE KEY", "sk-proj-", "ghp_"):
            assert forbidden not in content, f"Restricted marker {forbidden} in {path}"

thoughts = json.loads(Path("data/pensees.json").read_text(encoding="utf-8"))
thought_entries = thoughts.get("entries", [])
assert len(thought_entries) >= 25, "Atlas seed unexpectedly incomplete"
thought_ids = set()
for entry in thought_entries:
    assert {"id","title","region","period","family","topics","question","summary","limit","source"} <= entry.keys()
    assert entry["id"] not in thought_ids
    thought_ids.add(entry["id"])
    assert entry["topics"] and entry["limit"].strip()
    assert urlparse(entry["source"]["url"]).scheme == "https"
research = json.loads(Path("data/recherche.json").read_text(encoding="utf-8"))
studies, practices = research.get("studies", []), research.get("practices", [])
assert len(studies) >= 12 and len(practices) >= 6
study_ids = set()
for study in studies:
    assert {"id", "domain", "type", "year", "shortTitle", "authors", "organisation_at_publication", "title", "url", "population", "result", "limit", "practices"} <= study.keys()
    assert study["id"] not in study_ids
    study_ids.add(study["id"])
    assert urlparse(study["url"]).scheme == "https"
    assert study["population"].strip() and study["limit"].strip()
for practice in practices:
    assert {"id", "title", "description", "whatWeKnow", "tryExample", "cautions", "studyRefs"} <= practice.keys()
    assert practice["studyRefs"] and all(ref in study_ids for ref in practice["studyRefs"])
    assert practice["cautions"].strip()
# Champ interactif : la page et le contrôleur doivent exposer des contrôles explicites,
# l'état local non persistant et le support d'un arrêt immédiat.
field = Path("champ-emotionnel.html").read_text(encoding="utf-8")
controller = Path("assets/champ-emotionnel.mjs").read_text(encoding="utf-8")
engine = Path("assets/champ-physics.mjs").read_text(encoding="utf-8")
for element_id in ("champ-canvas", "champ-play", "champ-reset", "champ-speed",
                   "champ-intensity", "champ-density", "champ-slow", "champ-air",
                   "champ-recenter", "champ-status", "champ-fullscreen", "champ-fullscreen-play"):
    assert 'id="' + element_id + '"' in field, "Missing accessible field control: " + element_id
for mode in ("attraction", "vortex", "dispersion"):
    assert 'data-mode="' + mode + '"' in field
    assert '"' + mode + '"' in engine
assert 'type="module"' in field
assert 'aria-pressed' in field and 'tabindex="0"' in field
assert "document.hidden" in controller and "prefers-reduced-motion" in controller
assert "requestAnimationFrame" in controller and "cancelAnimationFrame" in controller
fullscreen = Path("assets/champ-fullscreen.mjs").read_text(encoding="utf-8")
assert "requestFullscreen" in fullscreen and "exitFullscreen" in fullscreen
assert "fullscreenchange" in fullscreen and "Escape" in fullscreen
assert "is-fullscreen-fallback" in fullscreen
assert "rescaleParticles" in controller and "rescaleParticles" in engine
for forbidden in ("fetch(", "localStorage", "sessionStorage", "sendBeacon", "XMLHttpRequest",
                  "navigator.geolocation", "getUserMedia"):
    assert forbidden not in controller and forbidden not in engine and forbidden not in fullscreen, "Privacy boundary violation: " + forbidden
print(f"Validation OK: {len(REQUIRED)} files, {len(HTML_PAGES)} HTML pages, {len(thought_entries)} atlas entries, {len(studies)} scientific references, {len(practices)} optional practices, qualified resource pipeline, interactive field privacy checks.")
