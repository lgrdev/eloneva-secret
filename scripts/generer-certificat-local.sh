#!/bin/sh
# Génère le certificat auto-signé local (certs/local.crt, certs/local.key), ignoré par git.
set -eu
cd "$(dirname "$0")/.."
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout certs/local.key -out certs/local.crt \
  -subj "/CN=secret.eloneva.com" \
  -addext "subjectAltName=DNS:secret.eloneva.com,DNS:localhost,IP:127.0.0.1"
chmod 644 certs/local.key certs/local.crt
echo "Certificat local généré dans certs/"
