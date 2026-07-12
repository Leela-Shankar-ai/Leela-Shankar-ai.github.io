// The Invariant: a crystal that is endlessly transformed by noise,
// yet its ember core stays constant. Mouse-orbit, scroll-recede.
import * as THREE from "three";

const host = document.getElementById("hero3d");
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  cam.position.set(0, 0, 7.2);

  const uni = {
    uTime: { value: 0 },
    uAmp: { value: 0.55 },
    uLight: { value: 0 },
  };
  const themeTarget = () => (document.documentElement.getAttribute("data-theme") === "light" ? 1 : 0);

  // shared noise chunk
  const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`;

  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    vertexShader: `
      uniform float uTime, uAmp;
      varying float vN; varying vec3 vNor; varying vec3 vPos;
      ${NOISE}
      void main(){
        float n = snoise(normal*1.35 + uTime*0.22);
        float n2 = snoise(normal*3.4 - uTime*0.14);
        float d = n*0.72 + n2*0.28;
        vN = d;
        vec3 p = position + normal * d * uAmp;
        vNor = normalMatrix * normal;
        vPos = (modelViewMatrix * vec4(p,1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime, uLight;
      varying float vN; varying vec3 vNor; varying vec3 vPos;
      void main(){
        vec3 N = normalize(vNor);
        vec3 V = normalize(-vPos);
        float fres = pow(1.0 - abs(dot(N, V)), 2.2);
        vec3 emberA = vec3(1.0, 0.32, 0.08);
        vec3 emberB = vec3(1.0, 0.72, 0.36);
        vec3 deep   = mix(vec3(0.055,0.042,0.034), vec3(0.94,0.90,0.85), uLight);
        vec3 col = mix(deep, mix(emberA, emberB, vN*0.5+0.5), 0.06 + fres*1.05);
        col += emberB * pow(max(vN,0.0), 3.0) * 0.30;
        float alpha = 0.9;
        gl_FragColor = vec4(col, alpha);
      }`,
  });

  const geo = new THREE.IcosahedronGeometry(2.1, 96);
  const crystal = new THREE.Mesh(geo, mat);
  scene.add(crystal);

  // constant core: a slowly breathing ember point light halo (sprite-free glow via shader ring)
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.75, 2),
    new THREE.MeshBasicMaterial({ color: 0xff7a29, wireframe: true, transparent: true, opacity: 0.10 })
  );
  scene.add(wire);

  // orbiting shards
  const shardGeo = new THREE.TetrahedronGeometry(0.09, 0);
  const shardMat = new THREE.MeshBasicMaterial({ color: 0xffb65c, transparent: true, opacity: 0.85 });
  const shards = [];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(shardGeo, shardMat);
    m.userData = { r: 3.1 + Math.random() * 1.7, a: Math.random() * Math.PI * 2, s: 0.12 + Math.random() * 0.3, y: (Math.random() - 0.5) * 2.6 };
    shards.push(m); scene.add(m);
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  let mx = 0, my = 0, light = themeTarget();
  addEventListener("pointermove", (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();
  (function loop() {
    const t = clock.getElapsedTime();
    uni.uTime.value = t;
    light += (themeTarget() - light) * 0.05;
    uni.uLight.value = light;
    wire.material.opacity = 0.06 + 0.05 * Math.sin(t * 0.8) + light * 0.05;
    wire.material.color.setHex(light > 0.5 ? 0xe8500f : 0xff7a29);

    const sc = Math.min(1, scrollY / innerHeight);
    crystal.rotation.y += 0.0016 + mx * 0.0009;
    crystal.rotation.x += (my * 0.25 - crystal.rotation.x) * 0.03;
    wire.rotation.y -= 0.0011;
    wire.rotation.z += 0.0006;
    scene.position.y = sc * 1.6;
    scene.scale.setScalar(1 - sc * 0.18);
    uni.uAmp.value = 0.55 + sc * 0.5;

    shards.forEach((s2, i) => {
      const u = s2.userData;
      u.a += 0.0016 * (i % 2 ? 1 : -1) * (1 + u.s);
      s2.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * u.s) * 0.28, Math.sin(u.a) * u.r);
      s2.rotation.x = t * u.s * 2; s2.rotation.y = t * u.s * 3;
    });
    shardMat.color.setHex(light > 0.5 ? 0xc23a00 : 0xffb65c);

    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
}
