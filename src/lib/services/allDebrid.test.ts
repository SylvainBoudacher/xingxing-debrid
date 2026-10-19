import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchSpy = vi.fn();

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: (...args: unknown[]) => fetchSpy(...(args as [])),
}));

import { fetchMagnetStatuses, type MagnetEntry } from "@/lib/services/allDebrid";

function magnet(id: number, statusCode = 1): MagnetEntry {
  return {
    id,
    filename: `m${id}`,
    size: 1,
    status: "Downloading",
    statusCode,
    downloaded: 0,
    seeders: 1,
    downloadSpeed: 0,
    uploadDate: 0,
    completionDate: 0,
  };
}

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function idOf(url: string): number {
  return Number(new URL(url).searchParams.get("id"));
}

beforeEach(() => {
  fetchSpy.mockReset();
});

describe("fetchMagnetStatuses", () => {
  it("interroge uniquement les magnets suivis, un appel par id", async () => {
    fetchSpy.mockImplementation(async (url: string) =>
      reply({ status: "success", data: { magnets: [magnet(idOf(url))] } }),
    );

    const result = await fetchMagnetStatuses("key", [7, 9]);

    expect(result.map((m) => m.id)).toEqual([7, 9]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls.map(([url]) => idOf(url))).toEqual([7, 9]);
  });

  it("accepte aussi un magnet renvoyé seul, hors tableau", async () => {
    fetchSpy.mockImplementation(async (url: string) =>
      reply({ status: "success", data: { magnets: magnet(idOf(url)) } }),
    );

    const result = await fetchMagnetStatuses("key", [7]);

    expect(result.map((m) => m.id)).toEqual([7]);
  });

  it("ignore un magnet supprimé du compte, que l'API réponde 200 ou 4xx", async () => {
    const invalid = { status: "error", error: { code: "MAGNET_INVALID_ID" } };
    fetchSpy.mockImplementation(async (url: string) => {
      const id = idOf(url);
      if (id === 1) return reply(invalid, 200);
      if (id === 2) return reply(invalid, 400);
      return reply({ status: "success", data: { magnets: [magnet(id)] } });
    });

    const result = await fetchMagnetStatuses("key", [1, 2, 3]);

    expect(result.map((m) => m.id)).toEqual([3]);
  });

  it("repasse par la liste complète au-delà de 10 magnets (limite de 12 requêtes/s)", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1);
    fetchSpy.mockResolvedValue(
      reply({ status: "success", data: { magnets: [magnet(3), magnet(99), magnet(11)] } }),
    );

    const result = await fetchMagnetStatuses("key", ids);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(new URL(fetchSpy.mock.calls[0][0]).searchParams.has("id")).toBe(false);
    expect(result.map((m) => m.id)).toEqual([3, 11]);
  });

  it("remonte une clé refusée au lieu de l'ignorer", async () => {
    fetchSpy.mockResolvedValue(reply({ status: "error", error: { code: "AUTH_BAD_APIKEY" } }, 401));

    await expect(fetchMagnetStatuses("key", [1])).rejects.toMatchObject({ status: 401 });
  });

  it("remonte une panne réseau pour que le suivi reprenne au prochain tour", async () => {
    fetchSpy.mockRejectedValue(new TypeError("network down"));

    await expect(fetchMagnetStatuses("key", [1])).rejects.toMatchObject({ kind: "offline" });
  });
});
