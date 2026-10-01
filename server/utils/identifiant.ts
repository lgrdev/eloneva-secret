import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LONGUEUR = 32;
/** Plus grand multiple de 36 inférieur à 256 : les octets >= 252 sont rejetés (pas de biais). */
const SEUIL = 256 - (256 % ALPHABET.length);

export type GenerateurIdentifiant = () => string;

/** Identifiant de 32 caractères [a-z0-9], tiré avec crypto.randomBytes. */
export function genererIdentifiant(): string {
  let resultat = '';
  while (resultat.length < LONGUEUR) {
    for (const octet of randomBytes(LONGUEUR * 2)) {
      if (octet >= SEUIL) continue;
      resultat += ALPHABET[octet % ALPHABET.length];
      if (resultat.length === LONGUEUR) break;
    }
  }
  return resultat;
}
