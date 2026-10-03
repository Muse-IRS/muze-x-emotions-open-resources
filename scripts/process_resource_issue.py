#!/usr/bin/env python3
"""Qualify one GitHub resource proposal and append it to data/resources.json.

The script is intentionally offline: it validates the structure and internal
consistency of a proposal already reviewed by a maintainer. It never claims
that an external resource is scientifically valid merely because its URL or
metadata are syntactically acceptable.
"""
from __future__ import annotations

import argparse
from datetime import date
import json
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import urlparse

FIELD_ALIASES = {
    "Titre de la ressource": "title",
    "URL de la source originale": "url",
    "Auteur ou organisme public": "creator",
    "Auteur, chaîne ou organisme à la source": "creator",
    "Catégorie": "category",
    "Langue": "language",
    "Apport pédagogique": "educational",
    "Conditions d'accès et de réutilisation": "rights",
}
CATEGORY_MAP = {
    "Vidéo": "video",
    "Podcast": "podcast",
    "Article": "article",
    "Fiche": "fiche",
    "Cours": "course",
    "Autre": "reference",
}
HOSTING_PLATFORMS = {
    "youtube", "youtube.com", "youtu.be", "vimeo", "vimeo.com",
    "spotify", "spotify.com", "github", "github.com", "dailymotion",
    "dailymotion.com", "soundcloud", "soundcloud.com",
}
EMPTY_MARKERS = {"", "_No response_", "No response", "N/A", "n/a"}


def clean(value: str) -> str:
    value = value.strip()
    return "" if value in EMPTY_MARKERS else value


def parse_issue_body(body: str) -> dict[str, str]:
    matches = list(re.finditer(r"^###\s+(.+?)\s*$", body or "", flags=re.MULTILINE))
    values: dict[str, str] = {}
    for i, match in enumerate(matches):
        heading = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        segment = clean(body[start:end])
        key = FIELD_ALIASES.get(heading)
        if key:
            values[key] = segment
    return values


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return slug[:48] or "resource"


def validate(issue: dict, fields: dict[str, str], catalog: dict) -> list[str]:
    errors: list[str] = []
    if issue.get("state") != "open":
        errors.append("L'issue doit être ouverte au moment de la qualification.")

    required = ("title", "url", "creator", "category", "language", "educational")
    for key in required:
        if not fields.get(key):
            errors.append(f"Champ manquant ou vide : {key}.")

    url = fields.get("url", "")
    parsed = urlparse(url)
    if url and (parsed.scheme != "https" or not parsed.netloc):
        errors.append("L'URL source doit être une URL HTTPS complète.")

    category = fields.get("category", "")
    if category and category not in CATEGORY_MAP:
        errors.append(f"Catégorie non reconnue : {category}.")

    creator = fields.get("creator", "").strip().lower()
    creator_normalized = re.sub(r"^https?://(www\.)?", "", creator).rstrip("/")
    if creator and (creator in HOSTING_PLATFORMS or creator_normalized in HOSTING_PLATFORMS):
        errors.append(
            "Le champ créateur désigne une plateforme d'hébergement. "
            "Indiquer la chaîne, l'auteur ou l'organisme qui publie réellement la ressource."
        )

    issue_url = issue.get("html_url", "")
    for row in catalog.get("resources", []):
        if url and row.get("url") == url:
            errors.append("Cette URL est déjà présente dans le catalogue.")
        if issue_url and row.get("source_issue") == issue_url:
            errors.append("Cette issue a déjà été publiée dans le catalogue.")

    return errors


def build_entry(issue: dict, fields: dict[str, str]) -> dict:
    issue_number = int(issue["number"])
    rights = fields.get("rights", "").strip()
    if not rights:
        rights = (
            "Lien vers la source originale ; conditions de réutilisation non précisées "
            "dans la proposition. Aucun média tiers n'est copié par Muze-X."
        )
    return {
        "id": f"issue-{issue_number}-{slugify(fields['title'])}",
        "kind": CATEGORY_MAP[fields["category"]],
        "title": fields["title"].strip(),
        "creator": fields["creator"].strip(),
        "url": fields["url"].strip(),
        "language": fields["language"].strip().lower(),
        "topics": [],
        "description": fields["educational"].strip(),
        "rights": rights,
        "status": "SOURCE_EXTERNE",
        "source_issue": issue["html_url"],
        "reviewed_on": date.today().isoformat(),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue-json", required=True, type=Path)
    parser.add_argument("--catalog", required=True, type=Path)
    args = parser.parse_args()

    issue = json.loads(args.issue_json.read_text(encoding="utf-8"))
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    fields = parse_issue_body(issue.get("body") or "")
    errors = validate(issue, fields, catalog)

    if errors:
        print("NEEDS_INFORMATION")
        for error in errors:
            print(f"- {error}")
        print("\nAucune ressource n'a été ajoutée au catalogue.")
        return 2

    entry = build_entry(issue, fields)
    catalog.setdefault("resources", []).append(entry)
    catalog["verified_on"] = date.today().isoformat()
    args.catalog.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("ACCEPTED_FOR_PUBLICATION")
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
