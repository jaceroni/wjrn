import * as THREE from 'three';
THREE.ColorManagement.enabled = false;
const V = THREE.Vector3;
const $ = id => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;
const pad3 = n => String(n).padStart(3, '0');
const CONFIG = window.DISCO_CONFIG;

/* ---------- placeholder reel data ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const PALETTES = [
  ['#1b0f2b','#ff6b35','#f7c548','#f4e4c1','#2ec4b6'],
  ['#0d1b2a','#e63946','#f1a208','#fefae0','#457b9d'],
  ['#2b1d0e','#d4a373','#e76f51','#faedcd','#264653'],
  ['#120d1f','#ff3fa4','#29e6ff','#f9f871','#7b2cbf'],
  ['#1a1a1a','#c1121f','#fdf0d5','#669bbc','#780000'],
  ['#14213d','#fca311','#e5e5e5','#ff5d8f','#2a9d8f'],
];
function reelInfo(id){
  const r = mulberry32(id*9973+17);
  return { id, wide: r() < 0.75, scene: Math.floor(r()*4), pal: Math.floor(r()*PALETTES.length), seed: Math.floor(r()*1e9) };
}

function drawCover(ctx, w, h, info, label=true){
  const P = PALETTES[info.pal], rnd = mulberry32(info.seed);
  const s = Math.min(w,h), cx = w/2, cy = h/2, x0 = (w-s)/2, y0 = (h-s)/2;
  ctx.save();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (info.scene === 0) {            // 70s sunset
    const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,P[0]); g.addColorStop(.68,P[1]); g.addColorStop(1,P[2]);
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    const sy = cy + s*0.1, r = s*0.3;
    ctx.save(); ctx.beginPath(); ctx.arc(cx,sy,r,0,Math.PI*2); ctx.clip();
    ctx.fillStyle = P[2]; ctx.fillRect(cx-r,sy-r,2*r,2*r);
    ctx.fillStyle = P[1]; for (let i=0;i<5;i++){ ctx.fillRect(cx-r, sy+r*0.08+i*r*0.19, 2*r, r*(0.035+i*0.02)); }
    ctx.restore();
    ctx.fillStyle = P[0]; ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(0, cy+s*0.22);
    let x = 0; while (x < w) { x += s*(0.1+rnd()*0.18); ctx.lineTo(x, cy + s*(0.12+rnd()*0.18)); }
    ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
  } else if (info.scene === 1) {     // stage + spotlights
    ctx.fillStyle = P[0]; ctx.fillRect(0,0,w,h);
    const floor = cy + s*0.36, cols = [P[1],P[4],P[2]];
    ctx.globalCompositeOperation = 'lighter';
    for (let i=0;i<3;i++){
      ctx.globalAlpha = 0.33; ctx.fillStyle = cols[i];
      const top = w*(0.18+0.32*i);
      ctx.beginPath(); ctx.moveTo(top-6,0); ctx.lineTo(top+6,0); ctx.lineTo(cx+s*(0.28-0.04*i),floor); ctx.lineTo(cx-s*(0.2+0.04*i),floor); ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#07050a';
    const hx = cx + s*(rnd()-0.5)*0.12, hy = floor - s*0.5;
    ctx.beginPath(); ctx.arc(hx, hy, s*0.055, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx-s*0.11, hy+s*0.09); ctx.lineTo(hx+s*0.11, hy+s*0.09); ctx.lineTo(hx+s*0.07, floor); ctx.lineTo(hx-s*0.07, floor); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#07050a'; ctx.lineWidth = s*0.012;
    ctx.beginPath(); ctx.moveTo(hx+s*0.17, floor); ctx.lineTo(hx+s*0.17, hy+s*0.02); ctx.lineTo(hx+s*0.08, hy+s*0.02); ctx.stroke();
    ctx.fillStyle = '#050307'; ctx.fillRect(0, floor, w, h-floor);
    ctx.fillStyle = P[3]; ctx.globalAlpha = .5; ctx.fillRect(0, floor, w, Math.max(1,s*0.006)); ctx.globalAlpha = 1;
  } else if (info.scene === 2) {     // vinyl
    ctx.fillStyle = P[4]; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = P[1]; ctx.globalAlpha = .35;
    for (let i=-4;i<8;i++){ ctx.beginPath(); const b = i*s*0.22; ctx.moveTo(b,0); ctx.lineTo(b+s*0.1,0); ctx.lineTo(b+s*0.1-h*0.6,h); ctx.lineTo(b-h*0.6,h); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
    const r = s*0.4;
    ctx.fillStyle = '#0c0b0d'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = Math.max(1, s*0.004);
    for (let rr = r*0.42; rr < r*0.97; rr += r*0.045){ ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = s*0.02;
    ctx.beginPath(); ctx.arc(cx,cy,r*0.72,-2.4,-1.7); ctx.stroke();
    ctx.fillStyle = P[1]; ctx.beginPath(); ctx.arc(cx,cy,r*0.34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = P[3]; ctx.font = `${Math.round(r*0.2)}px Bungee, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TRG', cx, cy - r*0.1);
    ctx.fillStyle = P[4]; ctx.beginPath(); ctx.arc(cx,cy+r*0.12,r*0.04,0,Math.PI*2); ctx.fill();
  } else {                           // 70s swoosh
    ctx.fillStyle = P[0]; ctx.fillRect(0,0,w,h);
    ctx.lineCap = 'round';
    for (let i=0;i<4;i++){
      ctx.strokeStyle = P[1+i]; ctx.lineWidth = s*0.075;
      const o = (i-1.5)*s*0.085;
      ctx.beginPath(); ctx.moveTo(-s*0.2, cy+s*0.35+o);
      ctx.bezierCurveTo(w*0.3, cy+s*0.38+o, w*0.4, cy-s*0.3+o, w+s*0.2, cy-s*0.28+o); ctx.stroke();
    }
    ctx.fillStyle = P[3]; ctx.beginPath(); ctx.arc(x0+s*0.78, y0+s*0.24, s*0.07, 0, Math.PI*2); ctx.fill();
  }
  // film grain
  ctx.globalAlpha = .08; ctx.fillStyle = '#fff';
  for (let i=0;i<Math.round(w*h/300);i++){ ctx.fillRect(rnd()*w, rnd()*h, 1, 1); }
  ctx.globalAlpha = 1;
  if (label) {
    ctx.font = `500 ${Math.round(s*0.1)}px "DM Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText('#'+pad3(info.id), cx+1, y0+s*0.84+1);
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillText('#'+pad3(info.id), cx, y0+s*0.84);
  }
  ctx.restore();
}

/* ---------- texture atlas: one square per reel ---------- */
// One square cell per reel, in reel order (cell i = reels[i], index 0 = newest). The grid sizes itself from the
// reel count, so any number of reels fits: 16x16 in a 2048 atlas up to 256 reels, then a 4096 atlas beyond that.
let ATLAS = 2048, CELLS = 16, CS = ATLAS/CELLS;
const PAD = 3;
let atlasCanvas = null, actx = null, atlasTex = new THREE.Texture();    // real texture is made in setupAtlas()
const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
function setupAtlas(N){
  CELLS = Math.max(16, Math.ceil(Math.sqrt(N)));
  ATLAS = N > 256 ? 4096 : 2048;
  CS = Math.floor(ATLAS / CELLS);
  atlasCanvas = document.createElement('canvas'); atlasCanvas.width = atlasCanvas.height = ATLAS;
  actx = atlasCanvas.getContext('2d');
  actx.fillStyle = '#1b160f'; actx.fillRect(0, 0, ATLAS, ATLAS);          // dark soil tone until a cover arrives
  atlasTex.dispose();
  atlasTex = new THREE.CanvasTexture(atlasCanvas); atlasTex.anisotropy = 4;
  shardUniforms.map.value = atlasTex;
}
// paint one cover into its cell, center-cropped square; `src` is an Image (real cover) or a canvas
let atlasDirty = false, lastAtlasUpload = 0;
function paintCell(i, src, sw, sh){
  const side = Math.min(sw, sh);
  actx.drawImage(src, (sw-side)/2, (sh-side)/2, side, side, (i%CELLS)*CS, Math.floor(i/CELLS)*CS, CS, CS);
  atlasDirty = true;
}
function paintPlaceholder(i, reel){
  const info = reelInfo(reel.ph), tw = info.wide ? 256 : 144, th = info.wide ? 144 : 256;
  tmp.width = tw; tmp.height = th; drawCover(tctx, tw, th, info);
  paintCell(i, tmp, tw, th);
}
// Load the real covers a few at a time so the ball is usable straight away and tiles fill in as they land.
// A failed cover just stays a dark tile; it never blocks the others.
function loadCovers(){
  let next = 0, active = 0; const LIMIT = 8;
  const pump = () => {
    while (active < LIMIT && next < reels.length) {
      const i = next++, reel = reels[i];
      if (reel.ph !== undefined) { paintPlaceholder(i, reel); continue; }
      if (!reel.cover) continue;
      active++;
      const img = new Image();
      img.onload = () => { reel.img = img; paintCell(i, img, img.naturalWidth, img.naturalHeight); active--; pump(); };
      img.onerror = () => { active--; pump(); };
      img.src = CONFIG.dataBase + reel.cover;
    }
  };
  pump();
}

