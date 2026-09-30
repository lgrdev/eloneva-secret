---
spec: specs/creation-secret.md
spec_sha: 88f0790300694a027abd657fc700276593f8e5c8
verdict: prêt
date: 2026-09-30
---

# Revue de spec : Création d'un secret

## Synthèse
Le parcours nominal, les types, les durées et les principaux messages d'erreur sont définis : la spec est proche d'être planifiable. Les risques : l'assistant de génération et la validation d'URL ne sont pas testables faute de paramètres, et la limite de 1500 caractères a deux messages différents et un comptage non défini. Il manque aussi des données dont S02 et S03 ont besoin (date d'expiration). Enfin, le stockage doit dès maintenant accepter un contenu opaque, puisque le chiffrement client (S04) sera actif par défaut. Plusieurs règles n'ont aucun critère d'acceptation.

## Constats

### R1 — MAJEUR — Assistant de génération de mot de passe : paramètres non définis
- [x] résolu
- section: RG-2
- constat: « paramètres de l'assistant de génération (longueur, jeux de caractères, réglables) » ne fixe ni la longueur par défaut, ni les bornes, ni les jeux de caractères proposés, ni leur état par défaut. Le générateur n'est pas testable au-delà de « un mot de passe apparaît ».
- proposition: « Longueur réglable de 8 à 128, 20 par défaut. Jeux : minuscules, majuscules, chiffres, symboles, tous cochés par défaut, au moins un jeu obligatoire. Le mot de passe est généré dans le navigateur avec un générateur aléatoire cryptographiquement sûr et contient au moins un caractère de chaque jeu coché. »
- suivi (2026-09-30): RG-3 : longueur 8 à 128 (20 par défaut), 4 jeux cochés par défaut, au moins un obligatoire, génération sûre dans le navigateur ; critères ajoutés.

### R2 — MAJEUR — Type Lien : « URL valide » non défini, risque de sécurité
- [x] résolu
- section: RG-1
- constat: « elle doit être valide (format) » ne dit pas quels schémas sont acceptés. Une URL `javascript:` ou `data:` acceptée puis rendue cliquable à la révélation (S03) permettrait d'exécuter du code chez le destinataire. Le message d'erreur d'une URL invalide n'est pas défini.
- proposition: « Seules les URL absolues en `http://` ou `https://` sont acceptées. Sinon, message : « Le lien doit commencer par http:// ou https://. » » Préciser dans S03 si le lien révélé est cliquable.
- suivi (2026-09-30): RG-2 : seules les URL `https://` sont acceptées, avec message ; lien révélé non cliquable (S03) ; critère ajouté.

### R3 — MAJEUR — Limite de 1500 caractères : deux messages, comptage et comportement flous
- [x] résolu
- section: RG-3, Erreurs et cas limites, Données manipulées
- constat:
  - RG-3 donne le message « vous êtes limités à 1500 caracteres », la section Erreurs « Le secret est trop long, vous êtes limité à 1500 caractères. » : deux textes pour le même cas.
  - La saisie est-elle bloquée à 1500, ou le dépassement est-il possible avec un message (« en attente modification ») ?
  - Le comptage n'est pas défini (caractères Unicode, emojis, retours à la ligne).
  - Avec le chiffrement client actif par défaut (S04), le serveur reçoit un contenu chiffré plus long que le texte : la limite doit être vérifiée dans le navigateur sur le texte, et côté serveur sur une taille maximale du contenu reçu.
- proposition: un seul message (celui de la section Erreurs) ; « le dépassement est possible, le bouton de création est désactivé et le message s'affiche tant que le texte dépasse 1500 caractères » (ou saisie bloquée) ; « un caractère = un caractère Unicode affiché, retour à la ligne compris » ; « le serveur refuse tout contenu reçu au-delà de N octets ».
- suivi (2026-09-30): RG-4 : un seul message, dépassement possible avec bouton désactivé, comptage en caractères Unicode ; limite serveur 10 Ko (RG-9) ; critères ajoutés.

### R4 — MAJEUR — Données nécessaires à S02 et S03 absentes
- [x] résolu
- section: Données manipulées
- constat: S02 affiche un compte à rebours « issu de la durée de vie (S01) » et S03 un reçu d'audit. S01 ne définit ni la date de création ni la date d'expiration du secret, ni la façon dont S02 les obtient.
- proposition: ajouter « Date d'expiration : calculée par le serveur à la création (création + durée de vie), renvoyée à l'expéditeur avec l'identifiant ». Ajouter un critère : la réponse de création contient l'identifiant et la date d'expiration.
- suivi (2026-09-30): RG-11 et Données : date d'expiration calculée par le serveur et renvoyée avec l'identifiant ; critère ajouté.

### R5 — MAJEUR — Stockage à préparer pour le chiffrement client (S04)
- [x] résolu
- section: Données manipulées, Hors périmètre
- constat: le chiffrement client sera actif par défaut (S04), avec la clé dans le `#` de l'URL. Si S01 stocke et valide un texte en clair (type, format d'URL côté serveur), S04 devra reprendre le stockage et la validation. La validation du format d'URL (R2), en particulier, ne pourra plus se faire côté serveur sur un contenu chiffré.
- proposition: « Le serveur stocke le contenu comme une donnée opaque, avec son type et sa date d'expiration. Les validations de contenu (vide, longueur, format d'URL) se font dans le navigateur ; le serveur ne vérifie que la présence et la taille maximale. »
- suivi (2026-09-30): RG-9 : contenu stocké comme donnée opaque, contrôles dans le navigateur, serveur limité à présence, type, durée et taille.

