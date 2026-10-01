import { DUREES, DUREE_PAR_DEFAUT, type DureeSecret } from '../../types/secret';

const LIBELLES: Record<DureeSecret, string> = {
  '1h': '1 h',
  '4h': '4 h',
  '24h': '24 h',
  '7j': '7 j',
  '14j': '14 j',
};

interface SelecteurDureeProps {
  valeur: DureeSecret;
  onChange: (duree: DureeSecret) => void;
}

export default function SelecteurDuree({ valeur, onChange }: SelecteurDureeProps) {
  return (
    <fieldset data-testid="selecteur-duree">
      <legend className="mb-space-sm font-body text-label-md uppercase text-on-surface-variant">
        Durée de vie
      </legend>
      <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-5">
        {DUREES.map((duree) => {
          const actif = duree === valeur;
          return (
            <label
              key={duree}
              data-testid={`duree-${duree}`}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-md border px-space-sm py-space-md text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-container ${
                actif
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <input
                type="radio"
                name="duree"
                value={duree}
                checked={actif}
                onChange={() => onChange(duree)}
                className="sr-only"
              />
              <span className="font-body text-body-md font-semibold">{LIBELLES[duree]}</span>
              {duree === DUREE_PAR_DEFAUT && (
                <span data-testid="duree-recommandee" className="text-label-sm uppercase">
                  recommandé
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