/* ---------- renderer / scene ---------- */
const BRAND = { sage: 0xA5AF8F, ivory: 0xF7E7C7, fern: 0x5A734A, deepFern: 0x304227, bark: 0x6B4E35, groove: 0x3C3023, amber: 0xDF9C32, rust: 0xBA4A2A, pine: 0x1E3426, ink: 0x100E0A };
// disco mode: shared switches for every material (0 = rock garden, 1 = full Studio 54)
const DISCO = { value: 0 }, BALLROT = { value: new THREE.Matrix3() };
const NEON_COLS = [new THREE.Color(0xff3fa4), new THREE.Color(0x29e6ff), new THREE.Color(0xffd23f)];
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xB7BD9F);
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
const ball = new THREE.Group(); scene.add(ball);

/* the room: a seamless sage-paper cove — floor that bends up into a wall, no corners, no horizon */
const FLOOR_Y = -1.75;
const coveMat = new THREE.ShaderMaterial({
  uniforms: { res: { value: new THREE.Vector2(1,1) }, camPos: { value: new V() }, uDisco: DISCO, uBallRot: BALLROT, cD: { value: NEON_COLS },
    cSage: { value: new THREE.Color(BRAND.sage) }, cIvory: { value: new THREE.Color(BRAND.ivory) },
    cShade: { value: new THREE.Color(0x7E896A) }, cHaze: { value: new THREE.Color(0xB7BD9F) } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `
    uniform vec2 res; uniform vec3 camPos, cSage, cIvory, cShade, cHaze; uniform float uDisco; uniform mat3 uBallRot; uniform vec3 cD[3]; varying vec3 vW;
    float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+1.0),f.x), f.y); }
    void main(){
      vec2 st = vec2(vW.x, vW.y - vW.z);                       // runs continuously across the bend
      float hgt = max(vW.y - ${FLOOR_Y.toFixed(3)}, 0.0);
      float pool = exp(-(vW.x*vW.x)/90.0 - pow(vW.z+1.2, 2.0)/70.0) * exp(-hgt/6.5);   // soft overhead light, pooling on the floor
      vec3 col = mix(cShade, cSage, 0.35 + 0.65*pool);
      col = mix(col, cIvory, 0.28*pool);
      col *= 1.0 - 0.22*smoothstep(1.0, 14.0, hgt);            // the wall falls off as it rises
      float mottle = noise(st*0.5)*0.6 + noise(st*1.9)*0.4;     // soft paper mottling
      col *= 0.96 + 0.06*mottle;
      float d = length(vW - camPos);
      col = mix(col, cHaze, smoothstep(14.0, 60.0, d));
      if (uDisco > 0.001) {
        // the club: black room, and the mirror ball throwing specks of light that sweep as it turns
        vec3 dir = uBallRot * normalize(vW);
        float th = atan(dir.z, dir.x), ph = acos(clamp(dir.y, -1.0, 1.0));
        vec2 g = vec2(th, ph) * 11.0, id = floor(g), f = fract(g) - 0.5;
        float rnd = hash(id + 7.0);
        float spot = smoothstep(0.3, 0.05, length(f)) * step(0.45, rnd);
        vec3 sc = rnd > 0.86 ? cD[0] : rnd > 0.74 ? cD[1] : rnd > 0.62 ? cD[2] : vec3(1.0);
        float att = 1.0 / (1.0 + 0.006*dot(vW, vW));
        vec3 club = vec3(0.012, 0.010, 0.018) * (1.0 + 3.0*pool) + sc * spot * 1.5 * att;
        col = mix(col, club, uDisco);
      }
      vec2 q = gl_FragCoord.xy/res - 0.5;
      col *= 1.0 - 0.32*dot(q,q)*1.6;                          // gentle vignette
      col += (hash(floor(gl_FragCoord.xy)) - 0.5) * 0.045;      // paper grain
      gl_FragColor = vec4(col, 1.0);
    }`
});
{
  // profile in (z, y): floor toward camera, quarter-circle bend, tall back wall
  const prof = [], R = 4.5, zBend = -3.5;
  for (let z = 40; z > zBend; z -= 1.0) prof.push([z, FLOOR_Y]);
  for (let k = 1; k <= 40; k++){ const a = -Math.PI/2 - (k/40)*(Math.PI/2); prof.push([zBend + R*Math.cos(a), FLOOR_Y + R + R*Math.sin(a)]); }   // floor curves up into the wall
  for (let y = FLOOR_Y + R + 1; y < 60; y += 2) prof.push([zBend - R, y]);
  const X = 80, pos = [], idx = [];
  prof.forEach(([z,y]) => { pos.push(-X, y, z, X, y, z); });
  for (let k=0;k<prof.length-1;k++){ const a = k*2; idx.push(a, a+1, a+2, a+1, a+3, a+2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
  const cove = new THREE.Mesh(g, coveMat); cove.material.side = THREE.DoubleSide; scene.add(cove);
}
// soft contact shadow on the floor, so the ball reads as floating
const shadow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(48,66,39,0.6)'); g.addColorStop(0.4,'rgba(48,66,39,0.3)'); g.addColorStop(1,'rgba(48,66,39,0)');
  x.fillStyle = g; x.fillRect(0,0,256,256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI/2; m.position.y = FLOOR_Y + 0.003; scene.add(m); return m;
})();

/* satin glass: soft warm sheen, no mirror glare, no neon */
const WARM = [new THREE.Color(BRAND.ivory), new THREE.Color(BRAND.amber), new THREE.Color(0xDCE3C8)];
const shardUniforms = { uDisco: DISCO, lColD: { value: NEON_COLS }, map: { value: atlasTex }, lPos: { value: [new V(), new V(), new V()] }, lCol: { value: WARM }, keyDir: { value: new V() }, cIvory: { value: new THREE.Color(BRAND.ivory) } };
const SHARD_VS = `
  attribute float aShade; varying vec2 vUv; varying float vShade; varying vec3 vN; varying vec3 vP;
  void main(){ vUv = uv; vShade = aShade; vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const SHARD_FS = `
  uniform sampler2D map; uniform vec3 lPos[3]; uniform vec3 lCol[3]; uniform vec3 keyDir; uniform vec3 cIvory; uniform float uDisco; uniform vec3 lColD[3];
  varying vec2 vUv; varying float vShade; varying vec3 vN; varying vec3 vP;
  void main(){
    vec3 N = normalize(vN); vec3 Vd = normalize(-vP);
    vec3 alb = texture2D(map, vUv).rgb;
    float d = 0.64 + 0.4 * max(dot(N, keyDir), 0.0);
    vec3 c = alb * d * vShade;
    vec3 Hk = normalize(keyDir + Vd); c += cIvory * pow(max(dot(N, Hk), 0.0), 14.0) * 0.2 * vShade;
    for (int i = 0; i < 3; i++) { vec3 L = normalize(lPos[i] - vP); vec3 H = normalize(L + Vd);
      c += lCol[i] * pow(max(dot(N, H), 0.0), 22.0) * 0.16 * vShade; }
    float f = pow(1.0 - max(dot(N, Vd), 0.0), 3.0); c = mix(c, cIvory*0.9, f * 0.18);
    if (uDisco > 0.001) {
      // each flat tile becomes a mirror: it flashes as a whole when it lines up with a light
      vec3 Rf = reflect(-Vd, N);
      vec3 m = mix(vec3(0.03,0.03,0.04), vec3(0.22,0.22,0.26), Rf.y*0.5 + 0.5);
      for (int i = 0; i < 3; i++) { vec3 L = normalize(lPos[i] - vP); m += lColD[i] * pow(max(dot(Rf, L), 0.0), 90.0) * 2.2; }
      m += vec3(1.0) * pow(max(dot(Rf, keyDir), 0.0), 220.0) * 2.5;
      m += vec3(0.42, 0.43, 0.47) * (0.35 + 0.4*max(dot(N, keyDir), 0.0));
      m = mix(m, alb*0.5, 0.15);                      // the reels still ghost through the silver
      c = mix(c, m * vShade, uDisco);
    }
    gl_FragColor = vec4(c, 1.0);
  }`;
const shardMat = new THREE.ShaderMaterial({ uniforms: shardUniforms, vertexShader: SHARD_VS, fragmentShader: SHARD_FS });
/* the soil: what the shards are pressed into — shows through as thick, earthy grout */
const NOISE3 = `
  float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }`;
const soilMat = new THREE.ShaderMaterial({
  uniforms: { uDisco: DISCO, keyDir: shardUniforms.keyDir, cGroove: { value: new THREE.Color(BRAND.groove) }, cBark: { value: new THREE.Color(BRAND.bark) },
    cInk: { value: new THREE.Color(BRAND.ink) }, cPebble: { value: new THREE.Color(0x9A8A6E) }, cMoss: { value: new THREE.Color(BRAND.fern) } },
  vertexShader: `attribute float aShade; varying vec3 vObj; varying vec3 vN; varying vec3 vP; varying float vShade;
    void main(){ vObj = position; vShade = aShade; vN = normalize(normalMatrix*normal);
      vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: NOISE3 + `
    uniform float uDisco; uniform vec3 keyDir, cGroove, cBark, cInk, cPebble, cMoss; varying vec3 vObj; varying vec3 vN; varying vec3 vP; varying float vShade;
    // bump the surface with a height field so light rakes across real-looking grains and clods
    vec3 bump(vec3 pos, vec3 nrm, float hgt){
      vec3 sx = dFdx(pos), sy = dFdy(pos);
      vec3 r1 = cross(sy, nrm), r2 = cross(nrm, sx);
      float det = dot(sx, r1);
      vec3 grad = sign(det) * (dFdx(hgt)*r1 + dFdy(hgt)*r2);
      return normalize(abs(det)*nrm - grad);
    }
    void main(){
      vec3 p = normalize(vObj);
      float clod  = n3(p*38.0);
      float grain = n3(p*120.0)*0.5 + n3(p*290.0)*0.3 + n3(p*640.0)*0.2;
      float peb   = smoothstep(0.8, 0.9, n3(p*140.0 + 3.0));                  // little stones sitting proud
      float hgt   = clod*0.45 + grain*0.45 + peb*0.5;
      vec3 N = bump(vP, normalize(vN), hgt*0.022);

      float n = n3(p*7.0)*0.5 + n3(p*19.0)*0.3 + n3(p*53.0)*0.2;            // patches of darker / lighter earth
      vec3 col = mix(cGroove, cBark, smoothstep(0.2, 0.8, n));
      col = mix(col, cInk, smoothstep(0.45, 0.15, n)*0.6);
      col = mix(col, cPebble, peb*0.5);
      float moss = smoothstep(0.8, 0.93, n3(p*11.0 + 4.0)); col = mix(col, cMoss, moss*0.25);
      col *= 0.45 + 0.8*hgt;                                                // crevices sit in shadow
      col *= 0.82 + 0.3*n3(p*900.0);                                        // crumb

      // matte, rough earth: raking key light + soft wrap, no sheen at all
      float diff = max(dot(N, keyDir), 0.0);
      float wrap = 0.5 + 0.5*dot(N, keyDir);
      col *= 0.3 + 0.95*diff + 0.25*wrap;
      col *= vShade;                                                        // darker where it presses against a tile
      col = mix(col, vec3(0.05,0.05,0.06)*(0.6 + 0.8*hgt)*vShade, uDisco);
      gl_FragColor = vec4(col, 1.0);
    }`
});
// dark core under everything, so no crack ever shows daylight
const inner = new THREE.Mesh(new THREE.SphereGeometry(0.86, 48, 32), new THREE.MeshBasicMaterial({ color: BRAND.ink }));
inner.userData.type = 'ball';
ball.add(inner);

