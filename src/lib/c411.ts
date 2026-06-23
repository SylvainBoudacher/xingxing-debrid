export interface C411Torrent {
  infoHash: string;
  name: string;
  size: number;
  seeders: number;
  leechers?: number;
  category: { id: number } | null;
  subcategory: { slug: string } | null;
}
