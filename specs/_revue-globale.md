---
specs_hash: e9ae69da
date: 2026-09-30
verdict: prêt
---

# Revue croisée des specs

## Synthèse
Quatrième passage (2026-09-30), après les réponses métier. Aucun BLOQUANT. G3, G4, G5 et G8 sont résolus : chiffrement actif par défaut avec clé dans le fragment `#`, badge et mention « zéro-connaissance » regroupés dans S04 (qui dépend désormais aussi de S02), identifiant de 32 caractères, règle de panne commune dans S00. G6 et G9 sont résolus : limite de 60 créations par heure et par IP, aucune journalisation (« zéro trace » tenu). G1 est résolu (lecture unique toujours). Reste un nettoyage mineur (G7, traçabilité).

## Constats

### G1 — MINEUR — Option « autodestruction à la 1ʳᵉ lecture » : restes à nettoyer
- [x] résolu
- suivi (2026-09-30): critère retiré de S01 et renvoi « S01 RG-6 » retiré de S03 RG-4 → lecture unique toujours, décision prise. Rétrogradé en MINEUR. Reste : le cahier des charges (écran 1, « Options de sécurité avancées ») cite encore l'option « activée par défaut », et les dépendances de S03 citent « option d'autodestruction ».
- specs: S01, S03
- constat: le cahier des charges (écran 1) garde « Autodestruction dès la 1ère lecture (activée par défaut) ». S01 a retiré la règle (plus de RG sur l'option), mais garde le critère « l'option d'autodestruction à la 1ʳᵉ lecture est activée par défaut ». S03 RG-4 renvoie à « S01 RG-6 », qui désigne désormais les garanties architecturales. Les dépendances de S03 citent « option d'autodestruction ». Impossible de savoir si le secret porte un attribut « lectures autorisées », ni ce que S03 doit faire quand l'option est désactivée.
- proposition: trancher. (a) Lecture unique toujours : retirer l'option du cahier des charges, le critère de S01 et la mention dans les dépendances de S03, et corriger le renvoi de S03 RG-4. (b) Option conservée : la rétablir dans S01 avec le comportement quand elle est désactivée (nombre de lectures, jusqu'à expiration ?), et l'appliquer dans S03.
- suivi (2026-09-30): lecture unique toujours : option retirée du cahier des charges (écran 1) et des dépendances de S03 ; critère de S01 et renvoi de S03 RG-4 déjà corrigés.

### G2 — BLOQUANT — Critère Killswitch orphelin dans S02
- [x] résolu
- suivi (2026-09-30): critère supprimé, Killswitch ajouté au hors-périmètre de S02.
- specs: S02
- constat: le Killswitch a été retiré du cahier des charges et des règles de S02, mais le critère « quand l'expéditeur clique sur Killswitch, alors le secret est détruit… » reste. `/relais:plan` en tirerait un ticket pour une fonctionnalité hors périmètre, et la CI exigerait un test pour ce critère.
- proposition: supprimer ce critère de S02, et ajouter « Destruction manuelle par l'expéditeur (Killswitch) » dans le hors-périmètre de S02.

### G3 — MAJEUR — Mentions de chiffrement dans S02 et S03 avant S04
- [x] résolu
- suivi (2026-09-30): chiffrement actif par défaut, clé dans le fragment `#` (S04 RG-1, RG-5) ; badge « Chiffré AES-256 » et mention zéro-connaissance déplacés dans S04, affichés seulement si le secret est chiffré (S04 RG-4, RG-7) ; S04 dépend de S02.
- specs: S02, S03, S04
- constat: S02 RG-6 affiche un badge « Chiffré AES-256 » dans la modale QR Code. S03 RG-5 et S04 RG-4 affichent « chiffrement zéro-connaissance » dans le reçu d'audit. Or le chiffrement client est optionnel (commutateur, S04 RG-1) et S04 arrive en vague 3. S02 et S03 livreraient donc une mention fausse quand le secret n'est pas chiffré côté client. Par ailleurs, si la clé de chiffrement est placée dans le fragment `#` de l'URL (question ouverte de S04), le format d'URL de S01, S02 et S03 change, et le stockage de S01 (contenu en clair ou chiffré) est remis en cause.
- proposition: (1) Déplacer le badge « Chiffré AES-256 » et la mention « zéro-connaissance » dans S04, en conditionnel (« affiché si le chiffrement client est activé »), et les retirer de S02 et S03. (2) Répondre aux questions de S04 sur la clé et le mot de passe avant de planifier S01. Si le chiffrement doit être actif par défaut, envisager de fusionner S04 dans S01 et S03.

