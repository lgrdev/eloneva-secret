# EloNeva Secret

Eloneva Secret est un service gratuit et sécurisé pour créer des liens auto-destructeurs. 
Ce site vous permet de partager des mots de passe, des messages confidentiels via des liens à usage unique qui expirent automatiquement après visualisation ou après une période définie. Contrairement aux e-mails ou aux applications de messagerie où les informations sensibles restent pour toujours, Eloneva Secret garantit que vos secrets sont définitivement supprimés après utilisation. Aucune inscription requise

url de production : https://secret.eloneva.com

## Stack
Front : React, Tailwind
Database : Valkey (avec durée de vie de chaque enregistrement)
Proxy : Traefik 

## socle 

- installe le socle de base pour le projet, avec les dépendances et la configuration initiale.


## Fonctionnalités 

En cas d'écart avec les maquettes fournies, la spécification prime sur la maquette.

### Liens Autodestructeurs
Vos secrets partagés se détruisent automatiquement après avoir été consultés ou après le délai d'expiration.

### Expiration Temporelle
Définissez des délais d'expiration personnalisés de 1 heure, 4 heures, 24 heures, 7 jours ou 14 jours. Une fois expiré, les données sont supprimées définitivement.

### Sécurisé par Conception
Vos secrets sont stockés en toute sécurité et transmis via des connexions chiffrées.

### Formats Multiples
Partagez des mots de passe, liens, messages. le tout avec la même expérience sécurisée.


## Fonctionnement

### envoi d'un secret
1. Selectionner le type de secret à envoyer : Lien, Mot de passe, Message
2. Selectionner la durée de vie du secret
3. Envoyez le lien au destinataire

### reception
l'url affiche une page contenant un bouton permettant de visualiser le secret.
celui-ci n'apparait que lorsque le bouton est cliqué.


## liste des écrans
1. 🛡️ Écran de Création de Secret (EloNeva Secret - Créer un secret)
Sélecteur de type multi-format : Onglets interactifs pour Message confidentiel, Mot de passe (avec assistant de génération) et Lien secret / URL.
Zone de saisie sécurisée : Éditeur monospace avec compteur de caractères et commutateur de chiffrement client (AES-GCM 256-bit).
Gestion fine de l'expiration temporelle (TTL) : Sélecteur direct pour 1 heure, 4 heures, 24 heures (recommandé), 7 jours ou 14 jours.
Options de sécurité avancées : mot de passe de déchiffrement optionnel. Le secret est toujours à lecture unique.
Garanties architecturales : Mise en avant de la stack technique souveraine (Valkey in-memory sans persistance disque, Traefik edge proxy TLS 1.3, zéro trace et zéro compte).

2. 🔗 Écran du Lien Généré (EloNeva Secret - Lien généré)
Lien unique de transit : Affichage de l'URL sécurisée (https://secret.eloneva.com/s/...) avec bouton de copie instantanée en 1 clic.
Options de diffusion : Boutons d’accès direct au QR Code et message prêt à envoyer.
Avertissement de sécurité critique : Encadré prévenant l'expéditeur de ne pas tester le lien lui-même sous peine de détruire le secret immédiatement.

Caractéristiques de la modale :
En-tête explicite : Icône dédiée, titre "Partager via QR Code", explication pour le scan mobile et bouton de fermeture ✕.
Rendu du QR Code haute fidélité : QR code vectoriel contrasté intégrant l'insigne de sécurité central (cadenas cryptographique).
Rappel du lien & statut : Affichage de l'URL sécurisée condensée (https://secret.eloneva.com/s/9f4a8e2b...) avec badge "Chiffré AES-256".
Avertissement de sécurité : Alerte ambrée rappelant que le premier scan ou affichage consommera la lecture unique du secret.
Actions rapides : Boutons pour Télécharger le QR code, Copier l'image dans le presse-papier, et fermer la vue.


3. ⏳ Écran de Réception & Déverrouillage (EloNeva Secret - Déverrouiller le secret)
Expérience destinataire à divulgation différée : Le contenu n'apparaît pas à l'ouverture de l'URL pour éviter toute lecture accidentelle par un robot ou un aperçu automatique d'application de messagerie.
Bouton d'action central : « Révéler le secret maintenant » avec confirmation explicite que le clic purgera le secret du serveur.
Champ facultatif de mot de passe : Permet de renseigner la clé supplémentaire si l'expéditeur en a défini une.

4. 🔥 Écran de Secret Révélé & Détruit (EloNeva Secret - Secret révélé & détruit)
Notification d'autodestruction en temps réel : Badge rouge vif confirmant que la clé a été supprimée de la mémoire vive Valkey (DEL secret:...).
Zone de visualisation confidentielle : Bloc de code avec bouton de copie rapide et avertissement de perte définitive en cas de rafraîchissement ou fermeture de page.
Reçu d'audit cryptographique : Détail transparent de l'heure exacte de destruction et du chiffrement zéro-connaissance.

