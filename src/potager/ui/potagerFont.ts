const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,700&display=swap";

export function loadPotagerFont() {
  if (document.querySelector(`link[href="${FONT_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_URL;
  document.head.appendChild(link);
}
