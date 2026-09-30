---
spec: specs/reception-revelation.md
spec_sha: 62ecd559b333984dae8a2eecf34c952b7907012c
verdict: prêt
date: 2026-09-30
---

# Revue de spec : Réception et révélation d'un secret

## Synthèse
La spec est solide sur l'essentiel : divulgation différée, lecture unique atomique, lien non cliquable, zéro trace, cas de concurrence. Il reste à préciser quand l'absence du secret est détectée (à l'ouverture ou au clic), comment protéger la révélation contre les robots et les aperçus (méthode de requête, cache), et plusieurs textes et formats (badge, heure du reçu). Un cas limite n'est pas traité : une panne réseau juste après la suppression fait perdre le secret.

## Constats

### R1 — MAJEUR — Secret absent : détecté à l'ouverture ou au clic ?
- [x] résolu
- section: RG-1, Erreurs et cas limites
- constat: RG-1 affiche toujours l'écran de déverrouillage, et le « toaster » d'erreur n'a pas de moment défini. Si l'absence n'est détectée qu'au clic, le destinataire voit un bouton « Révéler » pour un secret qui n'existe plus. Un toaster disparaît : le message doit rester visible.
- proposition: « À l'ouverture, le serveur indique seulement si le secret existe (sans le contenu, sans le consommer). S'il n'existe pas (lu, expiré, inexistant, identifiant mal formé), l'écran affiche « Le secret a déjà été lu ou a expiré. Il n'est plus disponible. » sans bouton « Révéler ». » Le même message s'affiche si le secret disparaît entre l'ouverture et le clic.
- suivi (2026-09-30): RG-1 : existence vérifiée à l'ouverture, message sans bouton ; même message si le secret disparaît avant le clic ; critère ajouté.

### R2 — MAJEUR — Protection contre les robots et les aperçus
- [x] résolu
- section: RG-2, Non-fonctionnel
- constat: l'objectif (pas de lecture accidentelle par un robot ou un aperçu de messagerie) n'est garanti que si la révélation ne peut pas être déclenchée par une simple visite. Rien n'impose une requête distincte de l'affichage de la page, ni l'absence de cache, ni l'exclusion des moteurs de recherche.
- proposition: « La révélation se fait par une requête `POST` déclenchée par le clic ; aucune requête `GET` ne renvoie le contenu. Les pages `/s/<identifiant>` sont servies avec `Cache-Control: no-store`, `X-Robots-Tag: noindex` et `Referrer-Policy: no-referrer`. » Critère : un `GET` sur l'URL ne consomme pas le secret (déjà couvert) et aucune réponse `GET` ne contient le contenu.
- suivi (2026-09-30): RG-4 et RG-5 : révélation par `POST`, aucun `GET` ne renvoie le contenu, en-têtes `no-store`, `noindex`, `no-referrer` ; critères ajoutés.

### R3 — MAJEUR — Panne après la suppression
- [x] résolu
- section: RG-4, Erreurs et cas limites
- constat: la lecture et la suppression sont atomiques côté serveur. Si la connexion tombe juste après, le secret est détruit mais jamais affiché. La règle commune S00 RG-7 (500 et redirection vers la création) n'est pas adaptée au destinataire : il ne peut rien créer d'utile et perd son contexte.
- proposition: accepter explicitement ce risque (« une coupure après la révélation fait perdre le secret ; l'expéditeur doit en créer un nouveau »). Pour une panne serveur avant la révélation, préciser si S00 RG-7 s'applique aussi au destinataire (redirection vers la création) ou si le message s'affiche sur l'écran de déverrouillage, bouton toujours disponible.
- suivi (2026-09-30): RG-8 : exception à S00 RG-7, message sur l'écran de déverrouillage, bouton disponible ; RG-9 : perte après coupure acceptée.

### R4 — MAJEUR — Textes et formats de l'écran révélé
- [x] résolu
- section: RG-3, RG-5
- constat:
  - Le badge rouge : texte exact non défini (le cahier des charges montre « DEL secret:... » : texte littéral ou illustration ?).
  - L'heure de destruction : source (horloge du serveur ou du navigateur), fuseau et format non définis.
  - La confirmation de RG-3 : texte exact non défini.
  - L'avertissement de perte au rafraîchissement : texte non défini, et le navigateur doit-il demander une confirmation avant de quitter la page ?
- proposition: « Badge : « Secret supprimé de la mémoire du serveur ». Heure de destruction fournie par le serveur, affichée dans le fuseau du navigateur au format `30/09/2026 à 14:32:05`. Texte près du bouton : « Le secret sera supprimé définitivement après lecture. » Confirmation du navigateur avant de quitter la page révélée. »
- suivi (2026-09-30): RG-3, RG-6, RG-7 : textes du bouton, du badge et de l'avertissement fixés ; heure du serveur au format `30/09/2026 à 14:32:05` ; confirmation avant de quitter.

### R5 — MINEUR — Données manipulées incomplètes
- [x] résolu
- section: Données manipulées
- constat: le type du secret (nécessaire pour afficher un lien en texte non cliquable) et l'heure de destruction ne figurent pas dans la table.
- proposition: ajouter « Type (S01) » et « Heure de destruction : renvoyée par le serveur avec le contenu ».
- suivi (2026-09-30): Données : type et heure de destruction ajoutés.

### R6 — MINEUR — Copie refusée
- [x] résolu
- section: RG-5, Erreurs et cas limites
- constat: le bouton de copie rapide peut échouer (navigateur qui refuse l'accès au presse-papier). S02 a un message pour ce cas, S03 non.
- proposition: reprendre le message de S02 : « Impossible de copier dans le presse-papier. Veuillez copier manuellement. »
- suivi (2026-09-30): message de copie refusée ajouté.

### R7 — MINEUR — Rédaction et traçabilité
- [x] résolu
- section: RG-3, Traçabilité
- constat: consigne laissée en minuscules dans RG-3 (« mettre un texte avertissant… ») ; numéros de lignes du cahier des charges décalés.
- proposition: reformuler RG-3 en règle ; citer les titres de sections du cahier des charges.
- suivi (2026-09-30): RG-3 reformulée, traçabilité par titres de sections.

## Questions pour le métier
- [x] Secret absent : vérifié dès l'ouverture, avec un écran « Le secret a déjà été lu ou a expiré. Il n'est plus disponible. » sans bouton (recommandé), plutôt qu'un toaster au clic ? — impact : R1 — réponse : oui (métier, 2026-09-30)
- [x] Panne serveur avant la révélation : message affiché sur l'écran de déverrouillage, bouton toujours disponible (recommandé), ou redirection vers la création comme S00 RG-7 ? Et la perte du secret en cas de coupure après la révélation est-elle acceptée ? — impact : R3 — réponse : message sur l'écran de déverrouillage, bouton disponible ; perte du secret acceptée (métier, 2026-09-30)
- [x] Badge rouge : « Secret supprimé de la mémoire du serveur » (recommandé) ou texte technique « DEL secret:… » ? — impact : R4 — réponse : « Secret supprimé de la mémoire du serveur » (métier, 2026-09-30)
- [x] Heure de destruction : heure du serveur, affichée dans le fuseau du navigateur au format `30/09/2026 à 14:32:05` ? — impact : R4 — réponse : oui (métier, 2026-09-30)
- [x] Page révélée : le navigateur demande-t-il une confirmation avant de la quitter ou de la recharger ? — impact : R4 — réponse : oui (métier, 2026-09-30)## Couverture
| Axe | Statut | Commentaire |
|---|---|---|
| Testabilité | ⚠️ | Textes et formats de l'écran révélé (R4) |
| Complétude fonctionnelle | ⚠️ | Moment de détection d'un secret absent (R1) |
| Erreurs et cas limites | ⚠️ | Concurrence et rafraîchissement couverts ; panne après suppression (R3), copie refusée (R6) |
| Droits d'accès | ✅ | Toute personne possédant le lien ; mot de passe dans S04 |
| Données personnelles (RGPD) | ✅ | Contenu supprimé à la lecture, aucun journal |
| Sécurité | ⚠️ | Révélation par `POST`, cache, indexation (R2) |
| Non-fonctionnel | ✅ | Lecture et suppression atomiques |
| Cohérence | ⚠️ | S02 affirme qu'ouvrir le lien détruit le secret, contrairement à RG-2 (voir revue S02, R1) ; règle de panne S00 RG-7 à adapter (R3) |
| Dépendances | ✅ | S01 (identifiant, type, stockage) |
