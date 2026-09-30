---
spec: specs/chiffrement-client.md
spec_sha: 62ecd559b333984dae8a2eecf34c952b7907012c
verdict: prêt
date: 2026-09-30
---

# Revue de spec : Chiffrement client et mot de passe de déchiffrement

## Synthèse
Deuxième passage (2026-09-30), après les réponses métier. Les deux BLOQUANTS sont levés : le mot de passe entre dans le calcul de la clé dans le navigateur (RG-2), et le serveur vérifie une empreinte avant de supprimer, avec 5 essais (RG-8). Les erreurs sont définies et testables. Reste un point MAJEUR de cohérence : la vérification par empreinte et l'indication « protégé » modifient S01 (déjà publiée) et S03, qui ne le disent pas encore (R6). Quelques mineurs : empreinte à séparer de la clé (R10), fragment dans l'historique (R8), texte du rappel de mot de passe (R12).

## Constats

### R1 — BLOQUANT — Fonctionnement du mot de passe non décidé
- [x] résolu
- section: RG-2, Données manipulées (question ouverte dans la spec)
- constat: le mot de passe peut soit entrer dans le calcul de la clé (tout se passe dans le navigateur, le serveur ne voit rien), soit être vérifié par le serveur (il faut alors lui envoyer quelque chose). Ce choix détermine le stockage, l'API de S01 et S03, et le comportement en cas d'erreur (R2). Sans lui, aucun ticket ne peut être écrit.
- proposition: « La clé de déchiffrement est dérivée dans le navigateur de la clé du fragment et du mot de passe (PBKDF2, paramètres fixés dans le plan). Le serveur ne reçoit ni le mot de passe ni la clé. »
- suivi (2026-09-30): RG-2 : mot de passe utilisé dans le navigateur pour calculer la clé, jamais envoyé ni stocké.

### R2 — BLOQUANT — Mauvais mot de passe ou lien altéré : le secret est détruit sans être lu
- [x] résolu
- section: Erreurs et cas limites, S03 RG-4
- constat: S03 supprime le secret au moment où il le renvoie. Si le déchiffrement échoue ensuite dans le navigateur (mauvais mot de passe, clé absente ou tronquée dans le lien), le secret est perdu sans avoir été lu. Une faute de frappe suffit à le détruire. Pour l'éviter, le serveur doit pouvoir vérifier la demande avant de supprimer, sans connaître la clé.
- proposition: « À la création, le navigateur calcule une empreinte de vérification à partir de la clé finale et l'envoie avec le contenu chiffré. À la révélation, le navigateur envoie l'empreinte recalculée ; le serveur ne renvoie et ne supprime le secret que si elle correspond. Après 5 échecs, le secret est détruit. Message : « Mot de passe incorrect. Il vous reste N essais. » ; lien altéré : « Ce lien est incomplet ou altéré. » » Critères : une erreur ne consomme pas le secret ; le 5ᵉ échec le détruit.
- suivi (2026-09-30): RG-8 : empreinte vérifiée par le serveur avant suppression, 5 essais puis destruction ; messages et critères ajoutés.

### R3 — MAJEUR — Mot de passe sans chiffrement client
- [x] résolu
- section: RG-1, RG-2
- constat: le chiffrement est désactivable, le mot de passe est optionnel. Que signifie un mot de passe sur un secret non chiffré ? Si le mot de passe entre dans le calcul de la clé (R1), il n'a de sens qu'avec le chiffrement.
- proposition: « Définir un mot de passe active le chiffrement client, et le commutateur ne peut plus être désactivé tant qu'un mot de passe est saisi. »
- suivi (2026-09-30): RG-2 : saisir un mot de passe active le chiffrement et verrouille le commutateur ; critère ajouté.

### R4 — MAJEUR — Champ de mot de passe à la réception
- [x] résolu
- section: RG-3 (question ouverte dans la spec)
- constat: afficher toujours le champ « facultatif » trompe le destinataire d'un secret sans mot de passe, et l'incite à cliquer sans saisir quand il en faut un.
- proposition: « Le serveur indique à l'ouverture si le secret est protégé par un mot de passe (sans renvoyer le contenu). Le champ ne s'affiche que dans ce cas, et il est alors obligatoire. »
- suivi (2026-09-30): RG-3 : le serveur indique à l'ouverture si le secret est protégé ; champ affiché et obligatoire seulement dans ce cas ; critère ajouté.

