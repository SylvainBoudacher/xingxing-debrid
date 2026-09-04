// Taille du vivier annoncee par TMDB. Avec des genres cumulatifs, certaines
// combinaisons ne donnent rien : le dire avant le lancer plutot qu'apres.
// null = pas encore connue, on n'affiche rien plutôt qu'un chiffre faux.
export function RoulettePoolCount({ count }: { count: number | null }) {
  if (count === null) return null;

  if (count === 0) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
        Aucun film ne porte tous ces genres
      </span>
    );
  }

  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
        {count.toLocaleString("fr-FR")}
      </span>{" "}
      {count > 1 ? "films dans le vivier" : "film dans le vivier"}
    </span>
  );
}
