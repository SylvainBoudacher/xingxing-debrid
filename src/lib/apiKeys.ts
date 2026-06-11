import { invoke } from "@tauri-apps/api/core";

export type ApiKeyName = "c411_api_key" | "alldebrid_api_key";

export function getApiKey(name: ApiKeyName): Promise<string | null> {
  return invoke<string | null>("get_api_key", { name });
}

export function setApiKey(name: ApiKeyName, value: string): Promise<void> {
  return invoke("set_api_key", { name, value });
}
