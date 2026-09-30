import type { ReactNode } from 'react';
import EnTete from './EnTete';

interface MiseEnPageProps {
  children: ReactNode;
}

export default function MiseEnPage({ children }: MiseEnPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <EnTete />
      <main
        data-testid="contenu"
        className="mx-auto w-full max-w-[1600px] flex-1 px-margin-sm py-space-lg md:px-margin"
      >
        {children}
      </main>
    </div>
  );
}
