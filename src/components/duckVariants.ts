import type { Variant } from "./duckTypes";

// Catalog of duck skins. Add new combinations here by mixing a body color,
// beak, and an optional pattern / accessory / effect.
export const VARIANTS: Variant[] = [
  // classic yellow appears a bit more often
  { body: "#FFD21E", beak: "#F5811F", acc: "none" },
  { body: "#FFD21E", beak: "#F5811F", acc: "none" },
  { body: "#FFD21E", beak: "#F5811F", acc: "shades" },
  { body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" },
  { body: "#FFD21E", beak: "#F5811F", acc: "crown", accColor: "#FFE066" },
  // colors
  { body: "#F4F7FB", beak: "#F5811F", acc: "none" }, // white
  { body: "#FB7AA8", beak: "#F5811F", acc: "none" }, // pink
  { body: "#E0457B", beak: "#F5811F", acc: "none" }, // magenta
  { body: "#FF6F61", beak: "#F5811F", acc: "none" }, // coral
  { body: "#F0584E", beak: "#F5811F", acc: "none" }, // red
  { body: "#FF9A3C", beak: "#E8620F", acc: "none" }, // orange
  { body: "#5EE6C5", beak: "#F5811F", acc: "none" }, // mint
  { body: "#3FD0C8", beak: "#F5811F", acc: "none" }, // teal
  { body: "#7BD850", beak: "#F5811F", acc: "none" }, // lime
  { body: "#4FB0F0", beak: "#F5811F", acc: "none" }, // sky blue
  { body: "#5B8DEF", beak: "#F5811F", acc: "shades" }, // blue
  { body: "#A7D8FF", beak: "#F5811F", acc: "none" }, // baby blue
  { body: "#A78BFA", beak: "#F5811F", acc: "party", accColor: "#FB7185" }, // purple
  { body: "#C9A8FF", beak: "#F5811F", acc: "none" }, // lavender
  { body: "#7C6B8A", beak: "#F5811F", acc: "none" }, // dusk purple
  { body: "#4A5568", beak: "#F5A623", acc: "none" }, // charcoal
  { body: "#F5C518", beak: "#F5811F", acc: "crown", accColor: "#FFF0A0" }, // gold king
  // accessorized
  { body: "#FFD21E", beak: "#F5811F", acc: "tophat", accColor: "#E0457B" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "sunhat", accColor: "#FF6F61" },
  { body: "#FF9A3C", beak: "#E8620F", acc: "sunhat", accColor: "#3FD0C8" },
  { body: "#FB7AA8", beak: "#F5811F", acc: "flower", accColor: "#FFFFFF" },
  { body: "#7BD850", beak: "#F5811F", acc: "flower", accColor: "#FF5C8A" },
  { body: "#4FB0F0", beak: "#F5811F", acc: "snorkel", effect: "bubbles" },
  { body: "#5EE6C5", beak: "#F5811F", acc: "snorkel" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "bowtie", accColor: "#E0457B" },
  { body: "#A78BFA", beak: "#F5811F", acc: "headphones", accColor: "#FB7185" },
  { body: "#FFD21E", beak: "#F5811F", acc: "headphones", accColor: "#5B8DEF" },
  // new accessories
  { body: "#FFD21E", beak: "#F5811F", acc: "beanie", accColor: "#4FB0F0" },
  { body: "#4FB0F0", beak: "#F5811F", acc: "beanie", accColor: "#E0457B" },
  { body: "#A78BFA", beak: "#F5811F", acc: "wizard", accColor: "#3B2E66" },
  { body: "#5EE6C5", beak: "#F5811F", acc: "viking" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "chef" },
  { body: "#FF9A3C", beak: "#E8620F", acc: "cowboy", accColor: "#8B5A2B" },
  { body: "#7BD850", beak: "#F5811F", acc: "propeller", accColor: "#FFE066" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "halo", effect: "glow" },
  { body: "#F0584E", beak: "#F5811F", acc: "devil" },
  { body: "#FFD21E", beak: "#F5811F", acc: "antlers" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "monocle", accColor: "#D4AF37" },
  { body: "#E0457B", beak: "#F5811F", acc: "scarf", accColor: "#F4F7FB" },
  // body patterns
  { body: "#F4F7FB", beak: "#F5811F", acc: "none", pattern: "spots" },
  { body: "#FFD21E", beak: "#F5811F", acc: "none", pattern: "stripes" },
  { body: "#FB7AA8", beak: "#F5811F", acc: "none", pattern: "polka" },
  { body: "#FFD21E", beak: "#F5811F", acc: "none", pattern: "rainbow" },
  { body: "#F5C518", beak: "#F5811F", acc: "crown", accColor: "#FFF0A0", pattern: "gold" },
  // special rare ducks
  { body: "#A7C7FF", beak: "#E8A0C0", acc: "none", effect: "ghost" },
  { body: "#2A2150", beak: "#C9A8FF", acc: "none", pattern: "galaxy", effect: "sparkle" },
  { body: "#5EE6C5", beak: "#F5811F", acc: "none", effect: "glow" },
  { body: "#7BB85A", beak: "#5A7A3A", acc: "none", pattern: "zombie" },
  { body: "#AEB6BF", beak: "#7A828B", acc: "antenna", pattern: "metal" },
];
