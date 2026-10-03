#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "process_resource_issue.py"
spec = importlib.util.spec_from_file_location("resource_proposal", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(module)


class ResourceProposalTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {"version": "test", "resources": []}

    def issue(self, body: str):
        return {
            "number": 7,
            "state": "open",
            "html_url": "https://github.com/example/repo/issues/7",
            "body": body,
        }

    def test_valid_proposal_is_accepted(self):
        body = """### Titre de la ressource
Une ressource test

### URL de la source originale
https://example.org/resource

### Auteur, chaîne ou organisme à la source
Organisme Exemple

### Catégorie
Article

### Langue
fr

### Apport pédagogique
Présente un exemple public et documenté.

### Conditions d'accès et de réutilisation
Lien public ; droits du contenu inchangés.
"""
        issue = self.issue(body)
        fields = module.parse_issue_body(issue["body"])
        self.assertEqual(module.validate(issue, fields, self.catalog), [])
        entry = module.build_entry(issue, fields)
        self.assertEqual(entry["kind"], "article")
        self.assertEqual(entry["creator"], "Organisme Exemple")
        self.assertEqual(entry["source_issue"], issue["html_url"])

    def test_hosting_platform_and_missing_language_require_information(self):
        body = """### Titre de la ressource
Une vidéo test

### URL de la source originale
https://youtu.be/example

### Auteur ou organisme public
YouTube

### Catégorie
Vidéo

### Apport pédagogique
Description factuelle.

### Conditions d'accès et de réutilisation
_No response_
"""
        issue = self.issue(body)
        fields = module.parse_issue_body(issue["body"])
        errors = module.validate(issue, fields, self.catalog)
        self.assertTrue(any("language" in error for error in errors))
        self.assertTrue(any("plateforme d'hébergement" in error for error in errors))

    def test_duplicate_issue_is_rejected(self):
        body = """### Titre de la ressource
Une ressource test

### URL de la source originale
https://example.org/resource

### Auteur, chaîne ou organisme à la source
Organisme Exemple

### Catégorie
Fiche

### Langue
fr

### Apport pédagogique
Description.
"""
        issue = self.issue(body)
        self.catalog["resources"] = [{
            "id": "existing",
            "kind": "fiche",
            "title": "Ancienne",
            "creator": "Org",
            "url": "https://example.org/other",
            "description": "x",
            "rights": "x",
            "status": "SOURCE_EXTERNE",
            "source_issue": issue["html_url"],
        }]
        fields = module.parse_issue_body(issue["body"])
        errors = module.validate(issue, fields, self.catalog)
        self.assertTrue(any("déjà été publiée" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
