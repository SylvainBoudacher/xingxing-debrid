import { useState } from "react";
import { httpFetch } from "@/lib/networkError";

export type DnsStatus = "idle" | "checking" | "ok" | "fail";
export type DnsSim = "none" | "ok" | "fail";

/** Teste l'accès à c411.org. `sim` force le résultat en dev. */
export function useDnsCheck(sim: DnsSim = "none") {
  const [status, setStatus] = useState<DnsStatus>("idle");
  const [error, setError] = useState("");

  async function check() {
    setError("");
    setStatus("checking");
    if (import.meta.env.DEV && sim !== "none") {
      await new Promise((r) => setTimeout(r, 600));
      setError(sim === "fail" ? "[DEV] échec simulé" : "");
      setStatus(sim);
      return;
    }
    try {
      await httpFetch("https://c411.org", { method: "HEAD", signal: AbortSignal.timeout(6000) });
      setStatus("ok");
    } catch (e) {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setStatus("fail");
    }
  }

  return { status, error, check, setStatus, setError };
}
