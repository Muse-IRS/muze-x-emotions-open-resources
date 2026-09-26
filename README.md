# Muze-X — Émotions & ressources ouvertes

**Une ressource pédagogique gratuite, open source et autonome**, destinée aux professionnels de la formation et de l'accompagnement, et librement consultable par toute personne intéressée.

**Site public :** https://muse-irs.github.io/muze-x-emotions-open-resources/ · **Atlas des émotions :** https://muse-irs.github.io/muze-x-emotions-open-resources/pensees.html · **Centre de recherche :** https://muse-irs.github.io/muze-x-emotions-open-resources/recherche.html · **Champ visuel :** https://muse-irs.github.io/muze-x-emotions-open-resources/champ-emotionnel.html

## Pourquoi ce projet ?

Proposer des supports pédagogiques simples sur les émotions, le recul, le lien entre corps, environnement et possibilités d'action. Les professionnels — notamment Capévol et le Département de l'Ardèche, à qui la ressource pourra être transmise gratuitement — pourront librement les consulter, les adapter et les utiliser dans leurs accompagnements. **Aucun partenariat, mandat, approbation ou collaboration n'est revendiqué.**

L'outil distingue le ressenti, les faits connus, les incertitudes et les options d'action. Une émotion ne doit ni être niée ni utilisée pour évaluer la valeur d'une personne ; les obstacles matériels ou institutionnels ne sont pas réductibles à des difficultés individuelles.

Trois entrées : **Ressentir et prendre du recul** ; **Corps, contexte et adaptation** ; **Attachement, sécurité et possibilité de choix** (ce dernier thème est exploratoire et ne constitue pas une théorie clinique validée).

Ce projet ne dispense ni soins, ni diagnostic, ni conseil juridique ou social individualisé.

## Les émotions à travers les pensées — extension 0.2

La page [Histoire des émotions et courants de pensée](pensees.html) présente une **première sélection de 31 entrées publiques et documentées**, non exhaustive, depuis les textes égyptiens et mésopotamiens jusqu'aux philosophies d'Asie et de Grèce, aux courants médiévaux, modernes, à la psychanalyse et à la psychologie actuelle. Le catalogue ouvert est conservé dans [data/pensees.json](data/pensees.json). Chaque entrée présente une question accessible, un résumé prudent, une référence externe et une limite.

Le lecteur peut explorer par question (colère, peur, attachement, deuil, désir, relations, doute et corps), par période ou par courant, sans compte ni conservation de ses recherches.

Une source antique, une reconstruction historienne, un courant de psychanalyse et une recommandation clinique ne constituent pas une seule catégorie de preuve. **La similarité entre deux idées n'établit ni filiation historique ni validation scientifique.** Le corpus reste évolutif : des traditions, écoles et auteurs manquent encore et pourront être ajoutés par contributions sourcées.

## Centre de recherche — extension 0.3

La page [Recherche : cerveau, émotions et pratiques](recherche.html) propose une introduction accessible aux réseaux cérébraux impliqués dans les émotions et la régulation, avec **15 études ou synthèses sourcées** et **six pratiques** présentées de façon facultative : nature et contemplation, activité physique, méditation, yoga adapté, respiration confortable et repos.

Son [catalogue de recherche structuré](data/recherche.json) enregistre auteurs ou organismes, établissement au moment de la publication, titre, année, type de méthode, population étudiée, résultats, limites et lien vers l'article ou la synthèse d'origine. Les liens vers les travaux de tiers n'autorisent pas à recopier leurs textes ou leurs figures.

L'examen des études suit notre [charte de recherche publique](RESEARCH_POLICY.md). Une corrélation ne prouve pas la causalité ; un résultat d'IRM n'est pas un résultat clinique ; une étude courte ou spécifique ne justifie pas une recommandation universelle. Aucun score psychologique ni pratique obligatoire. La page n'est pas une consultation médicale.

## Champ de réflexion émotionnelle — extension 0.4

La page [Champ de réflexion émotionnelle](champ-emotionnel.html) propose une expérience visuelle libre : **un rectangle, un cercle mobile et deux essaims**. Les modes attraction, vortex et dispersion sont de simples mouvements graphiques, pas des catégories de personnes ou des diagnostics.

L'animation **ne démarre jamais automatiquement**. La personne peut choisir le mouvement, déplacer le centre au doigt, à la souris ou au clavier, régler vitesse, intensité et nombre de particules, ralentir, aérer, recentrer, mettre en pause ou réinitialiser. La préférence système de réduction du mouvement est respectée, et tout passage en arrière-plan met l'animation en pause.

