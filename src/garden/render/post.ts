import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { HorizontalTiltShiftShader } from "three/examples/jsm/shaders/HorizontalTiltShiftShader.js";
import { VerticalTiltShiftShader } from "three/examples/jsm/shaders/VerticalTiltShiftShader.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";

export interface Post {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  resize(w: number, h: number): void;
  dispose(): void;
}

const TILT_BLUR = 2.2;

// Halo, flou de profondeur façon maquette (tilt-shift) et vignettage.
export function createPost(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): Post {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.6, 0.85);
  composer.addPass(bloom);
  const hts = new ShaderPass(HorizontalTiltShiftShader);
  const vts = new ShaderPass(VerticalTiltShiftShader);
  hts.uniforms.r.value = 0.45;
  vts.uniforms.r.value = 0.45;
  composer.addPass(hts);
  composer.addPass(vts);
  const vignette = new ShaderPass(VignetteShader);
  vignette.uniforms.offset.value = 1.0;
  vignette.uniforms.darkness.value = 1.15;
  composer.addPass(vignette);
  composer.addPass(new OutputPass());

  return {
    composer,
    bloom,
    resize(w, h) {
      composer.setSize(w, h);
      const ratio = renderer.getPixelRatio();
      hts.uniforms.h.value = TILT_BLUR / (w * ratio);
      vts.uniforms.v.value = TILT_BLUR / (h * ratio);
    },
    dispose: () => composer.dispose(),
  };
}
