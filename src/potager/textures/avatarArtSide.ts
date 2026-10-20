// Profil de l'avatar (tourné vers la droite), mêmes conventions que avatarArt.ts.
export const SIDE_HEAD = [
  "................",
  ".....oooo.......",
  "....ohhhho......",
  "....ohhhho......",
  "...orrrrrro.....",
  "..oohhhhhhhhhoo.",
  "..oHHHHHHHHHHHo.",
  "...oyyssssso....",
  "...oyysssesso...",
  "...oyysssssso...",
  "....oSSSSSo.....",
];
export const SIDE_TORSO = [
  "....obbbbo......",
  "....oBbbbbo.....",
  "....oBbbbbo.....",
  "....oBbbbbo.....",
  "....oBbbbbo.....",
  "....oppppo......",
  "....oPppPo......",
];
export const SIDE_STAND = [
  "....oppppo......",
  "....oppppo......",
  "....oppppo......",
  "....oppppo......",
  "....okkkkko.....",
  "....ooooooo.....",
];

// Cycle d'une jambe sur 8 frames ; l'autre jambe joue la même avec 4 frames d'écart.
// 0 attaque du talon, 1 amorti, 2 poussée, 3 suspension, 4 talon relevé, 5 passage, 6 genou haut, 7 jambe tendue vers l'avant
export const SIDE_DY = [0, 1, 0, -1, 0, 1, 0, -1];
export const SIDE_LEG = [
  [
    ".....o11o.......",
    "......o11o......",
    ".......o11o.....",
    "........o11o....",
    "........o2222o..",
    "........oooooo..",
  ],
  [
    ".....o11o.......",
    "......o11o......",
    "......o11o......",
    ".....o2222o.....",
    ".....oooooo.....",
  ],
  [
    ".....o11o.......",
    ".....o11o.......",
    "....o11o........",
    "....o11o........",
    "...o2222o.......",
    "...oooooo.......",
  ],
  [
    ".....o11o.......",
    "....o11o........",
    "...o11o.........",
    "..o11o..........",
    ".o22o...........",
    ".oooo...........",
  ],
  [".....o11o.......", "...ooo11o.......", "..o22111o.......", "..oooooo........"],
  [".....o11o.......", ".....o111o......", ".....o222o......", ".....ooooo......"],
  [
    ".....o11o.......",
    "......o1111o....",
    ".......ooo11o...",
    ".........o222o..",
    ".........ooooo..",
  ],
  [
    ".....o11o.......",
    "......o111o.....",
    ".......oo11o....",
    ".........o11o...",
    ".........o2222o.",
    ".........oooooo.",
  ],
];

export const SIDE_ARMS = {
  mid: [".....o3o", ".....o3o", ".....o3o", ".....o4o", ".....ooo"],
  fwd1: [".....o3o", ".....o3o", "......o3o", ".......o4o", ".......ooo"],
  fwd2: [".....o3o", ".....o3o.oo", ".....o3334o", "......ooooo"],
  back1: [".....o3o", "....o3o", "...o3o", "...o4o", "...ooo"],
  back2: [".....o3o", "...oo3o", "..o433o", "..ooooo"],
};
// bras opposé à la jambe du même côté : jambe en avant (frame 0), bras en arrière
export const SIDE_ARM_CYCLE: (keyof typeof SIDE_ARMS)[] = [
  "back2",
  "back1",
  "mid",
  "fwd1",
  "fwd2",
  "fwd1",
  "mid",
  "back1",
];
