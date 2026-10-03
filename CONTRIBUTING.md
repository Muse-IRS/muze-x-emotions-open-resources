# Contribuer aux ressources ouvertes

Toute contribution est facultative. Cette version utilise **GitHub Issues** pour proposer une ressource et des **pull requests** pour proposer des corrections de fichiers. Un compte GitHub est nécessaire pour ces actions ; pas pour consulter le site.

## Ressource admissible

Une vidéo, un podcast, un article, un cours, une fiche ou un outil qui aide à comprendre les émotions, le recul, les compétences psychosociales ou les contextes concrets d'accompagnement.

Indiquer **titre, auteur ou chaîne à la source, URL canonique, catégorie, langue, résumé factuel, raison pédagogique et droits d'utilisation si connus**. Proposer un lien et des métadonnées : ne pas téléverser une copie d'un média protégé sans autorisation explicite.

La plateforme d'hébergement n'est pas automatiquement l'auteur. Pour une vidéo, par exemple, indiquer la chaîne ou l'organisme qui la publie plutôt que simplement « YouTube ».

## Frontière protectrice

**Ne jamais publier** : identité, parcours RSA, dossier de bénéficiaire, certificat, numéro de dossier, courriel privé, données de santé ou vie intime, entretien confidentiel, photographie d'une personne identifiable sans son accord ou donnée issue d'un organisme sans droit de diffusion.

Éviter les témoignages personnels même anonymisés : une combinaison de détails peut réidentifier une personne. Utiliser des **situations fictives** pour les exercices. Ne pas envoyer de pièces justificatives en issue ni dans les commits.

## Publication : proposition ≠ ressource publiée

Une proposition ne vaut ni validation scientifique, ni approbation institutionnelle, ni autorisation d'incorporer le média à ce dépôt. La revue porte sur la pertinence, l'accès, la source, la compréhension, la provenance et la conformité aux droits.

Le flux public est volontairement borné :

```text
PROPOSER
 -> QUALIFIER
 -> ACCEPTER | DEMANDER_COMPLEMENT | REFUSER
 -> VERSIONNER
 -> PUBLIER
 -> CONSERVER_LA_PROVENANCE
```

Une Issue GitHub n'est donc **jamais copiée automatiquement** dans `data/resources.json`. Un mainteneur déclenche explicitement la revue à partir du numéro d'Issue. Si les informations sont suffisantes, le catalogue versionné reçoit la ressource et conserve l'URL de l'Issue d'origine. Si une relation est insuffisamment établie, l'Issue reste ouverte et peut être complétée.

La méthode éditoriale publique est expliquée dans [**Le vendeur de kebab**](le-vendeur-de-kebab.html). Ce nom désigne une **expérience de pensée fictive de concordance** : une étiquette, une parole, un document ou une URL sont des traces ; ils ne démontrent pas automatiquement l'auteur, le contenu, l'origine ou le fait auxquels on les rattache.

```text
TRACE != FAIT
TRACE + FAIT != RELATION_ETABLIE_ENTRE_TRACE_ET_FAIT
```

Cette méthode ne vise aucun commerce, métier ou individu réel et ne présume aucune fraude. Elle sert uniquement à borner ce que les traces disponibles permettent réellement d'affirmer.

Si la proposition est retenue, elle est référencée avec provenance et statut éditorial « source externe ». L'éditeur pourra rectifier, compléter ou retirer une entrée devenue erronée, obsolète ou inappropriée, en documentant le motif lorsque c'est possible.

### Revue par un mainteneur

Le workflow GitHub Actions **Qualify and publish resource proposal** est déclenché manuellement avec un numéro d'Issue. Il vérifie notamment :

- les champs indispensables ;
- une URL source en HTTPS ;
- une catégorie reconnue ;
- la présence d'une langue ;
- la distinction minimale entre plateforme d'hébergement et créateur déclaré ;
- l'absence de doublon d'URL ou d'Issue déjà publiée.

Cette vérification est un **garde-fou de structure et de provenance**, pas une preuve scientifique du contenu externe. La revue humaine reste nécessaire avant de déclencher la publication.

## Code et contenus

En proposant une contribution originale par pull request, vous confirmez pouvoir la soumettre sous les licences du dépôt : Apache-2.0 pour le code, CC BY 4.0 pour les textes et fiches pédagogiques originaux. Ne soumettez pas de contenu tiers incompatible.

Un compte GitHub expose son identité de profil et un historique public. Consulter [la notice RGPD](DATA_RIGHTS.md) avant de contribuer.

**Aucun engagement de réciprocité, de collaboration ou de réponse personnalisée** n'est requis pour bénéficier des ressources.

## Proposer un auteur, une tradition ou un mouvement de pensée

L'atlas public `pensees.html` s'appuie sur `data/pensees.json`. Pour toute nouvelle entrée, fournir : une source vérifiable et sa date de consultation, l'auteur ou la tradition, la période, une question simple, un résumé prudent et une limite de ce que la source établit. Les liens vers des vidéos, podcasts et traductions sont les bienvenus si leur attribution et leurs conditions d'utilisation sont précisées.

Ne pas attribuer de citations célèbres non vérifiées, assimiler des traditions distinctes, inventer une généalogie historique, ni transformer une hypothèse psychanalytique en résultat clinique démontré. Une différence entre auteurs est un apport documentaire à analyser ; elle ne nécessite pas un classement de valeur. Aucune information individuelle, dossier ou confidence personnelle ne doit figurer dans une contribution publique.

## Proposer une étude au centre de recherche

La page `recherche.html` est alimentée par `data/recherche.json`. Le [protocole éditorial public](RESEARCH_POLICY.md) demande la référence originale, les auteurs, l'établissement **au moment de la publication**, la méthode, la population, les comparateurs, les résultats observés, les limitations, les corrections et, lorsqu'ils ont été vérifiés, les conflits d'intérêts.

Une étude contradictoire ou un résultat non significatif est une contribution valable. Les vidéos, podcasts et communiqués institutionnels sont des ressources complémentaires : ils ne se substituent pas à une publication scientifique vérifiable. Une thèse de coaching ou une publicité ne reçoit pas le statut d'étude par simple répétition.

Ne publier aucune donnée de santé personnelle, questionnaire rempli ou cas réel d'allocataire. Les propositions concernent exclusivement des études déjà publiques et des descriptions factuelles.

## Contribuer au champ visuel

Toute proposition doit préserver la liberté d'interrompre le mouvement, l'accès au clavier, la lisibilité des commandes, la réduction du mouvement demandée par le système et l'absence d'enregistrement des gestes. Des améliorations visuelles ne doivent jamais introduire une analyse de la personne, une inférence de ses émotions, un formulaire personnel ou une transmission de ses interactions. Les tests existants doivent rester exécutables avec Node.js sans service externe.
