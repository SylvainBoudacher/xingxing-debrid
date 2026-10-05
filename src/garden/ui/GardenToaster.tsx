import { Toaster } from "sonner";

// Même habillage que les panneaux du champ : fond sombre, liseré doré.
export function GardenToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      offset={64}
      toastOptions={{
        className: "font-serif",
        style: {
          background: "rgba(26, 18, 22, 0.94)",
          border: "1px solid rgba(252, 211, 77, 0.35)",
          color: "#f3dca0",
          fontSize: 14,
          backdropFilter: "blur(6px)",
        },
      }}
    />
  );
}
