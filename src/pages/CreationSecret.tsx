import EditeurSecret from '../components/creation/EditeurSecret';
import GarantiesArchitecturales from '../components/creation/GarantiesArchitecturales';
import OngletsType from '../components/creation/OngletsType';
import SelecteurDuree from '../components/creation/SelecteurDuree';
import { useFormulaireSecret } from '../hooks/useFormulaireSecret';

export default function CreationSecret() {
  const f = useFormulaireSecret();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-xl">
      <header className="text-center">
        <h1 className="font-headline text-headline-lg text-on-surface">
          Eloneva Secret : créer un secret
        </h1>
        <p className="mt-space-sm text-body-lg text-on-surface-variant">
          Partagez un message, un mot de passe ou un lien par un lien à usage unique, sans compte.
        </p>
      </header>
      <form
        data-testid="formulaire-creation"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-space-lg rounded-xl border border-slate-border bg-surface-container-lowest p-space-lg shadow-level-2"
      >
        <OngletsType valeur={f.type} onChange={f.choisirType} />
        <EditeurSecret
          type={f.type}
          valeur={f.contenu}
          nombreCaracteres={f.nombreCaracteres}
          onChange={f.modifierContenu}
        />
        <SelecteurDuree valeur={f.duree} onChange={f.choisirDuree} />
      </form>
      <GarantiesArchitecturales />
    </div>
  );
}