/* ---------- logo medallions: north, south, east, west ---------- */
// The Rock Garden lettering, laid over sage paper. Used as supplied — never redrawn or recolored.
const LOGO_SRC = CONFIG.logo;   // lettering supplied as a file (trg-logo-black.png); never redrawn or recolored
const logoCanvas = document.createElement('canvas'); logoCanvas.width = logoCanvas.height = 1024;
let LOGO_ASPECT = 1.3;
function drawLogo(){
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const x = logoCanvas.getContext('2d'), S = 1024;
      const PADPX = 8, W = 1024, H = Math.round(W*img.height/img.width);
      logoCanvas.width = W + PADPX*2; logoCanvas.height = H + PADPX*2;
      x.clearRect(0,0,logoCanvas.width,logoCanvas.height);
      x.drawImage(img, PADPX, PADPX, W, H);
      LOGO_ASPECT = logoCanvas.width / logoCanvas.height;
      resolve();
    };
    img.onerror = resolve;
    img.src = LOGO_SRC;
  });
}
const logoTex = new THREE.CanvasTexture(logoCanvas); logoTex.anisotropy = 4; logoTex.wrapS = logoTex.wrapT = THREE.ClampToEdgeWrapping;
// one flat slab of sage agate per side, the lettering etched into it
const logoMat = new THREE.ShaderMaterial({
  uniforms: { uDisco: DISCO, lColD: { value: NEON_COLS }, mask: { value: logoTex }, keyDir: shardUniforms.keyDir, lPos: shardUniforms.lPos, lCol: shardUniforms.lCol,
    cIvory: { value: new THREE.Color(BRAND.ivory) }, cSage: { value: new THREE.Color(BRAND.sage) }, cSageLt: { value: new THREE.Color(0xC3CAAE) },
    cSageDk: { value: new THREE.Color(0x87917A) }, cFern: { value: new THREE.Color(BRAND.fern) }, cInk: { value: new THREE.Color(BRAND.ink) } },
  vertexShader: SHARD_VS,
  fragmentShader: `
    uniform sampler2D mask; uniform vec3 keyDir; uniform vec3 lPos[3]; uniform vec3 lCol[3]; uniform float uDisco; uniform vec3 lColD[3];
    uniform vec3 cIvory, cSage, cSageLt, cSageDk, cFern, cInk;
    varying vec2 vUv; varying float vShade; varying vec3 vN; varying vec3 vP;
    float h2(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+1.0),f.x), f.y); }
    void main(){
      vec3 N = normalize(vN); vec3 Vd = normalize(-vP);
      vec2 q = (vUv - 0.5) * 2.0;
      // agate: warped concentric bands, a little moss-green cloud, fine grain
      float warp = n2(q*2.1)*0.4 + n2(q*5.3)*0.12;
      float r = length(q*vec2(1.0,1.18)) + warp;
      float bands = 0.5 + 0.5*sin(r*30.0);
      float fine = 0.5 + 0.5*sin(r*105.0 + n2(q*14.0)*3.0);
      vec3 stone = mix(cSageDk, cSage, smoothstep(0.15, 0.85, bands));
      stone = mix(stone, cSageLt, smoothstep(0.8, 1.0, bands)*0.55);
      stone = mix(stone, cFern, smoothstep(0.6, 0.95, n2(q*1.5 + 7.0))*0.22);
      stone *= 0.96 + 0.05*fine + 0.03*n2(q*60.0);
      // the etch: lettering cut into the stone, dark and frosted, with lit/shadowed walls
      vec2 px = vec2(2.5/1024.0);
      float m = texture2D(mask, vUv).a;
      float gx = texture2D(mask, vUv + vec2(px.x,0.0)).a - texture2D(mask, vUv - vec2(px.x,0.0)).a;
      float gy = texture2D(mask, vUv + vec2(0.0,px.y)).a - texture2D(mask, vUv - vec2(0.0,px.y)).a;
      float e = dot(vec2(gx,gy), normalize(vec2(-1.0, 1.0)));
      vec3 etched = mix(cInk, stone*0.3, 0.22) * (0.9 + 0.2*n2(vUv*800.0));
      vec3 col = mix(stone, etched, m);
      col += cIvory * max(e, 0.0) * 0.5;          // far wall of the cut catches light
      col *= 1.0 - max(-e, 0.0) * 0.55;           // near wall falls into shadow
      col *= (0.66 + 0.38*max(dot(N, keyDir), 0.0)) * vShade;
      // polished satin on the stone only, matte inside the etch
      float sp = pow(max(dot(N, normalize(keyDir + Vd)), 0.0), 18.0) * 0.2;
      for (int i = 0; i < 3; i++) { vec3 L = normalize(lPos[i] - vP); sp += pow(max(dot(N, normalize(L + Vd)), 0.0), 24.0) * 0.08; }
      col += cIvory * sp * (1.0 - m) * vShade;
      if (uDisco > 0.001) {
        vec3 Rf = reflect(-Vd, N);
        vec3 ch = mix(vec3(0.03,0.03,0.04), vec3(0.22,0.22,0.26), Rf.y*0.5 + 0.5) + vec3(0.45,0.46,0.5)*(0.35 + 0.4*max(dot(N, keyDir), 0.0));
        for (int i = 0; i < 3; i++) { vec3 L = normalize(lPos[i] - vP); ch += lColD[i] * pow(max(dot(Rf, L), 0.0), 90.0) * 2.2; }
        ch *= 0.94 + 0.06*fine;
        vec3 ce = mix(ch, vec3(0.02), m) + cIvory * max(e, 0.0) * 0.4;
        col = mix(col, ce * vShade, uDisco);
      }
      gl_FragColor = vec4(col, 1.0);
    }`
});
const LOGO_CENTERS = [new V(0,1,0), new V(0,-1,0), new V(1,0,0), new V(-1,0,0)];
const LOGO_UPS     = [new V(0,0,-1), new V(0,0,1), new V(0,1,0), new V(0,1,0)];   // reads upright when you roll that side toward you

