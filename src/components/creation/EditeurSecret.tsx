import type { TypeSecret } from '../../types/secret';

const INDICATIONS: Record<TypeSecret, string> = {
  message: 'Saisissez votre message confidentiel…',
  'mot-de-passe': 'Saisissez le mot de passe à partager…',
  lien: 'Collez le lien confidentiel à partager…',
};

interface EditeurSecretProps {
  type: TypeSecret;
  valeur: string;
  nombreCaracteres: number;
  onChange: (valeur: string) => void;
}

export default function EditeurSecret({
  type,
  valeur,
  nombreCaracteres,
  onChange,
}: EditeurSecretProps) {
  return (
    <div id="editeur-secret" role="tabpanel" aria-labelledby={`onglet-${type}`}>
      <div className="mb-space-sm flex items-center justify-between">
        <label
          htmlFor="contenu-secret"
          className="font-body text-label-md uppercase text-on-surface-variant"
        >
          Données à protéger
        </label>
        <span
          data-testid="compteur-caracteres"
          aria-live="polite"
          className="font-mono text-body-sm text-on-surface-variant"
        >
          {nombreCaracteres} {nombreCaracteres > 1 ? 'caractères' : 'caractère'}
        </span>
      </div>
      <textarea
        id="contenu-secret"
        data-testid="editeur-contenu"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={INDICATIONS[type]}
        rows={8}
        spellCheck={false}
        autoComplete="off"
        className="w-full resize-y rounded-lg border border-outline-variant bg-slate-deep p-space-md font-mono text-code-md text-inverse-on-surface placeholder:text-outline"
      />
    </div>
  );
}
