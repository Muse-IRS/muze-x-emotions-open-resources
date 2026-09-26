# Cahier de conception public — Champ de réflexion émotionnelle

**Version :** 0.4 · **Statut :** démonstrateur visuel autonome, exploratoire, gratuit et open source.

## 1. Intention et limites

Proposer à tout public un **champ visuel manipulable** permettant d'observer des formes de mouvement sans devoir décrire, catégoriser, évaluer ni révéler ses émotions. Trois gestes visuels : **attraction, vortex et dispersion**. Le cercle constitue un repère d'attention au sein d'un rectangle ; deux essaims de particules réagissent aux paramètres et au centre.

Ce champ **n'est pas** un test psychologique, une méthode thérapeutique validée, un appareil de neurofeedback, une étude d'efficacité ou une représentation scientifique de la physiologie émotionnelle. Un mode choisi ne permet aucune inférence sur l'anxiété, la personnalité, les besoins, les capacités ou les droits de la personne.

## 2. Architecture publique indépendante

- \`champ-emotionnel.html\` : interface sémantique, descriptions compréhensibles, commandes natives, liens vers les valeurs et la confidentialité ;
- \`assets/champ-emotionnel.css\` : présentation responsive, contrastes élevés, champ visuel conteneur, focus visible, préférences de réduction du mouvement ;
- \`assets/champ-physics.mjs\` : génération déterministe des particules, bornes, modes et mise à jour du mouvement. Mathématiques visuelles indépendantes de tout modèle privé ;
- \`assets/champ-emotionnel.mjs\` : contrôleur Canvas 2D, pointeur, clavier, commandes, pause et nettoyage ;
- \`tests/champ-emotionnel.test.mjs\` : tests unitaires des modes, des limites, de la réinitialisation et de la sûreté numérique.

L'interface n'ajoute aucune dépendance externe, clé API, formulaire de collecte, authentification, caméra, microphone, cookie applicatif, stockage local, pixels de suivi ou analyse d'événements.

## 3. Composants

**Le rectangle :** cadre du champ, distinct du reste de la page. Il garde les particules visibles dans des limites stables.

**Le cercle :** point de repère déplaçable. Son rayon relatif et son contour sont volontairement constants : aucune pulsation ni fausse représentation du rythme cardiaque.

**Les deux essaims :** deux groupes cyan/violet pour rendre lisibles plusieurs trajectoires. Leur couleur ne désigne pas une émotion, un diagnostic ou une typologie humaine.

**Les trois mouvements :**
- Attraction : une accélération modérée vers le point.
- Vortex : une composante tangentielle et une composante centripète.
- Dispersion : une composante opposée au centre, avec rebond dans le rectangle.

Il s'agit de règles graphiques déterministes de la page, pas d'un modèle expérimental du cerveau.

## 4. Interaction et commande

- **Par défaut : immobile.** Aucun mouvement automatique avant une action explicite.
- Sélection d'**un seul mode** à la fois, avec états \`aria-pressed\` et description textuelle.
- **Démarrer / Mettre en pause** : commande visible en permanence au voisinage du champ.
- **Ralentir / Aérer / Recentrer** : actions de confort qui modifient respectivement vitesse, densité et position du cercle.
- Réglages indépendants **Vitesse (10–100), Intensité (0–100), Nombre de particules (40–180)** ; valeurs affichées comme réglages graphiques, jamais comme scores émotionnels.
- Déplacement du centre à la souris, au doigt ou avec les flèches lorsque le champ a le focus (Maj+flèche : déplacement plus grand).
- **Réinitialiser :** revient à l'image immobile initiale et oublie les paramètres de la session.
- Lorsque l'onglet est masqué ou que le système active la préférence de mouvement réduit, l'animation active se met en pause ; elle ne reprend jamais automatiquement.

## 5. Sécurité perceptive et accessibilité

- Mouvement non automatique, souple et limité à 30 images par seconde ; aucun clignotement intentionnel, flash lumineux ou synchronisation simulée sur des battements de cœur.
- Respect de \`prefers-reduced-motion\`, dont l'activation en cours d'utilisation provoque une pause. Le visiteur conserve la liberté de démarrer explicitement une animation, s'il le souhaite.
- Canvas décoré d'un texte alternatif et d'un focus clavier ; contrôles HTML natifs disponibles sans pointeur. Textes d'explication et état vocalisé uniquement lors des actions (aucun flux ARIA à chaque image).
- Le champ reste facultatif. Si Canvas ou JavaScript est indisponible, les descriptions statiques, questions d'observation et liens pédagogiques restent lisibles.
- Support mobile, contraste élevé, boutons suffisamment espacés, pas d'animation CSS obligatoire, aucun verrouillage du défilement hors du rectangle.
- Une animation peut déplaire ou accentuer un inconfort chez certaines personnes : la pause, le mode immobile et la sortie doivent rester immédiatement accessibles.

## 6. Texte et posture

Accroche : « Un espace visuel. Votre rythme. Aucun jugement. »

Invitation : « Observez deux essaims dans un rectangle. Vous pouvez choisir un mouvement, le ralentir, déplacer le centre, faire une pause ou fermer cette page. Vous n'avez rien à expliquer. »

Phrases à éviter : « Guérissez votre anxiété », « Votre vortex signifie que vous êtes anxieux », « Réinitialisez votre cerveau », « Mesurez votre stress », « Débloquez vos émotions ».

L'interface propose des questions facultatives, ouvertes, **non intrusives**. Le résultat attendu est seulement une expérience visuelle choisie ; aucune diminution de stress n'est garantie.

## 7. RGPD et limites de confidentialité

Le champ ne recueille **aucun nom, diagnostic, parcours administratif ni récit personnel**. Les coordonnées du pointeur, le mode et les curseurs existent uniquement en mémoire vive du navigateur pendant l'ouverture ; aucune valeur n'est enregistrée, envoyée, profilée ou transmise aux professionnels cités sur le site.

**Attention :** le serveur d'hébergement GitHub Pages peut traiter des données techniques de navigation indépendamment de notre code. Les liens vers des ressources externes s'ouvrent uniquement à la demande et relèvent de leurs opérateurs. Consulter \`privacy.html\` et \`DATA_RIGHTS.md\` pour les droits, les distinctions entre acteurs et les limites des retraits de données publiées sur GitHub.

La page est réutilisable par tout professionnel sous les licences du dépôt, **sans collaboration, contrepartie ou approbation institutionnelle présumée**.

## 8. Critères d'acceptation

La version est publiable si les tests automatiques confirment : (1) trois modes fonctionnels ; (2) particules bornées et paramètres plafonnés ; (3) aucune animation initiale ni redémarrage automatique ; (4) contrôle par le clavier et pointeur ; (5) données non persistées et absence de requêtes externes applicatives ; (6) liens vers la notice RGPD ; (7) absence de publication d'architecture ou de dossiers privés ; (8) liens depuis la page d'accueil et documentation de l'extension.