/* ---------- the "always fits" ball: N reels -> N flat shards, plus the four logo clusters ---------- */
function fib(N){
  const pts = [], ga = Math.PI*(3-Math.sqrt(5));
  for (let i=0;i<N;i++){ const y = 1-2*(i+0.5)/N, r = Math.sqrt(1-y*y), th = ga*i; pts.push(new V(Math.cos(th)*r, -Math.sin(th)*r, y)); }   // spiral pole faces the viewer
  return pts;
}
function clip(poly, a, b, c){
  const out = [], n = poly.length;
  for (let k=0;k<n;k++){
    const P = poly[k], Q = poly[(k+1)%n];
    const fp = a*P[0]+b*P[1]-c, fq = a*Q[0]+b*Q[1]-c;
    if (fp <= 0) out.push(P);
    if ((fp <= 0) !== (fq <= 0)) { const t = fp/(fp-fq); out.push([P[0]+(Q[0]-P[0])*t, P[1]+(Q[1]-P[1])*t]); }
  }
  return out;
}
function computeCells(pts){
  const N = pts.length, out = [], dots = new Float32Array(N), idx = [...Array(N).keys()];
  for (let i=0;i<N;i++){
    const p = pts[i];
    const ref = Math.abs(p.y) > 0.999 ? new V(1,0,0) : new V(0,1,0);
    const e1 = new V().crossVectors(ref, p).normalize(), e2 = new V().crossVectors(p, e1);
    for (let j=0;j<N;j++) dots[j] = p.dot(pts[j]);
    const order = idx.slice().sort((a,b) => dots[b]-dots[a]);
    let poly = [[-2,-2],[2,-2],[2,2],[-2,2]];
    for (let k=1;k<Math.min(30,N);k++){
      const q = pts[order[k]], dx = q.x-p.x, dy = q.y-p.y, dz = q.z-p.z;
      poly = clip(poly, dx*e1.x+dy*e1.y+dz*e1.z, dx*e2.x+dy*e2.y+dz*e2.z, 1-dots[order[k]]);
    }
    const sv = poly.map(([u,v]) => p.clone().addScaledVector(e1,u).addScaledVector(e2,v).normalize());
    let h = 0; for (const s of sv) h += s.dot(p); h /= sv.length;
    const center = p.clone().multiplyScalar(h), verts = [], loc = []; let R = 0;
    for (const s of sv){ const f = s.clone().multiplyScalar(h/s.dot(p)), d = f.clone().sub(center);
      const u = d.dot(e1), v = d.dot(e2); R = Math.max(R, Math.hypot(u,v)); verts.push(f); loc.push([u,v]); }
    out.push({ p, e1, e2, h, center, verts, loc, R, sv });
  }
  return out;
}
function cellCentroid(c){
  const s = new V(), n = c.verts.length;
  for (let k=0;k<n;k++){ const a = c.center, b = c.verts[k], d = c.verts[(k+1)%n];
    const area = new V().subVectors(b,a).cross(new V().subVectors(d,a)).length();
    s.addScaledVector(new V().add(a).add(b).add(d), area); }
  return s.normalize();
}
// seeds: 7 fixed per logo cluster (a centre + a ring of 6), N reel seeds spread over the rest, then relaxed so every shard is even
function makeSeeds(N){
  const T = N + 28, d = Math.sqrt(8*Math.PI/(Math.sqrt(3)*T));
  const logo = [];
  LOGO_CENTERS.forEach((C, k) => {
    const e2 = LOGO_UPS[k], e1 = new V().crossVectors(e2, C);
    logo.push({ p: C.clone(), k });
    for (let j=0;j<6;j++){ const a = j*Math.PI/3 + Math.PI/6, dir = e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      logo.push({ p: C.clone().multiplyScalar(Math.cos(d)).addScaledVector(dir, Math.sin(d)).normalize(), k }); }
  });
  const excl = Math.cos(1.5*d), near = p => Math.max(...LOGO_CENTERS.map(C => p.dot(C)));
  let pts;
  for (let M = N; ; M++){ pts = fib(M).filter(p => near(p) < excl); if (pts.length >= N) break; }
  while (pts.length > N){ let bi = 0, bv = -2; pts.forEach((p,i) => { const v = near(p); if (v > bv) { bv = v; bi = i; } }); pts.splice(bi, 1); }
  for (let it=0; it<14; it++){
    const cells = computeCells([...pts, ...logo.map(l => l.p)]);
    for (let i=0;i<N;i++) pts[i] = cellCentroid(cells[i]);
  }
  return { pts, logo };
}

const GROUT = 0.905;          // fraction of each cell the tile fills; the rest is grout
const BEVEL = 0.09;           // bevel width, as a fraction of a reel tile's size
const BEVEL_DROP = 0.007;     // how far the bevel rolls down at the tile edge
const SOIL_R = 1.0, LIP = 0.0045;
let logoTri = [];
let count = 0, cellsData = [], logoInfo = [], logoTiles = [], ballMesh = null, logoMesh = null, soilMesh = null, triShard = null, reelR = 0.17;
let reels = [];                                      // the feed, newest first: reels[i] is tile i
// reel shape: { id (YouTube video id), duration (seconds, or null if unknown), cover, w, h }  (or { ph: n } for a prototype placeholder)
const jitter = (seed, k) => { const r = mulberry32(seed*131 + k*7 + 3); return (r()-0.5)*0.03; };   // uneven grout = hand-laid

// merge each 7-cell logo cluster into ONE tile: trace the outline of the cluster
function logoTile(k){
  const cells = cellsData.filter((c, i) => i >= count && logoInfo[i-count].k === k);
  const canon = [], id = v => { for (let j=0;j<canon.length;j++) if (canon[j].distanceToSquared(v) < 4e-6) return j; canon.push(v.clone()); return canon.length-1; };
  const edges = [], seen = new Map();
  cells.forEach(c => { const n = c.sv.length; for (let j=0;j<n;j++){ const a = id(c.sv[j]), b = id(c.sv[(j+1)%n]); if (a === b) continue;
    edges.push([a,b]); const u = a<b ? a+'|'+b : b+'|'+a; seen.set(u, (seen.get(u)||0)+1); } });
  const bnd = edges.filter(([a,b]) => seen.get(a<b ? a+'|'+b : b+'|'+a) === 1), next = new Map(bnd.map(e => [e[0], e[1]]));
  const loop = []; let cur = bnd[0][0];
  for (let g=0; g<bnd.length+1; g++){ loop.push(canon[cur].clone().normalize()); cur = next.get(cur); if (cur === undefined || cur === bnd[0][0]) break; }
  const C = LOGO_CENTERS[k], e2 = LOGO_UPS[k], e1 = new V().crossVectors(e2, C);
  let h = 0; loop.forEach(s => h += s.dot(C)); h /= loop.length;
  const center = C.clone().multiplyScalar(h), verts = [], loc = []; let R = 0;
  loop.forEach(s => { const f = s.clone().multiplyScalar(h/s.dot(C)), d = f.clone().sub(center); const u = d.dot(e1), v = d.dot(e2); R = Math.max(R, Math.hypot(u,v)); verts.push(f); loc.push([u,v]); });
  return { p: C.clone(), e1, e2, h, center, verts, loc, R, sv: loop, logo: k };
}

// one tile = flat polished top + a bevel that rolls down into the soil; plus its collar of mud
function tileParts(c, seed){
  const n = c.verts.length, scale = reelR / c.R;
  const ins = c.verts.map((_, k) => 1 - (1-GROUT)*scale + jitter(seed, k)*scale);
  const bev = 1 - BEVEL*scale;
  const O = c.verts.map((f, k) => c.center.clone().lerp(f, ins[k]).addScaledVector(c.p, -BEVEL_DROP));
  const I = c.verts.map((f, k) => c.center.clone().lerp(f, ins[k]*bev));
  const LO = c.loc.map((l, k) => [l[0]*ins[k], l[1]*ins[k]]), LI = c.loc.map((l, k) => [l[0]*ins[k]*bev, l[1]*ins[k]*bev]);
  return { n, O, I, LO, LI };
}
function pushTri(B, a, b, d, nA, nB, nD, uA, uB, uD, sA, sB, sD){
  for (const [P, N, U, S] of [[a,nA,uA,sA],[b,nB,uB,sB],[d,nD,uD,sD]]){ B.pos.push(P.x,P.y,P.z); B.nor.push(N.x,N.y,N.z); B.uv.push(U[0],U[1]); B.sh.push(S); }
}
const newBuf = () => ({ pos: [], nor: [], uv: [], sh: [], owner: [] });
function tileInto(B, c, parts, uvFor, owner, lift=1){
  const { n, O, I, LO, LI } = parts, L = v => lift === 1 ? v : v.clone().multiplyScalar(lift), cen = L(c.center), z = uvFor([0,0]);
  for (let k=0;k<n;k++){
    const k2 = (k+1)%n;
    pushTri(B, cen, L(I[k]), L(I[k2]), c.p, c.p, c.p, z, uvFor(LI[k]), uvFor(LI[k2]), 1, 0.93, 0.93); B.owner.push(owner);
    // bevel quad, facet normal tilted outward so it catches light like a real ground edge
    let nrm = new V().subVectors(O[k], I[k]).cross(new V().subVectors(I[k2], I[k])).normalize(); if (nrm.dot(c.p) < 0) nrm.negate();
    pushTri(B, L(I[k]), L(O[k]), L(O[k2]), nrm, nrm, nrm, uvFor(LI[k]), uvFor(LO[k]), uvFor(LO[k2]), 0.88, 0.62, 0.62); B.owner.push(owner);
    pushTri(B, L(I[k]), L(O[k2]), L(I[k2]), nrm, nrm, nrm, uvFor(LI[k]), uvFor(LO[k2]), uvFor(LI[k2]), 0.88, 0.62, 0.88); B.owner.push(owner);
  }
}
function collarInto(B, c, parts){
  // mud rises from the tile's edge into a little lip, then settles to meet the neighbour's collar
  const { n, O } = parts;
  const ring = k => {
    const T = O[k], B0 = c.sv[k].clone().multiplyScalar(SOIL_R);
    const M = T.clone().normalize().lerp(c.sv[k], 0.35).normalize().multiplyScalar(Math.max(T.length(), SOIL_R) + LIP);
    const out = c.sv[k].clone().sub(c.p.clone().multiplyScalar(c.sv[k].dot(c.p))).normalize();
    return { T, M, B: B0, nT: T.clone().normalize().addScaledVector(out, -0.9).normalize(), nM: M.clone().normalize(), nB: B0.clone().normalize().addScaledVector(out, 0.25).normalize() };
  };
  const R = [...Array(n)].map((_, k) => ring(k)), z = [0,0];
  for (let k=0;k<n;k++){
    const a = R[k], b = R[(k+1)%n];
    pushTri(B, a.T, a.M, b.M, a.nT, a.nM, b.nM, z, z, z, 0.32, 1, 1);
    pushTri(B, a.T, b.M, b.T, a.nT, b.nM, b.nT, z, z, z, 0.32, 1, 0.32);
    pushTri(B, a.M, a.B, b.B, a.nM, a.nB, b.nB, z, z, z, 1, 0.85, 0.85);
    pushTri(B, a.M, b.B, b.M, a.nM, b.nB, b.nM, z, z, z, 1, 0.85, 1);
  }
}
function toMesh(B, mat){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv,2));
  g.setAttribute('aShade', new THREE.Float32BufferAttribute(B.sh,1));
  g.computeBoundingSphere();
  return new THREE.Mesh(g, mat);
}


