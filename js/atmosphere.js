// Fullscreen ember-nebula shader background. Three.js fullscreen quad.
// Domain-warped fBm, godrays, cursor + scroll reactive, theme-morphing.
import * as THREE from "three";

const canvas = document.getElementById("webgl");
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  const scene = new THREE.Scene();
  const cam = new THREE.Camera();

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2() },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
    uLight: { value: 0 }, // 0 dark, 1 light (animated)
  };

  const frag = `
  precision highp float;
  uniform float uTime, uScroll, uLight;
  uniform vec2 uRes, uMouse;
  varying vec2 vUv;

  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
  float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    vec2 u=f*f*(3.-2.*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }
  float fbm(vec2 p){
    float v=0., a=0.5;
    for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.02; p*=rot(0.5); a*=0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
    float t = uTime*0.028;

    // domain warp
    vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 - t + 5.2));
    vec2 r = vec2(fbm(p*2.1 + q*1.4 + vec2(1.7, 9.2) + t*1.3),
                  fbm(p*2.1 + q*1.4 + vec2(8.3, 2.8) - t));
    float f = fbm(p*1.8 + r*1.6 + t*0.6);

    // radial ember pool that follows cursor & scroll
    vec2 m = (uMouse - 0.5);
    float d = length(p - vec2(m.x*0.5, 0.35 - uScroll*0.7 + m.y*0.3));
    float pool = smoothstep(1.15, 0.0, d);

    float heat = f*0.72 + pool*0.38;
    heat += 0.05*sin(p.x*3.0 + t*4.0 + f*6.0); // faint shimmer

    // restrained ember veining over near-black obsidian
    float vein  = smoothstep(0.66, 0.98, heat);          // rare hot veins
    float haze  = smoothstep(0.45, 0.85, heat) * 0.5;    // soft warmth
    vec3 obsidian = vec3(0.040, 0.034, 0.030);
    vec3 warm     = vec3(0.16, 0.065, 0.028);
    vec3 emberHi  = vec3(0.95, 0.38, 0.12);
    vec3 amber    = vec3(1.0, 0.70, 0.34);
    vec3 col = obsidian;
    col = mix(col, warm, haze);
    col = mix(col, emberHi, vein*0.42);
    col = mix(col, amber, smoothstep(0.9, 1.08, heat)*0.28);

    // vignette breathing
    float vig = smoothstep(1.55, 0.25, length(p*vec2(0.8,1.0)));
    col *= 0.55 + 0.45*vig;
    col += pool*vec3(0.55,0.22,0.08)*0.05;

    // LIGHT MODE: warm paper, whisper-faint ember watermark
    vec3 paper = vec3(0.968, 0.951, 0.925);
    vec3 lightInk = mix(paper, vec3(0.98,0.72,0.48), vein*0.16 + haze*0.05);
    lightInk = mix(lightInk, vec3(0.93,0.55,0.28), smoothstep(0.95,1.1,heat)*0.10);
    lightInk *= 0.985 + 0.015*vig;

    col = mix(col, lightInk, uLight);
    gl_FragColor = vec4(col, 1.0);
  }`;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: frag,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }
  addEventListener("resize", resize); resize();

  let mx = 0.5, my = 0.5;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; my = 1 - e.clientY / innerHeight; }, { passive: true });

  const themeTarget = () => (document.documentElement.getAttribute("data-theme") === "light" ? 1 : 0);
  let light = themeTarget(), frames = 0;

  const clock = new THREE.Clock();
  function loop() {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.x += (mx - uniforms.uMouse.value.x) * 0.04;
    uniforms.uMouse.value.y += (my - uniforms.uMouse.value.y) * 0.04;
    const sc = Math.min(1, scrollY / (document.body.scrollHeight - innerHeight || 1));
    uniforms.uScroll.value += (sc - uniforms.uScroll.value) * 0.06;
    frames++;
    if (frames < 12) light = themeTarget();           // snap during load
    else light += (themeTarget() - light) * 0.12;     // then glide on toggle
    uniforms.uLight.value = light;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
}
