const GARANTIES = [
  {
    id: 'valkey',
    titre: 'Valkey en mémoire, sans persistance',
    texte:
      'Le secret vit uniquement dans la mémoire vive de Valkey. Rien n’est écrit sur disque ; une fois lu ou expiré, il est effacé.',
  },
  {
    id: 'traefik',
    titre: 'Traefik, TLS 1.3',
    texte: 'Tous les échanges sont protégés par Traefik avec TLS 1.3.',
  },
  {
    id: 'zero-trace',
    titre: 'Zéro trace',
    texte: 'Aucun journal du contenu de vos secrets n’est conservé.',
  },
  {
    id: 'zero-compte',
    titre: 'Zéro compte',
    texte: 'Aucune inscription n’est nécessaire pour créer ou lire un secret.',
  },
];

export default function GarantiesArchitecturales() {
  return (
    <section aria-labelledby="titre-garanties" data-testid="garanties">
      <h2
        id="titre-garanties"
        className="mb-space-lg text-center font-headline text-headline-md text-on-surface"
      >
        Garanties architecturales
      </h2>
      <ul className="grid gap-gutter-sm sm:grid-cols-2 lg:grid-cols-4">
        {GARANTIES.map((g) => (
          <li
            key={g.id}
            data-testid={`garantie-${g.id}`}
            className="rounded-lg border border-slate-border bg-surface-container-lowest p-space-lg shadow-level-1"
          >
            <h3 className="mb-space-sm font-headline text-title-md text-on-surface">{g.titre}</h3>
            <p className="text-body-md text-on-surface-variant">{g.texte}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