// Find the biggest logo that fits this slab's own outline, with clear space all round
// (brand rule: at least the height of "THE" ≈ 15% of the logo's height on every side), and centre it in that shape.
function fitLogo(poly){
  const inside = (x, y) => { let c = false; for (let i=0, j=poly.length-1; i<poly.length; j=i++){ const [xi,yi] = poly[i], [xj,yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) c = !c; } return c; };
  const CLEAR = 0.15, aspPad = (LOGO_ASPECT + 2*CLEAR) / (1 + 2*CLEAR);   // padded box (logo + clear space) proportions
  const fits = (cx, cy, hh) => {
    const hw = hh*aspPad, xs = [cx-hw, cx+hw], ys = [cy-hh, cy+hh];
    for (const x of xs) for (const y of ys) if (!inside(x, y)) return false;
    for (const [px,py] of poly) if (px > xs[0] && px < xs[1] && py > ys[0] && py < ys[1]) return false;
    for (let t=0.25; t<1; t+=0.25){ if (!inside(xs[0]+(xs[1]-xs[0])*t, ys[0]) || !inside(xs[0]+(xs[1]-xs[0])*t, ys[1]) || !inside(xs[0], ys[0]+(ys[1]-ys[0])*t) || !inside(xs[1], ys[0]+(ys[1]-ys[0])*t)) return false; }
    return true;
  };
  const best = (cx, cy) => { let lo = 0, hi = 2; for (let i=0;i<24;i++){ const m = (lo+hi)/2; if (fits(cx, cy, m)) lo = m; else hi = m; } return lo; };
  // centre = the shape's own centre of mass, so it reads centred whatever the outline; then grow the logo as big as fits
  let A = 0, gx = 0, gy = 0;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){ const [x0,y0] = poly[j], [x1,y1] = poly[i], cr = x0*y1 - x1*y0; A += cr; gx += (x0+x1)*cr; gy += (y0+y1)*cr; }
  const bx = gx/(3*A), by = gy/(3*A), bh = best(bx, by);
  // the logo itself is the padded box minus its clear space
  const logoH = 2*bh / (1 + 2*CLEAR), logoW = logoH * LOGO_ASPECT;
  return { cx: bx, cy: by, w: logoW, h: logoH };
}

function buildBall(){
  reelR = 0; for (let i=0;i<count;i++) reelR += cellsData[i].R; reelR /= count;
  logoTiles = [0,1,2,3].map(logoTile);
  const reelB = newBuf(), logoB = newBuf(), soilB = newBuf();
  for (let i=0;i<count;i++){
    const c = cellsData[i], parts = tileParts(c, i); c.parts = parts;
    const gx = i%CELLS, gy = Math.floor(i/CELLS);          // tile i samples atlas cell i
    tileInto(reelB, c, parts, L => { const uu = 0.5+L[0]/(2*c.R), vv = 0.5+L[1]/(2*c.R);
      return [(gx*CS+PAD+uu*(CS-2*PAD))/ATLAS, 1-(gy*CS+PAD+(1-vv)*(CS-2*PAD))/ATLAS]; }, i);
    collarInto(soilB, c, parts);
  }
  logoTiles.forEach((c, k) => { c.parts = tileParts(c, 900+k); c.fit = fitLogo(c.parts.LI); });
  // every side shows the logo at the SAME size: the largest that fits all four slabs, each centred in its own shape
  const LOGO_SCALE = 1.2;   // +20% over the strict clear-space fit
  const logoH = Math.min(...logoTiles.map(c => c.fit.h)) * LOGO_SCALE, logoW = logoH * LOGO_ASPECT;
  logoTiles.forEach((c, k) => {
    const parts = c.parts, r = { cx: c.fit.cx, cy: c.fit.cy, w: logoW, h: logoH };
    tileInto(logoB, c, parts, L => [(L[0]-r.cx)/r.w + 0.5, (L[1]-r.cy)/r.h + 0.5], k);
    collarInto(soilB, c, parts);
  });
  // The dark core only exists so no crack ever shows daylight. Flat tiles sit BELOW the unit sphere (a big tile's face is
  // lower at its middle than at its corners), so on a ball with fewer/larger tiles a fixed-size core pokes through the
  // flattest tile as a black dot. Size it to stay under every tile face.
  const minFace = Math.min(...logoTiles.map(c => c.center.length()), ...cellsData.slice(0, count).map(c => c.center.length()));
  inner.scale.setScalar(Math.min(1, (minFace - 0.02) / 0.86));
  triShard = reelB.owner;
  [ballMesh, logoMesh, soilMesh].forEach(m => { if (m) { ball.remove(m); m.geometry.dispose(); } });
  logoTri = logoB.owner;
  ballMesh = toMesh(reelB, shardMat); logoMesh = toMesh(logoB, logoMat); soilMesh = toMesh(soilB, soilMat);
  ball.add(ballMesh, logoMesh, soilMesh);
}

/* ---------- playback happens inside the shard itself ---------- */
let playing = null;                                       // { i, reel, mesh, ring, cv, ctx, tex, cover }
const PLAY_PX = 512;

function shardGeometry(c, lift){
  const B = newBuf();
  tileInto(B, c, c.parts, L => [0.5 + L[0]/(2*c.R*GROUT), 0.5 + L[1]/(2*c.R*GROUT)], 0, lift);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv,2));
  return g;
}

function attachPlaying(){
  if (!playing) return;
  const i = playing.i;
  if (i < 0 || i >= count) { stop(); return; }
  const c = cellsData[i];
  if (playing.mesh) { ball.remove(playing.mesh, playing.ring); playing.mesh.geometry.dispose(); playing.ring.geometry.dispose(); }
  playing.mesh = new THREE.Mesh(shardGeometry(c, 1.0015), playing.mat);
  playing.ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(c.parts.O.map(v => v.clone().multiplyScalar(1.004))), playing.ringMat);
  playing.mesh.userData.shard = i;
  ball.add(playing.mesh, playing.ring);
}

