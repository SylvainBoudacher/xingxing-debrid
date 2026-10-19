import * as THREE from "three";

// Sprite debout, ancré au sol par le bas.
export function spriteMesh(tex: THREE.Texture, w: number, h: number, cast = true): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }),
  );
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export const lambert = (
  map: THREE.Texture | null,
  extra: THREE.MeshLambertMaterialParameters = {},
) => new THREE.MeshLambertMaterial({ map, ...extra });
