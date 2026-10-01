import { useCallback, useState } from 'react';
import { DUREE_PAR_DEFAUT, type DureeSecret, type TypeSecret } from '../types/secret';

/** Nombre de caractères visibles (points de code Unicode, un emoji compte pour 1). */
export function compterCaracteres(texte: string): number {
  return Array.from(texte).length;
}

/** État du formulaire de création : type, contenu (conservé au changement de type) et durée. */
export function useFormulaireSecret() {
  const [type, setType] = useState<TypeSecret>('message');
  const [contenu, setContenu] = useState('');
  const [duree, setDuree] = useState<DureeSecret>(DUREE_PAR_DEFAUT);

  const choisirType = useCallback((t: TypeSecret) => setType(t), []);
  const modifierContenu = useCallback((c: string) => setContenu(c), []);
  const choisirDuree = useCallback((d: DureeSecret) => setDuree(d), []);

  return {
    type,
    contenu,
    duree,
    nombreCaracteres: compterCaracteres(contenu),
    choisirType,
    modifierContenu,
    choisirDuree,
  };
}
