import type { KeyboardEvent } from 'react';
import { TYPES_SECRET, type TypeSecret } from '../../types/secret';

const LIBELLES: Record<TypeSecret, string> = {
  message: 'Message',
  'mot-de-passe': 'Mot de passe',
  lien: 'Lien',
};

interface OngletsTypeProps {
  valeur: TypeSecret;
  onChange: (type: TypeSecret) => void;
}

export default function OngletsType({ valeur, onChange }: OngletsTypeProps) {
  const surTouche = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const decalage = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (decalage === 0) return;
    e.preventDefault();
    const suivant = TYPES_SECRET[(index + decalage + TYPES_SECRET.length) % TYPES_SECRET.length];
    if (!suivant) return;
    onChange(suivant);
    document.getElementById(`onglet-${suivant}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Type de secret"
      data-testid="onglets-type"
      className="grid grid-cols-3 gap-space-xs rounded-lg bg-surface-container-low p-space-xs"
    >
      {TYPES_SECRET.map((type, index) => {
        const actif = type === valeur;
        return (
          <button
            key={type}
            id={`onglet-${type}`}
            type="button"
            role="tab"
            aria-selected={actif}
            aria-controls="editeur-secret"
            tabIndex={actif ? 0 : -1}
            data-testid={`onglet-${type}`}
            onClick={() => onChange(type)}
            onKeyDown={(e) => surTouche(e, index)}
            className={`rounded-md px-space-md py-space-sm font-body text-body-md font-semibold ${
              actif
                ? 'bg-surface-container-lowest text-on-surface shadow-level-1'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {LIBELLES[type]}
          </button>
        );
      })}
    </div>
  );
}
