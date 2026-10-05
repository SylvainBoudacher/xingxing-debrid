// Zone de prise d'un sprite : ses pixels opaques élargis de `radius` pixels. Le halo
// (bloom, clochettes) déborde du dessin : viser pixel près raterait ce qu'on voit.
export function pickMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) mask[ny * width + nx] = 1;
        }
    }
  return mask;
}