### R6 — MAJEUR — Échec de création : la saisie est-elle perdue ?
- [x] résolu
- section: Erreurs et cas limites
- constat: la règle commune S00 RG-7 redirige vers l'écran de création. L'expéditeur y est déjà : s'il est « redirigé », le secret saisi est-il effacé ? Il faudrait alors tout ressaisir, y compris un mot de passe généré. Même question quand Valkey refuse l'écriture parce que sa mémoire est pleine (S00 RG-3).
- proposition: « En cas d'échec, l'expéditeur reste sur l'écran de création, le message de S00 RG-7 s'affiche et sa saisie (type, contenu, durée) est conservée. »
- suivi (2026-09-30): Erreurs : règle S00 RG-7 avec saisie conservée après redirection ; critère ajouté (y compris mémoire pleine).

### R7 — MAJEUR — Règles sans critère d'acceptation
- [x] résolu
- section: Critères d'acceptation métier
- constat: aucun critère pour :
  - la validation d'URL (RG-1) ;
  - la limite de 1500 et son message (RG-3) ;
  - le contenu vide ;
  - la durée par défaut de 24 h (RG-4) ;
  - l'affichage des garanties architecturales (RG-6) ;
  - le format de l'identifiant (32 caractères `[a-z0-9]`) ;
  - l'échec d'enregistrement.
  Avec la CI relais, ces règles ne seraient pas vérifiées.
- proposition: ajouter un critère par règle, par exemple « Étant donné un contenu de 1501 caractères, alors le message « Le secret est trop long… » s'affiche et la création est impossible » ; « Étant donné l'écran de création, alors 24 h est sélectionnée par défaut » ; « Étant donné un secret créé, alors son identifiant compte 32 caractères `[a-z0-9]` ».
- suivi (2026-09-30): un critère par règle ajouté (URL, limite, vide, durée par défaut, garanties, identifiant, taille, double clic, échec, zéro trace).

### R8 — MINEUR — Contenu vide : espaces seuls ?
- [x] résolu
- section: Erreurs et cas limites
- constat: un contenu fait uniquement d'espaces ou de retours à la ligne est-il vide ? Le moment d'affichage du message (à la validation ou en continu) n'est pas précisé.
- proposition: « Un contenu composé uniquement d'espaces est considéré comme vide. Le message s'affiche à la validation. »
- suivi (2026-09-30): RG-5 : contenu fait d'espaces = vide, message à la validation ; critère ajouté.

