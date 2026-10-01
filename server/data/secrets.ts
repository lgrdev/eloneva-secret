import { ecrireSiAbsente } from './valkey.js';

export type TypeSecret = 'message' | 'mot-de-passe' | 'lien';

/** Valeur stockée (sérialisée en JSON) sous la clé `secret:<identifiant>`. */
export interface SecretStocke {
  type: TypeSecret;
  contenu: string;
  /** Date d'expiration, ISO 8601. */
  expireLe: string;
}

const PREFIXE_CLE = 'secret:';

export function cleSecret(identifiant: string): string {
  return `${PREFIXE_CLE}${identifiant}`;
}

/**
 * Enregistre le secret avec une durée de vie (SET NX EX).
 * Renvoie `false` si l'identifiant existe déjà (le secret existant est conservé).
 * Lève ServiceIndisponibleError ou MemoirePleineError (cf. valkey.ts).
 */
export async function enregistrerSecret(
  identifiant: string,
  secret: SecretStocke,
  dureeSecondes: number,
): Promise<boolean> {
  return ecrireSiAbsente(cleSecret(identifiant), JSON.stringify(secret), dureeSecondes);
}
