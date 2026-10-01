import { useCallback, useEffect, useState } from 'react';
import { surPanneService, verifierSante } from '../services/api';

/**
 * Affiche le message de panne serveur et redirige vers l'écran de création (`/`).
 * Vérifie aussi la disponibilité du service au chargement.
 */
export function useErreurService() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const desabonner = surPanneService((msg) => {
      setMessage(msg);
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
    verifierSante().catch(() => {
      // déjà traité par l'abonnement
    });
    return desabonner;
  }, []);

  const fermer = useCallback(() => setMessage(null), []);

  return { message, fermer };
}
