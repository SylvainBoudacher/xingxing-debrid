// Généré le 2026-08-05 par scripts/fetchSensCritiqueTop.ts
// Source : https://www.senscritique.com/top/resultats/les_meilleurs_mangas/192836 (classement "Les meilleurs mangas" des membres SensCritique).
// Ne pas éditer à la main : relancer le script pour rafraîchir le classement.
import type { MangaRaw } from "@/lib/services/mangadex";

export interface SensCritiqueEntry {
  /** Position dans le classement SensCritique, 1 = meilleur. */
  rank: number;
  /** Fiche MangaDex correspondante, figée au format brut de l'API. */
  manga: MangaRaw;
}

export const SENSCRITIQUE_TOP: SensCritiqueEntry[] = [
  {
    rank: 1,
    manga: {
      id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
      attributes: {
        title: { "ja-ro": "One Piece" },
        altTitles: [{ ja: "ワンピース" }, { en: "One Piece" }],
        description: {
          en: 'Gol D. Roger, a man referred to as the "Pirate King," is set to be executed by the World Government. But just before his demise, he confirms the existence of a great treasure, One Piece, located somewhere within the vast ocean known as the Grand Line. Announcing that One Piece can be claimed by anyone worthy enough to reach it, the Pirate King is executed and the Great Age of Pirates begins.  \n  \nTwenty-two years later, a young man by the name of Monkey D. Luffy is ready to embark on his own adventure, searching for One Piece and striving to become the new Pirate King. Armed with just a straw hat, a small boat, and an elastic body, he sets out on a fantastic journey to gather his own crew and a worthy ship that will take them across the Grand Line to claim the greatest status on the high seas.\n\n---\n\n**Note:**  \n**Because a takedown notice was sent to MangaDex from the owners of this series, English fan translations of One Piece are unable to be posted at this time. The series can be read in its entirety at [the official Shonen Jump website,](https://www.viz.com/shonenjump/chapters/one-piece) with the first and latest three chapters available at any time and the rest accessible with a Shonen Jump membership (which costs about $2 a month and can be accessed via a VPN if you are outside the US). The three most recent chapters can also be read on MangaPlus for free by clicking the chapter links below.**\n\n---\n- **The Best-Selling Manga in History**\n- **Won the 41st Japan Cartoonists Association Award Grand Prize alongside Neko Darake in 2012** \n- **Received the Kumamoto Prefecture Honorary Prize in 2018**',
        },
        year: 1997,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "2f4aca53-64c7-46ac-ae85-3bc9b3169890.png" },
        },
      ],
    },
  },
  {
    rank: 2,
    manga: {
      id: "40bc649f-7b49-4645-859e-6cd94136e722",
      attributes: {
        title: { "ja-ro": "Dragon Ball" },
        altTitles: [{ ja: "ドラゴンボール" }, { en: "Dragon Ball" }],
        description: {
          fr: "Les Dragon Ball, boules de cristal magiques, offrent à celui qui les détient la possibilité de réaliser tous ses voeux. Bien sûr la quête que mène Sangoku et ses amis pour les réunir n'est pas sans obstacles: tournois et combats rythment chaque tome de cette série-culte pour les jeunes adolescents. Scénarios et dialogues assez simples centrés sur la confrontation entre les différents protagonistes. Les textes se résument parfois aux cris des combattants mais le succès de la série dépasse largement cela, pour en faire un véritable mythe auprès de la jeune génération.",
        },
        year: 1984,
        status: "completed",
        lastVolume: "42",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "e64f6742-c834-471d-8d72-dd51fc02b835", attributes: { name: { en: "Aliens" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "b048eb82-670b-4b41-9fc1-38bf7dd52159.jpg" },
        },
      ],
    },
  },
  {
    rank: 3,
    manga: {
      id: "75ee72ab-c6bf-4b87-badd-de839156934c",
      attributes: {
        title: { en: "Death Note" },
        altTitles: [{ ja: "デスノート" }, { "ja-ro": "DEATH NOTE" }],
        description: {
          en: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note. One day, Ryuk, bored by the shinigami lifestyle and interested in seeing how a human would use a Death Note, drops one into the human realm.  \n  \nHigh school student and prodigy Light Yagami stumbles upon the Death Note and—since he deplores the state of the world—tests the deadly notebook by writing a criminal's name in it. When the criminal dies immediately following his experiment with the Death Note, Light is greatly surprised and quickly recognizes how devastating the power that has fallen into his hands could be.  \n  \nWith this divine capability, Light decides to extinguish all criminals in order to build a new world where crime does not exist and people worship him as a god. Police, however, quickly discover that a serial killer is targeting criminals and, consequently, try to apprehend the culprit. To do this, the Japanese investigators count on the assistance of the best detective in the world: a young and eccentric man known only by the name of L.",
        },
        year: 2003,
        status: "completed",
        lastVolume: "12",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          {
            id: "92d6d951-ca5e-429c-ac78-451071cbf064",
            attributes: { name: { en: "Office Workers" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "d6555598-8202-477d-acde-303202cb3475.jpg" },
        },
      ],
    },
  },
  {
    rank: 4,
    manga: {
      id: "801513ba-a712-498c-8f57-cae55b38cc92",
      attributes: {
        title: { "ja-ro": "Berserk" },
        altTitles: [{ ja: "ベルセルク" }, { en: "Berserk" }],
        description: {
          en: "Guts, known as the Black Swordsman, seeks sanctuary from the demonic forces attracted to him and his woman because of a demonic mark on their necks, and also vengeance against the man who branded him as an unholy sacrifice. Aided only by his titanic strength gained from a harsh childhood lived with mercenaries, a gigantic sword, and an iron prosthetic left hand, Guts must struggle against his bleak destiny, all the while fighting with a rage that might strip him of his humanity.\n___\nWon the 6th Osamu Tezuka Cultural Prize Excellence Award in 2002.\n\nNote: Following Miura Kentarou's death in 2021, the series has been taken over by Kouji Mori, who supervises the series with art done by Studio Gaga.",
        },
        year: 1989,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "81e1c82d-6672-400c-8c58-4ff9bfb89031.jpg" },
        },
      ],
    },
  },
  {
    rank: 5,
    manga: {
      id: "dd8a907a-3850-4f95-ba03-ba201a8399e3",
      attributes: {
        title: { "ja-ro": "Fullmetal Alchemist" },
        altTitles: [{ ja: "鋼の錬金術師" }],
        description: {
          en: "Alchemy: the mystical power to alter the natural world; something between magic, art, and science.\n\nWhen two brothers, Edward and Alphonse Elric, dabbled in this power to grant their dearest wish, one of them lost an arm and a leg... and the other became nothing but a soul locked into a body of living steel.\n\nNow Edward is a agent of the government, a slave of the military-alchemical complex, using his unique powers to obey orders... even to kill. Except his powers aren't unique. The world has been ravaged by the abuse of alchemy.\n\nAnd in the pursuit of the ultimate alchemical treasure, the Philosopher's Stone, their enemies are even more ruthless than they are..\n\n---\n- English release by [Viz Media](https://www.viz.com/fullmetal-alchemist)\n- Indonesian release by Elex Media\n\n---\n- **Won the 49th Shogakukan Manga Award for Shonen**\n- **Won the 15th Osamu Tezuka Cultural Award New Artist Prize**\n- **Won the Seiun Award for Best Comic in 2011**",
        },
        year: 2001,
        status: "completed",
        lastVolume: "27",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "a9cd0207-1b86-4738-a2b5-3575c32d5315.jpg" },
        },
      ],
    },
  },
  {
    rank: 6,
    manga: {
      id: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      attributes: {
        title: { en: "Naruto" },
        altTitles: [{ ja: "ナルト" }, { ja: "-ナルト-" }, { ja: "NARUTO -ナルト-" }],
        description: {
          fr: "Naruto est un garçon un peu spécial. Il est toujours tout seul et son caractère fougueux ne l'aide pas vraiment à se faire apprécier dans son village. Malgré cela, il garde au fond de lui une ambition: celle de devenir un maître Hokage, la plus haute distinction dans l'ordre des ninjas, et ainsi obtenir la reconnaissance de ses pairs.",
        },
        year: 1999,
        status: "completed",
        lastVolume: "72",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "489dd859-9b61-4c37-af75-5b18e88daafc", attributes: { name: { en: "Ninja" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "c5a3090c-4ca0-40a2-9102-e0ee0c6dac15.jpg" },
        },
      ],
    },
  },
  {
    rank: 7,
    manga: {
      id: "175cf215-2122-4656-9fac-37ac092438af",
      attributes: {
        title: { "ja-ro": "Akira" },
        altTitles: [{ ja: "アキラ" }],
        description: {
          en: "This is the first volume (8 volumes) of the Otomo complete works edition of “AKIRA” by Katsuhiro Otomo in 1982-1983, when he was 28-29 years old, and containing the first 14 chapters (up to p. 279 of the first volume) that were serialized in Young Magazine, then in its second year of publication, in their original form.\n\nThis historical work, which had a great impact on the manga world, is renowned for its perfection, but in fact, considerable brushing up was done by the mangaka when it was collected.\n\nAdditions, corrections, deletions, page and koma replacements, additional finishing touches, new sequences, etc., were used to polish the work, and the final product is the YANMAGA book version of “AKIRA,” which continues to be read 40 years after its initial release. In particular, it is a well-known fact that the covers for each chapter of the serialization were removed.\n\nHowever, in this edition of Otomo's complete works, the mangaka decided to publish the “serialized version” which is a reprint of the original version before the said changes were made to the work, by restoring everything, including the chapter covers, as much as possible to the original state.\n\nAlthough there are some parts where the original versions do not exist, and some parts that cannot be restored to their original state due to direct revisions, we have made it our mission to “restore the original state as much as possible” in the collected editions.\n\nThe “LIVE serialized version of AKIRA,” which has been completely sealed since its serialization, is different from the “collected AKIRA”, and perfectly recreates the excitement of the time when it was first published! \n\nThis is a must-have, must-see volume dedicated to all “AKIRA” fans. The first color spread of the very rare first chapter, which is different from the collected version, and the color pages from the serialization are all reprinted exactly as they were.\n\n---\n \n- **Won the 8th Kodansha Manga Award for General Manga**\n---\n- **Volume 12 of the OTOMO COMPLETE WORKS**",
        },
        year: 1982,
        status: "completed",
        lastVolume: "6",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "7064a261-a137-4d3a-8848-2d385de3a99c", attributes: { name: { en: "Superhero" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "355ab0c8-5f30-4b3f-81b2-01348b2bcd72.png" },
        },
      ],
    },
  },
  {
    rank: 8,
    manga: {
      id: "304ceac3-8cdb-4fe7-acf7-2b6ff7a60613",
      attributes: {
        title: { en: "Attack on Titan" },
        altTitles: [
          { ja: "進撃の巨人" },
          { "ja-ro": "Shingeki no Kyojin" },
          { "ja-ro": "SnK" },
          { fr: "L'attaque des titans" },
          { fr: "L'attaque sur les titans" },
        ],
        description: {
          fr: "Eren est un petit garçon rêvant de voyager dans le monde extérieur. Mais cela est impossible car il vit dans une ville fortifiée aux murailles dépassant les cinquante mètres de haut. Ces remparts sont nécessaires à la sécurité des habitants car ils sont les derniers représentants de l'humanité, obligés de se cacher pour échapper aux titans qui ont massacré la majeure partie du genre humain un siècle plus tôt. Eren est têtu: il ne se doute pas de la violence des combats qui ont opposé les hommes aux titans. Il décide de poster sa candidature pour devenir éclaireur, car il s'agit des seuls soldats autorisés à sortir de la ville pour en savoir plus sur les titans. Mais un beau jour, un géant parvient à détruire le mur qui protégeait la ville et ouvre la voie à plusieurs dizaines de ses congénères! Eren assiste impuissant à la mort atroce de sa mère qui finit dévorée. Alors qu'il fuit avec d'autres survivants, il se jure de se venger et de détruire la race des titans jusqu'à ce qu'il n'en reste plus un seul!!",
        },
        year: 2009,
        status: "completed",
        lastVolume: "34",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "29f82b1d-b37f-455a-b630-e42bccb1422a.jpg" },
        },
      ],
    },
  },
  {
    rank: 9,
    manga: {
      id: "d9e30523-9d65-469e-92a2-302995770950",
      attributes: {
        title: { "ja-ro": "Monster" },
        altTitles: [{ ja: "モンスター" }],
        description: {
          en: "Monster weaves the riveting story of the brilliant Dr. Kenzo Tenma, a famous surgeon with a promising career at a leading hospital. Tenma risks his reputation and promising career to save the life of a critically wounded young boy. Unbeknownst to him, this child is destined for a terrible fate. \n\nA string of strange and mysterious murders begin to occur soon afterward, ones that professionally benefit Dr. Tenma, and he emerges as the primary suspect. Conspiracies, serial murders, and a scathing depiction of the underbelly of hospital politics are all masterfully woven together in this compelling manga thriller.\n\n---\n**Awards Won:**\n\n- Winner of the Excellence Prize at the [Japan Media Arts Festival](https://j-mediaarts.jp/en/award/index-2.html) in 1997.\n- Winner of the Grand Prize at the 3rd [Osamu Tezuka Cultural Prize](https://en.wikipedia.org/wiki/Tezuka_Osamu_Cultural_Prize) in 1999.\n- Winner of the 46th [Shogakukan Manga Award](https://en.wikipedia.org/wiki/Shogakukan_Manga_Award) for General Manga in 2000.\n- Winner of the [Lucca Comics Awards](https://luccacomicsawards.com/albo-doro-2/) for Best Manga Series in 2004.\n\n---\nSee [MyAnimeList](https://myanimelist.net/anime/19/Monster) for the Anime Adaptation.\n\n- [Wikipedia](https://en.wikipedia.org/wiki/Monster_(manga))",
        },
        year: 1994,
        status: "completed",
        lastVolume: "18",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "c8cbe35b-1b2b-4a3f-9c37-db84c4514856", attributes: { name: { en: "Medical" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "997585f0-8948-4b3d-8015-4f6ff8fe265b.jpg" },
        },
      ],
    },
  },
  {
    rank: 10,
    manga: {
      id: "db692d58-4b13-4174-ae8c-30c515c0689c",
      attributes: {
        title: { en: "Hunter x Hunter" },
        altTitles: [{ ja: "ハンター×ハンター" }, { en: "HUNTER×HUNTER (HxH)" }],
        description: {
          en: "Hunters are a special breed, dedicated to tracking down treasures, magical beasts, and even other men. But such pursuits require a license, and less than one in a hundred thousand can pass the grueling qualification exam. Those who do pass gain access to restricted areas, amazing stores of information, and the right to call themselves Hunters.",
        },
        year: 1998,
        status: "ongoing",
        lastVolume: null,
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "aa112927-f1e5-4fe4-a4db-7fd4a1536e3c.jpg" },
        },
      ],
    },
  },
  {
    rank: 11,
    manga: {
      id: "02860cdf-1020-40f1-a23f-2025d80f6290",
      attributes: {
        title: { en: "GTO: Great Teacher Onizuka" },
        altTitles: [{ ja: "ジーティーオー" }],
        description: {
          en: "From Kodansha:\nMeet Eikichi Onizuka, a 22-year-old virgin and ex-biker. He's crude, foul-mouthed, and has a split-second temper. His goal: to be the Greatest High School Teacher in the world! Onizuka may think he's the toughest guy on campus, but when he meets his class full of bullies, blackmailers and scheming sadists, he'll have to prove it. This content is from a former localization of this work and may contain phrases or scenes which were and are still offensive. Rather than omit this content, we have decided to present it in its original form to harbor conversation and growth among the community. Kodansha remains committed to the distribution of compelling stories worldwide, which serve as a lens through which we may view various communities. \n  \n---\n- **Won the 22nd Kodansha Manga Award for Shonen**",
        },
        year: 1997,
        status: "completed",
        lastVolume: "25",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "92d6d951-ca5e-429c-ac78-451071cbf064",
            attributes: { name: { en: "Office Workers" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6cc5e896-02ce-47db-88c6-2c0b13d5d12a.jpg" },
        },
      ],
    },
  },
  {
    rank: 12,
    manga: {
      id: "f64f7752-f0b5-4a21-913c-e8b077e0b8b2",
      attributes: {
        title: { en: "Battle Angel Alita" },
        altTitles: [{ "ja-ro": "GUNNM" }, { ja: "銃夢" }, { en: "Gun Dream" }, { en: "GUNNM" }],
        description: {
          en: "The people and cyborgs of the Scrap Yard live beneath the flying city of Tiphares, whose inhabitants dump their junk in the Scrap Yard and rules above it's inhabitants. One day doc Ido, a former Tipharean citizen, finds the intact head of young cyborg-girl in a vast pile of scrap. He takes her in and gives her a body and the name Alita. Alita then discovers since long forgotten fighting techniques hidden in her body and decides to become a hunter-warrior like Ido.",
        },
        year: 1990,
        status: "completed",
        lastVolume: "9",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "b7a60370-e0b9-40c0-9d2d-89dc86121e30.jpg" },
        },
      ],
    },
  },
  {
    rank: 13,
    manga: {
      id: "ad06790a-01e3-400c-a449-0ec152d6756a",
      attributes: {
        title: { "ja-ro": "20th Century Boys" },
        altTitles: [
          { "ja-ro": "20 Seiki Shounen" },
          { ja: "20世紀少年" },
          { fr: "Garçons du 20ème siècle" },
        ],
        description: {
          en: "From Viz:\nHumanity, having faced extinction at the end of the 20th century, would not have entered the new millennium if it weren’t for them. In 1969, during their youth, they created a symbol. In 1997, as the coming disaster slowly starts to unfold, that symbol returns. This is the story of a group of boys who try to save the world.\n\n--- \n**Awards Won:**\n\n- Winner of the 25th [Kodansha Manga Award]( https://en.wikipedia.org/wiki/Kodansha_Manga_Award) for General Manga in 2001.\n- Winner of the 48th [Shogakukan Manga Award](https://en.wikipedia.org/wiki/Shogakukan_Manga_Award) for General Manga in 2002.\n- Winner of the 2008 [Seiun Award](https://en.wikipedia.org/wiki/Seiun_Award) for Best Comic at the 46th Japan Science Fiction Convention.\n- Winner of the 2011 [Eisner Award](https://en.wikipedia.org/wiki/Eisner_Awards#Past_winners) for Best U.S. Edition of International Material-Asia.\n\n---\n  \nSee [MyAnimeList](https://myanimelist.net/manga/3/20th_Century_Boys) for Manga Details.\n\n- [Wikipedia](https://en.wikipedia.org/wiki/20th_Century_Boys)",
        },
        year: 1999,
        status: "completed",
        lastVolume: "22",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f42fbf9e-188a-447b-9fdc-f19dc1e4d685", attributes: { name: { en: "Music" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "14e6676e-57e4-4115-a441-331606491ee0.jpg" },
        },
      ],
    },
  },
  {
    rank: 14,
    manga: {
      id: "239d6260-d71f-43b0-afff-074e3619e3de",
      attributes: {
        title: { en: "Bleach" },
        altTitles: [{ ja: "ブリーチ" }],
        description: {
          fr: "Adolescent de quinze ans, Ichigo Kurosaki possède un don particulier: celui de voir les esprits. Un jour, il croise la route d'une belle Shinigami (un être spirituel) en train de pourchasser une «âme perdue,» un esprit maléfique qui hante notre monde et n'arrive pas à trouver le repos.Mise en difficulté par son ennemi, la jeune fille décide alors de prêter une partie de ses pouvoirs à Ichigo, mais ce dernier hérite finalement de toute la puissance du Shinigami. Contraint d'assumer son nouveau statut, Ichigo va devoir gérer ses deux vies: celle de lycéen ordinaire, et celle de chasseur de démons... Bleach est l'oeuvre d'un mangaka prometteur, Taito Kubo, et le dernier succès des Editions Shueisha. Manga d'action au rythme trépidant, au graphisme soigné et à l'intrigue palpitante, Bleach est la nouvelle bonne surprise du manga au pays du Soleil Levant.",
        },
        year: 2001,
        status: "completed",
        lastVolume: "74",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "3bb26d85-09d5-4d2e-880c-c34b974339e9", attributes: { name: { en: "Ghosts" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "032cc781-43eb-4281-956c-7cf991dd0a6a.jpg" },
        },
      ],
    },
  },
  {
    rank: 15,
    manga: {
      id: "227e3f72-863f-46f9-bafe-c43104ca29ee",
      attributes: {
        title: { en: "FAIRY TAIL" },
        altTitles: [{ ja: "FAIRY TAIL" }, { ja: "フェアリーテイル" }],
        description: {
          en: "Celestial wizard Lucy wants to join the Fairy Tail, a guild for the most powerful wizards. But instead, her ambitions land her in the clutches of a gang of unsavory pirates led by a devious magician. Her only hope is Natsu, a strange boy she happens to meet on her travels. Natsu's not your typical hero - but he just might be Lucy's best hope.\n\n**Awards:**\n- Won the 33th Kodansha Manga Award for Best Shounen Manga.\n- Won the Society for the Promotion of Japanese Animation's Industry Award for Best Comedy Manga.\n___\n**Official English Volumes:** [Kodansha USA](https://kodansha.us/series/fairy-tail/)",
        },
        year: 2006,
        status: "completed",
        lastVolume: "63",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "3e02208c-b5cb-494b-9c79-0a9cdb75eadd.jpg" },
        },
      ],
    },
  },
  {
    rank: 16,
    manga: {
      id: "321cbc60-43dc-4a0e-9243-2a75160b3c81",
      attributes: {
        title: { en: "A Distant Neighborhood" },
        altTitles: [
          { fr: "Quartier Lointain" },
          { ja: "遥かな町へ" },
          { "ja-ro": "Haruka na Machi e" },
        ],
        description: {
          en: "Middle-aged salaryman Hiroshi Nakahara accidentally takes a train ride back to his old hometown to visit his mother’s grave. Then for reasons he can’t explain, Hiroshi is transported back in time, and discovers that he’s an 8th grader again, but with all of his adult memories intact.  \n  \nCan he, or should he try to change the decisions he made before? But more importantly, can he find his way back to the present day, or is he stuck in the past?",
        },
        year: 1998,
        status: "completed",
        lastVolume: "2",
        originalLanguage: "ja",
        tags: [
          {
            id: "292e862b-2d17-4062-90a2-0356caa4ae27",
            attributes: { name: { en: "Time Travel" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "06fd4f7f-dae0-4c07-bc9a-6871564e7b9a.jpg" },
        },
      ],
    },
  },
  {
    rank: 17,
    manga: {
      id: "d1a9fdeb-f713-407f-960c-8326b586e6fd",
      attributes: {
        title: { en: "Vagabond" },
        altTitles: [{ fr: "Avare" }, { ja: "バガボンド" }],
        description: {
          en: "Growing up in the late 16th century Sengoku era Japan, Shinmen Takezou is shunned by the local villagers as a devil child due to his wild and violent nature. Running away from home with a fellow boy at age 17, Takezo joins the Toyotomi army to fight the Tokugawa clan at the Battle of Sekigahara. However, the Tokugawa win a crushing victory, leading to nearly three hundred years of Shogunate rule. Takezo and his friend manage to survive the battle and afterwards swear to do great things with their lives. However, after their paths separate, Takezo becomes a wanted criminal and must change his name and his nature in order to escape an ignoble death.  \n  \n**Awards:**\n- Won the 24th Kodansha Manga Award in the general category in 2000.\n- Won the Tezuka Osamu Cultural Prize in 2002 \n**Note:** was nominated for the 2003 Eisner Award in the Best Writer/Artist category.",
        },
        year: 1999,
        status: "hiatus",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "05f8dcb4-8ea1-48db-a0b1-3a8fbf695e5a.jpg" },
        },
      ],
    },
  },
  {
    rank: 18,
    manga: {
      id: "e171c073-4415-499b-85bc-ea93825127ac",
      attributes: {
        title: { en: "Pluto" },
        altTitles: [{ ja: "プルートウ" }],
        description: {
          en: 'From Viz:\nIn an ideal world where man and robots coexist, someone or something has destroyed the powerful Swiss robot Mont Blanc. Elsewhere a key figure in a robot rights group is murdered. The two incidents appear to be unrelated except for one very conspicuous clue - the bodies of both victims have been fashioned into some sort of bizarre collage complete with makeshift horns placed by the victims\' heads. Interpol assigns robot detective Gesicht to this most strange and complex case - and he eventually discovers that he too, as one of the seven great robots of the world, is one of the targets.\n\nA remake of the "The Greatest Robot on Earth" arc from Astro Boy.',
        },
        year: 2004,
        status: "completed",
        lastVolume: "8",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "7064a261-a137-4d3a-8848-2d385de3a99c", attributes: { name: { en: "Superhero" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "1e9f777a-71eb-4f93-8a35-6dc0205b391f.jpg" },
        },
      ],
    },
  },
  {
    rank: 19,
    manga: {
      id: "5a547d1d-576b-477f-8cb3-70a3b4187f8a",
      attributes: {
        title: { "ja-ro": "JoJo no Kimyou na Bouken: Part 1 - Phantom Blood" },
        altTitles: [
          { "ja-ro": "JoJo no Kimyou na Bouken: Phantom Blood" },
          { en: "JoJo's Bizarre Adventure Part 1: Jonathan Joestar: His Youth" },
          { fr: "Le bizzarre avventure di Jojo: Phantom Blood" },
          { ja: "ジョジョの奇妙な冒険" },
          { ja: "ファントムブラッド" },
          { en: "JoJo's Bizarre Adventure Part 1 - Phantom Blood" },
        ],
        description: {
          en: "First story arc of the Jojo's Bizarre Adventure series.  \n  \nJonathan Joestar, a young wealthy son living in Victorian England, has his life destroyed by a recently orphaned Dio Brando, who was taken in by Jonathan's father. Dio, who plots to drive Jonathan to insanity and inherit the Joestar fortune, becomes an unstoppable vampire that Jonathan must fight.\n\n[Official English](https://www.viz.com/read/manga/jojo-s-bizarre-adventure-part-1-phantom-blood/all)",
        },
        year: 1986,
        status: "completed",
        lastVolume: "5",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "d7d1730f-6eb0-4ba6-9437-602cac38664c", attributes: { name: { en: "Vampires" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "263645fa-129c-4d77-b69d-61d0880fb13e.jpg" },
        },
      ],
    },
  },
  {
    rank: 20,
    manga: {
      id: "d8a959f7-648e-4c8d-8f23-f1f3f8e129f3",
      attributes: {
        title: { "ja-ro": "One Punch-Man" },
        altTitles: [
          { ja: "ワンパンマン" },
          { "ja-ro": "Wanpanman" },
          { en: "One-Punch Man" },
          { en: "One Punch Man" },
          { en: "OPM" },
        ],
        description: {
          en: "After rigorously training for three years, the ordinary Saitama has gained immense strength which allows him to take out anyone and anything with just one punch. He decides to put his new skill to good use by becoming a hero. However, he quickly becomes bored with easily defeating monsters, and wants someone to give him a challenge to bring back the spark of being a hero.  \n  \nUpon bearing witness to Saitama's amazing power, Genos, a cyborg, is determined to become Saitama's apprentice. During this time, Saitama realizes he is neither getting the recognition that he deserves nor known by the people due to him not being a part of the Hero Association. Wanting to boost his reputation, Saitama decides to have Genos register with him, in exchange for taking him in as a pupil. Together, the two begin working their way up toward becoming true heroes, hoping to find strong enemies and earn respect in the process.  \n  \n\n\n\n---\n\n**Notes:**  \n- Because some groups use the web version of the manga while others use the magazine version, the numbering won't match between different languages.  \n- **Because a takedown notice was sent to MangaDex from the owners of this series, fan translations of One Punch Man are currently unavailable to be uploaded. The series can be read in its entirety at [the official Shonen Jump website,](https://www.viz.com/shonenjump/chapters/one-punch-man) with the first and latest three chapters available at any time and the rest accessible with a Shonen Jump membership (which costs about $2 a month and can be accessed via a VPN if you are outside the US).**",
        },
        year: 2012,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "7064a261-a137-4d3a-8848-2d385de3a99c", attributes: { name: { en: "Superhero" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "511fc404-e6b4-4204-bb10-e4a28f7b5271.jpg" },
        },
      ],
    },
  },
  {
    rank: 21,
    manga: {
      id: "5d1fc77e-706a-4fc5-bea8-486c9be0145d",
      attributes: {
        title: { "ja-ro": "Vinland Saga" },
        altTitles: [{ ja: "ヴィンランド・サガ" }],
        description: {
          en: "As a child, Thorfinn sat at the feet of the great Leif Ericson and thrilled to wild tales of a land far to the west. But his youthful fantasies were shattered by a mercenary raid. Raised by the Vikings who murdered his family, Thorfinn became a terrifying warrior, forever seeking to kill the band's leader, Askeladd, and avenge his father. Sustaining Thorfinn through his ordeal are his pride in his family and his dreams of a fertile westward land, a land without war or slavery... the land Leif called Vinland.\n___\n- **Won the Japan Media Arts Award Division Grand Prize in 2009**\n- **Won the 36th Kodansha Manga Award for General Manga in 2012**",
        },
        year: 2005,
        status: "completed",
        lastVolume: "29",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7fa60f5d-285a-40c5-8a1d-9cf375eaf897.jpg" },
        },
      ],
    },
  },
  {
    rank: 22,
    manga: {
      id: "4f3bcae4-2d96-4c9d-932c-90181d9c873e",
      attributes: {
        title: { "ja-ro": "Boku no Hero Academia" },
        altTitles: [
          { ja: "僕のヒーローアカデミア" },
          { en: "My Hero Academia" },
          { fr: "My Hero Academia" },
          { ja: "ヒロアカ" },
          { "ja-ro": "HeroAca" },
          { "ja-ro": "BnHA" },
        ],
        description: {
          fr: "Dans un monde où 80 % de la population possède un super-pouvoir appelé alter, les héros font partie de la vie quotidienne. Et les super-vilains aussi ! Face à eux se dresse l’invincible All Might, le plus puissant des héros ! Le jeune Izuku Midoriya en est un fan absolu. Il n’a qu’un rêve : entrer à la Hero Academia pour suivre les traces de son idole.\nLe problème, c’est qu’il fait partie des 20 % qui n’ont aucun pouvoir…\n\nSon destin est bouleversé le jour où sa route croise celle d’All Might en personne ! Ce dernier lui offre une chance inespérée de voir son rêve se réaliser. Pour Izuku, le parcours du combattant ne fait que commencer !\n\n---\n\nMaison d'édition FR : **Ki-oon**",
        },
        year: 2014,
        status: "completed",
        lastVolume: "42",
        originalLanguage: "ja",
        tags: [
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "7064a261-a137-4d3a-8848-2d385de3a99c", attributes: { name: { en: "Superhero" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "dd1f77c5-dea9-4e2b-97ae-224af09caf99",
            attributes: { name: { en: "Monster Girls" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "c7a7101a-8e22-442b-a1db-55ba9ef5b1ab.jpg" },
        },
      ],
    },
  },
  {
    rank: 23,
    manga: {
      id: "077a3fed-1634-424f-be7a-9a96b7f07b78",
      attributes: {
        title: { "ja-ro": "Kingdom" },
        altTitles: [{ ja: "キングダム" }, { en: "Kingdom" }, { fr: "Kingdom" }],
        description: {
          fr: "**Cette Histoire se déroule avant notre ère.**\n\nLa chine, qui n'est pas encore unifiée, traverse une grande guerre de cinq siècles. Shin, un jeune garçon contemporain de ces temps violents et houleux, cherche, par la seule force de son épée, à se faire un nom sous les cieux !!!\n___\n**Kingdom en France, le manga tant attendu ! Véritable phénomène au Japon !**\n- Élu meilleur manga au 17e Grand Prix Culturel Osamu Tezuka (2013)\n- Meilleur manga seinen vendu au Japon depuis 2015 (source : Oricon)\n- 3ème meilleur manga vendu au Japon en 2016 et 2017 (source : Oricon)",
        },
        year: 2006,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7c1a85fe-1ce7-4b27-bde8-c668d7e766c8.jpg" },
        },
      ],
    },
  },
  {
    rank: 24,
    manga: {
      id: "6a1d1cb1-ecd5-40d9-89ff-9d88e40b136b",
      attributes: {
        title: { "ja-ro": "Toukyou Ghoul" },
        altTitles: [
          { ja: "東京喰種トーキョーグール" },
          { "ja-ro": "Tokyo Ghoul" },
          { en: "TOKYO GHOUL" },
        ],
        description: {
          en: 'Lurking within the shadows of Tokyo are frightening beings known as "ghouls," who satisfy their hunger by feeding on humans once night falls. Ken Kaneki, an unsuspecting university freshman, finds himself caught in a world between humans and ghouls when his date turns out to be a ghoul after his flesh.\n\n[Written by MAL Rewrite]',
        },
        year: 2011,
        status: "completed",
        lastVolume: "14",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "040e8ae9-4ddd-49d2-8986-56782b391714.jpg" },
        },
      ],
    },
  },
  {
    rank: 25,
    manga: {
      id: "4301d363-ee02-43f4-ae24-4cbf29a74830",
      attributes: {
        title: { "ja-ro": "Oyasumi Punpun" },
        altTitles: [
          { fr: "Bonne nuit Punpun" },
          { ja: "おやすみプンプン" },
          { en: "Goodnight Punpun" },
        ],
        description: {
          en: "Punpun Onodera is a normal 11-year-old boy living in Japan. Hopelessly idealistic and romantic, Punpun begins to see his life take a subtle—though nonetheless startling—turn to the adult when he meets the new girl in his class, Aiko Tanaka. It is then that the quiet boy learns just how fickle maintaining a relationship can be, and the surmounting difficulties of transitioning from a naïve boyhood to a convoluted adulthood. When his father assaults his mother one night, Punpun realizes another thing: those whom he looked up to were not as impressive as he once thought.  \r\n  \r\nAs his problems increase, Punpun's once shy demeanor turns into voluntary reclusiveness. Rather than curing him of his problems and conflicting emotions, this merely intensifies them, sending him down the dark path of maturity in this grim coming-of-age saga.",
        },
        year: 2007,
        status: "completed",
        lastVolume: "13",
        originalLanguage: "ja",
        tags: [
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "0295431e-ccb9-4599-900f-0a1bc7380561.jpg" },
        },
      ],
    },
  },
  {
    rank: 26,
    manga: {
      id: "319df2e2-e6a6-4e3a-a31c-68539c140a84",
      attributes: {
        title: { en: "Slam Dunk!" },
        altTitles: [{ ja: "スラム　ダンク" }, { "ja-ro": "Slam Dunk" }],
        description: {
          en: "Winning isn't everything in the game of basketball, but who wants to come in second? It takes dedication and discipline to be the best, and the Shohoku High hoops team wants to be just that. They have one last year to make their captain's dream of reaching the finals come true–will they do it? Takehiko Inoue's legendary beloved basketball manga is finally here and the tale of a lifetime is in your hands.  \n  \nHanamichi Sakuragi's got no game with girls—none at all! It doesn't help that he's known for throwing down at a moment's notice and always coming out on top. A hopeless bruiser, he's been rejected by 50 girls in a row! All that changes when he meets the girl of his dreams, Haruko, and she's actually not afraid of him! When she introduces him to the game of basketball, his life is changed forever…  \n  \nNote: Includes a one-shot called 10 Days After. \n\n[Official English](https://www.viz.com/slam-dunk) \n\n---\n  \n- **Won the 40th Shogakukan Manga Award for Shonen In 1995**\n- **One of top 10 highest selling Manga in history, with over 170 Million copies sold as of 2017**\n- **In 2010, Inoue received special commendations from the Japan Basketball Association (JBA) for his contributions to the sport**",
        },
        year: 1990,
        status: "completed",
        lastVolume: "31",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "a845455f-52d0-4cc4-92a8-bd5bad7d69b9.jpg" },
        },
      ],
    },
  },
  {
    rank: 27,
    manga: {
      id: "f1c716b5-e82f-4625-a646-280cfa66abad",
      attributes: {
        title: { en: "CITY HUNTER" },
        altTitles: [{ fr: "Nicky Larson" }, { ja: "シティーハンター" }],
        description: {
          en: "Ryo Saeba is a \"sweeper\" in the city of Tokyo. He works as a troubleshooter - cleaning the streets of vermin and helping out desperate people. Sometimes he's a bodyguard, other times he's an assassin but whatever Ryo does, he does it well. In fact, his only flaw is his hormones - he loves the ladies maybe a little too much and sometimes turns into an idiot when he's near them! Thankfully, he's got people like his partner, Kaori Makimura to keep him in check.\n___\nOfficial Indonesian: Akasha (2020; Complete Edition)",
        },
        year: 1985,
        status: "completed",
        lastVolume: "35",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "85daba54-a71c-4554-8a28-9901a8b0afad", attributes: { name: { en: "Mafia" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "92d6d951-ca5e-429c-ac78-451071cbf064",
            attributes: { name: { en: "Office Workers" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "c16770ea-cebc-46a9-8dbc-d551f81a5cc3.jpg" },
        },
      ],
    },
  },
  {
    rank: 28,
    manga: {
      id: "0c9e19cd-86cb-490c-93e9-955af41746ca",
      attributes: {
        title: { en: "Nausicaä of the Valley of the Wind" },
        altTitles: [
          { "ja-ro": "Kaze no Tani no Nausicaä" },
          { fr: "Nausicaä de la Valée du Vent" },
          { ja: "風の谷のナウシカ" },
        ],
        description: {
          en: "The era of great civilizations came and went, brought to ash by machines of their creation. A thousand years passed, and the remnants of humanity reside in small pockets of land free from the toxic miasma produced by the surrounding Sea of Corruption.\n\n In one such land lies the Valley of the Wind, a small kingdom by the sea that receives strong wind that dissipates the miasma. There lives the princess Nausicaa. Chosen to represent her father in a military campaign far from home, she cannot imagine what role fate has for her, and for what the future will bring...\n\n---\n- **Won the Japan Cartoonist Association Grand Prize in 1994** \n- **Won the 26th Seiun Award for Best Comic in 1995**  \n  \n\n\n---\n\n**Links:**  \n- [Anime Film Adaptation on ANN](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=180)  \n- [Tokusatsu Prequel entitled: **Giant God Warrior Appears in Tokyo** on ANN](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=17207)",
        },
        year: 1982,
        status: "completed",
        lastVolume: "7",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e578c14c-1bbd-4eab-a5fb-882891c9115b.jpg" },
        },
      ],
    },
  },
  {
    rank: 29,
    manga: {
      id: "fa3e0b2f-4e1f-48ee-9af0-1de9dc28ca51",
      attributes: {
        title: { en: "Bakuman。" },
        altTitles: [{ en: "Bakuman." }, { en: "Bakuman" }, { ja: "バクマン。" }],
        description: {
          en: "Moritaka Mashiro (Saiko), with his superb drawing skill, is invited by his writing genius classmate Akito Takagi (Shujin) to tread the difficult path of the mangaka!! His sights are set on his naive yet earnest joint dream with Miho Azuki, who is aiming to become a voice actress!! Saiko and Shujin team up as writer and artist, aiming to be serialized in Weekly Shonen Jump, make a hit, and then release an anime. They bring their manuscripts into editors and set off on the road to becoming pro manga artists!! This is a new-age story of manga success!!  \n  \nAnimeNewsNetwork Links:  \n[Season 1](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=11197)  \n[Season 2](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=12311)  \n[Season 3](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=13867)  \n  \n[Live-Action Movie](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=17268)",
        },
        year: 2008,
        status: "completed",
        lastVolume: "20",
        originalLanguage: "ja",
        tags: [
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "92d6d951-ca5e-429c-ac78-451071cbf064",
            attributes: { name: { en: "Office Workers" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "5ed89234-34ac-4bc9-8035-8e5d9ef14d13.jpg" },
        },
      ],
    },
  },
  {
    rank: 30,
    manga: {
      id: "c196dcc8-d942-4abf-987f-bfa244650585",
      attributes: {
        title: { en: "Gantz" },
        altTitles: [{ ja: "ガンツ" }],
        description: {
          en: "Somewhere in Tokyo, there is a room. In that room is a black sphere. Periodically, people who should otherwise have died are transferred to the room. There, the sphere gives them special suits and weapons, and sends them out on a mission to kill aliens here on Earth. While these missions take place, the rest of the world is largely oblivious to them. These missions are lethal–few participants survive them. The sphere calls the shots, and it's not the slightest bit nice. Its name… Gantz.",
        },
        year: 2000,
        status: "completed",
        lastVolume: "37",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "90933363-cd67-4c7e-bb24-a3389b283e24.jpg" },
        },
      ],
    },
  },
  {
    rank: 31,
    manga: {
      id: "7e2ddc4c-c07c-4163-bf48-2b7c45f7b7fb",
      attributes: {
        title: { en: "NANA" },
        altTitles: [{ ja: "NANA―ナナ―" }, { ja: "ナナ" }],
        description: {
          en: 'Komatsu "Hachi" Nana is a 20-year-old Genki Girl from the countryside with a bad habit of falling in love at first sight.   \nOosaki Nana is a 20-year-old punk rocker from a different small city, who\'s coming off a bad breakup with her boyfriend (and former bass player of her band).   \nWhen "Hachi" decides to follow her boyfriend to Tokyo, and the other Nana heads there to start her music career, the two young women meet by chance on a snowbound train. They rent an apartment together several days later.   \nSurprisingly realistic drama and an oddly romantic friendship ensues.  \n  \n---\n- **Won the Shogakukan Manga Award for Shojo in 2002**\n  \nCurrently on an indefinite hiatus since 2009 due to the mangaka\'s health.',
        },
        year: 1999,
        status: "hiatus",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f42fbf9e-188a-447b-9fdc-f19dc1e4d685", attributes: { name: { en: "Music" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4eb41e2e-daa6-443d-a5ec-84765af12d2c.jpg" },
        },
      ],
    },
  },
  {
    rank: 32,
    manga: {
      id: "30460ee1-e7c1-4b1a-90a0-6861f9992c17",
      attributes: {
        title: { en: "Eyeshield 21" },
        altTitles: [{ ja: "アイシールド21" }],
        description: {
          en: "Wimpy Sena Kobayakawa has been running away from bullies all his life. But when the American football gear comes on, things change–Sena's speed and uncanny ability to elude big bullies just might give him what it takes to become a great high school American football hero! Enjoy all the bone-crushing action and slapstick comedy that this heartwarming coming-of-age story has to offer.",
        },
        year: 2002,
        status: "completed",
        lastVolume: "37",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4e777511-b9b7-4491-8de5-dda3e699f2a7.jpg" },
        },
      ],
    },
  },
  {
    rank: 33,
    manga: {
      id: "7f30dfc3-0b80-4dcc-a3b9-0cd746fac005",
      attributes: {
        title: { "ja-ro": "Meitantei Conan" },
        altTitles: [
          { en: "Detective Conan" },
          { fr: "Détective Conan" },
          { en: "Case Closed" },
          { ja: "名探偵コナン" },
        ],
        description: {
          en: "Shinichi Kudo is a high school detective who sometimes works with the police to solve cases. During an investigation, he is attacked by members of a crime syndicate known as the Black Organization. They force him to ingest an experimental poison, but instead of killing him, the poison transforms him into a child. Adopting the pseudonym Conan Edogawa and keeping his true identity a secret, Kudo lives with his childhood friend Ran and her father Kogoro, who is a private detective.",
        },
        year: 1994,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "b65b80fa-217c-4a71-8e8f-5d647990117a.jpg" },
        },
      ],
    },
  },
  {
    rank: 34,
    manga: {
      id: "f7888782-0727-49b0-95ec-a3530c70f83b",
      attributes: {
        title: { "ja-ro": "Hajime no Ippo" },
        altTitles: [
          { ja: "はじめの一歩" },
          { fr: "Ippo" },
          { en: "Hajime no Ippo: Fighting Spirit!" },
        ],
        description: {
          en: "Makunouchi Ippo is an ordinary high school student in Japan. Since he spends most of his time away from school helping his mother run the family business, he doesn't get to enjoy his younger years like most teenagers. Always a target for bullying at school, Ippo's life is one of hardship. One of these after-school bullying sessions turns Ippo's life around for the better, as he is saved by a boxer named Takamura. He decides to follow in Takamura's footsteps and train to become a boxer, giving his life direction and purpose. Ippo's path to perfecting his pugilistic prowess is just beginning.\n___\nOfficial Release:\n- Indonesian release by Level Comics as **Fight!! Ippo** (2006-ongoing)",
        },
        year: 1989,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "8ebf0c88-0f84-4fa0-abaf-0e2f8ebdf91e.jpg" },
        },
      ],
    },
  },
  {
    rank: 35,
    manga: {
      id: "754a46fa-62fa-457a-bc3b-4f31bf1373d4",
      attributes: {
        title: { "ja-ro": "Rurouni Kenshin: Meiji Kenkaku Romantan" },
        altTitles: [
          { ja: "るろうに剣心―明治剣客浪漫譚―" },
          { en: "Rurouni Kenshin" },
          { en: "Rurouni Kenshin: Meiji Swordsman Romance" },
          { en: "Samurai X" },
          { en: "Kenshin the Wanderer: Meiji Swordsman Romance" },
        ],
        description: {
          en: "140 years ago in Kyoto, with the coming of the American \"Black Ships,\" there arose a warrior who, felling men with his bloodstained blade, gained the name Hitokiri, man slayer! His killer blade helped close the turbulent Bakumatsu era and slashed open the progressive age known as Meiji . Then he vanished, and with the flow of years, became legend.  \n  \nTen years later, a young woman's life is saved when she happens upon a strange wandering swordsman named Kenshin. The young woman accepts the wanderer into her dojo, despite his secretive past, and the two become fast friends. As their relationship grows, they meet and make more friends (as well as enemies), and they grow accustomed to their life together.  \n  \nHowever, one man can only run from his past for so long, and it isn't long before Kenshin is forced to face the life he thought he'd left behind. Now, together with his friends, he must fight the ghosts of his past if he wants the people he loves to have any kind of future.  \n  \nContains a side story called Yahiko no Sakabato.\n\n\n---\nOfficial Release:\n- Indonesian release by Elex Media as **Samurai X** (2001)",
        },
        year: 1994,
        status: "completed",
        lastVolume: "28",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "81183756-1453-4c81-aa9e-f6e1b63be016", attributes: { name: { en: "Samurai" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "644c949b-0308-4799-8510-4ff5f12849a3.jpg" },
        },
      ],
    },
  },
  {
    rank: 36,
    manga: {
      id: "333f4d22-7753-4e3b-b0da-0a69b2cdce4f",
      attributes: {
        title: { en: "Assassination Classroom" },
        altTitles: [
          { ja: "暗殺教室" },
          { "ja-ro": "Ansatsu Kyoushitsu" },
          { "ja-ro": "Ansatsu Kyōshitsu" },
          { fr: "Classe d'assassinat" },
        ],
        description: {
          en: "In the blink of an eye, the night sky is forever changed when, with a great explosion, the moon is blasted into a permanent crescent. Confronting the governments of the world, a yellow tentacled monster boasts that it was the one responsible for the catastrophe, and in a year's time, it will do the same to Earth. Zooming around at Mach 20, the creature makes a peculiar demand: a teaching position at the prestigious Kunugigaoka Junior High School. Desperate to keep the creature in one place, the government agrees, and so the students of Class 3-E find themselves faced with an impossible task—assassinate the creature responsible for destroying the moon. But as the enigmatic creature—whom they dub Koro-sensei—educates them in both assassination and academia, the children slowly find the courage to rise up and take aim at their target: the greatest teacher the world has ever seen.",
        },
        year: 2012,
        status: "completed",
        lastVolume: "21",
        originalLanguage: "ja",
        tags: [
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "ad3292cf-416c-4d05-9e7a-78432c45fe35.jpg" },
        },
      ],
    },
  },
  {
    rank: 37,
    manga: {
      id: "07823fcd-f2c9-458c-9824-3eae62b2a006",
      attributes: {
        title: { en: "Parasyte" },
        altTitles: [{ ja: "寄生獣" }, { "ja-ro": "Kiseijuu" }],
        description: {
          en: "They arrive in silence and darkness. They descend from the skies. They have a hunger for human flesh. They are everywhere. They are parasites, alien creatures who must invade - and take control of - a human host to survive. And once they have infected their victims, they can assume any deadly form they choose: monsters with giant teeth, winged demons, creatures with blades for hands. But most have chosen to conceal their lethal purpose behind ordinary human faces. So no one knows their secret - except an ordinary high school student. Shin is battling for control of his own body against an alien parasite, but can he find a way to warn humanity of the horrors to come?\n\n[Alternate Official English](https://kodansha.us/series/parasyte/)\n\n---\n- **Won the Kodansha Manga Award for General Manga in 1993**\n- **Won the Seiun Award for Best Comic in 1996**",
        },
        year: 1988,
        status: "completed",
        lastVolume: "10",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "e64f6742-c834-471d-8d72-dd51fc02b835", attributes: { name: { en: "Aliens" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6ab29145-70f1-4ef7-97de-241394b4c530.jpg" },
        },
      ],
    },
  },
  {
    rank: 38,
    manga: {
      id: "cb43467f-8e3a-4e7f-9af9-7e48c1d6d0dc",
      attributes: {
        title: { "ja-ro": "Setoshi Seya" },
        altTitles: [
          { ja: "聖闘士星矢" },
          { en: "Saint Seiya" },
          { en: "Knights of the Zodiac" },
          { fr: "Les Chevaliers du Zodiaque" },
        ],
        description: {
          en: "Ages ago, the goddess Athena was served by fighters called Saints who channeled the power of the Cosmos within them. Now a youth named Seiya has trained to become a Saint himself by earning the mystical Cloth of Pegasus. He is joined by other Saints with Cloths of their own to fight for Athena.",
        },
        year: 1985,
        status: "completed",
        lastVolume: "28",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e196b394-cd15-4fa2-a247-91643aea61c4.jpg" },
        },
      ],
    },
  },
  {
    rank: 39,
    manga: {
      id: "4ee5e960-6329-4e1d-b038-93e8e0d53589",
      attributes: {
        title: { "ja-ro": "Ashita no Joe" },
        altTitles: [{ ja: "あしたのジョー" }, { fr: "Le Joe de demain" }],
        description: {
          en: "Joe Yabuki is a young man living in the slums of Tokyo. But, one day he meets Danpei Tange, a former boxer, who discovers his potential in boxing and tries to make him into a champion. Due to petty crimes, Joe is sent to a juvenile prison. There Joe mets Toru Rikiishi, a promising boxer, who knocked him out with one blow when he attempted to escape prison. Slowly but surely, Joe realizes his own potential. Joe begins his boxing life, step by step, with only one goal in mind… To Defeat Toru Rikiishi !!\n\nLicensed in English by Kodansha USA under the title Ashita no Joe: Fighting for Tomorrow.",
        },
        year: 1968,
        status: "completed",
        lastVolume: "20",
        originalLanguage: "ja",
        tags: [
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "750f8199-919e-4137-87f2-c16ab9720645.jpg" },
        },
      ],
    },
  },
  {
    rank: 40,
    manga: {
      id: "75251a47-952c-4e38-b1c6-3572b9bfd481",
      attributes: {
        title: { "ja-ro": "Hokuto no Ken" },
        altTitles: [
          { fr: "Ken le survivant" },
          { ja: "北斗の拳" },
          { en: "Fist of the North Star" },
          { fr: "Ken the Survivor" },
          { fr: "Fist of the North Star - Hokuto no Ken" },
        ],
        description: {
          en: "It is the year 199X. The world, after being plunged into nuclear war, is now a desert. The rule of law is might makes right. The weak suffer as bandits and warlords do as they please. Chaos runs amok and it seems there is no relief in sight.\n\nHowever, there is one man who stands against that. His name is Kenshiro, and he wields the Chinese martial art Hokuto Shinken - the Divine Fist of the North Star. \n\nJoin Kenshiro on his journey as he encounters all kinds of people, both friend and foe, as he discovers what his purpose in this wasteland is - to protect those who cannot protect themselves.\n___\n**Alt Official English:** [MangaHot](https://mangahot.jp/site/works/e_R0001)",
        },
        year: 1983,
        status: "completed",
        lastVolume: "27",
        originalLanguage: "ja",
        tags: [
          {
            id: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
            attributes: { name: { en: "Reincarnation" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "acc803a4-c95a-4c22-86fc-eb6b582d82a2", attributes: { name: { en: "Wuxia" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "126617b6-d739-4d64-9e28-0af94a10595a.jpg" },
        },
      ],
    },
  },
  {
    rank: 41,
    manga: {
      id: "b905f827-8d48-4948-b58c-0d6fd330d10d",
      attributes: {
        title: { en: "BLAME!" },
        altTitles: [{ ja: "ブラム" }],
        description: {
          en: "Killy is a man of few words. He wanders, seemingly endlessly, through a lonely, gargantuan labyrinth of concrete and steel, fighting off cyborgs and other futuristic nightmares, searching only for something called Net Terminal Genes. And he has a very powerful gun, which he uses without hesitation whenever anything resembling danger rears its ugly head.  \r\nWho is this quiet, violent, determined man and what are these Genes he seeks? The small communities he finds tucked into the crevices of this towering, dystopic ruin hardly give him leads on his treasure, driving him to find larger enclaves of civilization where people can reveal more about the world he lives in and the quarry he seeks.",
        },
        year: 1997,
        status: "completed",
        lastVolume: "10",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7310014a-0f95-487b-b2bc-0f89e1d40073.jpg" },
        },
      ],
    },
  },
  {
    rank: 42,
    manga: {
      id: "8bd19e5c-94f7-4368-a918-50f463857446",
      attributes: {
        title: { "ja-ro": "Kuroshitsuji" },
        altTitles: [{ ja: "黒執事" }, { en: "Black Butler" }, { fr: "Majordome noir" }],
        description: {
          fr: "Sébastian est majordome au service de Ciel Phantomhive, héritier d'une grande famille de la noblesse anglaise. En matière d'érudition, d'éducation, d'art culinaire, rien à redire, il est parfait. Mais ne vous fiez pas à sa distinction, si vous vous en prenez à son jeune maître, vous découvrirez sa vraie nature... Ciel aurait-il signé un pacte avec le Diable...?!",
        },
        year: 2006,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "631ef465-9aba-4afb-b0fc-ea10efe274a8", attributes: { name: { en: "Zombies" } } },
          {
            id: "9ab53f92-3eed-4e9b-903a-917c86035ee3",
            attributes: { name: { en: "Crossdressing" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "dd5ef594-59b2-4aaf-96db-a547c3e48312.jpg" },
        },
      ],
    },
  },
  {
    rank: 43,
    manga: {
      id: "46e9cae5-4407-4576-9b9e-4c517ae9298e",
      attributes: {
        title: { en: "Yakusoku no Neverland" },
        altTitles: [
          { ja: "約束のネバーランド" },
          { en: "The Promised Neverland" },
          { fr: "The Promised Neverland" },
        ],
        description: {
          fr: "Emma, Norman et Ray coulent des jours heureux à l’orphelinat Grace Field House. Entourés de leurs petits frères et sœurs, ils s’épanouissent sous l’attention pleine de tendresse de « Maman », qu'ils considèrent comme leur véritable mère. Mais tout bascule le soir où ils découvrent l’abominable réalité qui se cache derrière la façade de leur vie paisible ! Ils doivent s’échapper, c’est une question de vie ou de mort !\n\n---\n\nMaison d'édition FR : **Kazé / Crunchyroll**",
        },
        year: 2016,
        status: "completed",
        lastVolume: "20",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e023b6b0-76c7-4dfd-8ec2-ce7a26b90a05.jpg" },
        },
      ],
    },
  },
  {
    rank: 44,
    manga: {
      id: "34f45c13-2b78-4900-8af2-d0bb551101f4",
      attributes: {
        title: { en: "Dorohedoro" },
        altTitles: [{ ja: "ドロヘドロ" }],
        description: {
          en: 'This is the story of Kaiman, a guy who does not remember who he was before he was transfigured by a Magic user. \nThis transformation left him with a reptile\'s head, and a desire to find out the truth about who he really is. \nAccompanied by Nikaido, his female companion, he tracks down Magic Users in "The Hole" and unceremoniously \nchomps down on their head, hoping to find out who it was that put him in this state. \nOne by one, they witness this "second man" inside the head of Kaiman, and after pulling them back out of his mouth \nhe asks them all a question "What did the guy inside my head say?"  \n\n\n---',
        },
        year: 2000,
        status: "completed",
        lastVolume: "23",
        originalLanguage: "ja",
        tags: [
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "631ef465-9aba-4afb-b0fc-ea10efe274a8", attributes: { name: { en: "Zombies" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "54a405c8-c20b-475d-ae67-c8cf9d3b4aa6.jpg" },
        },
      ],
    },
  },
  {
    rank: 45,
    manga: {
      id: "3be16cf9-fe5c-431e-b528-98551d3d3bb0",
      attributes: {
        title: { en: "Planetes" },
        altTitles: [{ ja: "プラネテス" }],
        description: {
          en: "Haunted by a space flight accident that claimed the life of his beloved wife, Yuri finds himself six years later as part of a team of debris cleaners on a vessel called the Toy Box charged with clearing space junk from space flight paths. The team consists of Hachimaki, a hot shot debris-man with a sailor's affinity for the orbital ocean; Fee, a chain-smoking tomboy beauty with an abrasive edge; and Pops, a veteran orbital mechanic whose avuncular presence soothes the stress of the job.\n\n*Won the Seiun Award for Best Comic of the Year in 2002.*",
        },
        year: 1999,
        status: "completed",
        lastVolume: "4",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "a8b8aab0-f6d1-4d34-8d0d-a1d7d34b4873.jpg" },
        },
      ],
    },
  },
  {
    rank: 46,
    manga: {
      id: "c52b2ce3-7f95-469c-96b0-479524fb7a1a",
      attributes: {
        title: { "ja-ro": "Jujutsu Kaisen" },
        altTitles: [{ ja: "呪術廻戦" }, { en: "Revolving Battles Of Curse Arts" }],
        description: {
          fr: "Yuuji est un jeune étudiant qui excelle dans le sport, notamment dans l'athlétisme, mais qui a un immense poil dans la main. Du coup, au lieu de parfaire ses capacités physiques qui pourraient lui permettre de devenir le meilleur de l'établissement, il s'est inscrit au club de recherches occultes du lycée. Son petit train-train va changer du tout au tout lorsqu'un véritable esprit malfaiteur vient menacer son école…\n\n---\n\nMaison d'édition FR : **Ki-oon**",
        },
        year: 2018,
        status: "completed",
        lastVolume: "30",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "3bb26d85-09d5-4d2e-880c-c34b974339e9", attributes: { name: { en: "Ghosts" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6d9134b2-21ea-4d02-ac2b-7c0d1c6a2aaa.jpg" },
        },
      ],
    },
  },
  {
    rank: 47,
    manga: {
      id: "789642f8-ca89-4e4e-8f7b-eee4d17ea08b",
      attributes: {
        title: { en: "Demon Slayer: Kimetsu no Yaiba" },
        altTitles: [
          { en: "Demon Slayer" },
          { fr: "Les Rôdeurs de la Nuit" },
          { ja: "鬼滅の刃" },
          { en: "Blade of Demon Destruction" },
          { "ja-ro": "Kimetsu no Yaiba" },
        ],
        description: {
          en: "Since ancient times, rumors have abounded of man-eating demons lurking in the woods. Because of this, the local townsfolk never venture outside at night. Legend has it that a demon slayer also roams the night, hunting down these bloodthirsty demons.  \nEver since the death of his father, Tanjirou has taken it upon himself to support his mother and five siblings. Although their lives may be hardened by tragedy, they've found happiness. But that ephemeral warmth is shattered one day when Tanjirou finds his family slaughtered and the lone survivor, his sister Nezuko, turned into a demon. Adding to this sorrow, a demon hunter named Tomioka Giyuu arrived and was about to finish Nezuko off, but to his surprise she and Tanjiro started to protect each other. Seeing this oddity and Tanjiro's promising fighting skills, Giyuu decides to send them to his old mentor to be trained.  \nSo begins Tanjiro's life as a demon hunter, bound on a quest to cure his sister and find the one who murdered his entire family.  \n\n----\nAlternative English: [MANGA Plus](https://mangaplus.shueisha.co.jp/titles/100009)",
        },
        year: 2016,
        status: "completed",
        lastVolume: "23",
        originalLanguage: "ja",
        tags: [
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "60530e72-f76f-45d5-b6f9-f95e05058fc3.png" },
        },
      ],
    },
  },
  {
    rank: 48,
    manga: {
      id: "16dc43f3-d6ba-4154-b445-a9d2e674c0eb",
      attributes: {
        title: { en: "Message to Adolf" },
        altTitles: [
          { en: "Tell Adolf" },
          { "ja-ro": "Adolf ni Tsugu" },
          { en: "Adolf" },
          { ja: "アドルフに告ぐ" },
        ],
        description: {
          en: "A graveyard in contemporary Israel has an unlikely visitor. The elderly gentleman from Japan, a former news correspondent, lays a bouquet of flowers at the tomb of one Adolf Kamil. For he remembers the tale of three Adolfs: Kamil, a Jew who grew up in Kobe, Japan, the son of a baker; Kaufmann, only child of a German consul stationed at that port city and his Japanese wife; and the Fuhrer with whom the Far Eastern nation made common cause.  \n\n---\n- **Won the 10th Kodansha Manga Award for General Manga in 1986, shared with Makoto Kobayashi's What's Michael?**\n\n\n---\n**Volumes 372-376 of the Osamu Tezuka Complete Works**",
        },
        year: 1983,
        status: "completed",
        lastVolume: "5",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          { id: "85daba54-a71c-4554-8a28-9901a8b0afad", attributes: { name: { en: "Mafia" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4f6bf801-d99e-427c-a032-18db376bb293.jpg" },
        },
      ],
    },
  },
  {
    rank: 49,
    manga: {
      id: "53ef1720-7a5d-40ad-90b0-2f9ca0a1ab01",
      attributes: {
        title: { "ja-ro": "Soul Eater" },
        altTitles: [{ ja: "ソウルイーター" }],
        description: {
          en: "Maka is a weapon meister, determined to turn her partner, a living scythe named Soul Eater, into a powerful death scythe — the ultimate weapon of Death himself! Charged with the task of collecting and devouring the tainted souls of ninety-nine humans and one witch, Maka and her fellow meisters strive to master their weapons as they face off against the bizarre and dangerous minions of the underworld. But the meisters’ own personal quirks may prove a bigger obstacle than any sultry enchantress!",
        },
        year: 2004,
        status: "completed",
        lastVolume: "25",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6163c521-db05-4b23-9642-862d55fe9787.jpg" },
        },
      ],
    },
  },
  {
    rank: 50,
    manga: {
      id: "7661932f-7f80-4c3a-bb37-6861a1477876",
      attributes: {
        title: { en: "Tekkon Kinkreet" },
        altTitles: [
          { en: "A Cidade do Tesouro" },
          { en: "Amer Béton" },
          { en: "Black & White" },
          { en: "Black and White (MATSUMOTO Taiyou)" },
          { en: "Preto e Branco" },
          { en: "Reinforced Concrete" },
          { en: "Steel Reinforced Concrete" },
          { en: "Tekkon Kinkreet: Black & White" },
          { en: "Tekkon Kinkurito" },
          { en: "Tekkonkinkreet" },
          { en: "鉄コン筋クリート" },
        ],
        description: {
          en: "Orphaned on the mean streets of Treasure Town, lost boys Black and White must mug, steal and fight to survive. Around them moves a world of corruption and loneliness, small-time crooks and neurotic police officers, and a band of sadistic yakuza who have plans for their once-fair city. Can they rise above their environment? Surreal manga influenced by European comics.",
        },
        year: 1993,
        status: "completed",
        lastVolume: "3",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "55c7ad40-b748-42ce-841d-295cd19cc3ec.jpg" },
        },
      ],
    },
  },
  {
    rank: 51,
    manga: {
      id: "b6886009-e60b-44a7-abc2-a575765277ba",
      attributes: {
        title: { "ja-ro": "D.Gray-man" },
        altTitles: [{ ja: "D.Gray-man" }, { ja: "ディー・グレイマン" }, { en: "D.Gray-man" }],
        description: {
          en: 'Losing a loved one is so painful that one may sometimes wish to be able to resurrect them—a weakness that the enigmatic Millennium Earl exploits. To make his mechanical weapons known as "Akuma," he uses the souls of the dead that are called back. Once a soul is placed in an Akuma, it is trapped forever, and the only way to save them is to exorcise them from their vessel using the Anti-Akuma weapon, "Innocence."\n\nAfter spending three years as the disciple of General Cross, Allen Walker is sent to the Black Order—an organization comprised of those willing to fight Akuma and the Millennium Earl—to become an official Exorcist. With an arm as his Innocence and a cursed eye that can see the suffering souls within an Akuma, it\'s up to Allen and his fellow Exorcists to stop the Millennium Earl\'s ultimate plot: one that can lead to the destruction of the world.',
        },
        year: 2004,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "a8ea60f1-0fef-4af0-b26e-8b761406c114.jpg" },
        },
      ],
    },
  },
  {
    rank: 52,
    manga: {
      id: "aaedcbda-ea61-4e7b-8143-7a475f327fbf",
      attributes: {
        title: { en: "Neon Genesis Evangelion" },
        altTitles: [
          { "ja-ro": "Shin Seiki Evangelion" },
          { ja: "新世紀エヴァンゲリオン" },
          { fr: "Neon Genesis Evangelion" },
        ],
        description: {
          fr: "An 2000. Un astéroïde frappa la Terre, provoquant un cataclysme sans précédent. Les humains qui survécurent construisirent une nouvelle ville, Tokyo-3, et s'apprêtaient à vivre enfin en paix lorsque de mystérieuses créatures appelées \" Anges \" apparurent, semant la terreur et la destruction.\"Qui sont les Anges ? D'où viennent-ils ? Ont-ils un lien avec l'astéroïde ? Mystère ! Sauf pour le commandant de l'organisation N.E.R.V. qui possède la seule arme capable de les repousser : les Evangelions, gigantesques machines de guerre humanoïdes. Mais lorsqu'un nouvel Ange surgit, il manque encore l'essentiel : un pilote…\"\n\n---\n\nMaison d'édition FR : **Glénat**",
        },
        year: 1994,
        status: "completed",
        lastVolume: "14",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "50880a9d-5440-4732-9afb-8f457127e836", attributes: { name: { en: "Mecha" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "e64f6742-c834-471d-8d72-dd51fc02b835", attributes: { name: { en: "Aliens" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          {
            id: "f4122d1c-3b44-44d0-9936-ff7502c39ad3",
            attributes: { name: { en: "Adaptation" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "608a07c7-0671-4577-8eb5-8ee826d50ed5.jpg" },
        },
      ],
    },
  },
  {
    rank: 53,
    manga: {
      id: "e5357466-c8a2-4259-9b02-2580185bd2bb",
      attributes: {
        title: { en: "Billy Bat" },
        altTitles: [{ ja: "ビリーバット" }],
        description: {
          en: "From Kana:\nThe story begins in 1949 Los Angeles. Kevin Yamagata, a Japanese American cartoonist, has built his career on Billy Bat, a sharp, wisecracking detective beloved by readers. But everything shifts when Kevin realizes he may have unknowingly copied the character from an image he once saw in Japan.\n\nDetermined to find the truth, Kevin returns to a devastated, post-war Japan. What he uncovers goes far beyond questions of inspiration or theft. The image of the bat is ancient, surfacing again and again across history, tied to moments of upheaval, power, and violence.\n\nAs Kevin follows the trail, he is drawn into a far-reaching mystery that blurs fiction and reality, where a single drawing may hold the key to forces shaping human history.\n\n---\n**Awards Won:**\n\n- Winner of the [Lucca Comics Awards](https://luccacomicsawards.com/albo-doro-2/) for Best Manga Series in 2012.\n- Winner of the [Max und Moritz Award](https://www.comic-salon.de/en/max-and-moritz-award) for Best International Comic in 2014.\n\n---\nSee [MyAnimeList](https://myanimelist.net/manga/11054/Billy_Bat?q=billy%20bat&cat=manga) for Manga Details.\n\n- [Wikipedia](https://en.wikipedia.org/wiki/Billy_Bat)",
        },
        year: 2008,
        status: "completed",
        lastVolume: "20",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "92d6d951-ca5e-429c-ac78-451071cbf064",
            attributes: { name: { en: "Office Workers" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "11cde992-1cd2-4e84-af10-31f9ff71e69b.jpg" },
        },
      ],
    },
  },
  {
    rank: 54,
    manga: {
      id: "ffa6ccc0-6989-495e-878f-851a83ccdb59",
      attributes: {
        title: { en: "Ikigami" },
        altTitles: [
          { en: "Ikigami: The Ultimate Limit" },
          { fr: "Ikigami: Préavis de mort" },
          { ja: "イキガミ" },
          { en: "Death Paper" },
        ],
        description: {
          en: "The japanese government has launched a brand new law: because of the laziness and apathy of Japan's people it was decided that someone, daily and randomly, will be chosen and killed with a poisoned capsule in order to \"bring to life again\" and wake up the others.  \nThe person elected will be warned with an ikigami (or death's notice) and after this he/she will have only 24 hours left to live.  \nWhat will those condemned think and do during this short time?  \n  \n [Official Serbian](https://www.kupindo.com/Manga-stripovi/64393201_Ikigami-2-Motoro-Mase)",
        },
        year: 2005,
        status: "completed",
        lastVolume: "10",
        originalLanguage: "ja",
        tags: [
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "bda6ad4b-6200-45a4-b154-2b7f63132038.jpg" },
        },
      ],
    },
  },
  {
    rank: 55,
    manga: {
      id: "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b",
      attributes: {
        title: { "ja-ro": "Chainsaw Man" },
        altTitles: [{ ja: "チェンソーマン" }, { en: "Chainsaw Man" }],
        description: {
          fr: "Pour rembourser ses dettes, Denji, jeune homme dans la dèche la plus totale, est exploité en tant que Devil Hunter avec son chien-démon-tronçonneuse, “Pochita”. Mais suite à une cruelle trahison, il voit enfin une possibilité de se tirer des bas-fonds où il croupit ! Devenu surpuissant après sa fusion avec Pochita, Denji est recruté par une organisation et part à la chasse aux démons…\n\n---\n\nMaison d'édition FR : **Kazé / Crunchyroll**",
        },
        year: 2018,
        status: "completed",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6e518bd1-5f60-446b-8832-bfe6bf74834b.jpg" },
        },
      ],
    },
  },
  {
    rank: 56,
    manga: {
      id: "985e4ae6-7a36-42c5-ae12-f4291c58798c",
      attributes: {
        title: { "ja-ro": "Dr. Slump" },
        altTitles: [{ en: "Doctor Slump" }, { ja: "Dr.スランプ" }],
        description: {
          en: "When goofy inventor Senbei Norimaki creates a precocious robot named Arale, his masterpiece turns out to be more than he bargained for!\n\n\n---\nOfficial Release:\n- English release by [Viz Media](https://www.viz.com/dr-slump)\n- Indonesian release by Elex Media (2022)\n\n\n---\n- **Won the Shogakukan Manga Award for Shonen/Shojo in 1982**",
        },
        year: 1980,
        status: "completed",
        lastVolume: "18",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7df761c0-79ec-4e58-9d1e-ba230cfb16eb.jpg" },
        },
      ],
    },
  },
  {
    rank: 57,
    manga: {
      id: "17dcd7da-7692-420f-b813-a92159def4be",
      attributes: {
        title: { "ja-ro": "Hikaru no Go" },
        altTitles: [
          { ja: "ヒカルの碁" },
          { "ja-ro": "HikaGo" },
          { en: "Hikaru no Go" },
          { en: "Hikaru's Go" },
          { fr: "Le go de Hikaru" },
        ],
        description: {
          fr: "Un jour, Hikaru, 11 ans, trouve dans une remise une vieille table de go. Soudain, de celle-ci surgit un fantôme qui y était enfermé: le fantôme de Saï Fujiwara, un génie du jeu de go à l'époque Heïan (VIIIe à XIIe siècle) qui s'introduit dans l'esprit de Hikaru. Acceptant de permettre à Saï de jouer au go contre quelqu'un, Hikaru fait la connaissance d'Akira Toya, fils du meilleur joueur japonais et promis lui aussi à un brillant avenir. La passion de Saï et d'Akira pour ce jeu entraîne peu à peu Hikaru dans le monde du go...\n\n---\nUn jour, Hikaru 11 ans, trouve dans une remise une vieille table de go. Soudain, de celle-ci surgit un fantôme qui y est enfermé: le fantôme de Saï Fujiwara, un génie du jeu de go à l'époque Heian (du VIIème au XIIème siècle) qui s'introduit dans l'esprit de Hikaru. La passion de Saï pour ce jeu entraine peu à peu Hikaru dans le monde du go...",
        },
        year: 1998,
        status: "completed",
        lastVolume: "23",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "31932a7e-5b8e-49a6-9f12-2afa39dc544c",
            attributes: { name: { en: "Traditional Games" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e70a1632-e36e-42ce-a9ad-f5891410726d.jpg" },
        },
      ],
    },
  },
  {
    rank: 58,
    manga: {
      id: "178f7c49-3dd7-4e92-90e2-bb08c9f7b789",
      attributes: {
        title: { en: "Samurai Deeper Kyo" },
        altTitles: [{ ja: "サムライ ディーパー キョウ" }],
        description: {
          en: "At the dawn of the 17th century, at the end of the era of civil wars, in a world of chaos, the epic Battle of Sekigahara was joined. One man emerged from the largest battle ever fought on Japanese soil; a terrible warrior of unspeakable power, he was nicknamed 'the unconquerable.'  \n  \nKyoshiro is a peaceful medicine peddler who harbors the soul of an assassin. He accompanies a young bounty hunter across Japan in search of a murderer and on a quest to discover the terrible secret of his own identity.",
        },
        year: 1999,
        status: "completed",
        lastVolume: "38",
        originalLanguage: "ja",
        tags: [
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "8e41c5bd-c92d-4f80-a3bb-94d5152ffd6e.jpg" },
        },
      ],
    },
  },
  {
    rank: 59,
    manga: {
      id: "4481002b-f65c-426a-8cb4-3a1bba1040c5",
      attributes: {
        title: { "ja-ro": "Mugen no Junin" },
        altTitles: [
          { fr: "L'Habitant de l'Infini" },
          { fr: "Lame de l'immortel" },
          { ja: "むげんのじゅにん" },
          { ja: "無限の住人" },
          { en: "Blade of the Immortal" },
          { en: "The Inhabitant of Infinity" },
        ],
        description: {
          en: "\"To end his eternal suffering, he must slay one thousand enemies!\" Manji, a ronin warrior of feudal Japan, has been cursed with immortality. To rid himself of this curse and end his life of misery, he must slay one thousand evil men! His quest begins when a young girl seeks his help in taking revenge on her parents' killers… and his quest won't end until the blood of a thousand has spilled!  \n\n[Official English](https://digital.darkhorse.com/series/373/blade-of-the-immortal)\n \n--- \n- **Won the 1st Japan Media Arts Award Division Excellence Prize**\n\n---\n  \nAnimeNewsNetwork Links:  \n[Anime](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=9691)  \n[Live-Action Movie](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=18861)",
        },
        year: 1993,
        status: "completed",
        lastVolume: "30",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "489dd859-9b61-4c37-af75-5b18e88daafc", attributes: { name: { en: "Ninja" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "81183756-1453-4c81-aa9e-f6e1b63be016", attributes: { name: { en: "Samurai" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "d4f09702-2208-40a1-9f5b-1ef91aabaeba.png" },
        },
      ],
    },
  },
  {
    rank: 60,
    manga: {
      id: "c4994dc6-f2ee-4eb7-a00c-ebca63b35268",
      attributes: {
        title: { "ja-ro": "Koukaku Kidoutai: THE GHOST IN THE SHELL" },
        altTitles: [
          { ja: "攻殻機動隊 THE GHOST IN THE SHELL" },
          { ja: "攻殻機動隊" },
          { "ja-ro": "Koukaku Kidoutai" },
          { en: "The Ghost in the Shell" },
          { en: "Assault Shell Mobile Squad: THE GHOST IN THE SHELL" },
          { en: "Mobile Armored Riot Police" },
          { fr: "policiers anti-émeute en carapaces offensives" },
          { fr: "GITS" },
        ],
        description: {
          en: 'From Kodansha:\nDeep into the 21st century, the line between man and machine has been inexorably blurred as humans rely on the enhancement of mechanical implants and robots are upgraded with human tissue. In this rapidly converging landscape, cyborg super-agent Major Motoko Kusanagi is charged with tracking down the craftiest and most dangerous terrorists and cybercriminals, including "ghost hackers," capable of exploiting the human/machine interface by re-programming human minds to become puppets to carry out their criminal ends. When Major Kusanagi tracks the cybertrail of one such master hacker, the Puppeteer, her quest leads her into a world beyond information and technology where the very nature of consciousness and the human soul are turned upside-down and inside-out.',
        },
        year: 1989,
        status: "completed",
        lastVolume: "1",
        originalLanguage: "ja",
        tags: [
          {
            id: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
            attributes: { name: { en: "Reincarnation" } },
          },
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "8c86611e-fab7-4986-9dec-d1a2f44acdd5",
            attributes: { name: { en: "Virtual Reality" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7ef52662-aa4a-49f4-9158-7cddb42181c7.jpg" },
        },
      ],
    },
  },
  {
    rank: 61,
    manga: {
      id: "e9b1d4ba-b8fb-48c3-8d52-5a4eefd05980",
      attributes: {
        title: { "ja-ro": "Fruits Basket" },
        altTitles: [{ "ja-ro": "Furuba" }, { ja: "フルーツバスケット" }, { ja: "フルバ" }],
        description: {
          en: "Tohru Honda, an orphaned high school girl, is taken in by the wealthy Shigure Sohma when he realizes she has nowhere else to go. However, the Sohma family shares a secret, and it isn't long before Tohru discovers that there's a reason why her classmates, Yuki and Kyo Sohma, never let girls get near them, and never talk about their lives before they lived with Shigure. And before she knows it, Tohru has become so tangled up in the lives of each member of the Sohma family that she couldn't leave even if she wanted to.  \n  \nAs she learns more and more about the truth of the Sohma family and the nature of their secrets, she desperately searches for a way that she can save them. But what can one girl do, especially when it seems that she may have been part of someone's plan all along…  \n  \n[Official English](https://yenpress.com/9780316360166/fruits-basket-collectors-edition-vol-1/)\n\n---\n- **Won the Kodansha Manga Award for Shojo in 2001**\n- **Attained the Guinness World Record for Best-Selling Shojo Manga**",
        },
        year: 1998,
        status: "completed",
        lastVolume: "23",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "65761a2a-415e-47f3-bef2-a9dababba7a6",
            attributes: { name: { en: "Reverse Harem" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "8aa2d91e-adb9-46e9-a119-60751128b323.jpg" },
        },
      ],
    },
  },
  {
    rank: 62,
    manga: {
      id: "e52d9403-3356-403b-b7bb-d7d6a420dd50",
      attributes: {
        title: { "ja-ro": "Nanatsu no Taizai" },
        altTitles: [
          { ja: "七つの大罪" },
          { fr: "Les sept péchés capitaux" },
          { fr: "Les sept péchés mortels" },
          { en: "The Seven Deadly Sins" },
        ],
        description: {
          fr: "La princesse Elizabeth est prête à tout pour retrouver la légendaire bande de mercenaires connue sous le nom de « Seven Deadly Sins. » À ses yeux, eux seuls ont le pouvoir d’arracher le royaume de Britannia des mains des surpuissants Chevaliers Sacrés qui sèment la terreur! Sa rencontre avec Meliodas, un garçon à la force exceptionnelle, et Hawk, son cochon, va marquer le début d’une aventure riche en rebondissements, où magie et combats sont au rendez-vous!\n\nPlonge dans cette épopée chevaleresque dans la plus pure tradition de l’heroic fantasy!",
        },
        year: 2012,
        status: "completed",
        lastVolume: "41",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
            attributes: { name: { en: "Reincarnation" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "07709f1d-a9aa-4a0e-be80-8e4c9e764161.jpg" },
        },
      ],
    },
  },
  {
    rank: 63,
    manga: {
      id: "d00375da-57ab-4282-a887-754dbfd88c4d",
      attributes: {
        title: { en: "A Journal Of My Father" },
        altTitles: [
          { fr: "Le Journal de mon père" },
          { en: "My Father's Almanac" },
          { ja: "父の暦" },
          { "ja-ro": "Chichi no Koyomi" },
        ],
        description: {
          en: "A family is devastated by the Great Tottori Fire of 1952, but the family comes to terms with the disaster and breaks free from the bonds holding them back.\n\n(from MangaUpdates):\n\nKNOW THY FATHER The book opens with some childhood thoughts of Yoichi Yamashita spurred by a phone call at work informing him of his father's death. \n\nSo, he journeys back to his hometown after an absence of well over a decade during which time he has not seen his father. But as the relatives gather for the funeral and the stories start to flow, Yoichi's childhood starts to resurface. \n\nThe Spring afternoons playing on the floor of his father's barber shop, the fire that ravaged the city and his family home, his parents' divorce and a new ‘mother’. Through confidences and memories shared with those who knew him best, Yoichi rediscovers the man he had long considered an absent and rather cold father.\n\nNote: Was nominated for the Eisner Award for Best U.S. Edition of International Material - Asia in 2021",
        },
        year: 1994,
        status: "completed",
        lastVolume: "1",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "bd8ec57e-f48f-4b32-b802-4d4ee1aa3931.jpg" },
        },
      ],
    },
  },
  {
    rank: 64,
    manga: {
      id: "58be6aa6-06cb-4ca5-bd20-f1392ce451fb",
      attributes: {
        title: { "ja-ro": "Yotsuba to!" },
        altTitles: [{ ja: "よつばと！" }, { en: "Yotsuba&!" }, { en: "Yotsuba and!" }],
        description: {
          en: "Yotsuba is a strange little girl with a big personality! Even in the most trivial, unremarkable encounters, Yotsuba's curiosity and enthusiasm quickly turns the everyday into the extraordinary!\n\n---\n- **Won the Excellence Award for Manga at the Japan Media Arts Festival in 2006**\n\n\n---\nOfficial Release:\n- Indonesian release by Elex Media (2007)",
        },
        year: 2003,
        status: "hiatus",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "ff8d4f70-1797-4036-8241-c63b2237254e.jpg" },
        },
      ],
    },
  },
  {
    rank: 65,
    manga: {
      id: "4e102d46-0a98-4249-8a42-98e4705b663e",
      attributes: {
        title: { en: "Buddha" },
        altTitles: [{ ja: "ブッダ" }, { fr: "La Vie du Bouddha" }],
        description: {
          en: "(from ebookjapan):\n\nSome 3,500 years ago, the Arians living on the banks of the Indus River had established a caste system with Brahmins at the top. Shortly before the birth of Siddhartha, the hero of this story, Chapra, who was born a slave, became his adopted son after helping a general of the Kosala kingdom. \n\nHe then hid his origins and sought the position of power, but Chapra, too, could not escape the curse of the status system... \n\nHere begins the epic story of the Buddha's life and the times in which he lived!\n\nThe complete biography of Buddha, as seen by Osamu Tezuka.  \n\n\n---\nOfficial Release:\n- English release by [Kodansha US](https://kodansha.us/series/buddha/)\n- Indonesian release by Kepustakaan Populer Gramedia (KPG)\n\n\n\n---\n- **Won the 21st Bungei Shunju Manga Award in 1975, along with another short work of Tezuka's, Animal Tsurezuregusa (included in Paper Fortress)**\n---\n**Volumes 287-300 of the Osamu Tezuka Complete Works**",
        },
        year: 1972,
        status: "completed",
        lastVolume: "8",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
            attributes: { name: { en: "Reincarnation" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "3bb26d85-09d5-4d2e-880c-c34b974339e9", attributes: { name: { en: "Ghosts" } } },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "c8cbe35b-1b2b-4a3f-9c37-db84c4514856", attributes: { name: { en: "Medical" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          {
            id: "f4122d1c-3b44-44d0-9936-ff7502c39ad3",
            attributes: { name: { en: "Adaptation" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "88140047-5be9-4104-8531-a2c782683132.png" },
        },
      ],
    },
  },
  {
    rank: 66,
    manga: {
      id: "be8fe64b-37da-4fba-b14d-603aba19be1f",
      attributes: {
        title: { en: "Claymore" },
        altTitles: [{ "ja-ro": "Kureimoa" }, { ja: "クレイモア" }],
        description: {
          en: 'It is the Middle Ages, and the remnants of mankind are plagued by paranoia and death. Spoken in fearful whispers, the word "Yoma" cuts a clear image into the minds of all: monstrous beings with an insatiable hunger for human flesh. But fear of their gruesome appetite is dwarfed by that of their ability to shapeshift and steal the memories of their last meal. Forever vulnerable to attack, humans live in unease, even among family.  \n  \nThere are few means to kill a Yoma. The Organization, informally known as "Claymore," is humanity\'s only line of defense, dispatching half-human, half-Yoma female warriors to purify villages of Yoma. A lonely and dangerous existence, death for these warriors comes with each new assignment. What time is found between trying battles and long, arduous travels is spent in ever-intensifying struggle to resist their Yoma blood and maintain their humanity. Villagers, knowing of this, pay for their security reluctantly and have only loathsome regard for their protectors.  \n  \nClaymore follows the stoic and low-ranking member Clare in her daunting trek as she searches for personal vengeance. Along the way, she encounters many unexpected things about the world, from the camaraderie and hope held fast by her sisters-in-arms to the sinister truth behind the Claymore Organization.',
        },
        year: 2001,
        status: "completed",
        lastVolume: "27",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4e397457-36ef-4122-8219-54ae470e28b0.jpg" },
        },
      ],
    },
  },
  {
    rank: 67,
    manga: {
      id: "4393fd4e-d646-4bab-9c95-786168ccb618",
      attributes: {
        title: { en: "Devilman" },
        altTitles: [{ ja: "デビルマン" }, { "ja-ro": "Devilman" }],
        description: {
          en: "Demons exist and their power is beyond what humans can fathom. In fact they are so strong that humans do not stand a chance against them in a fight. The only thing strong enough to defeat a demon is another demon and it is through this logic that Ryo Asuka hatches the plan to have his good-hearted friend Akira Fudo possessed by a demon. If a person is of pure of heart then he might be able to control the demon that possesses him and thereby acquire power equal to a demon. After raising some hell in a club the plan works and Akira is possessed by the powerful demon known as Amon. Now Akira is mankind's sole champion of justice against the hidden demon menace that has plagued humanity since the dawn of time.\n\n[Official English](https://sevenseasentertainment.com/series/devilman-the-classic-collection/)",
        },
        year: 1972,
        status: "completed",
        lastVolume: "5",
        originalLanguage: "ja",
        tags: [
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "3199fa66-3a73-4c11-9236-9cba765e6650.jpg" },
        },
      ],
    },
  },
  {
    rank: 68,
    manga: {
      id: "44a5cbe1-0204-4cc7-a1ff-0fda2ac004b6",
      attributes: {
        title: { en: "Yu★Yu★Hakusho" },
        altTitles: [{ ja: "幽★遊★白書" }, { "ja-ro": "Yu Yu Hakusho" }],
        description: {
          en: "Yusuuke Urameshi was a tough teen delinquent until one selfless act changed his life… by ending it. When he died saving a little kid from a speeding car, the afterlife didn't know what to do with him, so it gave him a second chance at life. Now, Yusuuke is a ghost with a mission, performing good deeds at the behest of Botan, the ferrywoman of the River Styx, and Koenma, the pacifier-sucking judge of the dead.  \n\n---\n  \n- **Won the 39th Shogakukan Manga Award for Shonen**",
        },
        year: 1990,
        status: "completed",
        lastVolume: "19",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6cad3617-7ced-453c-9801-48a743a08d6c.jpg" },
        },
      ],
    },
  },
  {
    rank: 69,
    manga: {
      id: "b3fe7c22-0045-439a-9b74-82d43a19eeb4",
      attributes: {
        title: { en: "Love Hina" },
        altTitles: [{ ja: "ラブひな" }],
        description: {
          en: 'Keitaro has had great difficulty getting into the university of his choice and no luck in meeting women. In a desperate effort to go into seclusion and study for his entrance exams, he volunteers to take over running his grandmother\'s hotel. His plans are ruined when he discovers that the "hotel" is actually an all-girls dormitory… and some serious distractions ensue.  \n  \nWon the 25nd Kodansha Manga Award for Best Shounen Manga.',
        },
        year: 1998,
        status: "completed",
        lastVolume: "14",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "aafb99c1-7f60-43fa-b75f-fc9502ce29c7", attributes: { name: { en: "Harem" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "8d7bf598-7b60-4549-9dae-caeabeae3b33.jpg" },
        },
      ],
    },
  },
  {
    rank: 70,
    manga: {
      id: "05be3fec-cdec-47df-b9c2-ebc6bbf7407d",
      attributes: {
        title: { fr: "Dreamland" },
        altTitles: [{ en: "Dreamland" }],
        description: {
          en: "Dreamland is a series based on a dual universe: on one side, you have the real world, and on the other, the world of dreams, imaginary and crazy.  \nWe follow the life of Terrence and his friends between those two worlds. He's a shy high-schooler who would like to seduce Lydia, a girl he's liked for a long time. But one day, his life changes completely when, during one of his nightmares, he overcomes his greatest fear: Fire. That marks the beginning of his double life as a normal high-school student during the day and the flame controller at night in Dreamland.",
        },
        year: 2006,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "fr",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "94c0c1b5-fe8a-441f-9481-d5583092d8c0.jpg" },
        },
      ],
    },
  },
  {
    rank: 71,
    manga: {
      id: "8fcee9b9-ed14-4eb7-a3ab-2310d508ac76",
      attributes: {
        title: { en: "Battle Royale" },
        altTitles: [{ ja: "バトル・ロワイアル" }],
        description: {
          en: "In the future, random Jr. High School classes are chosen to compete in a game called Battle Royale. The rules: only one student can survive after 3 days on an island or else they all perish. Weapons are handed out and each student is sent out into the field alone and unprepared for the horror that awaits them. The classmates turn upon themselves in a battle for survival, treaties are made and broken, and former friends become foes as the relentless countdown continues. Amid the betrayals and rising body count, two classmates confess their love for each other and swear to survive this deadly game together.  \n  \nLinks:  \n[AnimeNewsNetwork](https://www.animenewsnetwork.com/encyclopedia/anime.php?id=2971) (live-action movie)",
        },
        year: 2000,
        status: "completed",
        lastVolume: "15",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "6d451709-07bf-406e-8b75-464845ce679f.jpg" },
        },
      ],
    },
  },
  {
    rank: 72,
    manga: {
      id: "62b74aa6-24df-4b91-b76d-39e7ab3c3ca5",
      attributes: {
        title: { "ja-ro": "REAL" },
        altTitles: [{ ja: "リアル" }, { en: "REAL" }],
        description: {
          en: "Nomiya Tomomi, a high school drop-out who wants to devote his life to helping Natsumi, a girl he sentenced to a life of immobility after a tragic bike ride he invited her on, tries to change his life around, from a trouble making delinquent into a reliable man. The problem is, both Natsumi and her sister dont seem to care at all for Nomiya, rightfuly blaming him for the accident. Plus, the only notable talent Nomiya posseses is the talent for basketball. Everything changes for him when he meets up with Togawa Kiyoharu, a wheelchair basketball player.\n\n---\n- **Won the Japan Media Arts Festival Excellence Prize for Manga in 2001**",
        },
        year: 1999,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "447b6696-a834-444a-bf17-034648ffeef1.jpg" },
        },
      ],
    },
  },
  {
    rank: 73,
    manga: {
      id: "3a3cfc32-357e-4b50-a660-5ce4b58dfcbc",
      attributes: {
        title: { en: "Dragon Quest: The Adventure of Dai" },
        altTitles: [
          { ja: "DRAGON QUEST―ダイの大冒険―" },
          { ja: "ドラゴンクエスト ダイの大冒険" },
          { "ja-ro": "Dragon Quest - Dai no Daibouken" },
          { en: "Dragon Quest: The Great Adventure of Dai" },
          { en: "DRAGON QUEST: Dai's Great Adventure" },
        ],
        description: {
          en: "*Long ago there was a brave swordsman known simply as ‘the Hero’. Back then, people suffered under the rule of the great Demon King, but the Hero and his companions challenged the Demon King and, after a great battle, emerged victorious… The Demon King had fallen! The monsters who were under his influence were freed and settled on an isolated island and, with no humans around to stir the monsters, it became a peaceful place where everyone could live together.*\n\nOn a remote island on the southern seas lives Dai, a shipwrecked boy adopted by Brass, a lump wizard monster. Dai dreams of becoming a great hero, but after years without human contact, one day a ship arrives to the island. This is the start of Dai's adventures…\n\n**Notes:**\n- MangaDex's volume numbering goes by the small-format edition (bunkoban).\n___\n**Supervisor:** [Horii Yuuji](https://mangadex.org/author/66e591eb-d155-446d-a2b4-7e7a6828592e)",
        },
        year: 1989,
        status: "completed",
        lastVolume: "22",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8",
            attributes: { name: { en: "Video Games" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          {
            id: "f4122d1c-3b44-44d0-9936-ff7502c39ad3",
            attributes: { name: { en: "Adaptation" } },
          },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "5d20bf27-eb44-4191-82b5-cab5631625b7.jpg" },
        },
      ],
    },
  },
  {
    rank: 74,
    manga: {
      id: "f4cfbb1c-766e-49db-ae80-1a5db3cbcc1b",
      attributes: {
        title: { en: "Uzumaki" },
        altTitles: [
          { en: "The Spiral" },
          { en: "Vortex" },
          { en: "Whirlpool" },
          { ja: "うずまき" },
          { fr: "Spirale" },
        ],
        description: {
          en: "On her way to the station to pick up Shuichi Saito, a high school student from a neighboring town, she finds Shuichi's father sitting in an alley, staring at a wall. \n\nHe seemed oblivious to Kirie's greeting and continued to stare at the snail shell stuck to the wall... \n\nAn out-of-this-world horror depicted by Junji Ito, the genius of new-sensation horror!",
        },
        year: 1998,
        status: "completed",
        lastVolume: "3",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9467335a-1b83-4497-9231-765337a00b96",
            attributes: { name: { en: "Post-Apocalyptic" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "9cae3e50-c2dd-450c-a550-c00db7885574.png" },
        },
      ],
    },
  },
  {
    rank: 75,
    manga: {
      id: "4cf9b503-439a-48f7-9fc5-21831087a421",
      attributes: {
        title: { en: "BECK" },
        altTitles: [{ ja: "ＢＥＣＫ" }, { ja: "ベック" }, { en: "BECK: Mongolian Chop Squad" }],
        description: {
          en: "For the first 14 years of his life, Yukio Tanaka has been one heck of a boring guy. He has no hobbies, weak taste in music, and only a small vestige of a personality.\nHe yearns for an exciting life as a musician, but his shy and somewhat neurotic personality makes him his own worst enemy by hampering his musical dreams.\nLittle does he know that his life will be forever changed when he meets Ryuusuke Minami, a wild and unpredictable 16-year old fresh from America who happens to be in a rock-and-roll band named after his Frankenstein-like patched dog, Beck.\n\n**Award:** Won the 26th Kodansha Manga Award for Shonen in 2002, shared with *Cromartie High School*\n___\n**Official English Volumes:** [Kodansha USA](https://kodansha.us/series/beck/)",
        },
        year: 1999,
        status: "completed",
        lastVolume: "34",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "f42fbf9e-188a-447b-9fdc-f19dc1e4d685", attributes: { name: { en: "Music" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "7dcfd82f-6224-4043-be3e-05db43a8bd5a.png" },
        },
      ],
    },
  },
  {
    rank: 76,
    manga: {
      id: "3ee952f1-45c7-4c39-aea2-7df7676606d4",
      attributes: {
        title: { "ja-ro": "Ao no Exorcist" },
        altTitles: [
          { "ja-ro": "Ao no Futsumashi" },
          { en: "Blue Exorcist" },
          { ja: "青のエクソシスト" },
          { ja: "青の祓魔師" },
          { fr: "Blue Exorcist" },
        ],
        description: {
          fr: "Ce monde se compose de deux dimensions jointes en une seule, comme un miroir. Le premier est le monde dans lequel vivent les humains, Assiah. L’autre est le monde des démons, la géhenne. Habituellement, voyager entre les deux, et même tout type de contact entre les deux, est impossible. Cependant, les démons peuvent passer dans ce monde en possédant tout ce qui existe en son sein. Satan est peut-être le roi des démons, mais il y a une chose qu’il n’a pas, et c’est une substance dans le monde humain qui est assez puissante pour le contenir ! Dans ce but, il a créé Rin, son fils avec une femme humaine, mais le fils acceptera-t-il ses plans? Ou va-t-il devenir autre chose...? Un exorciste ?",
        },
        year: 2009,
        status: "ongoing",
        lastVolume: "",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "39730448-9a5f-48a2-85b0-a70db87b1233", attributes: { name: { en: "Demons" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e6806b84-92be-4a36-8bed-5fafb3e2989c.jpg" },
        },
      ],
    },
  },
  {
    rank: 77,
    manga: {
      id: "3dd0b814-23f4-4342-b75b-f206598534f6",
      attributes: {
        title: { en: "Sword Art Online: Aincrad" },
        altTitles: [
          { en: "Sword Art Online: Aincrad" },
          { ja: "ソードアート・オンライン　アインクラッド" },
        ],
        description: {
          en: 'In the year 2022, gamers rejoice as Sword Art Online—a VRMMORPG (Virtual Reality Massively Multiplayer Online Role Playing Game) like no other—opens its virtual doors, allowing players to take full advantage of the ultimate in gaming technology: NerveGear, a system that allows users to completely immerse themselves in the game world by manipulating their brain waves to create a wholly realistic gaming experience. But when the game goes live, the elation of the players quickly turns to horror as they discover that, for all its amazing features, SAO is missing one of the most basic functions of any MMORPG—a log-out button. Now trapped in the virtual world of Aincrad, their bodies held captive by NerveGear in the real world, users are issued a chilling ultimatum: conquer all one hundred floors of Aincrad to regain your freedom. But in the warped world of SAO, "game over" means certain death-both virtual and real…',
        },
        year: 2010,
        status: "completed",
        lastVolume: "2",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8",
            attributes: { name: { en: "Video Games" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "97dd38d0-bbc5-46c3-805f-aa0a387821ce.jpg" },
        },
      ],
    },
  },
  {
    rank: 78,
    manga: {
      id: "8d5e4567-dc46-4ef3-8af1-0fcf3b6c5e63",
      attributes: {
        title: { en: "The Summit of the Gods" },
        altTitles: [
          { fr: "Le Sommet des Dieux" },
          { ja: "神々の山嶺" },
          { "ja-ro": "Kamigami no Itadaki" },
        ],
        description: {
          en: "(from MangaUpdates):\n\nIn a small Nepalese shop, Makoto Fukamachi, photographer for a Japanese expedition to conquer Mt. Everest, stumbles across a camera which may well be that of George Mallory, the celebrated mountain climber who was the first to attempt conquering Everest. \n\nMallory disappeared along with Andrew Irvine during the course of their ascent in 1924, without leaving any indication of whether they reached the summit or not. So, what if it was only on their return trip that they had their fatal accident?\n\nBased on the Baku Yumemakura novel of the same name.\n\n---\n- **Won the Japan Media Arts Festival Excellence Award in 2001**",
        },
        year: 2000,
        status: "completed",
        lastVolume: "5",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          {
            id: "f4122d1c-3b44-44d0-9936-ff7502c39ad3",
            attributes: { name: { en: "Adaptation" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "709fc2cf-0b87-4d97-a20a-089c705c5015.jpg" },
        },
      ],
    },
  },
  {
    rank: 79,
    manga: {
      id: "94a7d0d5-18c6-4f24-826c-4157e36608e6",
      attributes: {
        title: { en: "RAINBOW - The Seven From Block 2, Cell 6" },
        altTitles: [
          { ja: "RAINBOW —二舎六房の七人—" },
          { en: "RAINBOW" },
          { "ja-ro": "RAINBOW - Nisha Rokubou no Shichinin" },
        ],
        description: {
          en: 'July 1955. Six juveniles, including Minakami Mario, who were considered to be heinous criminals, were sent to the Shounan Special Reformatory. After being treated like insects by the instructor and undergoing a humiliating physical examination, they were placed in a room called "Block 2, Cell 6." In the midst of repeated fights and abuse, they face absurdity and live strongly under the teachings of their senior cellmate Sakuragi Rokurouta (a.k.a. "Bro").',
        },
        year: 2002,
        status: "completed",
        lastVolume: "22",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "e64b9c67-a377-4dfa-afe6-1e4c080434cc.jpg" },
        },
      ],
    },
  },
  {
    rank: 80,
    manga: {
      id: "a81e63a3-83f1-4da5-95a4-ba431e830ce9",
      attributes: {
        title: { "ja-ro": "Shamo" },
        altTitles: [{ fr: "Coq de Combat" }, { en: "Gamecock" }, { ja: "軍鶏" }],
        description: {
          en: "At the age of sixteen Ryo Narushima was a genius and looked to have no trouble of getting into Tokyo University and joining the elite of society. However, that summer something cracked inside Ryo's head. With a small knife he brutally murdered both of his parents only leaving his sister alive and cowering in a corner. It is at this grotesque incident that our story begins.  \n  \nNote: At volume 20, the series changed publishers, which created a restart of the chapter numbers.  \n  \nStarting from chapter 61 in volume 26, the first chapter from when the series returned from a long hiatus, the series has been completely written & drawn by Tanaka Akio. While Hashimoto Izou did write the series in the beginning, he had been doing less and less work starting from volume 4. Tanaka & Hashimoto reached a settlement and Shamo continued.",
        },
        year: 1998,
        status: "completed",
        lastVolume: "34",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4d6585d9-a37f-47fe-81a6-cd25a5661807.jpg" },
        },
      ],
    },
  },
  {
    rank: 81,
    manga: {
      id: "d41bebac-1fd3-45dd-80f4-c371db540a2a",
      attributes: {
        title: { en: "Ranma 1/2" },
        altTitles: [{ ja: "らんま1/2" }, { "ja-ro": "Ranma ½" }],
        description: {
          en: "(from ebookjapan):\n\nSoun was disappointed to find that Ranma was a girl. However, when Ranma got out of the bath, he turned into a boy and the panda turned into Ranma's father, Genma. The two had fallen into a fountain during their training in China, a fountain that turned them into a woman and panda respectively when they touched the water. \n\nThe Tendo family is initially in turmoil, including Akane, who has become a prospective bride, as they face the troublesome duo who go back and forth between man and woman, human and panda, although they can be restored to their original state if they are bathed in hot water. \n\nThis is the first volume of a new edition of the popular manga.\n\n\n---\nOfficial Release:\n- English release by [Viz Media](https://www.viz.com/ranma-1-2)\n- Indonesian release by Elex Media",
        },
        year: 1987,
        status: "completed",
        lastVolume: "38",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "a8e0e761-b213-46b5-8aed-f20dce316190.png" },
        },
      ],
    },
  },
  {
    rank: 82,
    manga: {
      id: "f8e41a48-5ca9-41e3-94a7-a1379a4fda62",
      attributes: {
        title: { en: "Kuroko's Basketball" },
        altTitles: [
          { ja: "黒子のバスケ" },
          { "ja-ro": "Kuroko no Basket" },
          { "ja-ro": "Kuroko no Basuke" },
          { en: "The Basketball Which Kuroko Plays" },
          { en: "The Basketball which Kuroko Plays." },
        ],
        description: {
          en: "Kuroko is a member from the legendary middle school basketball team known as -The Generation of Miracles-, and while nobody seems to know about him, the main 5 players of the team all admit that he is a better player. When he joins the high school basketball team, everyone is surprised to find out that he is small, weak, and easy to miss. What is the secret that makes him so strong, and how will he help his high school team?\n\nOfficial Release:\n- Indonesian release by m&c! Comics as **Kuroko's Basketball** (2013)",
        },
        year: 2008,
        status: "completed",
        lastVolume: "30",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "9ca4dfed-ddd5-4ef9-940e-f999ef50cd20.jpg" },
        },
      ],
    },
  },
  {
    rank: 83,
    manga: {
      id: "8946189d-682f-4838-9c2a-3c2dd5132f2c",
      attributes: {
        title: { en: "Akame ga KILL!" },
        altTitles: [
          { "ja-ro": "Akame ga Kiru!" },
          { en: "Akame Kills!" },
          { en: "Akame Slashes!" },
          { en: "Red Eyes Sword - Akame ga Kill ! (FRoff)" },
          { en: "Red-Eyed Killer!" },
          { ja: "アカメが斬る!" },
        ],
        description: {
          en: "Tatsumi is a fighter who, accompanied by his two childhood friends, sets off to the Capital in search of a way to make money to assist his poverty-stricken village. After being separated from his friends, Tatsumi not only fails to enlist in the army, but is swindled out of all his money. He is then taken in by a noble family who offer him help; after finding himself in a messy situation Tatsumi is rescued by a group of assassins known as Night Raid, and is invited to join their ranks. Composed of the swordswoman Akame, a young woman armed with a huge pair of scissors named Sheele, the string manipulator Lubbock, the armored warrior Bulat, the sniper Mine, the beast fighter Leone and their leader Najenda, Night Raid is also part of the revolutionary forces assembled to overthrow Prime Minister Honest, who manipulates the young emperor for his and his men's personal gain, leading the rest of the nation to poverty and strife.  \n\n\n---",
        },
        year: 2010,
        status: "completed",
        lastVolume: "15",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "685f49e6-4f62-4942-98a3-c7d960d3423a.jpg" },
        },
      ],
    },
  },
  {
    rank: 84,
    manga: {
      id: "9c16fed0-3d93-4487-8c62-a9f49ab48828",
      attributes: {
        title: { "ja-ro": "Boku Dake ga Inai Machi" },
        altTitles: [
          { ja: "僕だけがいない街" },
          { en: "Erased" },
          { en: "The Town Where Only I Don't Exist" },
          { en: "The Town Where Only I'm Erased" },
          { en: "The Town Without Me Only" },
        ],
        description: {
          en: "A strange phenomenon where one is transferred back to the moment right before something life-threatening occurs. This continues to happen until the cause of the threat is erased. It is as if somebody is forcing Satoru to stop it from happening. Then one day, everything is changed. What truths are revealed when Satoru comes face to face with his own past? How will they affect his future?  \n___\n**Note:** Was nominated for the 18th Tezuka Osamu Cultural Prize Reader Award in 2014 and for the 7th, 8th and 9th Manga Taisho Award between 2014 and 2016. Also nominated for the 40th Kodansha Manga Awards in 2016.",
        },
        year: 2012,
        status: "completed",
        lastVolume: "9",
        originalLanguage: "ja",
        tags: [
          {
            id: "292e862b-2d17-4062-90a2-0356caa4ae27",
            attributes: { name: { en: "Time Travel" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4a7acd60-cf93-494e-ad91-c8d2a341af5b.jpg" },
        },
      ],
    },
  },
  {
    rank: 85,
    manga: {
      id: "4702058d-c553-4966-ab09-1deab6328384",
      attributes: {
        title: { en: "xxxHOLIC" },
        altTitles: [{ ja: "×××ホリック" }, { "ja-ro": "×××ＨＯＬｉＣ" }],
        description: {
          en: "Watanuki Kimihiro is haunted by visions of ghosts and spirits. Seemingly by chance, he encounters a mysterious witch named Yuuko, who claims she can help. In desperation, he accepts, but realizes that he's just been tricked into working for Yuuko in order to pay off the cost of her services. Soon he's employed in her little shop- a job which turns out to be nothing like his previous work experience!",
        },
        year: 2003,
        status: "completed",
        lastVolume: "19",
        originalLanguage: "ja",
        tags: [
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "97299e30-b171-4025-8c00-6cb7dea418ad.jpg" },
        },
      ],
    },
  },
  {
    rank: 86,
    manga: {
      id: "df64232c-cc30-4e9c-92e1-7ccba2b743b0",
      attributes: {
        title: { en: "Ayako" },
        altTitles: [{ ja: "奇子" }, { fr: "Ayako, l'enfant de la nuit" }],
        description: {
          en: "The year is 1949. Crushed by the Allied Powers, occupied by General MacArthur’s armies, Japan has been experiencing massive change. Agricultural reform is dissolving large estates and redistributing plots to tenant farmers—terrible news, if you’re landowners like the archconservative Tenge family. For patriarch Sakuemon, the chagrin of one of his sons coming home alive from a P.O.W. camp instead of having died for the Emperor is topped only by the revelation that another of his is consorting with “the reds.” What solace does he have but his youngest Ayako, apple of his eye, at once daughter and granddaughter?\n\n[Official English](https://kodansha.us/series/ayako/)\n\n---\n**Volumes 197-199 of the Osamu Tezuka Complete Works**",
        },
        year: 1972,
        status: "completed",
        lastVolume: "3",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "85daba54-a71c-4554-8a28-9901a8b0afad", attributes: { name: { en: "Mafia" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "2bd1a943-ed51-4eef-9693-bb5f25037296.png" },
        },
      ],
    },
  },
  {
    rank: 87,
    manga: {
      id: "25aaabb1-9f74-4469-a8d6-1eac5924cc79",
      attributes: {
        title: { en: "Pandora Hearts" },
        altTitles: [{ en: "PandoraHearts" }],
        description: {
          en: "The air of celebration surrounding fifteen-year-old Oz Vessalius's coming-of-age ceremony quickly turns to horror when he is condemned for a sin about which he knows nothing. He is thrown into an eternal, inescapable prison known as the Abyss from which there is no escape. There, he meets a young girl named Alice, who is not what she seems. Now that the relentless cogs of fate have begun to turn, do they lead only to crushing despair for Oz, or is there some shred of hope for him to grasp on to? [Yen Press]\n\n---\n**Officially Translated:**  \n- In Polish by [Waneko](https://waneko.pl/nasze-mangi/?manga_id=78)",
        },
        year: 2006,
        status: "completed",
        lastVolume: "24",
        originalLanguage: "ja",
        tags: [
          {
            id: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
            attributes: { name: { en: "Reincarnation" } },
          },
          {
            id: "292e862b-2d17-4062-90a2-0356caa4ae27",
            attributes: { name: { en: "Time Travel" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "17dba76b-3332-417f-93b6-6c32c59427cc.jpg" },
        },
      ],
    },
  },
  {
    rank: 88,
    manga: {
      id: "4bde51e5-e420-45a4-98e9-7405bf2d59ff",
      attributes: {
        title: { "ja-ro": "Koe no Katachi" },
        altTitles: [{ ja: "聲の形" }, { "ja-ro": "Koe no Katachi" }, { en: "A Silent Voice" }],
        description: {
          en: 'The story revolves around Nishimiya Shouko, a grade school student who has impaired hearing. She transfers into a new school, where she is bullied by her classmates, especially Ishida Shouya. It gets to the point where she transfers to another school and as a result, Shouya is ostracized and bullied himself, with no friends to speak of and no plans for the future. Years later, he sets himself on a path to redemption.  \n\n---\n\nNote: Won the 19th Tezuka Osamu Cultural Award New Artist Prize in 2015 and the Ogaki City Cultural Alliance Award (Lifestyle Culture Division). Nominated for the category "Best U.S. Edition of International Material" in the 2016 Eisner Awards.',
        },
        year: 2013,
        status: "completed",
        lastVolume: "7",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "2f8d133a-cf64-442a-9c79-cde975f6ae0c.jpg" },
        },
      ],
    },
  },
  {
    rank: 89,
    manga: {
      id: "5ce0d9df-a3cc-421e-bc33-796869b6b9f7",
      attributes: {
        title: { en: "Shaman King" },
        altTitles: [{ ja: "シャーマンキング" }],
        description: {
          en: "Yoh Asakura is a shaman–one of the gifted few who, thanks to training or natural talent, can channel spirits that most people can't even see. With the help of his fiancée, Anna, Yoh is in training for the ultimate shaman sports event: the \"Shaman Fight in Tokyo,\" the once-every-500-years tournament to see who can shape humanity's future and become the Shaman King. But unfortunately for Yoh, every shaman in the world is competing for the same prize…\n\n\n---\nOfficial Release:\n- Indonesian release by m&c! Comics (tankoubon) and Elex Media (kanzenban)",
        },
        year: 1998,
        status: "completed",
        lastVolume: "33",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          {
            id: "799c202e-7daa-44eb-9cf7-8a3c0441531e",
            attributes: { name: { en: "Martial Arts" } },
          },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "c454451c-94f9-4e7d-996c-70ecf6f8b196.jpg" },
        },
      ],
    },
  },
  {
    rank: 90,
    manga: {
      id: "5f20891f-0136-4fa8-afb7-d72f2af23c65",
      attributes: {
        title: { "ja-ro": "Shokugeki no Souma" },
        altTitles: [
          { ja: "食戟のソーマ" },
          { en: "Food Wars!: Shokugeki no Soma" },
          { en: "Food Halberd Souma" },
        ],
        description: {
          en: "Yukihira Souma's dream is to become a full-time chef in his father's restaurant and surpass his father's culinary skill. But just as Yukihira graduates from middle schools his father, Yukihira Jouichirou, closes down the restaurant to cook in America. Although downtrodden, Souma's fighting spirit is rekindled by a challenge from Jouichirou which is to survive in an elite culinary school where only 10% of the students graduate. Can Souma survive?  \n___\n**Collaborator:** [Morisaki Yuki]()",
        },
        year: 2012,
        status: "completed",
        lastVolume: "36",
        originalLanguage: "ja",
        tags: [
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          { id: "ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869", attributes: { name: { en: "Cooking" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "60aa7c6e-d714-468c-ad4a-043b820a6252.jpg" },
        },
      ],
    },
  },
  {
    rank: 91,
    manga: {
      id: "857a4d6b-7228-42e1-b49c-bbb50a8befdd",
      attributes: {
        title: { en: "Shonan Junai-gumi!" },
        altTitles: [
          { en: "Shonan Pure Love Gang!" },
          { en: "GTO The Early Years" },
          { en: "Young GTO" },
          { ja: "しょうなん じゅんあいぐみ!" },
          { ja: "湘南純愛組!" },
          { "ja-ro": "Shounan Junaigumi!" },
        ],
        description: {
          en: "Eikichi Onizuka and Ryuji Danma are members of infamous biker gang, Oni Baku. When not out riding around, they can be found in school, trying to pick up young women. This is the story of the young Onizuka, who would later become the greatest teacher in Japan.",
        },
        year: 1990,
        status: "completed",
        lastVolume: "31",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "4a933502-a591-4e44-971d-67872d51486e.jpg" },
        },
      ],
    },
  },
  {
    rank: 92,
    manga: {
      id: "1ed6f34b-42a6-4492-acc3-60749479dfe4",
      attributes: {
        title: { en: "Cobra: The Space Pirate" },
        altTitles: [
          { ja: "COBRA ギャラクシー・ナイツ" },
          { ja: "COBRA ザ・サイコガン" },
          { ja: "COBRA ソード人の秘密" },
          { ja: "COBRA タイム・ドライブ" },
          { ja: "COBRA ブルーローズ" },
          { ja: "COBRA マジックドール" },
          { ja: "COBRA マンドラドの伝説" },
          { ja: "COBRA 戦場にて" },
          { ja: "COBRA 神の瞳" },
          { ja: "COBRA 雷電の惑星" },
          { ja: "COBRA 黄金の扉" },
          { ja: "COBRAラグボール" },
          { ja: "COBRA黒竜王" },
          { en: "Space Adventure Cobra: Blue Rose" },
          { en: "Space Adventure Cobra: Galaxy Nights" },
          { en: "Space Adventure Cobra: God's Eyes" },
          { en: "Space Adventure Cobra: Golden Gate" },
          { en: "Space Adventure Cobra: Legend of Mandrad" },
          { en: "Space Adventure Cobra: Magic Doll" },
          { en: "Space Adventure Cobra: On the Battlefield" },
          { en: "Space Adventure Cobra: Rugball" },
          { en: "Space Adventure Cobra: Secret of Sword" },
          { en: "Space Adventure Cobra: The Black Dragon King" },
          { en: "Space Adventure Cobra: The Psychogun" },
          { en: "Space Adventure Cobra: Thunderbolt Star" },
          { en: "Space Adventure Cobra: Time Drive" },
        ],
        description: {
          en: "An all-color alternate story of the original classic, Space Adventure Cobra.",
        },
        year: 1995,
        status: "completed",
        lastVolume: "15",
        originalLanguage: "ja",
        tags: [
          { id: "256c8bd9-4904-4360-bf4f-508a76d67183", attributes: { name: { en: "Sci-Fi" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "91a427f0-1ad9-47fb-8228-17827ca7e20b.jpg" },
        },
      ],
    },
  },
  {
    rank: 93,
    manga: {
      id: "6fcfaa0e-6023-403e-97f9-5301dd3c258c",
      attributes: {
        title: { en: "Hellsing" },
        altTitles: [{ ja: "ヘルシング" }],
        description: {
          fr: "En Angleterre, l'organisation secrète Hellsing agit pour protéger le pays des forces du mal, dont les vampires. Force de frappe de l'Église protestante, ce groupe dispose d'une arme secrète des plus inattendues: Alucard, vampire surpuissant et apparemment invulnérable. Mais leur mission se corsera quand ils devront faire face au Vatican et aux brigades anti-monstres de l'État le plus petit du monde...",
        },
        year: 1997,
        status: "completed",
        lastVolume: "10",
        originalLanguage: "ja",
        tags: [
          {
            id: "33771934-028e-4cb3-8744-691e866a923e",
            attributes: { name: { en: "Historical" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", attributes: { name: { en: "Magic" } } },
          { id: "ac72833b-c4e9-4878-b9db-6c8a4a99444a", attributes: { name: { en: "Military" } } },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "cdad7e68-1419-41dd-bdce-27753074a640", attributes: { name: { en: "Horror" } } },
          { id: "d7d1730f-6eb0-4ba6-9437-602cac38664c", attributes: { name: { en: "Vampires" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "b1c48d29-de5e-40d9-9a22-8b181b499738.jpg" },
        },
      ],
    },
  },
  {
    rank: 94,
    manga: {
      id: "59b36734-f2d6-46d7-97c0-06cfd2380852",
      attributes: {
        title: { "ja-ro": "Toukyou 卍 Revengers" },
        altTitles: [
          { ja: "東京卍リベンジャーズ" },
          { "ja-ro": "Toukyou Manji Revengers" },
          { en: "Tokyo Revengers" },
        ],
        description: {
          en: 'Watching the news, Takemichi Hanagaki learns that his girlfriend from way back in middle school, Hinata Tachibana, has died. The only girlfriend he ever had was just killed by a villainous group known as the Tokyo Manji Gang. He lives in a crappy apartment with thin walls, and his six-years-younger boss treats him like an idiot. Plus, he’s a complete and total virgin… At the height of his rock-bottom life, he suddenly time-leaps 12 years back to his middle school days!! To save Hinata, and change the life he spent running away, hopeless part-timer Takemichi must aim for the top of Kanto’s most sinister delinquent gang!!\n\n*Source: Kodansha Comics, Vol. 1*\n\n---\n\n**Notes:**\n- The original Japanese title contains the manji symbol, so it will not be removed from the title on MangaDex.\n- Addendum on the "Manji" for those uninformed. From Seven Seas\' Omnibus Edition:\n  *"In East Asia the manji (卍) is an ancient religious symbol of power and good fortune for many different countries and religions around the world, including Buddhism, Hinduism, Jainism, and a number of Indo-European and Native American religions as well."* \n*"The specific meaning of the symbol varies by nation and religion, and also by the position of the "arms" of the cross--whether they face left or right, or whether the cross is tilted or straight."* \n*"In the 1930s, the swastika symbol--a clockwise, tilted cross--was adopted by the Nazi Political Party in Germany, and gained a negative reputation as a symbol of hatred in the modern world."*\n*"The manji used by the Tokyo Manji Gang as their emblem is intended to be the ancient Buddhist symbol, as evidenced by the appearance of its counterclockwise, straight arms..."*\n\n---\n\n**Links:**\n- [Official English Translation (Seven Seas)](https://sevenseasentertainment.com/series/tokyo-revengers-omnibus)\n- [Official English Translation (Kodansha USA)](https://kodansha.us/series/tokyo-revengers)',
        },
        year: 2017,
        status: "completed",
        lastVolume: "31",
        originalLanguage: "ja",
        tags: [
          { id: "07251805-a27e-4d59-b488-f0bfbec15168", attributes: { name: { en: "Thriller" } } },
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          {
            id: "292e862b-2d17-4062-90a2-0356caa4ae27",
            attributes: { name: { en: "Time Travel" } },
          },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          {
            id: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
            attributes: { name: { en: "Psychological" } },
          },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", attributes: { name: { en: "Crime" } } },
          { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", attributes: { name: { en: "Survival" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
          {
            id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
            attributes: { name: { en: "Delinquents" } },
          },
          { id: "df33b754-73a3-4c54-80e6-1a74a8058539", attributes: { name: { en: "Police" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "3676571a-9d2b-48e6-8639-d4591725759a.jpg" },
        },
      ],
    },
  },
  {
    rank: 95,
    manga: {
      id: "f830514d-f3e1-4b11-b18b-e5f7b6d9b861",
      attributes: {
        title: { "ja-ro": "Tsubasa -RESERVoir CHRoNiCLE-" },
        altTitles: [{ en: "Chronicle of the Wings" }, { ja: "ツバサ-RESERVoir CHRoNiCLE-" }],
        description: {
          en: "Sakura is the princess of Clow - and possessor of a mysterious, misunderstood power that promises to change the world. Syaoran is her childhood friend and leader of the archaeological dig that took his father's life. They reside in an alternate reality where whatever you least expect can happen - and does. When Sakura ventures to the dig site to declare her love for Syaoran, a puzzling symbol is uncovered - which triggers a remarkable quest. Now Syaoran embarks upon a desperate journey through other worlds - all in the name of saving Sakura.",
        },
        year: 2003,
        status: "completed",
        lastVolume: "28",
        originalLanguage: "ja",
        tags: [
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", attributes: { name: { en: "Romance" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          { id: "ace04997-f6bd-436e-b261-779182193d3d", attributes: { name: { en: "Isekai" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "dc946dfd-8821-4cc3-a917-47ce5d2669d1.jpg" },
        },
      ],
    },
  },
  {
    rank: 96,
    manga: {
      id: "0771c4e7-60f3-4fb5-8708-d779f0a0e023",
      attributes: {
        title: { "ja-ro": "Mushishi" },
        altTitles: [{ ja: "蟲師" }, { en: "Mushishi" }, { en: "Bug Master" }],
        description: {
          en: "They exist in the most unexpected places – be it within your eyes and ears, under the floor and roof of your house, or the trees and flowers in your garden. They are everywhere and yet nowhere at the same time. Are they alive or not? Perhaps it is more apt to say they are beings who transcend the concept of life and death itself…\nThey are mushi.\nSome wreak havoc in the lives of humans; while others bring them deliverance from suffering. Mushi are neither good, nor evil; for just like any other creature, they are merely striving to survive in this harsh, competitive world.\nGinko - a lone wanderer with a reclusive personality, offers help and guidance to those plagued by mushi. This is the tale of his travels and exploits in a wondrous world populated by these mysterious entities.\n\n**Awards:**\n- Won the Japanese Media Arts Festival Excellence Prize in 2003.\n- Won the Kodansha Manga Award in 2006.",
        },
        year: 1999,
        status: "completed",
        lastVolume: "10",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "3de8c75d-8ee3-48ff-98ee-e20a65c86451", attributes: { name: { en: "Animals" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
            attributes: { name: { en: "Philosophical" } },
          },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
          {
            id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
            attributes: { name: { en: "Slice of Life" } },
          },
          {
            id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
            attributes: { name: { en: "Supernatural" } },
          },
          { id: "ee968100-4191-4968-93d3-f82d72be7e46", attributes: { name: { en: "Mystery" } } },
          { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", attributes: { name: { en: "Tragedy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "882edbc2-a233-4960-9c26-a00e00ce24da.jpg" },
        },
      ],
    },
  },
  {
    rank: 97,
    manga: {
      id: "8f8b7cb0-7109-46e8-b12c-0448a6453dfa",
      attributes: {
        title: { en: "Haikyu!!" },
        altTitles: [{ ja: "ハイキュー!!" }, { "ja-ro": "Haikyuu!!" }, { en: "Volleyball!!" }],
        description: {
          en: "Shoyo Hinata is out to prove that in volleyball you don’t need to be tall to fly!\nEver since he saw the legendary player known as “the Little Giant” compete at the national volleyball finals, Shoyo Hinata has been aiming to be the best volleyball player ever! Who says you need to be tall to play volleyball when you can jump higher than anyone else?\n___\n[Official X](https://x.com/haikyu_com)",
        },
        year: 2012,
        status: "completed",
        lastVolume: "45",
        originalLanguage: "ja",
        tags: [
          {
            id: "0a39b5a1-b235-4886-a747-1d05d216532d",
            attributes: { name: { en: "Award Winning" } },
          },
          { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", attributes: { name: { en: "Comedy" } } },
          { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", attributes: { name: { en: "Sports" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          {
            id: "caaa44eb-cd40-4177-b930-79d3ef2afe87",
            attributes: { name: { en: "School Life" } },
          },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "0929bd2f-284d-44c8-bc44-9a3da5f1002f.jpg" },
        },
      ],
    },
  },
  {
    rank: 98,
    manga: {
      id: "8a3e22a6-949a-4540-bfbf-559b8cae30f9",
      attributes: {
        title: { "ja-ro": "Übel Blatt" },
        altTitles: [{ ja: "Übel Blatt～ユーベルブラット～" }, { en: "Übel Blatt" }],
        description: {
          fr: "La légende raconte que pour lutter contre une terrifiante armée des ténèbres, l’empereur missionna 14 vaillants guerriers à qui il confia 14 lances sacrées. 3 d’entre eux, les glorieux guerriers sans retour, périrent au combat. 4 autres, surnommés les lances de la trahison, furent exécutés par leurs compagnons pour félonie. Les 7 derniers accomplirent leur mission et furent accueillis en héros à leur retour. Mais 20 ans plus tard, des rebelles baptisés eux aussi les lances de la trahison défient de nouveau l’autorité de l¹Empire...",
        },
        year: 2004,
        status: "completed",
        lastVolume: "23",
        originalLanguage: "ja",
        tags: [
          { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", attributes: { name: { en: "Monsters" } } },
          { id: "391b0423-d847-456f-aff0-8b0cfc03066b", attributes: { name: { en: "Action" } } },
          { id: "87cc87cd-a395-47af-b27a-93258283bbc6", attributes: { name: { en: "Adventure" } } },
          {
            id: "97893a4c-12af-4dac-b6be-0dffb353568e",
            attributes: { name: { en: "Sexual Violence" } },
          },
          { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", attributes: { name: { en: "Gore" } } },
          { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", attributes: { name: { en: "Drama" } } },
          { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", attributes: { name: { en: "Fantasy" } } },
        ],
      },
      relationships: [
        {
          id: "",
          type: "cover_art",
          attributes: { fileName: "398f5809-546d-40c2-adda-9ad0ab484a41.jpg" },
        },
      ],
    },
  },
];
