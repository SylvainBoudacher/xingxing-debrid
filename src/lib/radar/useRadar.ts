import { useSyncExternalStore } from "react";
import { getRadarState, subscribeRadar, type RadarState } from "./radarStore";

export function useRadar(): RadarState {
  return useSyncExternalStore(subscribeRadar, getRadarState);
}
