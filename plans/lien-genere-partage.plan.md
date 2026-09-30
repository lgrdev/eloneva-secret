---
spec: specs/lien-genere-partage.md
spec_sha: 0e130a40bb7006788ddcba02c3021f210cd75237
epic_title: "Lien généré et partage"
epic_priority: P1
status: Backlog
epic_issue: 19
---

# Epic : Lien généré et partage

## Contexte
Après la création (S01), afficher à l'expéditeur, sur `/lien-genere`, l'URL du secret avec copie en un clic, les avertissements, un compte à rebours jusqu'à la purge, un message prêt à envoyer et une modale QR Code générée dans le navigateur. Les données (identifiant, date d'expiration) arrivent par l'état de navigation posé par S01/T05 et ne sont jamais stockées ; sans elles, l'expéditeur est renvoyé vers la création.
Hors périmètre : clé dans l'URL, badge « Chiffré AES-256 » et rappel du mot de passe (S04), envoi par e-mail, Killswitch.

## Questions ouvertes
- [x] Format de l'« URL condensée » de la modale QR Code : proposition, les 8 premiers caractères de l'identifiant suivis de « … » (`https://secret.eloneva.com/s/9f4a8e2b…`, comme l'exemple du cahier des charges) ? — impact : T04 — réponse : oui, 8 premiers caractères de l'identifiant suivis de « … » (métier, 2026-09-30)

## Tickets

### T01 — Afficher l'écran du lien généré
- priorité: P1
- dépend de: S01/T05
- issue: 20

#### Objectif
Créer l'écran `/lien-genere` : URL du secret, copie en un clic, avertissement, rappel de copie, et redirection vers la création quand les données manquent.

#### Critères d'acceptation
- [ ] CA1 — Après une création, l'écran affiche une URL de la forme `https://secret.eloneva.com/s/<identifiant>` `auto`
- [ ] CA2 — Le bouton Copier place l'URL dans le presse-papier `auto`
- [ ] CA3 — Si le navigateur refuse le presse-papier, le message « Impossible de copier le lien dans le presse-papier. Veuillez le copier manuellement. » s'affiche `auto`
- [ ] CA4 — L'avertissement « Ne révélez pas le secret vous-même : le premier clic sur « Révéler » le détruit définitivement. » et le rappel « Copiez le lien maintenant : il ne sera plus affiché. » sont affichés `auto`
- [ ] CA5 — Écran rechargé ou ouvert directement : l'expéditeur est redirigé vers l'écran de création `auto`
- [ ] CA6 — Aucune donnée du secret n'est écrite dans l'URL de l'écran ni dans le stockage du navigateur `auto`
- [ ] CA7 — L'écran respecte la maquette `docs/design/eloneva_secret_lien_g_n_r/` `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : page `src/pages/LienGenere.tsx` sur la route `/lien-genere`, dans `MiseEnPage` (S00) ; hook `src/hooks/useLienGenere.ts` qui lit l'identifiant et la date d'expiration dans l'état de navigation, puis efface cet état de l'historique (`replace`) pour qu'un rechargement ne les retrouve pas, et redirige vers `/` s'ils manquent ; fonction pure `construireUrlSecret(identifiant)` dans `src/services/urlSecret.ts` ; utilitaire commun de copie `src/services/pressePapier.ts` (réutilisé par T03, T04) ; composants `src/components/lien/UrlSecret.tsx`, `AvertissementRevelation.tsx`
- **test** : Vitest `tests/unit/front/urlSecret.test.ts` ; Playwright `tests/e2e/lien-genere.spec.ts` (CA1 à CA6 : création puis écran, presse-papier accordé et refusé, rechargement, accès direct, inspection de `location` et du stockage)

#### Hors périmètre
- Compte à rebours (T02), message (T03), QR Code (T04).

### T02 — Afficher le compte à rebours jusqu'à la purge
- priorité: P1
- dépend de: T01
- issue: 21

#### Objectif
Afficher le temps restant avant la purge, calculé depuis la date d'expiration du serveur, et gérer l'arrivée à zéro.

#### Critères d'acceptation
- [ ] CA1 — Pour un secret de 7 j, le format est `J j HH:MM:SS` ; pour un secret de 1 h, `HH:MM:SS` `auto`
- [ ] CA2 — Le temps restant est calculé à partir de la date d'expiration renvoyée par le serveur `auto`
- [ ] CA3 — À zéro, « Ce secret a expiré. » s'affiche, et le lien et les boutons de partage sont masqués `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : fonction pure `formaterTempsRestant(ms)` dans `src/services/compteARebours.ts` ; hook `src/hooks/useCompteARebours.ts` (rafraîchissement chaque seconde, état « expiré ») ; composant `src/components/lien/CompteARebours.tsx` ; masquage du lien et des boutons dans `LienGenere.tsx`
- **test** : Vitest `tests/unit/front/compteARebours.test.ts` (CA1, formats aux bornes 24 h et 0) ; Playwright `tests/e2e/lien-compte-a-rebours.spec.ts` avec horloge simulée (CA2, CA3)

#### Hors périmètre
- Suppression du secret à l'expiration (Valkey, S01).

### T03 — Partager le message prêt à envoyer
- priorité: P2
- dépend de: T01
- issue: 22

#### Objectif
Proposer le message pré-rempli, par le partage natif du téléphone quand il existe, sinon par copie.

#### Critères d'acceptation
- [ ] CA1 — Partage natif disponible : « Partager » ouvre le partage avec le texte « Je t'ai envoyé un secret via Eloneva Secret. Il ne peut être lu qu'une fois : <URL> » `auto`
- [ ] CA2 — Partage natif indisponible : le bouton devient « Copier le message » et copie ce texte `auto`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : fonction pure `construireMessage(url)` dans `src/services/messagePartage.ts` ; composant `src/components/lien/PartageMessage.tsx` (détection de `navigator.share`, repli sur `pressePapier.ts`)
- **test** : Vitest `tests/unit/front/messagePartage.test.ts` ; Playwright `tests/e2e/lien-partage.spec.ts` (CA1 avec `navigator.share` simulé, CA2 sans)

#### Hors périmètre
- Envoi par e-mail.

### T04 — Partager via QR Code
- priorité: P1
- dépend de: T01
- issue: 23

#### Objectif
Ouvrir la modale « Partager via QR Code » : QR Code généré dans le navigateur, URL condensée, alerte, téléchargement PNG et copie de l'image.

#### Critères d'acceptation
- [ ] CA1 — La modale affiche l'en-tête « Partager via QR Code », l'explication du scan mobile, le QR Code de l'URL avec le cadenas au centre, l'URL condensée, l'alerte « Le premier clic sur « Révéler » détruira le secret. » et les boutons Télécharger, Copier l'image et Fermer `auto`
- [ ] CA2 — Le QR Code décodé redonne exactement l'URL du secret `auto`
- [ ] CA3 — Télécharger enregistre le fichier `secret-eloneva.png` `auto`
- [ ] CA4 — « Copier l'image » est masqué si le navigateur ne permet pas de copier une image `auto`
- [ ] CA5 — Fermer ou ✕ ferme la modale `auto`
- [ ] CA6 — L'ouverture de la modale n'envoie aucune requête à un service externe `auto`
- [ ] CA7 — L’URL condensée affiche les 8 premiers caractères de l'identifiant suivis de « … » `auto`
- [ ] CA8 — Le QR Code est lisible par un téléphone et respecte la maquette `manuel`

#### Plan par couche
- **db** : —
- **server** : —
- **front** : bibliothèque de génération de QR Code exécutée localement (paquet npm, aucune API distante), niveau de correction d'erreur élevé pour le cadenas central ; `src/services/qrCode.ts` (rendu SVG, export PNG) ; `src/components/lien/ModaleQrCode.tsx` ; fonction `condenserUrl` dans `src/services/urlSecret.ts` (8 premiers caractères de l'identifiant suivis de « … ») ; copie d'image via `ClipboardItem` si disponible
- **test** : Playwright `tests/e2e/lien-qr-code.spec.ts` (CA1, CA3 à CA7 en surveillant les requêtes réseau) ; Vitest `tests/unit/front/qrCode.test.ts` (CA2 en décodant le QR généré)

#### Hors périmètre
- Badge « Chiffré AES-256 » et clé dans l'URL (S04).
