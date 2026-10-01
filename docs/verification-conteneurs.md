# Vérification manuelle — conteneurisation (issue #10, CA1 à CA4)

Tous les critères de l'issue #10 sont `manuel`. Cette procédure se déroule depuis la racine du dépôt.

## Prérequis

- Docker avec Compose v2.24 ou plus, `curl`, `openssl`.
- Générer le certificat auto-signé local (une seule fois, `certs/` est ignoré par git) :

  ```sh
  sh scripts/generer-certificat-local.sh
  ```

  Résultat attendu : `Certificat local généré dans certs/` (fichiers `certs/local.crt` et `certs/local.key`, SAN `secret.eloneva.com`, `localhost`, `127.0.0.1`).

- Si les ports 80 ou 443 de l'hôte sont déjà pris, choisir d'autres ports. Les exemples ci-dessous utilisent ces variables, à adapter :

  ```sh
  export HTTP_PORT=18080 HTTPS_PORT=18443   # sinon, laisser les défauts 80 et 443
  ```

  Avec les défauts, remplacer `18443` par `443` et `18080` par `80` dans les commandes.

- Variable pratique pour les `curl` (le nom `secret.eloneva.com` est résolu vers la machine locale) :

  ```sh
  R="--resolve secret.eloneva.com:${HTTPS_PORT:-443}:127.0.0.1"
  ```

## Démarrage

```sh
docker compose up -d --build
docker compose ps
```

Attendu : trois services `app`, `valkey`, `traefik` ; `app` et `valkey` sont `healthy`, `traefik` est `Up`. Il n'y a qu'un seul conteneur pour l'application.

## CA1 — La pile démarre et le site répond en HTTPS (certificat auto-signé)

1. Réponse HTTPS en ignorant la validation du certificat :

   ```sh
   curl -sk $R -o /dev/null -w '%{http_code} %{http_version}\n' https://secret.eloneva.com:${HTTPS_PORT:-443}/
   ```

   Attendu : `200 2`.

2. Le certificat est bien celui de `certs/local.crt` (validation réussie avec ce certificat comme racine) :

   ```sh
   curl -s --cacert certs/local.crt $R -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' https://secret.eloneva.com:${HTTPS_PORT:-443}/
   ```

   Attendu : `200 0`. Sans `-k` ni `--cacert`, curl refuse le certificat, ce qui est normal (auto-signé).

3. Santé de l'application et accès via `localhost` :

   ```sh
   curl -sk $R https://secret.eloneva.com:${HTTPS_PORT:-443}/api/sante
   curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:${HTTPS_PORT:-443}/
   ```

   Attendu : `{"statut":"ok"}` puis `200`.

4. Redirection HTTP vers HTTPS :

   ```sh
   curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' --resolve secret.eloneva.com:${HTTP_PORT:-80}:127.0.0.1 http://secret.eloneva.com:${HTTP_PORT:-80}/
   ```

   Attendu : `301 https://secret.eloneva.com/`. L'URL de redirection n'inclut pas le port : avec un `HTTPS_PORT` différent de 443, la redirection ne mène pas au bon port. Sans conséquence avec les ports par défaut.

5. Navigateur (facultatif) : ajouter `127.0.0.1 secret.eloneva.com` dans `/etc/hosts` ou ouvrir `https://localhost:<HTTPS_PORT>/`, accepter l'avertissement du certificat auto-signé. La page de l'application s'affiche.

## CA2 — TLS 1.2 refusé ; TLS 1.3, HTTP/2 et HTTP/3 acceptés

1. TLS 1.2 refusé :

   ```sh
   curl -sk $R --tls-max 1.2 -o /dev/null -w '%{http_code}\n' https://secret.eloneva.com:${HTTPS_PORT:-443}/; echo "code de sortie: $?"
   openssl s_client -connect 127.0.0.1:${HTTPS_PORT:-443} -servername secret.eloneva.com -tls1_2 </dev/null 2>&1 | grep -i alert
   ```

   Attendu : curl affiche `000` et échoue (erreur 35) ; openssl affiche `tlsv1 alert protocol version`.

2. TLS 1.3 et HTTP/2 acceptés :

   ```sh
   curl -sk $R --tlsv1.3 --http2 -o /dev/null -w '%{http_code} %{http_version}\n' https://secret.eloneva.com:${HTTPS_PORT:-443}/
   ```

   Attendu : `200 2`.

3. HTTP/3 annoncé (vérifiable avec tout curl) :

   ```sh
   curl -skI $R https://secret.eloneva.com:${HTTPS_PORT:-443}/ | grep -i alt-svc
   ```

   Attendu : `alt-svc: h3=":443"; ma=2592000`. Le port UDP est publié (`docker compose ps` montre `<HTTPS_PORT>->443/udp`).

4. HTTP/3 réel : **demande un curl compilé avec HTTP/3** (`curl -V` doit afficher `HTTP3` dans les fonctionnalités) ou un navigateur récent. Le curl de la machine de développement n'en dispose pas : ce point n'a pas été exécuté lors de la rédaction.

   ```sh
   curl -sk $R --http3-only -o /dev/null -w '%{http_code} %{http_version}\n' https://secret.eloneva.com:${HTTPS_PORT:-443}/
   ```

   Attendu : `200 3`. Dans un navigateur, ouvrir les outils réseau, colonne protocole, `h3` (après un premier chargement qui reçoit l'en-tête `alt-svc`). Le navigateur doit faire confiance au certificat local. Avec un `HTTPS_PORT` différent de 443, `alt-svc` annonce quand même `:443`, donc tester HTTP/3 avec le port 443.

## CA3 — Aucun journal : accès Traefik désactivés, pilote Docker `none`

1. Pilote de journaux des trois conteneurs :

   ```sh
   for s in app valkey traefik; do docker inspect -f '{{.Name}} {{.HostConfig.LogConfig.Type}}' $(docker compose ps -q $s); done
   ```

   Attendu : `none` pour chacun.

2. `docker logs` ne renvoie rien (après quelques requêtes `curl` du CA1) :

   ```sh
   docker logs $(docker compose ps -q traefik)
   docker compose logs
   ```

   Attendu : `Error response from daemon: configured logging driver does not support reading` (aucune ligne de journal) ; `docker compose logs` affiche seulement des avertissements « Can't retrieve logs ».

3. Journal d'accès Traefik désactivé dans la configuration :

   ```sh
   grep -n accessLog traefik/traefik.local.yml traefik/traefik.prod.yml
   ```

   Attendu : aucune sortie (pas de section `accessLog`, donc désactivé).

## CA4 — Aucun enregistrement après redémarrage de Valkey

```sh
docker compose exec valkey valkey-cli set cle valeur
docker compose exec valkey valkey-cli dbsize
docker compose restart valkey
sleep 6
docker compose exec valkey valkey-cli dbsize
```

Attendu : `OK`, puis `1`, puis après redémarrage `0`.

## Arrêt

```sh
docker compose down
```

## Production (non couverte par les CA)

`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` utilise Let's Encrypt (TLS-ALPN-01). L'émission réelle d'un certificat n'est pas testée ici : elle exige le nom de domaine et l'hébergement, hors périmètre de l'issue.
