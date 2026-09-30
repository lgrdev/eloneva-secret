---
spec: specs/lien-genere-partage.md
spec_sha: 099dbb7cf3fcca99ad8a8bca4b222903b46d8612
verdict: à compléter
date: 2026-09-30
---

# Revue de spec : Lien généré et partage

## Synthèse
Le parcours est simple et bien délimité (copie, QR Code, message prêt à envoyer, compte à rebours). Mais deux avertissements affichés contredisent S03 : ouvrir ou scanner le lien ne détruit pas le secret, seul le clic « Révéler » le fait. Plusieurs points ne sont pas encore testables : le comportement de l'écran rechargé (les données arrivent par l'état de navigation, décision du plan S01), le format et la fin du compte à rebours, le texte du message prêt à envoyer, le format du QR Code téléchargé. Le QR Code doit aussi être généré localement, sans service tiers.

## Constats

### R1 — MAJEUR — Avertissements contraires à S03 : ouvrir le lien ne détruit pas le secret
- [ ] résolu
- section: RG-4, RG-6 (alerte ambrée)
- constat: RG-4 dit que « l'ouvrir détruirait le secret » et l'alerte de la modale que « le premier scan ou affichage consommera la lecture unique ». Or S03 RG-2 garantit que l'ouverture de l'URL ne consomme pas le secret : seul le clic « Révéler le secret maintenant » le détruit. Les deux textes sont faux et inquiètent l'expéditeur à tort.
- proposition: reformuler RG-4 : « Ne révélez pas le secret vous-même : le premier clic sur « Révéler » le détruit définitivement. » Même correction pour l'alerte de la modale. Fixer les textes exacts.

### R2 — MAJEUR — Écran rechargé ou ouvert sans données
- [ ] résolu
- section: Parcours, Droits d'accès
- constat: le plan S01 (T05) transmet l'identifiant et la date d'expiration à `/lien-genere` par l'état de navigation, sans URL ni stockage du navigateur. Si l'expéditeur recharge la page ou ouvre `/lien-genere` directement, les données sont perdues. La spec ne dit pas ce qui s'affiche.
- proposition: « Sans données (rechargement, accès direct), l'expéditeur est redirigé vers l'écran de création ; le lien ne peut plus être réaffiché. » Ajouter un rappel sur l'écran : « Copiez le lien maintenant : il ne sera plus affiché. »

### R3 — MAJEUR — Compte à rebours : format et fin non définis
- [ ] résolu
- section: RG-5, Erreurs et cas limites
- constat: le format n'est pas fixé (jours, heures, minutes, secondes ?). « Il ne voit rien » à zéro n'est pas testable : le lien reste-t-il affiché ? Le calcul doit partir de la date d'expiration renvoyée par le serveur (S01 RG-11), pas d'un minuteur local.
- proposition: « Format : `J j HH:MM:SS` au-delà de 24 h, `HH:MM:SS` en dessous. Calculé à partir de la date d'expiration du serveur. À zéro, le compte à rebours affiche « Ce secret a expiré. », le lien et les boutons de partage sont masqués. »

### R4 — MAJEUR — QR Code : génération locale, formats et repli
- [ ] résolu
- section: RG-6, Non-fonctionnel
- constat:
  - Beaucoup de bibliothèques de QR Code appellent un service en ligne : l'URL du secret (et, avec S04, la clé) serait envoyée à un tiers. Rien ne l'interdit.
  - Le format du fichier téléchargé (SVG, PNG) et son nom ne sont pas fixés.
  - « Copier l'image » n'est pas pris en charge par tous les navigateurs : aucun repli n'est défini.
  - Avec S04, l'URL contient la clé : le QR Code doit rester lisible avec une URL plus longue.
- proposition: « Le QR Code est généré dans le navigateur, sans appel à un service externe. Téléchargement en PNG (`secret-eloneva.png`). Si la copie d'image n'est pas prise en charge, le bouton est masqué. » Critère : aucune requête réseau à l'ouverture de la modale.

### R5 — MAJEUR — Message prêt à envoyer : texte et partage non définis
- [ ] résolu
- section: RG-3
- constat: le texte pré-rempli n'est pas donné. Le partage natif du téléphone n'existe pas sur la plupart des ordinateurs : que fait le bouton ?
- proposition: fixer le texte, par exemple « Je t'ai envoyé un secret via Eloneva Secret. Il ne peut être lu qu'une fois : <URL> ». « Bouton Partager (partage natif) si disponible, sinon bouton Copier le message. »

### R6 — MINEUR — Critères d'acceptation manquants
- [ ] résolu
- section: Critères d'acceptation métier
- constat: pas de critère pour la copie refusée, le message prêt à envoyer, la copie d'image, la fermeture de la modale, le compte à rebours à zéro, le rechargement de l'écran.
- proposition: un critère par cas, une fois R2 à R5 tranchés.

### R7 — MINEUR — Rédaction et traçabilité
- [ ] résolu
- section: RG-1, Données manipulées, Hors périmètre, Traçabilité
- constat: minuscules en début de phrase (RG-1, RG-3), « Issue de la durée de vie (S01) » alors que la date est désormais calculée par le serveur (S01 RG-11), espace en trop dans le hors-périmètre, puce « « Stack » » vide et numéros de lignes décalés dans la traçabilité.
- proposition: « Date d'expiration : renvoyée par le serveur à la création (S01 RG-11) » ; citer les titres de sections du cahier des charges.

## Questions pour le métier
- [ ] Textes des avertissements : « Ne révélez pas le secret vous-même : le premier clic sur « Révéler » le détruit définitivement. » (écran) et « Le premier clic sur « Révéler » détruira le secret. » (modale QR Code) ? — impact : R1
- [ ] Écran rechargé ou ouvert sans données : redirection vers l'écran de création, avec le rappel « Copiez le lien maintenant : il ne sera plus affiché. » ? — impact : R2
- [ ] Compte à rebours : format `J j HH:MM:SS` puis `HH:MM:SS` ; à zéro, « Ce secret a expiré. » et lien masqué ? — impact : R3
- [ ] QR Code : généré dans le navigateur, téléchargé en PNG, bouton « Copier l'image » masqué si non pris en charge ? — impact : R4
- [ ] Message prêt à envoyer : texte « Je t'ai envoyé un secret via Eloneva Secret. Il ne peut être lu qu'une fois : <URL> » ; sans partage natif, bouton « Copier le message » ? — impact : R5

## Couverture
| Axe | Statut | Commentaire |
|---|---|---|
| Testabilité | ⚠️ | Compte à rebours (R3), message (R5), critères manquants (R6) |
| Complétude fonctionnelle | ⚠️ | Rechargement et accès direct (R2) |
| Erreurs et cas limites | ⚠️ | Copie refusée définie ; expiration à l'écran (R3), copie d'image (R4) |
| Droits d'accès | ⚠️ | « Expéditeur qui vient de créer » : garanti seulement par l'état de navigation (R2) |
| Données personnelles (RGPD) | ✅ | Aucune donnée personnelle ; rien n'est stocké dans le navigateur |
| Sécurité | ⚠️ | QR Code par un service tiers (R4) |
| Non-fonctionnel | ✅ | QR Code vectoriel lisible ; français et responsive portés par S00 |
| Cohérence | ❌ | Avertissements contraires à S03 RG-2 (R1) ; date d'expiration (R7) |
| Dépendances | ✅ | S01 (identifiant, date d'expiration, route `/lien-genere`) ; S04 ajoutera la clé et le badge |
