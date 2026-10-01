import CreationSecret from './pages/CreationSecret';
import MiseEnPage from './components/MiseEnPage';
import { useErreurService } from './hooks/useErreurService';

export default function App() {
  const { message, fermer } = useErreurService();

  return (
    <MiseEnPage>
      {message && (
        <div
          role="alert"
          data-testid="erreur-service"
          className="mb-space-lg flex items-center justify-between gap-4 rounded border border-error bg-error-container px-4 py-3 text-on-error-container"
        >
          <p>{message}</p>
          <button type="button" onClick={fermer} className="underline">
            Fermer
          </button>
        </div>
      )}
      <CreationSecret />
    </MiseEnPage>
  );
}
