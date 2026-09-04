import c411Logo from "@/assets/sources/C411.webp";
import allDebridLogo from "@/assets/sources/alldebrid.webp";
import tmdbLogo from "@/assets/sources/tmdb.svg";
import type { ApiKeyName } from "@/lib/apiKeys";
import { validateKey as validateC411 } from "@/lib/services/c411";
import { validateKey as validateAllDebrid } from "@/lib/services/allDebrid";
import { validateKey as validateTmdb } from "@/lib/services/tmdb";

/** Verdict d'une cle : refusee par le service, ou service injoignable. */
export type KeyCheck = "valid" | "invalid" | "unreachable";

export interface KeyService {
  id: "c411" | "alldebrid" | "tmdb";
  name: string;
  logo: string;
  url: string;
  urlLabel: string;
  badge: "free" | "paid";
  tagline: string;
  /** Trois etapes maximum : au-dela, l'ecran redevient un mur de texte. */
  steps: [string, string, string];
  placeholder: string;
  keyName: ApiKeyName;
  check: (key: string) => Promise<KeyCheck>;
}

// Les validateurs des services renvoient un booleen et levent quand ils ne
// peuvent pas trancher. On uniformise les trois en un seul verdict.
function toCheck(validate: (key: string) => Promise<boolean>) {
  return async (key: string): Promise<KeyCheck> => {
    try {
      return (await validate(key)) ? "valid" : "invalid";
    } catch {
      return "unreachable";
    }
  };
}

export const KEY_SERVICES: KeyService[] = [
  {
    id: "c411",
    name: "C411",
    logo: c411Logo,
    url: "https://c411.org",
    urlLabel: "c411.org",
    badge: "free",
    tagline: "Le moteur de recherche de l'application.",
    steps: [
      "Ouvrez c411.org et connectez-vous à votre compte.",
      'Cliquez sur votre profil en haut à droite, puis "Intégration API".',
      'Cliquez sur "Créer une clé", puis collez-la ci-dessous.',
    ],
    placeholder: "Collez votre clé C411",
    keyName: "c411_api_key",
    check: toCheck(validateC411),
  },
  {
    id: "alldebrid",
    name: "AllDebrid",
    logo: allDebridLogo,
    url: "https://alldebrid.fr",
    urlLabel: "alldebrid.fr",
    badge: "paid",
    tagline: "Ce qui transforme un résultat en téléchargement rapide.",
    steps: [
      "Ouvrez alldebrid.fr et connectez-vous à votre compte.",
      'Allez dans "Mon compte", puis "Apikey Manager".',
      'Cliquez sur "Nouvelle clé", puis collez-la ci-dessous.',
    ],
    placeholder: "Collez votre clé AllDebrid",
    keyName: "alldebrid_api_key",
    check: toCheck(validateAllDebrid),
  },
  {
    id: "tmdb",
    name: "TMDB",
    logo: tmdbLogo,
    url: "https://www.themoviedb.org/settings/api",
    urlLabel: "themoviedb.org",
    badge: "free",
    tagline: "Les jaquettes, résumés et notes de votre bibliothèque.",
    steps: [
      "Créez un compte gratuit sur themoviedb.org.",
      'Dans "Paramètres" puis "API", demandez une clé à usage personnel.',
      'Copiez la "Cle d\'API" (v3) et collez-la ci-dessous.',
    ],
    placeholder: "Collez votre clé TMDB",
    keyName: "tmdb_api_key",
    check: toCheck(validateTmdb),
  },
];