### R9 — MINEUR — Changement d'onglet et affichage du mot de passe
- [x] résolu
- section: Parcours, RG-1
- constat: quand l'expéditeur change de type, le contenu déjà saisi est-il conservé ? Dans l'onglet Mot de passe, la saisie est-elle masquée (avec bouton afficher) ?
- proposition: « Le contenu est conservé au changement d'onglet. Dans l'onglet Mot de passe, la saisie est visible (éditeur monospace) pour permettre la vérification. » (ou l'inverse, au choix du métier)
- suivi (2026-09-30): RG-1 et RG-3 : contenu conservé au changement d'onglet, mot de passe visible ; critère ajouté.

### R10 — MINEUR — Identifiant : génération sûre et doubles clics
- [x] résolu
- section: Données manipulées, Parcours
- constat: l'identifiant doit être produit par un générateur aléatoire cryptographiquement sûr (c'est la seule protection d'un secret non chiffré) ; la spec dit seulement « aléatoire ». Un double clic sur « Créer » pourrait créer deux secrets.
- proposition: « Identifiant généré par un générateur aléatoire cryptographiquement sûr ; en cas de collision, un nouvel identifiant est tiré. » « Le bouton de création est désactivé pendant l'envoi. »
- suivi (2026-09-30): RG-10 (générateur sûr, nouveau tirage en cas de collision) et RG-12 (bouton désactivé pendant l'envoi) ; critère ajouté.

### R11 — MINEUR — Rédaction et traçabilité
- [x] résolu
- section: RG-1, RG-2, RG-3, Traçabilité
- constat:
  - fautes (« sic'est », « etre », « caracteres ») et consignes laissées entre parenthèses dans les règles ;
  - S01 RG-7 et S00 RG-7 portent le même numéro, ce qui rend le renvoi « règle commune S00 RG-7 » ambigu à la lecture ;
  - numéros de lignes du cahier des charges décalés ;
  - « Liens Autodestructeurs » n'est tracé dans aucune spec depuis son retrait de S01 (il relève de S03).
- proposition: reformuler RG-1 à RG-3 en phrases complètes, toujours préfixer les renvois par l'ID de spec, citer les titres de sections, et tracer « Liens Autodestructeurs » dans S03.
- suivi (2026-09-30): règles reformulées et renumérotées (RG-1 à RG-13), renvois préfixés par S00, traçabilité par titres ; « Liens Autodestructeurs » tracé dans S03.

## Questions pour le métier
- [x] Assistant de génération : longueur 8 à 128, 20 par défaut ; minuscules, majuscules, chiffres et symboles, tous cochés par défaut ? — impact : R1 — réponse : oui (métier, 2026-09-30)
- [x] Type Lien : seules les URL en `http://` et `https://` sont acceptées (recommandé) ? Le lien révélé dans S03 est-il cliquable ? — impact : R2 — réponse : oui seulement https:// , non (métier, 2026-09-30)
- [x] Limite de 1500 : saisie bloquée à 1500, ou dépassement possible avec message et bouton désactivé (recommandé) ? Quel message unique retenir ? — impact : R3 — réponse : dépassement possible, message « Le secret est trop long, vous êtes limité à 1500 caractères. » et bouton désactivé (métier, 2026-09-30)
- [x] Échec de création : l'expéditeur reste sur l'écran avec sa saisie conservée (recommandé), ou la saisie est effacée ? — impact : R6 — réponse : redirigé avec saisie conservée (métier, 2026-09-30)
- [x] Contenu composé uniquement d'espaces : considéré comme vide (recommandé) ? — impact : R8 — réponse : oui (métier, 2026-09-30)
- [x] Changement d'onglet : contenu conservé (recommandé) ? Mot de passe visible ou masqué dans l'éditeur ? — impact : R9 — réponse : contenu conservé, visible (métier, 2026-09-30)

## Couverture
| Axe | Statut | Commentaire |
|---|---|---|
| Testabilité | ⚠️ | Générateur (R1), URL (R2), limite (R3) et plusieurs règles sans critère (R7) |
| Complétude fonctionnelle | ⚠️ | Parcours nominal clair ; changement d'onglet (R9), double clic (R10) |
| Erreurs et cas limites | ⚠️ | Vide, trop long et panne définis ; saisie perdue en cas d'échec (R6), URL invalide (R2) |
| Droits d'accès | ✅ | Tout visiteur, sans compte |
| Données personnelles (RGPD) | ✅ | Contenu potentiellement personnel, supprimé à la lecture ou au plus tard à 14 jours ; aucun journal (S00 RG-8) |
| Sécurité | ⚠️ | Schémas d'URL dangereux (R2), génération sûre de l'identifiant et du mot de passe (R1, R10) |
| Non-fonctionnel | ✅ | Pas de persistance disque ; français et responsive portés par S00 |
| Cohérence | ⚠️ | Deux messages pour la limite (R3), numéros de règles ambigus (R11), stockage à aligner sur S04 (R5) |
| Dépendances | ⚠️ | Données attendues par S02 et S03 absentes (R4) ; S00 correcte |
