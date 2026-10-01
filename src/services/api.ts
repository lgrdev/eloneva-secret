import { MESSAGE_SERVICE_INDISPONIBLE, erreurReponseSchema } from '../../shared/schemas/erreur';

type EcouteurPanne = (message: string) => void;

const ecouteurs = new Set<EcouteurPanne>();

export class ErreurServiceError extends Error {
  constructor(message: string = MESSAGE_SERVICE_INDISPONIBLE) {
    super(message);
    this.name = 'ErreurServiceError';
  }
}

/** S'abonne aux pannes serveur (réponses 500). Retourne la fonction de désabonnement. */
export function surPanneService(ecouteur: EcouteurPanne): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

async function extraireMessage(reponse: Response): Promise<string> {
  try {
    const corps = erreurReponseSchema.safeParse(await reponse.json());
    if (corps.success) return corps.data.erreur;
  } catch {
    // corps absent ou illisible : message générique
  }
  return MESSAGE_SERVICE_INDISPONIBLE;
}

/** Client API commun : intercepte les 500 et prévient les abonnés. */
export async function appelerApi(chemin: string, options?: RequestInit): Promise<Response> {
  let reponse: Response;
  try {
    reponse = await fetch(chemin, options);
  } catch {
    ecouteurs.forEach((e) => e(MESSAGE_SERVICE_INDISPONIBLE));
    throw new ErreurServiceError();
  }
  if (reponse.status >= 500) {
    const message = await extraireMessage(reponse);
    ecouteurs.forEach((e) => e(message));
    throw new ErreurServiceError(message);
  }
  return reponse;
}

export async function verifierSante(): Promise<void> {
  await appelerApi('/api/sante');
}
