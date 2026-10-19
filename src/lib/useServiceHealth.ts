import { useSyncExternalStore } from "react";
import { getHealth, subscribeHealth } from "@/lib/serviceHealth";

export function useServiceHealth() {
  return useSyncExternalStore(subscribeHealth, getHealth);
}