function play(i){
  if (i >= count) return;                                  // logo tiles don't play
  if (playing && playing.i === i) { stop(); return; }    // double-tap the playing shard again = stop
  stop();
  discoAudio.stop();                                       // a reel takes over from the disco loop (the loop doesn't come back on its own)
  const reel = reels[i];
  // The tile first shows its own cover (so there's never a blank while the player loads), then the video fades in over it.
  // Placeholder reels (prototype fallback only) have no video: they keep the old animated stand-in.
  const cover = document.createElement('canvas');
  if (reel.img) { cover.width = reel.img.naturalWidth; cover.height = reel.img.naturalHeight; cover.getContext('2d').drawImage(reel.img, 0, 0); }
  else {
    const info = reelInfo(reel.ph !== undefined ? reel.ph : i), cw = info.wide ? 768 : 432, ch = info.wide ? 432 : 768;
    cover.width = cw; cover.height = ch; drawCover(cover.getContext('2d'), cw, ch, info, false);
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = PLAY_PX;
  const tex = new THREE.CanvasTexture(cv);
  playing = { i, reel, cover, cv, ctx: cv.getContext('2d'), tex, last: -1, t0: clock.elapsedTime,
    mat: new THREE.MeshBasicMaterial({ map: tex }),
    ringMat: new THREE.LineBasicMaterial({ color: BRAND.amber, transparent: true }) };
  attachPlaying();
  faceShard(i);
  if (reel.ph === undefined) { drawStatic(playing); ytStart(playing); }
}
function stop(){
  if (!playing) return;
  ytStop(playing);
  ball.remove(playing.mesh, playing.ring);
  playing.mesh.geometry.dispose(); playing.ring.geometry.dispose();
  playing.mat.dispose(); playing.ringMat.dispose(); playing.tex.dispose();
  playing = null;
}

// placeholder "video": the clip's frame, cropped to fill the shard, with motion so it reads as playing
function drawPlaying(time){
  const p = playing, ctx = p.ctx, S = PLAY_PX, t = time - p.t0;
  const cw = p.cover.width, ch = p.cover.height, side = Math.min(cw, ch);
  const z = 1.08 + 0.06*Math.sin(t*0.35), crop = side/z;
  const sx = (cw-crop)/2, sy = (ch-crop)/2;   // always dead-center; the shard is the mask
  ctx.drawImage(p.cover, sx, sy, crop, crop, 0, 0, S, S);
  const g = ctx.createLinearGradient(0, S*0.55, 0, S); g.addColorStop(0,'rgba(5,3,9,0)'); g.addColorStop(1,'rgba(5,3,9,.8)');
  ctx.fillStyle = g; ctx.fillRect(0, S*0.55, S, S*0.45);
  const bars = 9, bw = S*0.035, gap = S*0.02, bx = (S-(bars*bw+(bars-1)*gap))/2, by = S*0.8;
  ctx.fillStyle = '#ff3fa4';
  for (let k=0;k<bars;k++){ const a = 0.2+0.8*Math.abs(Math.sin(t*2.7+k*1.3)*Math.cos(t*1.1+k*0.7)); const bh = a*S*0.12; ctx.fillRect(bx+k*(bw+gap), by-bh, bw, bh); }
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(S*0.25, S*0.86, S*0.5, S*0.012);
  ctx.fillStyle = '#ffb02e'; ctx.fillRect(S*0.25, S*0.86, S*0.5*((t/24)%1), S*0.012);
  p.tex.needsUpdate = true;
}

/* ---------- YouTube playback, masked by the tile ---------- */
// The player is a normal YouTube embed rendered at 640x360 in a layer ABOVE the canvas. Every frame it is mapped onto the
// playing tile's plane with a perspective transform (the same camera + ball rotation as the WebGL scene), and clipped to
// the tile's outline — so the video turns with the ball, is centred on the tile, and the shard is the mask. It never grows
// or lifts off. While playing it takes no pointer events, so you can still grab and spin the ball from a playing tile.
// Starts at a random point inside the video (its length is in reels.json) so there's never a slow intro to sit through.
const YT_W = 640, YT_H = 360;
const ytLayer = $('yt-layer');
let ytApi = null;
function loadYT(){
  if (!ytApi) ytApi = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
    const el = document.createElement('script'); el.src = 'https://www.youtube.com/iframe_api'; el.async = true;
    el.onerror = () => { ytApi = null; reject(new Error('YouTube player API failed to load')); };
    document.head.appendChild(el);
  });
  return ytApi;
}
// The 3x3 projective transform taking the box's 4 corners — (0,0) (W,0) (W,H) (0,H) — to 4 screen points, as a CSS matrix3d.
function quadMatrix(W, H, q){
  const src = [[0,0],[W,0],[W,H],[0,H]], A = [], b = [];
  for (let k = 0; k < 4; k++){
    const [x, y] = src[k], [X, Y] = q[k];
    A.push([x, y, 1, 0, 0, 0, -x*X, -y*X, X]); A.push([0, 0, 0, x, y, 1, -x*Y, -y*Y, Y]);
  }
  for (let c = 0; c < 8; c++){                                   // Gauss-Jordan with partial pivoting
    let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
    [A[c], A[m]] = [A[m], A[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  const h = A.map((row, r) => row[8] / row[r]);
  return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;
}
// The reel's own cover, centre-cropped to the tile, held still (the video replaces it once it's playing)
function drawStatic(p){
  const ctx = p.ctx, S = PLAY_PX, cw = p.cover.width, ch = p.cover.height, side = Math.min(cw, ch);
  ctx.drawImage(p.cover, (cw-side)/2, (ch-side)/2, side, side, 0, 0, S, S);
  p.tex.needsUpdate = true;
}
function ytStart(p){
  const reel = p.reel, c = cellsData[p.i], LO = c.parts.LO;
  // the smallest 16:9 box, centred on the tile's outline, that covers it — in the tile's own (u,v) units
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  LO.forEach(([u, v]) => { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, Ht = Math.max(v1 - v0, (u1 - u0) * 9 / 16) * 1.04, Wt = Ht * 16 / 9, k = YT_H / Ht;
  const frame = document.createElement('div'); frame.className = 'yt-frame';
  // clip to the tile's outline (a hair inside, so the amber ring stays visible around the video)
  frame.style.clipPath = 'polygon(' + LO.map(([u, v]) => `${(YT_W/2 + (u*0.985 - uc)*k).toFixed(1)}px ${(YT_H/2 - (v*0.985 - vc)*k).toFixed(1)}px`).join(',') + ')';
  ytLayer.appendChild(frame);
  const y = p.yt = { frame, uc, vc, Wt, Ht, player: null, played: false, blocked: false, show: false, timer: 0 };
  const dur = reel.duration;
  const randomStart = d => Math.floor(Math.random() * Math.max(1, d - Math.min(60, d * 0.4)));   // always leaves room to play
  loadYT().then(YT => {
    if (playing !== p) return;                                 // tapped away while the API was loading
    const holder = document.createElement('div'); frame.appendChild(holder);
    y.player = new YT.Player(holder, {
      width: YT_W, height: YT_H, videoId: reel.id,
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0,
                    start: dur ? randomStart(dur) : 0, origin: location.origin },
      events: {
        onReady: e => {
          e.target.playVideo();
          y.timer = setTimeout(() => { if (!y.played) ytBlocked(p); }, 2500);   // nothing started: the browser refused sound-on autoplay
        },
        onAutoplayBlocked: () => ytBlocked(p),
        onStateChange: e => {
          if (playing !== p) return;
          if (e.data === 1) {                                   // PLAYING
            if (!y.played) {
              y.played = true; clearTimeout(y.timer);
              const d = e.target.getDuration();
              if (!dur && d > 90) e.target.seekTo(randomStart(d), true);   // length wasn't in the feed: pick the spot now
            }
            y.blocked = false; y.show = true;
          } else if (e.data === 0) stop();                      // ENDED
        },
        onError: e => { console.warn('[disco] video unavailable (YouTube error ' + e.data + ')'); if (playing === p) stop(); }
      }
    });
  }).catch(err => console.warn('[disco]', err.message));
}
// The browser wouldn't start the video with sound from a tap on OUR page. Don't fight the player: show it, and let the tap
// land on YouTube's own play button (the whole tile is the target). Once it's playing it goes back to ignoring touches.
function ytBlocked(p){ const y = p.yt; if (!y || y.played) return; y.blocked = true; y.show = true; }
function ytStop(p){
  const y = p.yt; if (!y) return;
  clearTimeout(y.timer);
  try { if (y.player) y.player.destroy(); } catch (_) {}
  y.frame.remove(); p.yt = null;
}
function ytPlace(){
  const p = playing; if (!p || !p.yt) return;
  const y = p.yt, c = cellsData[p.i], f = y.frame, W = innerWidth, H = innerHeight;
  ball.updateMatrixWorld();
  const pt = (u, v) => { const w = c.center.clone().addScaledVector(c.e1, u).addScaledVector(c.e2, v).applyMatrix4(ball.matrixWorld).project(camera); return [(w.x + 1) / 2 * W, (1 - w.y) / 2 * H]; };
  const q = [pt(y.uc - y.Wt/2, y.vc + y.Ht/2), pt(y.uc + y.Wt/2, y.vc + y.Ht/2), pt(y.uc + y.Wt/2, y.vc - y.Ht/2), pt(y.uc - y.Wt/2, y.vc - y.Ht/2)];
  f.style.transform = quadMatrix(YT_W, YT_H, q);
  // facing: fade out as the tile turns away. Behind the ball it's invisible but keeps playing (audio carries on).
  const facing = c.p.clone().transformDirection(ball.matrixWorld).dot(camera.position.clone().sub(c.center.clone().applyMatrix4(ball.matrixWorld)).normalize());
  const vis = y.show ? Math.min(1, Math.max(0, (facing - 0.06) / 0.2)) : 0;
  f.style.opacity = vis.toFixed(3);
  f.style.pointerEvents = (y.blocked && vis > 0.5) ? 'auto' : 'none';
}

/* ---------- ball rotation ---------- */
const omega = new V(), qTmp = new THREE.Quaternion(), DRIFT = new V(0.04, 0.15, 0);
let faceAnim = null, lastInteract = performance.now();
function facePoint(p, up, instant=false){
  // turn the ball so local point p looks straight at the camera, with local direction `up` pointing up on screen
  const toCam = camera.position.clone().normalize();
  const n = p.clone().applyQuaternion(ball.quaternion);
  const to = new THREE.Quaternion().setFromUnitVectors(n, toCam).multiply(ball.quaternion.clone());
  const flat = v => v.clone().addScaledVector(toCam, -v.dot(toCam)).normalize();
  const have = flat(up.clone().applyQuaternion(to)), want = flat(new V(0,1,0).applyMatrix4(new THREE.Matrix4().extractRotation(camera.matrixWorld)));
  const ang = Math.atan2(new V().crossVectors(have, want).dot(toCam), have.dot(want));
  to.premultiply(new THREE.Quaternion().setFromAxisAngle(toCam, ang));
  omega.set(0,0,0);
  if (instant) { ball.quaternion.copy(to); faceAnim = null; }
  else faceAnim = { from: ball.quaternion.clone(), to, t: 0 };
  return to;
}
function faceLogo(k, instant=false){ facePoint(LOGO_CENTERS[k], LOGO_UPS[k], instant); }
function faceShard(i, instant=false){
  return facePoint(cellsData[i].p, cellsData[i].e2, instant);
}

/* ---------- feed: the ball is cut to however many reels the account has ---------- */
// Reads the reel list the server keeps in sync with Instagram (reels.json), fresh on every page load. Newest first.
// The ball re-cuts itself to however many reels come back.
async function loadFeed(){
  try {
    const res = await fetch(CONFIG.feed, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = (data.reels || []).filter(r => r && r.id);
    if (!list.length) throw new Error('reels.json has no reels');
    return list;
  } catch (err) {
    console.warn('[disco] feed unavailable:', err.message);
    // Until the Instagram feed is connected: 130 placeholder reels so the page still works.
    if (CONFIG.placeholderFallback) return Array.from({ length: 130 }, (_, k) => ({ ph: 130 - k }));
    return [];
  }
}

function setReels(list){
  reels = list; count = list.length;
  setupAtlas(count);
  const { pts, logo } = makeSeeds(count);
  logoInfo = logo;
  cellsData = computeCells([...pts, ...logo.map(l => l.p)]);
  buildBall();
  attachPlaying();
  loadCovers();
}

/* ---------- default disco loop ---------- */
// Plays when disco mode starts with nothing else playing. Until Jace's own loop arrives this is a PLACEHOLDER that is
// synthesized live (no audio file): 120 BPM four-on-the-floor kick, claps on 2 & 4, open + 16th hats, octave-bounce bass
// and off-beat chord stabs over Am7 - Dm7 - G7 - Cmaj7 (two bars each = an 8-bar loop).
// TO SWAP IN THE REAL LOOP: drop the file next to index.html and set `discoLoop: 'your-loop.mp3'` in DISCO_CONFIG.
// It is decoded once and looped sample-accurately; the synth is not used at all then.
const discoAudio = (() => {
  let ctx = null, run = null, noise = null, filePromise = null;
  const BPM = 120, STEP = 60 / BPM / 4, MAKEUP = 7;   // MAKEUP: synth is pushed as loud as it can go cleanly (see start())
  const ROOTS  = [55.0, 73.42, 49.0, 65.41];
  const CHORDS = [[220, 261.63, 329.63, 392], [293.66, 349.23, 440, 523.25], [196, 246.94, 293.66, 349.23], [261.63, 329.63, 392, 493.88]];

  // Browsers only allow audio after a user gesture, so this is called from every pointer-up (and again right when disco starts).
  function unlock(){
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (CONFIG.discoLoop && !filePromise) filePromise = fetch(CONFIG.discoLoop).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).catch(e => { console.warn('[disco] loop file failed:', e.message); return null; });
    } catch (_) {}
  }
  const noiseBuf = () => {
    if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return noise;
  };
  const env = (g, t, peak, attack, decay) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay); };

  function kick(out, t){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.13);
    env(g, t, 1.0, 0.004, 0.36); o.connect(g).connect(out); o.start(t); o.stop(t + 0.5);
  }
  function burst(out, t, type, freq, q, peak, decay){
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    env(g, t, peak, 0.002, decay); s.connect(f).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + decay + 0.05);
  }
  const clap = (out, t) => { burst(out, t, 'bandpass', 1500, 0.9, 0.5, 0.2); burst(out, t + 0.011, 'bandpass', 1900, 0.9, 0.4, 0.12); };
  function bass(out, t, f, len){
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    lp.type = 'lowpass'; lp.Q.value = 5; lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(260, t + len);
    env(g, t, 0.55, 0.006, len); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + len + 0.1);
  }
  function stab(out, t, notes){
    notes.forEach((f, i) => [-6, 6].forEach(det => {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det + i;
      lp.type = 'lowpass'; lp.frequency.value = 2400;
      env(g, t, 0.05, 0.004, 0.16); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + 0.25);
    }));
  }
  function step(out, n, t){
    const s = n % 16, bar = Math.floor(n / 16) % 8, chord = Math.floor(bar / 2);
    if (s % 4 === 0) kick(out, t);                                   // four on the floor
    if (s === 4 || s === 12) clap(out, t);                           // 2 and 4
    if (s % 4 === 2) burst(out, t, 'highpass', 7000, 0.7, 0.16, 0.14);       // open hat on the off-beat
    else if (s % 2 === 1) burst(out, t, 'highpass', 8500, 0.7, 0.07, 0.04); // closed 16ths
    if (s % 2 === 0) bass(out, t, ROOTS[chord] * ((s / 2) % 2 ? 2 : 1), STEP * 1.7);   // octave bounce
    if (s % 4 === 2) stab(out, t, CHORDS[chord]);                    // chord stab on the "and" of each beat
  }

  function start(){
    unlock(); if (!ctx || run) return;
    // There is deliberately NO volume setting here: the listener's own device volume is the only volume control.
    // `master` only fades in/out and always settles at exactly 1.0. The synth is made as loud as it can be without
    // distorting (makeup gain -> compressor -> limiter -> a clamp that only ever touches overshoot). A real loop file is
    // played completely untouched at unity gain, exactly as it was mastered.
    const master = ctx.createGain(), nodes = [master];
    master.gain.setValueAtTime(0.0001, ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, 0.25);   // gentle fade-in
    if (CONFIG.discoLoop) master.connect(ctx.destination);
    else {
      const makeup = ctx.createGain(); makeup.gain.value = MAKEUP;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 6; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.12;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.05;
      const guard = ctx.createWaveShaper(); guard.curve = new Float32Array([-0.97, 0.97]);      // linear; only catches a stray overshoot
      master.connect(makeup).connect(comp).connect(lim).connect(guard).connect(ctx.destination);
      nodes.push(makeup, comp, lim, guard);
    }
    const r = run = { master, nodes, timer: 0, src: null };
    if (CONFIG.discoLoop) {
      filePromise.then(buf => {
        if (run !== r || !buf) return;
        r.src = ctx.createBufferSource(); r.src.buffer = buf; r.src.loop = true; r.src.connect(master); r.src.start();
      });
    } else {
      let n = 0, next = ctx.currentTime + 0.06;
      r.timer = setInterval(() => { while (next < ctx.currentTime + 0.25) { step(master, n++, next); next += STEP; } }, 50);
    }
  }
  function stop(){
    if (!run) return;
    const r = run; run = null;
    clearInterval(r.timer);
    r.master.gain.cancelScheduledValues(ctx.currentTime); r.master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);   // quick fade, no click
    setTimeout(() => { try { if (r.src) r.src.stop(); r.nodes.forEach(n => n.disconnect()); } catch (_) {} }, 600);
  }
  return { unlock, start, stop };
})();

