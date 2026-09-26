#!/usr/bin/env python3
"""Static checks for public content; no network or external dependencies."""
from pathlib import Path
import json
from html.parser import HTMLParser
from urllib.parse import urlparse

REQUIRED = [
    "README.md", "LICENSE", "CONTENT_LICENSE.md", "NOTICE.md",
    "VALUES.md", "DATA_RIGHTS.md", "CONTRIBUTING.md", "SECURITY.md",
    "index.html", "privacy.html", "valeurs.html", "pensees.html", "recherche.html", "assets/styles.css",
    "assets/pensees.css", "assets/pensees.js", "data/pensees.json",
    "assets/recherche.css", "assets/recherche.js", "data/recherche.json", "RESEARCH_POLICY.md",
    "assets/app.js", "data/resources.json", ".nojekyll",
    ".github/ISSUE_TEMPLATE/proposer-ressource.yml",
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

for page in ("index.html", "privacy.html", "valeurs.html", "pensees.html", "recherche.html"):
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

catalog = json.loads(Path("data/resources.json").read_text(encoding="utf-8"))
assert catalog["version"] and isinstance(catalog["resources"], list)
ids = set()
for row in catalog["resources"]:
    assert {"id","kind","title","creator","url","description","rights","status"} <= row.keys()
    assert urlparse(row["url"]).scheme == "https"
    assert row["id"] not in ids
    ids.add(row["id"])

# Guard against unintentionally publishing private research or case files.
for path in Path(".").rglob("*"):
    if ".git" in path.parts or not path.is_file():
        continue
    assert path.suffix.lower() not in {".zip", ".pdf", ".xlsx", ".docx", ".har"}
    if path.suffix.lower() in {".html", ".js", ".css", ".json", ".md", ".yml"}:
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
print(f"Validation OK: {len(REQUIRED)} files, 5 HTML pages, {len(thought_entries)} atlas entries, {len(studies)} scientific references, {len(practices)} optional practices.")