### G4 — MAJEUR — Vocabulaire slug / identifiant / URL instable, entropie non définie
- [x] résolu
- suivi (2026-09-30): identifiant de 32 caractères `[a-z0-9]`, aléatoire, généré par le serveur (S01, S02 RG-1) ; faute de frappe corrigée.
- specs: S01, S02, S03
- constat:
  - S01 nomme « Identifiant du secret » une donnée dont le format est une URL (« tpphs://url_site/s/<slug> », faute de frappe incluse).
  - S02 RG-1 parle de `<slug>`, mais sa table de données et son critère d'acceptation disent `<identifiant>`.
  - S03 mélange `/s/<slug>` et « Identifiant du secret ».
  - La longueur du slug n'est fixée nulle part. Le lien est pourtant la seule protection d'un secret non chiffré : un slug court peut être deviné par essais.
  - `CLAUDE.md` impose des « slugs en kebab-case français » : cette convention vaut pour les routes, pas pour cet identifiant aléatoire.
- proposition: adopter un seul terme (« slug », défini dans le glossaire), le définir une fois dans S01 (généré par le serveur, `[a-z0-9]`, longueur fixe à décider, aléatoire cryptographiquement sûr), et utiliser la forme `https://secret.eloneva.com/s/<identifiant>` partout.

### G5 — MAJEUR — Valkey indisponible : comportements contradictoires entre S00 et S01
- [x] résolu
- suivi (2026-09-30): règle commune S00 RG-7 : erreur 500, message générique, redirection vers l'écran de création sur tous les écrans ; S01 y renvoie.
- specs: S00, S01, S03
- constat: S00 impose un message générique (« Service temporairement indisponible… ») suivi d'une redirection vers l'écran de création. S01 impose, pour la même panne pendant la création, un autre message (« Une erreur est survenue… ») et une nouvelle tentative sur place. S03 ne dit rien : faut-il rediriger le destinataire vers l'écran de création, et donc perdre son lien ?
- proposition: poser la règle transverse dans S00 (message générique, sans redirection, l'utilisateur reste sur son écran) et laisser les specs fonctionnelles la préciser seulement si besoin. Vérifier que le secret n'est pas marqué comme lu si la suppression échoue.

### G6 — MAJEUR — Anti-abus et « zéro trace » non couverts
- [x] résolu
- suivi (2026-09-30): limite de 60 créations par heure et par IP (S00 RG-9), journalisation par IP (S00 RG-8). La contradiction avec « zéro trace » est suivie en G9.
- suivi (2026-09-30, revue S00): limite de débit abandonnée (hors périmètre S00) ; zéro trace strict, aucun journal (S00 RG-8).
- specs: S00, S01, S03
- constat: S00 et S01 RG-6 promettent « zéro trace », mais aucune spec ne dit ce qui est journalisé (logs Traefik et applicatifs, adresses IP). La question a été retirée de S00 sans réponse. Aucune spec ne traite l'abus : création massive de secrets (saturation de la mémoire Valkey) et essais de slugs sur `/s/<slug>`.
- proposition: ajouter dans S00 (1) une politique de journalisation vérifiable, par exemple « aucun contenu, aucun slug complet, pas d'IP conservée au-delà de X », et (2) une limite de débit par IP sur la création et la révélation, avec seuils et message.

### G7 — MINEUR — Traçabilité décalée
- [ ] résolu
- suivi (2026-09-30): non traité.
- specs: S00, S01, S02, S03, S04
- constat: le cahier des charges a été modifié (ligne Mail supprimée, lignes Killswitch retirées) : les numéros de lignes cités dans les sections Traçabilité sont décalés. S02 finit par une puce « « Stack » » sans objet.
- proposition: citer les titres de sections du cahier des charges plutôt que les numéros de lignes, et supprimer la puce vide de S02.

### G8 — MINEUR — Questions répondues laissées au format question
- [x] résolu
- suivi (2026-09-30): question transformée en exigences (français uniquement, responsive) dans S00.
- specs: S00
- constat: S00 garde « ❓ Question : langues… – reponse : francais seul, support mobile (responsive) ». La revue individuelle comptera ce bloc comme une question ouverte.
- proposition: transformer la réponse en exigence dans la section Non-fonctionnel (« Interface en français uniquement ; responsive mobile ») et supprimer la question.

### G9 — MAJEUR — Journalisation des IP contre promesse « zéro trace »
- [x] résolu
- specs: S00, S01
- constat: S00 RG-8 journalise l'adresse IP de chaque requête, alors que l'écran de création (S01 RG-6) et le cahier des charges affichent « zéro trace ». Une adresse IP est une donnée personnelle (RGPD) : sans durée de conservation, la règle n'est ni testable ni conforme, et la promesse affichée devient trompeuse. S00 porte la question ouverte correspondante.
- proposition: fixer une durée de conservation courte des journaux (par exemple 24 h ou 7 jours, juste ce qu'il faut pour la limite de débit et la sécurité), et reformuler la promesse de S01 RG-6 (par exemple « aucun contenu journalisé, adresses IP conservées X jours maximum »).
- suivi (2026-09-30): pas de journalisation (S00 RG-8, critère associé) ; la promesse « zéro trace » est tenue. Le compteur de la limite de débit reste en mémoire 1 h (S00 RG-9).

## Questions pour le métier
- [x] Le secret est-il toujours à lecture unique (option supprimée), ou l'option « autodestruction à la 1ʳᵉ lecture » est-elle conservée ? Si oui, que se passe-t-il quand elle est désactivée ? — impact : S01, S03 (G1) — réponse : lecture unique toujours, option supprimée (déduit des corrections de S01 et S03, 2026-09-30)
- [x] Le critère Killswitch de S02 est-il bien à supprimer (hors périmètre) ? — impact : S02 (G2) — réponse : oui, hors périmètre (S02 corrigée, 2026-09-30)
- [x] Le chiffrement client est-il activé par défaut ? La clé est-elle dans le fragment `#` de l'URL ? Le badge « Chiffré AES-256 » est-il masqué quand il est désactivé ? — impact : S01, S02, S03, S04 (G3) — réponse : actif par défaut (AES-256), clé dans le fragment `#`, badge masqué si désactivé (métier, 2026-09-30)
- [x] Quelle longueur pour l'identifiant (par exemple 22 caractères `[a-z0-9]`, soit environ 113 bits) ? — impact : S01, S02, S03 (G4) — réponse : 32 caractères (métier, 2026-09-30)
- [x] En cas de panne Valkey : message générique sans redirection, ou redirection vers la création pour tous les écrans ? — impact : S00, S01, S03 (G5) — réponse : erreur 500 et redirection vers la création, pour tous les écrans (métier, 2026-09-30)
- [x] Quelle politique de logs pour « zéro trace » ? Quelles limites de débit (créations et révélations par IP) ? — impact : S00 (G6) — réponse : journalisation par IP, 60 créations par heure et par IP (métier, 2026-09-30)

- [x] Combien de temps conserver les journaux contenant l'adresse IP, et comment reformuler « zéro trace » ? — impact : S00, S01 (G9) — réponse : aucune journalisation, « zéro trace » tenu (métier, 2026-09-30)

## Glossaire proposé
| Terme | Définition | Specs concernées |
|---|---|---|
| Secret | Contenu confidentiel (message, mot de passe ou lien) stocké temporairement dans Valkey | Toutes |
| Type de secret | Message confidentiel, Mot de passe ou Lien secret / URL | S01 |
| Identifiant | Chaîne aléatoire `[a-z0-9]` générée par le serveur, qui identifie un secret dans l'URL (32 caractères) | S01, S02, S03 |
| URL du secret | `https://secret.eloneva.com/s/<identifiant>` + `#<clé>` quand le secret est chiffré côté client (S04) | S01, S02, S03, S04 |
| Expéditeur | Visiteur anonyme qui crée un secret | S01, S02, S04 |
| Destinataire | Personne possédant l'URL, qui révèle le secret | S03, S04 |
| Durée de vie | Délai choisi à la création (1 h, 4 h, 24 h, 7 j, 14 j) après lequel le secret est purgé | S01, S02 |
| Révélation | Clic volontaire sur « Révéler le secret maintenant » : affiche le contenu et supprime le secret | S03, S04 |
| Purge | Suppression définitive du secret de Valkey, par révélation ou expiration | S00, S02, S03 |
| Chiffrement client | Chiffrement AES-GCM 256 bits dans le navigateur de l'expéditeur, activé par défaut, désactivable | S04 (S02, S03 pour l'affichage) |
| Mot de passe de déchiffrement | Clé supplémentaire optionnelle, définie par l'expéditeur et saisie par le destinataire | S04 |