/* ---------- disco mode ---------- */
const MAX_SPIN = 30, DISCO_SPIN = new V(0, 0.9, 0);
let disco = 0, discoTarget = 0, streak = 0, lastFlick = 0;
const lastFlickDir = new V();
// Called on every qualifying flick past the 7th, so only the first one (off -> on) starts the loop, and only if no reel is
// playing. If a reel is already playing it keeps playing and only the room changes. The loop never restarts by itself
// after a reel takes over — it takes another full disco activation.
function enterDisco(){ if (discoTarget === 0 && !playing) discoAudio.start(); discoTarget = 1; }
// double-tap a logo: the page's reset — stop any reel, stop the disco loop, leave disco, stop the spin, face that logo square-on
function resetAll(k){ stop(); discoAudio.stop(); discoTarget = 0; streak = 0; omega.set(0,0,0); faceLogo(k); }
// light beams sweeping down from the ceiling (only visible in disco)
const beams = new THREE.Group(); scene.add(beams);
NEON_COLS.concat([new THREE.Color(0xffffff)]).forEach((col, i) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(1.5, 10, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.geometry.translate(0, -5, 0);                 // pivot at the top of the cone
  const g = new THREE.Group(); g.position.set(-4.5 + i*3, 7, -2 + (i%2)*1.5); g.add(m); g.userData.phase = i*1.7; beams.add(g);
});

