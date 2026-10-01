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

export function enregistrerGestionErreurs(app: FastifyInstance): void {
  app.setErrorHandler((_erreur, _requete, reponse) => repondreErreurService(reponse));
}
