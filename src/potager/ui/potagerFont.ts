import "@fontsource/jersey-10/latin-400.css";

// Police pixel du Potager : une seule graisse, donc ni gras ni italique simulés.
// Étroite, elle paraît petite : fontSizeAdjust la grossit d'un quart environ.
export const POTAGER_FONT = {
  fontFamily: '"Jersey 10", monospace',
  fontSynthesis: "none",
  fontSizeAdjust: "0.54",
  letterSpacing: "0.5px",
} as const;
