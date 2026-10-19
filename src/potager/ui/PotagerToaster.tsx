import { Toaster } from "sonner";

// Habillage des bandeaux : fond sombre, filet doré.
export function PotagerToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      offset={96}
      toastOptions={{
        style: {
          background: "rgba(20, 14, 10, 0.92)",
          border: "1px solid #b8975a",
          color: "#f2e2b0",
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 17,
        },
      }}
    />
  );
}
