import logo from '../assets/logo-eloneva-secret.svg';

export default function EnTete() {
  return (
    <header
      data-testid="en-tete"
      className="border-b border-slate-border bg-surface-container-lowest"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center px-margin-sm md:px-margin">
        <a
          href="/"
          data-testid="lien-accueil"
          className="flex min-w-0 items-center gap-space-sm rounded"
        >
          <img
            src={logo}
            alt="Logo Eloneva Secret"
            data-testid="logo"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
          />
          <span className="truncate font-headline text-headline-sm text-on-surface">
            Eloneva Secret
          </span>
        </a>
      </div>
    </header>
  );
}
