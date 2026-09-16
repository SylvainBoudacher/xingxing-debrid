import * as THREE from "three";
import { hash } from "../core/hash";
import { pixelTexture } from "./texture";

export type SkyColors = [top: string, bottom: string, nearHills: string, farHills: string];

export interface Ambience {
  paintSky(colors: SkyColors): void;
  setNight(on: boolean): void;
  setRainVisible(on: boolean): void;
  update(t: number, mist: number, camera: THREE.Camera): void;
  dispose(): void;
}

const LEAVES = 70;
const FIREFLIES = 40;
const RAIN = 900;
const FALL_COLORS = ["#b8401c", "#e08a2a", "#f2c14a", "#8f2a1a"];

// Ciel en pixels, feuilles qui tombent, lucioles la nuit, pluie et brume.
export function createAmbience(scene: THREE.Scene): Ambience {
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);

  const skyCanvas = Object.assign(document.createElement("canvas"), { width: 320, height: 120 });
  const skyTex = track(pixelTexture(skyCanvas));
  const sky = new THREE.Mesh(
    track(new THREE.PlaneGeometry(40, 15)),
    track(new THREE.MeshBasicMaterial({ map: skyTex, fog: false })),
  );
  sky.position.set(0, 5, -14);
  scene.add(sky);

  const leafMat = track(new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1 }));
  const leaves = new THREE.InstancedMesh(
    track(new THREE.PlaneGeometry(0.07, 0.045)),
    leafMat,
    LEAVES,
  );
  leaves.castShadow = true;
  const fall = FALL_COLORS.map((c) => new THREE.Color(c));
  for (let i = 0; i < LEAVES; i++) leaves.setColorAt(i, fall[i % 4]);
  scene.add(leaves);
  const dummy = new THREE.Object3D();

  const ffPos = new Float32Array(FIREFLIES * 3);
  const ffGeo = track(new THREE.BufferGeometry());
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const ffMat = track(
    new THREE.PointsMaterial({
      size: 0.05,
      color: new THREE.Color(3, 3.2, 1.2),
      toneMapped: false,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  );
  scene.add(new THREE.Points(ffGeo, ffMat));

  const rainPos = new Float32Array(RAIN * 6);
  const rainGeo = track(new THREE.BufferGeometry());
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(
    rainGeo,
    track(new THREE.LineBasicMaterial({ color: 0xb8c8e8, transparent: true, opacity: 0.45 })),
  );
  rain.visible = false;
  scene.add(rain);

  const mistCanvas = Object.assign(document.createElement("canvas"), { width: 64, height: 16 });
  const mg = mistCanvas.getContext("2d")!;
  for (let x = 0; x < 64; x++)
    for (let y = 0; y < 16; y++) {
      const a =
        Math.max(0, 1 - Math.abs(y - 8) / 8) *
        Math.max(0, 1 - Math.abs(x - 32) / 32) *
        (0.6 + hash(x >> 2, y >> 2) * 0.4);
      mg.fillStyle = `rgba(240,244,250,${a.toFixed(3)})`;
      mg.fillRect(x, y, 1, 1);
    }
  const mistTex = track(new THREE.CanvasTexture(mistCanvas));
  mistTex.colorSpace = THREE.SRGBColorSpace;
  const mistGeo = track(new THREE.PlaneGeometry(7, 0.8));
  const mists = Array.from({ length: 7 }, (_, i) => {
    const m = new THREE.Mesh(
      mistGeo,
      track(
        new THREE.MeshBasicMaterial({
          map: mistTex,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      ),
    );
    m.position.set(-8 + i * 3, 0.35 + (i % 3) * 0.25, -3 + i * 0.9);
    scene.add(m);
    return m;
  });

  let night = false;

  return {
    paintSky([top, bottom, near, far]) {
      const g = skyCanvas.getContext("2d")!;
      const gradient = g.createLinearGradient(0, 0, 0, 120);
      gradient.addColorStop(0, top);
      gradient.addColorStop(1, bottom);
      g.fillStyle = gradient;
      g.fillRect(0, 0, 320, 120);
      // collines en paliers de pixels
      for (const [col, base, amp, f, s] of [
        [far, 70, 14, 0.03, 1],
        [near, 84, 10, 0.05, 2],
      ] as const) {
        g.fillStyle = col;
        for (let x = 0; x < 320; x++) {
          const y = Math.round(
            base - amp * (Math.sin(x * f + s) * 0.6 + Math.sin(x * f * 2.3 + s * 3) * 0.4),
          );
          g.fillRect(x, y, 1, 120 - y);
        }
      }
      skyTex.needsUpdate = true;
    },
    setNight(on) {
      night = on;
      ffMat.opacity = on ? 1 : 0;
    },
    setRainVisible(on) {
      rain.visible = on;
    },
    update(t, mist, camera) {
      for (let i = 0; i < LEAVES; i++) {
        const speed = 0.25 + hash(i, 3) * 0.2;
        dummy.position.set(
          -7 + ((hash(i, 1) * 14 + t * 0.25) % 14) + Math.sin(t * 1.3 + i) * 0.3,
          4.5 - ((hash(i, 2) * 4.5 + t * speed) % 4.5),
          -4 + hash(i, 4) * 8,
        );
        dummy.rotation.set(t * 2 + i, t * 1.3 + i, Math.sin(t + i));
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      }
      leaves.instanceMatrix.needsUpdate = true;

      if (night) {
        for (let i = 0; i < FIREFLIES; i++) {
          ffPos[i * 3] = -5 + hash(i, 11) * 10 + Math.sin(t * 0.5 + i) * 0.5;
          ffPos[i * 3 + 1] = 0.3 + hash(i, 12) * 1.2 + Math.sin(t * 0.9 + i * 2) * 0.2;
          ffPos[i * 3 + 2] = -3 + hash(i, 13) * 6 + Math.cos(t * 0.4 + i) * 0.5;
        }
        ffGeo.attributes.position.needsUpdate = true;
        ffMat.size = 0.04 + Math.abs(Math.sin(t * 2)) * 0.03;
      }

      if (rain.visible) {
        for (let i = 0; i < RAIN; i++) {
          const x = -8 + hash(i, 21) * 16;
          const z = -5 + hash(i, 22) * 11;
          const y = 6 - ((hash(i, 23) * 6 + t * 7) % 6);
          rainPos.set([x, y, z, x - 0.03, y - 0.28, z], i * 6);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      mists.forEach((m, i) => {
        m.material.opacity = mist * (0.5 + 0.5 * Math.sin(t * 0.2 + i));
        m.position.x = ((((-10 + i * 3 + t * 0.15 * (1 + (i % 3) * 0.3)) % 20) + 20) % 20) - 10;
        m.lookAt(camera.position);
      });
    },
    dispose() {
      leaves.dispose();
      disposables.forEach((d) => d.dispose());
    },
  };
}
