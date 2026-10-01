import type { FastifyInstance } from 'fastify';
import { enregistrerSecret } from '../data/secrets.js';
import { genererIdentifiant, type GenerateurIdentifiant } from '../utils/identifiant.js';
import { ErreurHttp } from '../utils/erreurs.js';
import {
  DUREES_SECONDES,
  MESSAGE_CONTENU_TROP_VOLUMINEUX,
  TAILLE_MAX_CONTENU_OCTETS,
  creationSecretSchema,
  reponseCreationSchema,
} from '../../shared/schemas/index.js';

/** Nombre maximal de tirages d'identifiant en cas de collision. */
export const MAX_TIRAGES = 5;

/** Marge pour l'enveloppe JSON et l'échappement autour du contenu (garde-fou HTTP). */
const LIMITE_CORPS_OCTETS = TAILLE_MAX_CONTENU_OCTETS * 6 + 1024;

export interface SecretsOptions {
  generateur?: GenerateurIdentifiant | undefined;
  maintenant?: (() => Date) | undefined;
}

/**
 * POST /api/secrets : 201 { identifiant, expireLe } ; 400 validation ; 413 contenu > 10 Ko
 * (octets UTF-8) ou corps HTTP trop gros ; 500 pannes (gestionnaire commun).
 */
export function routeSecrets(app: FastifyInstance, options: SecretsOptions = {}): void {
  const generateur = options.generateur ?? genererIdentifiant;
  const maintenant = options.maintenant ?? (() => new Date());

  app.post('/api/secrets', { bodyLimit: LIMITE_CORPS_OCTETS }, async (requete, reponse) => {
    const analyse = creationSecretSchema.safeParse(requete.body);
    if (!analyse.success) {
      const seulementTaille = analyse.error.issues.every(
        (i) => i.message === MESSAGE_CONTENU_TROP_VOLUMINEUX,
      );
      if (seulementTaille) throw new ErreurHttp(413, MESSAGE_CONTENU_TROP_VOLUMINEUX);
      throw new ErreurHttp(400, 'Requête invalide.');
    }
    const { type, duree, contenu } = analyse.data;
    const dureeSecondes = DUREES_SECONDES[duree];
    const expireLe = new Date(maintenant().getTime() + dureeSecondes * 1000).toISOString();

    for (let essai = 0; essai < MAX_TIRAGES; essai++) {
      const identifiant = generateur();
      if (await enregistrerSecret(identifiant, { type, contenu, expireLe }, dureeSecondes)) {
        return reponse
          .status(201)
          .send(reponseCreationSchema.parse({ identifiant, expireLe }));
      }
    }
    // Tirages épuisés : erreur interne, traitée en 500 générique.
    throw new Error('tirages épuisés');
  });
}
