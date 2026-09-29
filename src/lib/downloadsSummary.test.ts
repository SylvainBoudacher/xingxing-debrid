import { describe, expect, it } from "vitest";
import type { DownloadItem } from "@/lib/downloads";
import { summarizeDownloads } from "@/lib/downloadsSummary";

function item(status: DownloadItem["status"], downloaded = 0, total = 0): DownloadItem {
  return {
    id: Math.random().toString(),
    filename: "f.mkv",
    downloaded,
    total,
    status,
    meta: { title: "f", badges: [] } as unknown as DownloadItem["meta"],
  };
}

describe("summarizeDownloads", () => {
  it("agrège les octets des téléchargements en cours", () => {
    const s = summarizeDownloads([
      item("active", 50, 100),
      item("active", 150, 300),
      item("done", 10, 10),
    ]);
    expect(s).toEqual({ active: 2, progress: 0.5, speed: 0, pending: 0, state: "active" });
  });

  it("ignore les tailles inconnues", () => {
    expect(summarizeDownloads([item("active", 20, 0)]).progress).toBe(0);
  });

  it("reste en cours entre deux fichiers d'un lot", () => {
    const s = summarizeDownloads([item("done")], { total: 4, done: 1, active: 0 });
    expect(s.state).toBe("active");
    expect(s.pending).toBe(3);
  });

  it("compte les fichiers en attente d'un lot dans la progression", () => {
    // 6 fichiers : 1 terminé, 2 en cours à 50 %, 3 en attente -> 2 / 6.
    const s = summarizeDownloads(
      [item("done", 10, 10), item("active", 50, 100), item("active", 150, 300)],
      { total: 6, done: 1, active: 2 },
    );
    expect(s.progress).toBeCloseTo(2 / 6);
    expect(s.pending).toBe(3);
  });

  it("signale un échec une fois tout terminé", () => {
    expect(summarizeDownloads([item("done"), item("error")]).state).toBe("error");
    expect(summarizeDownloads([item("done"), item("cancelled")]).state).toBe("done");
  });
});