/* ---------- input: drag-spin, fling, double-tap, pinch, wheel ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y){
  ndc.set(x/innerWidth*2-1, -(y/innerHeight)*2+1); ray.setFromCamera(ndc, camera);
  const objs = [ballMesh, logoMesh, soilMesh, inner].filter(Boolean); if (playing && playing.mesh) objs.unshift(playing.mesh);
  const hits = ray.intersectObjects(objs, false);
  if (!hits.length) return null;
  const h = hits[0];
  if (h.object === ballMesh) return { type: 'shard', index: triShard[h.faceIndex] };
  if (h.object === logoMesh) return { type: 'logo', k: logoTri[h.faceIndex] };
  if (playing && h.object === playing.mesh) return { type: 'shard', index: h.object.userData.shard };
  return { type: 'ball' };
}
const pointers = new Map();
let dragging = false, down = null, lastMove = null, pinch = null, lastTap = null;
function radiusPx(){ return (innerHeight/2)/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/camDist; }

canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  lastInteract = performance.now();
  if (pointers.size === 2) {
    const [a,b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x-b.x, a.y-b.y), start: camDistTarget, ang: Math.atan2(b.y-a.y, b.x-a.x) }; dragging = false; down = null; omega.set(0,0,0); faceAnim = null; return;
  }
  if (pointers.size > 2) return;
  down = { x: e.clientX, y: e.clientY, t: performance.now(), hit: pick(e.clientX, e.clientY), moved: false, spinBefore: omega.clone() };
  lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
  dragging = true; omega.set(0,0,0); faceAnim = null; canvas.classList.add('grabbing');
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  lastInteract = performance.now();
  if (pinch && pointers.size === 2) {
    const [a,b] = [...pointers.values()];
    camDistTarget = clampDist(pinch.start * pinch.d / Math.max(10, Math.hypot(a.x-b.x, a.y-b.y)));
    const ang = Math.atan2(b.y-a.y, b.x-a.x); let dA = ang - pinch.ang; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); pinch.ang = ang;
    qTmp.setFromAxisAngle(camera.position.clone().normalize(), -dA); ball.quaternion.premultiply(qTmp);   // twist, like turning a dial
    return;
  }
  if (!down || !dragging) return;
  if (Math.hypot(e.clientX-down.x, e.clientY-down.y) > 7) down.moved = true;
  const now = performance.now(), dx = e.clientX-lastMove.x, dy = e.clientY-lastMove.y, len = Math.hypot(dx,dy);
  if (len > 0) {
    const ang = len/radiusPx(), axis = new V(dy/len, dx/len, 0);
    qTmp.setFromAxisAngle(axis, ang); ball.quaternion.premultiply(qTmp);
    const dt = Math.max(1, now-lastMove.t)/1000;
    omega.lerp(axis.multiplyScalar(ang/dt), 0.6);
  }
  lastMove = { x: e.clientX, y: e.clientY, t: now };
});
function endPointer(e){
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (e.type === 'pointerup') discoAudio.unlock();          // a pointer-up is a gesture the browser accepts for starting audio
  if (pointers.size > 0) return;
  canvas.classList.remove('grabbing');
  const now = performance.now();
  if (dragging && lastMove && now-lastMove.t > 90) omega.set(0,0,0);
  // a quick flick adds to the spin that was already going — keep flicking and it keeps winding up
  if (dragging && down && now - down.t < 320 && omega.length() > 2.5) {
    const prev = down.spinBefore;
    if (prev.length() > 0.5 && prev.clone().normalize().dot(omega.clone().normalize()) > 0.3) omega.addScaledVector(prev, 0.92);
    const dir = omega.clone().normalize();
    if (now - lastFlick < 1300 && dir.dot(lastFlickDir) > 0.2) streak++; else streak = 1;
    lastFlick = now; lastFlickDir.copy(dir);
    if (streak >= 7) enterDisco();
  }
  if (omega.length() > MAX_SPIN) omega.setLength(MAX_SPIN);
  dragging = false;
  if (down && !down.moved && now-down.t < 350 && e.type === 'pointerup') tap(down.x, down.y, down.hit);
  down = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
function tap(x, y, hit){
  const t = performance.now();
  if (lastTap && t-lastTap.t < 380 && Math.hypot(x-lastTap.x, y-lastTap.y) < 32) {
    lastTap = null;
    if (hit && hit.type === 'shard') play(hit.index);
    else if (hit && hit.type === 'logo') resetAll(hit.k);
  } else lastTap = { x, y, t };
}
canvas.addEventListener('wheel', e => { e.preventDefault(); camDistTarget = clampDist(camDistTarget*Math.exp(e.deltaY*0.0012)); lastInteract = performance.now(); }, { passive: false });
canvas.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- camera fit ---------- */
let camDist = 4, camDistTarget = 4, zoomK = 1;
function fitDist(){ const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect); return (camera.aspect < 0.75 ? 1.12 : 1.3)/Math.sin(Math.min(vf,hf)/2); }
function clampDist(d){ const f = fitDist(); return Math.min(f*1.7, Math.max(Math.max(1.45, f*0.32), d)); }
function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
  coveMat.uniforms.res.value.set(w*renderer.getPixelRatio(), h*renderer.getPixelRatio());
  camDistTarget = clampDist(fitDist()*zoomK); camDist = camDistTarget; placeCamera();
}
function placeCamera(){ camera.position.set(0, camDist*0.28, camDist); camera.lookAt(0,-0.18,0); camera.updateMatrixWorld(); }
addEventListener('resize', resize);

/* ---------- loop ---------- */
const clock = new THREE.Clock(), lightW = [new V(), new V(), new V()], keyW = new V(-0.45, 0.7, 0.55).normalize();
function frame(){
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime, now = performance.now();
  camDist += (camDistTarget-camDist)*(1-Math.exp(-dt*10)); zoomK = camDistTarget/fitDist();
  placeCamera(); camera.updateMatrixWorld();

  if (faceAnim) {
    faceAnim.t = Math.min(1, faceAnim.t+dt/0.85);
    ball.quaternion.slerpQuaternions(faceAnim.from, faceAnim.to, easeInOut(faceAnim.t));
    if (faceAnim.t >= 1) faceAnim = null;
  } else if (!dragging) {
    const w = omega.length();
    if (w > 1e-4) { qTmp.setFromAxisAngle(omega.clone().divideScalar(w), w*dt); ball.quaternion.premultiply(qTmp); }
    omega.multiplyScalar(Math.exp(-dt*(discoTarget ? 0.6 : 1.1)));
    if (discoTarget) omega.lerp(DISCO_SPIN, 1-Math.exp(-dt*0.35));          // settles into a club-steady turn
    else if (!playing && now-lastInteract > 2500) omega.lerp(DRIFT, 1-Math.exp(-dt*0.7));
  }

  for (let i=0;i<3;i++){
    const a = time*0.45 + i*2.094;
    lightW[i].set(Math.cos(a)*2.8, Math.sin(a*0.7+i*2)*1.9, 2.3+Math.sin(a)*0.9);
    shardMat.uniforms.lPos.value[i].copy(lightW[i]).applyMatrix4(camera.matrixWorldInverse);
  }
  shardMat.uniforms.keyDir.value.copy(keyW).transformDirection(camera.matrixWorldInverse);
  coveMat.uniforms.camPos.value.copy(camera.position);

  // covers land one by one; push the atlas to the GPU at most ~6x/second so a phone isn't re-uploading 16MB every frame
  if (atlasDirty && now - lastAtlasUpload > 160) { atlasTex.needsUpdate = true; atlasDirty = false; lastAtlasUpload = now; }

  if (playing) {
    if (!playing.yt && time-playing.last > 1/30) { drawPlaying(time); playing.last = time; }   // stand-in: placeholder reels only
    playing.ringMat.opacity = 0.55 + 0.45*Math.sin(time*4);
  }

  disco += (discoTarget - disco) * (1 - Math.exp(-dt*2.2));
  DISCO.value = disco;
  BALLROT.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(ball.quaternion.clone().invert()));
  shadow.material.opacity = 0.9 * (1 - disco);
  scene.background.setRGB(0.718*(1-disco) + 0.01*disco, 0.741*(1-disco) + 0.008*disco, 0.624*(1-disco) + 0.014*disco);
  beams.children.forEach((g, i) => { g.rotation.z = Math.sin(time*0.6 + g.userData.phase)*0.55; g.rotation.x = 0.35 + Math.cos(time*0.45 + g.userData.phase)*0.25; g.children[0].material.opacity = 0.07*disco; });
  renderer.render(scene, camera);
  ytPlace();                                                // after the scene: the video follows this frame's camera + ball
  requestAnimationFrame(frame);
}

const easeInOut = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

/* ---------- start ---------- */
Promise.all([loadFeed(), drawLogo()]).then(([list]) => {
  logoTex.needsUpdate = true;
  resize();
  if (!list.length) { frame(); return; }                    // no feed and no fallback: just the room, nothing to cut
  setReels(list);
  setTimeout(() => loadYT().catch(() => {}), 1500);          // warm the YouTube player API so the first double-tap isn't waiting on it
  faceLogo(2, true);                                        // on load: a logo slab square-on, centered and level, exactly as after a logo double-tap (instant, no turn)
  frame();
});
