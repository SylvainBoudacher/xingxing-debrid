import * as THREE from "three";

const QUAD_VS =
  "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

// Flou de bascule haut / bas, bloom, étalonnage chaud et vignette (prototype validé).
export function createPost(renderer: THREE.WebGLRenderer) {
  const opts = { type: THREE.HalfFloatType };
  const main = new THREE.WebGLRenderTarget(1, 1, { ...opts, samples: 4 });
  const a = new THREE.WebGLRenderTarget(1, 1, opts);
  const b = new THREE.WebGLRenderTarget(1, 1, opts);

  const blur = new THREE.ShaderMaterial({
    uniforms: { tex: { value: null }, dir: { value: new THREE.Vector2() } },
    vertexShader: QUAD_VS,
    fragmentShader: `uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tex, vUv).rgb * 0.227;
        c += (texture2D(tex, vUv + dir * 1.385).rgb + texture2D(tex, vUv - dir * 1.385).rgb) * 0.316;
        c += (texture2D(tex, vUv + dir * 3.231).rgb + texture2D(tex, vUv - dir * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const final = new THREE.ShaderMaterial({
    uniforms: { tSharp: { value: main.texture }, tBlur: { value: b.texture } },
    vertexShader: QUAD_VS,
    fragmentShader: `uniform sampler2D tSharp; uniform sampler2D tBlur; varying vec2 vUv;
      void main() {
        vec3 s = texture2D(tSharp, vUv).rgb;
        vec3 b = texture2D(tBlur, vUv).rgb;
        float f = smoothstep(0.1, 0.42, abs(vUv.y - 0.44));
        vec3 col = mix(s, b, f);
        col += max(b - vec3(0.5), 0.0) * 1.1;
        col = col * vec3(1.06, 1.0, 0.9) + vec3(0.0, 0.012, 0.035) * (1.0 - col);
        float v = smoothstep(0.32, 0.95, length((vUv - 0.5) * vec2(1.0, 1.3)));
        col *= 1.0 - v * 0.65;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), final);
  const postScene = new THREE.Scene().add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function pass(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(postScene, postCam);
  }

  return {
    render(scene: THREE.Scene, camera: THREE.Camera) {
      renderer.setRenderTarget(main);
      renderer.render(scene, camera);
      blur.uniforms.tex.value = main.texture;
      blur.uniforms.dir.value.set(1 / a.width, 0);
      pass(blur, a);
      blur.uniforms.tex.value = a.texture;
      blur.uniforms.dir.value.set(0, 1 / a.height);
      pass(blur, b);
      pass(final, null);
    },
    setSize(w: number, h: number) {
      main.setSize(w, h);
      a.setSize(Math.ceil(w / 4), Math.ceil(h / 4));
      b.setSize(Math.ceil(w / 4), Math.ceil(h / 4));
    },
    dispose() {
      [main, a, b].forEach((t) => t.dispose());
      [blur, final].forEach((m) => m.dispose());
      quad.geometry.dispose();
    },
  };
}
