import type { FastifyInstance, FastifyReply } from 'fastify';
import {
  MESSAGE_SERVICE_INDISPONIBLE,
  erreurReponseSchema,
} from '../../shared/schemas/index.js';

/**
 * Convertit toute erreur (ServiceIndisponibleError, MemoirePleineError, autre)
 * en 500 avec le message générique. Aucune journalisation, aucun détail interne.
 */
export function repondreErreurService(reponse: FastifyReply): FastifyReply {
  return reponse.status(500).send(
    erreurReponseSchema.parse({ erreur: MESSAGE_SERVICE_INDISPONIBLE }),
  );
}

/** Erreur client explicite (400, 413) levée par les routes. */
export class ErreurHttp extends Error {
  constructor(
    readonly statut: 400 | 413,
    message: string,
  ) {
    super(message);
    this.name = 'ErreurHttp';
  }
}

const MESSAGE_REQUETE_INVALIDE = 'Requête invalide.';
const MESSAGE_CORPS_TROP_VOLUMINEUX = 'Le contenu dépasse la taille maximale de 10 Ko.';

export function enregistrerGestionErreurs(app: FastifyInstance): void {
  app.setErrorHandler((erreur, _requete, reponse) => {
    if (erreur instanceof ErreurHttp) {
      return reponse
        .status(erreur.statut)
        .send(erreurReponseSchema.parse({ erreur: erreur.message }));
    }
    // Erreurs natives de Fastify (corps trop gros, JSON invalide, type de contenu) : messages fixes.
    const statut = (erreur as { statusCode?: unknown }).statusCode;
    if (statut === 413) {
      return reponse
        .status(413)
        .send(erreurReponseSchema.parse({ erreur: MESSAGE_CORPS_TROP_VOLUMINEUX }));
    }
    if (typeof statut === 'number' && statut >= 400 && statut < 500) {
      return reponse
        .status(400)
        .send(erreurReponseSchema.parse({ erreur: MESSAGE_REQUETE_INVALIDE }));
    }
    return repondreErreurService(reponse);
  });
}
