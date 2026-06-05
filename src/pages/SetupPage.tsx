import { ApiKeysForm } from "@/components/ApiKeysForm";

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Bienvenue sur C411 Debrid</h1>
        <p className="mt-2 text-muted-foreground">
          Pour utiliser l'application, vous devez configurer vos deux cles API ci-dessous.
        </p>
      </div>
      <ApiKeysForm showContinue onContinue={onComplete} />
    </main>
  );
}
