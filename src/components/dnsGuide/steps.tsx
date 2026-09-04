import { DNS_IPV4, DNS_IPV6 } from "./dnsData";
import { Addresses, CopyChip, Key, Strong, WinKey } from "./ui";

export interface GuideStep {
  title: string;
  /** Une instruction par ligne : chacune est une action a faire, dans l'ordre. */
  lines: React.ReactNode[];
  /** Precision affichee sous les instructions, quand le pourquoi n'est pas evident. */
  note?: React.ReactNode;
}

export const WINDOWS_STEPS: GuideStep[] = [
  {
    title: "Ouvrir vos connexions réseau",
    lines: [
      <>
        Appuyez sur <WinKey /> + <Key>R</Key>.
      </>,
      <>
        Copiez <CopyChip value="ncpa.cpl" /> (cliquez dessus), collez dans la fenetre puis Entree.
      </>,
    ],
  },
  {
    title: "Ouvrir les propriétés de votre connexion",
    lines: [
      <>Faites un clic droit sur votre connexion active (Wi-Fi ou Ethernet).</>,
      <>
        Cliquez sur <Strong>Propriétés</Strong>.
      </>,
    ],
  },
  {
    title: "Regler l'IPv4",
    lines: [
      <>
        Double-cliquez sur <Strong>Protocole Internet version 4 (TCP/IPv4)</Strong>.
      </>,
      <>
        Cochez <Strong>Utiliser les adresses de serveurs DNS suivantes</Strong>.
      </>,
      <>
        Saisissez ces deux adresses.
        <Addresses list={DNS_IPV4} />
      </>,
      <>
        Cliquez sur <Strong>OK</Strong>.
      </>,
    ],
  },
  {
    title: "Regler l'IPv6",
    lines: [
      <>
        Revenez dans la meme liste et double-cliquez sur{" "}
        <Strong>Protocole Internet version 6 (TCP/IPv6)</Strong>.
      </>,
      <>
        Cochez <Strong>Utiliser les adresses de serveurs DNS suivantes</Strong>.
      </>,
      <>
        Saisissez ces deux adresses.
        <Addresses list={DNS_IPV6} />
      </>,
      <>
        Cliquez sur <Strong>OK</Strong>.
      </>,
    ],
    note: (
      <>
        Presque toutes les box utilisent l'IPv6 en priorité. Si vous ne réglez que l'IPv4, votre
        ordinateur continue d'interroger l'annuaire de votre operateur et rien ne change.
      </>
    ),
  },
  {
    title: "Vider le cache puis retester",
    lines: [
      <>
        Appuyez sur <WinKey /> + <Key>R</Key>, copiez <CopyChip value="cmd" /> (cliquez dessus),
        collez puis Entree.
      </>,
      <>
        Dans la fenetre noire, tapez <CopyChip value="ipconfig /flushdns" /> puis Entree.
      </>,
      <>
        Revenez sur XingXing et cliquez sur <Strong>Retester ma connexion</Strong>.
      </>,
    ],
  },
];

export const MACOS_STEPS: GuideStep[] = [
  {
    title: "Ouvrir les réglages réseau",
    lines: [
      <>
        Ouvrez le menu Pomme puis <Strong>Réglages Système</Strong>.
      </>,
      <>
        Cliquez sur <Strong>Réseau</Strong> dans la barre laterale.
      </>,
    ],
  },
  {
    title: "Ouvrir les détails de votre connexion",
    lines: [
      <>Sélectionnez votre connexion active (Wi-Fi ou Ethernet).</>,
      <>
        Cliquez sur <Strong>Détails...</Strong>.
      </>,
    ],
  },
  {
    title: "Ouvrir l'onglet DNS",
    lines: [
      <>
        Dans la barre laterale de la fenetre, cliquez sur <Strong>DNS</Strong>.
      </>,
    ],
  },
  {
    title: "Ajouter les quatre adresses",
    lines: [
      <>
        Cliquez sur <Strong>+</Strong> sous "Serveurs DNS".
      </>,
      <>
        Ajoutez ces quatre adresses, une par une.
        <Addresses list={[...DNS_IPV4, ...DNS_IPV6]} />
      </>,
      <>
        Cliquez sur <Strong>OK</Strong> puis sur <Strong>Appliquer</Strong>.
      </>,
    ],
    note: (
      <>
        Les deux premieres sont l'IPv4, les deux suivantes l'IPv6. Presque toutes les box utilisent
        l'IPv6 en priorité : s'arreter aux deux premieres laisse le blocage en place.
      </>
    ),
  },
  {
    title: "Vider le cache puis retester",
    lines: [
      <>
        Ouvrez le <Strong>Terminal</Strong>.
      </>,
      <>
        Collez <CopyChip value="sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder" />{" "}
        puis Entree.
      </>,
      <>Tapez le mot de passe de votre Mac puis Entrée.</>,
      <>
        Revenez sur XingXing et cliquez sur <Strong>Retester ma connexion</Strong>.
      </>,
    ],
    note: (
      <>
        Pendant que vous tapez le mot de passe, le Terminal n'affiche rien : ni lettres, ni points,
        ni etoiles. C'est normal, il est bien saisi. Tapez-le en entier puis appuyez sur Entree.
      </>
    ),
  },
];