### R5 — MAJEUR — Navigateur sans chiffrement disponible
- [x] résolu
- section: Erreurs et cas limites
- constat: sans l'API de chiffrement du navigateur (très ancien navigateur, page hors HTTPS en local), le chiffrement par défaut échoue. Faut-il bloquer la création ou envoyer le secret en clair ? Même question à la réception d'un secret chiffré.
- proposition: « Création bloquée avec le message « Votre navigateur ne permet pas de chiffrer ce secret. » (pas d'envoi en clair par repli). À la réception, même message, secret non consommé. »
- suivi (2026-09-30): Erreurs : création bloquée avec message, pas d'envoi en clair ; même message à la réception, secret non consommé ; critère ajouté.

### R6 — MAJEUR — Impact sur S01, S02 et S03 déjà planifiées
- [x] résolu
- section: Dépendances
- constat: S01 est planifiée et publiée (epic #12) avec un envoi du contenu en clair ; S03 révèle par une simple demande. S04 modifie ces parcours (chiffrement avant envoi, empreinte, champ de mot de passe, URL avec fragment dans S02). La spec ne dit pas quels écrans et quels échanges sont modifiés.
- proposition: lister les modifications attendues par spec : S01 (commutateur, champ mot de passe, chiffrement avant envoi, empreinte), S02 (URL avec `#<clé>`, badge), S03 (champ mot de passe, vérification avant suppression, déchiffrement, mention zéro-connaissance).
- suivi (2026-09-30, 3ᵉ passage): RG-11 : S04 livre les évolutions de S01, S02 et S03 (liste par spec).
- suivi (2026-09-30): toujours ouvert, et renforcé par RG-3 et RG-8 : S01 doit accepter et stocker l'empreinte et le compteur d'échecs (l'API `POST /api/secrets` du plan S01, epic #12, ne les prévoit pas) ; S03 RG-4 supprime le secret au clic sans vérification, et S03 RG-1 n'indique pas « protégé ». Voir la question ajoutée.

### R7 — MINEUR — Contraintes du mot de passe
- [x] résolu
- section: Données manipulées
- constat: longueur minimale et maximale non définies (❓ dans la spec).
- proposition: « 8 à 128 caractères », comme le générateur de S01.
- suivi (2026-09-30): RG-2 et Données : 8 à 128 caractères.

### R8 — MINEUR — Fragment dans l'historique du navigateur
- [x] résolu
- section: RG-5
- constat: le fragment n'est pas envoyé au serveur, mais l'URL complète (avec la clé) reste dans l'historique du navigateur du destinataire.
- proposition: « Après lecture de la clé, l'écran de déverrouillage retire le fragment de l'URL affichée (sans recharger la page). »
- suivi (2026-09-30, 3ᵉ passage): RG-10 : fragment retiré de l'URL affichée ; critère ajouté.
- suivi (2026-09-30): non traité.

### R9 — MINEUR — ❓ restants et traçabilité
- [x] résolu
- section: Parcours, Données manipulées, Erreurs, Traçabilité
- constat: le parcours (« mot de passe par un autre canal, ❓ à confirmer »), la table des données et les erreurs contiennent encore des ❓ ; numéros de lignes du cahier des charges décalés.
- proposition: remplacer chaque ❓ par la décision retenue ; citer les titres de sections.
- suivi (2026-09-30, 3ᵉ passage): traçabilité par titres de sections.
- suivi (2026-09-30): ❓ retirés du parcours, des données et des erreurs ; reste la traçabilité par numéros de lignes.

### R10 — MINEUR — L'empreinte ne doit pas permettre de déchiffrer
- [x] résolu
- section: RG-8
- constat: si l'empreinte est calculée de façon trop proche de la clé (ou est la clé elle-même hachée une seule fois), quelqu'un qui accède à Valkey pourrait s'en servir pour déchiffrer, ce qui contredit « le serveur ne voit que du contenu chiffré ».
- proposition: « L'empreinte est dérivée de la clé finale par une fonction de dérivation distincte de celle qui produit la clé de chiffrement ; elle ne permet pas de retrouver la clé. » Critère : l'empreinte stockée ne permet pas de déchiffrer le contenu.
- suivi (2026-09-30): RG-8 : empreinte dérivée par une fonction distincte, ne permet pas de retrouver la clé ; critère ajouté.

### R11 — MINEUR — Message au singulier
- [x] résolu
- section: Erreurs et cas limites
- constat: « Il vous reste N essais. » donne « Il vous reste 1 essais. » au dernier essai.
- proposition: « Il vous reste 1 essai. » au singulier.
- suivi (2026-09-30): singulier « Il vous reste 1 essai. » ; critère ajouté.

### R12 — MINEUR — Rappel de transmission du mot de passe dans S02
- [x] résolu
- section: RG-9
- constat: RG-9 ajoute un rappel sur l'écran du lien généré (S02) sans en donner le texte, et S02 ne le mentionne pas.
- proposition: « Transmettez le mot de passe par un autre moyen que le lien (appel, SMS séparé…). » ; ajouter un critère.
- suivi (2026-09-30): RG-9 : texte du rappel fixé ; critère ajouté.

## Questions pour le métier
- [x] Mot de passe : utilisé dans le navigateur pour calculer la clé, jamais envoyé au serveur (recommandé), ou vérifié par le serveur ? — impact : R1 — réponse : utilisé dans le navigateur pour calculer la clé, jamais envoyé au serveur (métier, 2026-09-30)
- [x] Mauvais mot de passe ou lien altéré : le serveur vérifie une empreinte avant de supprimer, 5 essais puis destruction, messages « Mot de passe incorrect. Il vous reste N essais. » et « Ce lien est incomplet ou altéré. » ? — impact : R2 — réponse : le serveur vérifie une empreinte avant de supprimer, 5 essais puis destruction, messages « Mot de passe incorrect. Il vous reste N essais. » et « Ce lien est incomplet ou altéré. » (métier, 2026-09-30)
- [x] Saisir un mot de passe force-t-il le chiffrement client (commutateur verrouillé) ? — impact : R3 — réponse : Saisir un mot de passe force le chiffrement client (commutateur verrouillé) (métier, 2026-09-30)
- [x] Champ de mot de passe à la réception : affiché et obligatoire seulement si le secret en exige un ? — impact : R4 — réponse : Champ de mot de passe à la réception : affiché et obligatoire seulement si le secret en exige un (métier, 2026-09-30)
- [x] Navigateur sans chiffrement : création bloquée avec message, sans envoi en clair ? — impact : R5 — réponse : Navigateur sans chiffrement : création bloquée avec message, sans envoi en clair (métier, 2026-09-30)
- [x] Mot de passe transmis au destinataire par un autre canal que le lien (message affiché à l'expéditeur) ? Longueur de 8 à 128 caractères ? — impact : R7, R9 — réponse : Mot de passe transmis au destinataire par un autre canal que le lien (message affiché à l'expéditeur) ; Longueur de 8 à 128 caractères (métier, 2026-09-30)
- [x] Les évolutions de S01 (envoi et stockage de l'empreinte, compteur d'échecs) et de S03 (indication « protégé » à l'ouverture, vérification avant suppression) sont-elles livrées par S04 (recommandé : S04 contient les tickets qui modifient l'API et les écrans existants), ou faut-il modifier S01 et S03 avant de les développer ? — impact : R6 — réponse : S04 contient les tickets qui modifient l'API et les écrans existants (métier, 2026-09-30)
- [x] Texte du rappel sur l'écran du lien généré : « Transmettez le mot de passe par un autre moyen que le lien (appel, SMS séparé…). » ? — impact : R12 — réponse : « Transmettez le mot de passe par un autre moyen que le lien (appel, SMS séparé…). » (métier, 2026-09-30)## Couverture
| Axe | Statut | Commentaire |
|---|---|---|
| Testabilité | ✅ | Erreurs et messages définis, critères ajoutés |
| Complétude fonctionnelle | ⚠️ | Mot de passe, commutateur et champ définis ; rappel S02 sans texte (R12) |
| Erreurs et cas limites | ✅ | Mauvais mot de passe, lien altéré, navigateur sans chiffrement définis |
| Droits d'accès | ✅ | Lien + mot de passe si défini |
| Données personnelles (RGPD) | ✅ | Le serveur ne voit que du contenu chiffré |
| Sécurité | ⚠️ | Empreinte distincte de la clé (R10), fragment dans l'historique (R8) |
| Non-fonctionnel | ✅ | AES-GCM 256 dans le navigateur |
| Cohérence | ⚠️ | S01 et S03 à faire évoluer pour l'empreinte et l'indication « protégé » (R6) |
| Dépendances | ⚠️ | S01, S02, S03 déjà planifiées ou à planifier : impacts à lister (R6) |