Tout fonctionne en JavaScript local avec Canvas 2D, **sans aucun compte, suivi, collecte des gestes, stockage de session, microphone, caméra ou service tiers**. Le serveur GitHub Pages possède ses propres traitements techniques, décrits séparément dans notre notice. Les personnes peuvent également se contenter des descriptions textuelles sans lancer l'animation.

- [Cahier de conception public et critères d'acceptation](CHAMP_EMOTIONNEL_DESIGN.md)
- [Code autonome du champ et des interactions](assets/champ-emotionnel.mjs)
- [Règles graphiques minimales et indépendantes](assets/champ-physics.mjs)
- [Tests de logique et de robustesse numérique](tests/champ-emotionnel.test.mjs)

**Frontière scientifique :** cette page est un support de réflexion et de décompression visuelle exploratoire, sans efficacité thérapeutique revendiquée et sans inférence sur les émotions ou la santé des visiteurs. Il ne remplace pas une aide humaine, sociale ou médicale.

## Fonctionnalités de la première version

- Page web statique en français, responsive, imprimable et utilisable sans compte.
- Fiche d'atelier construite autour d'un **cas fictif**, sans obligation de révéler son propre vécu.
- Catalogue de liens vers des ressources publiques, avec source, provenance, droits et date de vérification.
- Contributions volontaires par issues ou pull requests GitHub : proposer une vidéo, un podcast, un article, un cours ou une correction. **Un compte GitHub est requis pour ces contributions, mais pas pour la consultation.**
- Aucun téléchargement de vidéo, formulaire de collecte de témoignages, détecteur d'émotions, suivi individuel, cookies applicatifs, pixel publicitaire ou analytics ajouté au site.

Les vidéos externes s'ouvrent sur leur site d'origine par action volontaire ; aucun lecteur tiers ne se charge automatiquement.

## Utilisation

Ouvrir `index.html` directement dans un navigateur. Pour adapter : cloner ce dépôt puis modifier les fichiers HTML/CSS/JS et le catalogue `data/resources.json`.

Le site fonctionne sans framework, serveur applicatif ni clé API. GitHub Pages peut le publier depuis `main` / `(root)` après activation dans **Settings → Pages**.

## Contribuer

Lire [CONTRIBUTING.md](CONTRIBUTING.md) et [notre charte publique](VALUES.md). Les contributions portent exclusivement sur des informations et exemples **publics ou fictifs** : aucune identité de bénéficiaire, pièce RSA, donnée de santé, confidence émotionnelle, photographie identifiable sans autorisation ou contenu audiovisuel sans droit de publication.

Une proposition de ressource **n'est pas** une approbation automatique de l'ensemble de son contenu. Aucune contribution n'est obligatoire pour utiliser le projet.

## Vie privée et droits sur les données

Lire la [notice de confidentialité](privacy.html) et le [parcours des données / droits](DATA_RIGHTS.md).

- Les réponses aux exercices restent hors ligne, à l'appréciation de la personne : aucun champ de saisie ni stockage applicatif n'est prévu dans cette première version.
- Les demandes publiées sur GitHub Issues sont publiques : **ne jamais y poster de données personnelles ou de dossier individuel**.
- GitHub Pages et les sites externes ouverts volontairement peuvent traiter des données techniques de connexion selon leurs politiques propres.
- La page indique les moyens d'exercer les droits applicables auprès des responsables des traitements concernés.

## Valeurs

**Un socle, une posture** : dignité, pluralité des vécus, reconnaissance des contributions, esprit critique, correction traçable, absence de jugement et autonomie. Voir [VALUES.md](VALUES.md).

## Licences et attribution

- **Code original** : Apache License 2.0 — voir [LICENSE](LICENSE).
- **Textes, fiches et exemples pédagogiques originaux** : Creative Commons Attribution 4.0 International (CC BY 4.0) — voir [CONTENT_LICENSE.md](CONTENT_LICENSE.md).
- **Ressources externes** : liens et métadonnées seulement. Les médias et documents liés restent régis par les conditions de leurs titulaires.

Crédits de conception : **Jérémy Boubekeur et ChatGPT (OpenAI), dans le cadre de Muze-X**. Cette mention reconnaît l'assistance créative du système et **n'implique ni statut d'auteur juridique pour l'IA, ni soutien d'OpenAI, de Capévol ou du Département**.

## Indépendance des recherches privées

Ce dépôt public est **autonome**. Il ne duplique aucun dépôt privé, aucun dossier individuel ni aucune méthode interne non publiée. L'architecture des travaux internes et les données documentaires confidentielles ne sont pas requises pour utiliser ou prolonger cette ressource.

## État du projet

**Version 0.4.0 — démonstrateur pédagogique, atlas philosophique, centre de recherche et champ visuel autonome.** Les hypothèses exploratoires restent révisables ; aucune efficacité d'intervention ni validation clinique n'est revendiquée.
