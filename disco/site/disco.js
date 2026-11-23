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
const ROOM_VIDEO = 0.27;      // how strongly the playing video is projected onto the room in disco mode (0.27 = 27%)
const NEON_COLS = [new THREE.Color(0xff3fa4), new THREE.Color(0x29e6ff), new THREE.Color(0xffd23f)];
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true });   // alpha: so the room can be see-through in disco (video projection)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const scene = new THREE.Scene();
scene.background = null;     // transparent: the stage picture (#bg) shows behind the canvas; the 3D room only appears in disco mode
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
const ball = new THREE.Group(); scene.add(ball);

/* the room: a seamless sage-paper cove — floor that bends up into a wall, no corners, no horizon */
const FLOOR_Y = -1.75;
let coveMesh = null;
const coveMat = new THREE.ShaderMaterial({
  uniforms: { res: { value: new THREE.Vector2(1,1) }, camPos: { value: new V() }, uDisco: DISCO, uRoomVid: { value: 0 }, uBallRot: BALLROT, cD: { value: NEON_COLS },
    cSage: { value: new THREE.Color(BRAND.sage) }, cIvory: { value: new THREE.Color(BRAND.ivory) },
    cShade: { value: new THREE.Color(0x7E896A) }, cHaze: { value: new THREE.Color(0xB7BD9F) } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `
    uniform vec2 res; uniform vec3 camPos, cSage, cIvory, cShade, cHaze; uniform float uDisco; uniform float uRoomVid; uniform mat3 uBallRot; uniform vec3 cD[3]; varying vec3 vW;
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
        vec3 club = vec3(0.012, 0.010, 0.018) * (1.0 + 3.0*pool) + sc * spot * 1.5 * att * uDisco * uDisco;   // the light specks fade as uDisco^2 (times the room's own alpha), so they are gone well before the end of the ramp
        col = club;   // always the club colour: the room is drawn only for disco, and its alpha (uDisco) does the fading - mixing the pale sage room in made the fade-out wash the whole picture out to cream
      }
      vec2 q = gl_FragCoord.xy/res - 0.5;
      col *= 1.0 - 0.32*dot(q,q)*1.6;                          // gentle vignette
      col += (hash(floor(gl_FragCoord.xy)) - 0.5) * 0.045;      // paper grain
      col = clamp(col, 0.0, 1.0);                                 // keep premultiplied colour valid (rgb <= alpha after the *alpha blend)
      gl_FragColor = vec4(col, smoothstep(0.0, 1.0, uDisco) * (1.0 - ${ROOM_VIDEO.toFixed(3)} * uRoomVid));   // fully see-through normally (the stage picture shows); fades to the club in disco, and lets a projected video through
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
  const cove = new THREE.Mesh(g, coveMat); cove.material.side = THREE.DoubleSide; scene.add(cove); coveMesh = cove;
}
// the ball's contact shadow is a soft DOM ellipse placed on the stage picture's floor pool (see placeShadow)

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
// Opal tuning (GLSL defines): body brightness; flash window widths (bigger = more/longer flashes) for the large patches (C)
// and the small flakes (F); and how strongly each layer counts. DULLING (hue/saturation untouched): OPAL_EDGE = how bright a
// patch is right at its boundary vs its middle (lower = softer seams); OPAL_FLASHV = flash brightness scale (RGB scaled evenly,
// so hue + saturation stay the same); OPAL_GLOW = the extra additive glow; OPAL_GLOSS = the polished satin highlight on the stone.
const OPAL_DEFS = `
    #define OPAL_BODY 1.04
    #define OPAL_CW0 0.0205
    #define OPAL_CW1 0.034
    #define OPAL_FW0 0.024
    #define OPAL_FW1 0.040
    #define OPAL_COARSE 0.85
    #define OPAL_FINE 1.0
    #define OPAL_EDGE 0.55
    #define OPAL_FLASHV 0.97
    #define OPAL_GLOW 0.09
    #define OPAL_GLOSS 0.35
`;
const logoMat = new THREE.ShaderMaterial({
  uniforms: { uDisco: DISCO, lColD: { value: NEON_COLS }, mask: { value: logoTex }, keyDir: shardUniforms.keyDir, lPos: shardUniforms.lPos, lCol: shardUniforms.lCol,
    cIvory: { value: new THREE.Color(BRAND.ivory) }, cSage: { value: new THREE.Color(BRAND.sage) }, cSageLt: { value: new THREE.Color(0xC3CAAE) },
    cSageDk: { value: new THREE.Color(0x87917A) }, cFern: { value: new THREE.Color(BRAND.fern) }, cInk: { value: new THREE.Color(BRAND.ink) },
    uOpal: { value: CONFIG.logoStyle === 'agate' ? 0 : 1 } },   // logoStyle in DISCO_CONFIG: 'opal' (default) or 'agate' (the original sage stone)
  vertexShader: SHARD_VS,
  fragmentShader: OPAL_DEFS + `
    uniform sampler2D mask; uniform vec3 keyDir; uniform vec3 lPos[3]; uniform vec3 lCol[3]; uniform float uDisco; uniform vec3 lColD[3];
    uniform vec3 cIvory, cSage, cSageLt, cSageDk, cFern, cInk; uniform float uOpal;
    varying vec2 vUv; varying float vShade; varying vec3 vN; varying vec3 vP;
    float h2(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+1.0),f.x), f.y); }
    vec2 h22(vec2 p){ p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
    // irregular mosaic: xy = which patch this pixel is in, zw = its offset from that patch's centre
    float vorE = 1.0;                                    // set by vor(): distance from this pixel to its patch's edge (0 = right on the seam)
    vec4 vor(vec2 x){
      vec2 n = floor(x), f = fract(x); float md = 8.0, md2 = 8.0; vec2 bg = vec2(0.0), br = vec2(0.0);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j)), r = g + h22(n + g) - f; float d = dot(r, r);
        if (d < md) { md2 = md; md = d; bg = n + g; br = -r; } else if (d < md2) { md2 = d; } }
      vorE = sqrt(md2) - sqrt(md);
      return vec4(bg, br);
    }
    // play-of-colour palette, weighted like the reference stone: ~1/3 greens, then pinks/reds, oranges, yellows, a little violet/blue
    const vec3 OPAL[12] = vec3[12](
      vec3(0.18,0.96,0.38), vec3(0.35,0.98,0.30), vec3(0.10,0.90,0.55), vec3(0.60,0.95,0.22),
      vec3(0.98,0.85,0.18), vec3(1.00,0.68,0.16), vec3(1.00,0.50,0.16), vec3(1.00,0.40,0.28),
      vec3(1.00,0.30,0.50), vec3(1.00,0.32,0.62), vec3(0.62,0.38,0.98), vec3(0.22,0.55,1.00));
    vec3 opalHue(float h){ float f = fract(h)*12.0; int i = int(floor(f)); return mix(OPAL[i], OPAL[(i+1)%12], smoothstep(0.0, 1.0, fract(f))); }
    // One layer of crystal domains. Each patch has its own hidden crystal axis and lights up only while that axis lines up with
    // the light/eye half-vector (Ha, Hb for two lights, already in the stone's own frame); the colour slides along the palette
    // as the tilt changes. Returns (colour sum weighted by brightness, total brightness).
    vec4 opalLayer(vec2 xq, vec3 Ha, vec3 Hb, float w0, float w1, float spread, float hueGain){
      vec4 dm = vor(xq); float seam = mix(OPAL_EDGE, 1.0, smoothstep(0.0, 0.22, vorE));     // patches fade a little toward their seams: no hard cut-out edges
      vec2 ra = h22(dm.xy + 13.0), rb = h22(dm.xy + 57.0);
      vec3 ax = normalize(vec3((ra - 0.5)*spread + dm.zw*0.20, 1.0));
      vec3 acc = vec3(0.0); float sum = 0.0;
      for (int k = 0; k < 2; k++) {
        vec3 Ht = k == 0 ? Ha : Hb;
        float aa = dot(normalize(Ht), ax);
        float I = exp(-(1.0 - aa) / (w0 + w1*rb.x)) * seam;
        float sh = dot(Ht.xy - ax.xy, vec2(cos(rb.y*6.2832), sin(rb.y*6.2832)));
        acc += opalHue(rb.x*0.9 + 0.05 + sh*hueGain) * I; sum += I;
      }
      return vec4(acc, sum);
    }
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
      vec3 flash = vec3(0.0);
      if (uOpal > 0.5) {
        // Real opal (reference: a translucent periwinkle body with patches of vivid, angular play-of-colour in clusters).
        // Body: cool blue-grey with lavender and deeper translucent areas.
        float b1 = n2(q*1.1 + 3.0), b2 = n2(q*2.3 + 8.0);
        vec3 body = mix(mix(vec3(0.74, 0.78, 0.87), vec3(0.58, 0.62, 0.84), smoothstep(0.3, 0.7, b1)), vec3(0.48, 0.58, 0.72), smoothstep(0.55, 0.8, b2)*0.6);
        body *= (1.0 + 0.10*(n2(q*30.0) - 0.5)) * OPAL_BODY;
        // the slab's own tangent frame, so its crystal directions can be compared with the light/eye directions
        vec3 dp1 = dFdx(vP), dp2 = dFdy(vP); vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
        vec3 dp2p = cross(dp2, N), dp1p = cross(N, dp1);
        vec3 Tn = normalize(dp2p*du1.x + dp1p*du2.x), Bn = normalize(dp2p*du1.y + dp1p*du2.y);
        vec3 Hk = normalize(keyDir + Vd), Hr = normalize(normalize(lPos[0] - vP) + Vd);        // fixed key light + one roaming light
        vec3 Ha = vec3(dot(Hk, Tn), dot(Hk, Bn), dot(Hk, N)), Hb = vec3(dot(Hr, Tn), dot(Hr, Bn), dot(Hr, N));
        Ha.xy += q*0.22; Hb.xy += q*0.22;                                  // a polished dome: the surface tilts across the stone, so each part lines up at its own angle
        // large patches (broad flash) + lots of small angular flakes (pinfire) that gather in clusters, like the real thing
        vec4 Lc = opalLayer(q*3.0 + 0.32*vec2(n2(q*4.0), n2(q*4.0 + 9.0)), Ha, Hb, OPAL_CW0, OPAL_CW1, 1.8, 2.8);
        vec2 xf = mat2(0.87, 0.5, -0.5, 0.87) * q * vec2(9.5, 6.5) + 0.25*vec2(n2(q*7.0), n2(q*7.0 + 4.0));
        vec4 Lf = opalLayer(xf, Ha, Hb, OPAL_FW0, OPAL_FW1, 1.8, 2.8);
        float zone = smoothstep(0.36, 0.60, n2(q*1.6 + 5.0));              // where the flakes cluster
        vec3 acc = Lc.rgb*OPAL_COARSE + Lf.rgb*(0.10 + 0.90*zone)*OPAL_FINE;
        float sum = Lc.a*OPAL_COARSE + Lf.a*(0.10 + 0.90*zone)*OPAL_FINE;
        vec3 fcol = acc / max(sum, 1e-3);
        float fi = smoothstep(0.05, 0.62, sum);                           // saturated cores with soft edges
        flash = fcol * fi;
        stone = mix(body, fcol * OPAL_FLASHV, fi*0.92);
        stone += vec3(0.55, 0.70, 0.85) * pow(1.0 - max(dot(N, Vd), 0.0), 3.0) * 0.06;   // faint blue sheen at glancing angles
      }
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
      col += cIvory * sp * mix(1.0, OPAL_GLOSS, uOpal) * (1.0 - m) * vShade;      // (opal: a duller, less polished satin highlight)
      col += flash * OPAL_GLOW * (1.0 - m) * vShade;               // opal: the flash glows a touch through the satin
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
// LOGO_CELL: how tight a logo cluster's cells are packed, as a fraction of a video shard's spacing. 1 = the original (a logo slab
// was 7 full-size cells, ~28% of the ball at 71 videos). Smaller = a smaller slab (and smaller logo) and bigger video shards.
const LOGO_CELL = 0.6;
function makeSeeds(N){
  const T = N + 28*LOGO_CELL*LOGO_CELL, d = Math.sqrt(8*Math.PI/(Math.sqrt(3)*T)), dl = d*LOGO_CELL;
  const logo = [];
  LOGO_CENTERS.forEach((C, k) => {
    const e2 = LOGO_UPS[k], e1 = new V().crossVectors(e2, C);
    logo.push({ p: C.clone(), k });
    for (let j=0;j<6;j++){ const a = j*Math.PI/3 + Math.PI/6, dir = e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      logo.push({ p: C.clone().multiplyScalar(Math.cos(dl)).addScaledVector(dir, Math.sin(dl)).normalize(), k }); }
  });
  const excl = Math.cos(1.5*dl + 0.35*d), near = p => Math.max(...LOGO_CENTERS.map(C => p.dot(C)));
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
    mat: new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
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
// The player renders at 960x540 and is scaled onto the tile. Rendering it LARGE makes YouTube's own overlays (title bar,
// bottom strip) a small slice of the height, and YT_ZOOM then zooms into the middle of the video so those slices fall
// outside the tile's outline and are cropped away. (The overlays can't be switched off any more, only cropped.)
const YT_W = 960, YT_H = 540, YT_ZOOM = 1.5;
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
/* One persistent player, reused for every video. Creating a fresh iframe per tap meant a ~2s boot every time AND each new
   player had to win autoplay on its own; a single long-lived player boots once, in the background, and once the browser has
   let it play with sound (iOS needs one real tap on the player the first time) it stays allowed for the rest of the visit. */
const yt = { frame: null, player: null, ready: null };
function ytEnsure(){
  if (yt.ready) return yt.ready;
  yt.ready = loadYT().then(YT => new Promise(resolve => {
    const frame = yt.frame = document.createElement('div'); frame.className = 'yt-frame'; ytLayer.appendChild(frame);
    const holder = document.createElement('div'); frame.appendChild(holder);
    yt.player = new YT.Player(holder, {
      width: YT_W, height: YT_H,
      playerVars: { controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0, cc_load_policy: 0, origin: location.origin },
      events: {
        onReady: () => resolve(yt.player),
        onAutoplayBlocked: () => { const p = playing; if (p && p.yt) ytBlocked(p); },
        onStateChange: e => {
          const p = playing, y = p && p.yt; if (!y) return;
          let vid; try { vid = e.target.getVideoData().video_id; } catch (_) {}
          if (vid && vid !== y.videoId) return;                   // a leftover event from the previous video
          if (e.data === 1) {                                     // PLAYING
            ytNoCaptions();
            if (!y.played) {
              y.played = true; clearTimeout(y.timer);
              const d = e.target.getDuration();
              if (!p.reel.duration && d > 90) e.target.seekTo(Math.floor(Math.random() * Math.max(1, d - Math.min(60, d * 0.4))), true);   // length wasn't in the feed
            }
            y.blocked = false; y.show = true;
          } else if (e.data === 0) stop();                        // ENDED
        },
        onError: e => { yt.lastErr = e.data; console.warn('[disco] video unavailable (YouTube error ' + e.data + ')'); if (playing && playing.yt) stop(); }
      }
    });
  })).catch(err => { yt.ready = null; console.warn('[disco]', err.message); throw err; });
  return yt.ready;
}
// Captions off, whatever the viewer's YouTube settings say (cc_load_policy=0 alone doesn't override a "always show captions" account)
function ytNoCaptions(){ try { yt.player.unloadModule('captions'); yt.player.unloadModule('cc'); } catch (_) {} }

function ytStart(p){
  const reel = p.reel, c = cellsData[p.i], LO = c.parts.LO;
  // the smallest 16:9 box, centred on the tile's outline, that covers it — in the tile's own (u,v) units — then zoomed in
  // (YT_ZOOM) so YouTube's title bar / bottom strip land outside the outline
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  LO.forEach(([u, v]) => { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, Ht = Math.max(v1 - v0, (u1 - u0) * 9 / 16) * 1.04 * YT_ZOOM, Wt = Ht * 16 / 9, k = YT_H / Ht;
  // clip to the tile's outline EXACTLY (an inset left a sliver of the cover showing round the video, which read as a glowing border)
  const clip = 'polygon(' + LO.map(([u, v]) => `${(YT_W/2 + (u - uc)*k).toFixed(1)}px ${(YT_H/2 - (v - vc)*k).toFixed(1)}px`).join(',') + ')';
  const y = p.yt = { clip, uc, vc, Wt, Ht, vis: 0, videoId: reel.id, played: false, blocked: false, show: false, timer: 0 };
  const dur = reel.duration;
  const start = dur ? Math.floor(Math.random() * Math.max(1, dur - Math.min(60, dur * 0.4))) : 0;   // random spot; always leaves room to play
  ytEnsure().then(player => {
    if (playing !== p) return;                                  // tapped away while the player was booting
    player.loadVideoById({ videoId: reel.id, startSeconds: start });
    ytNoCaptions();
    // Nothing started after 3s: is the browser refusing sound-on autoplay, or is the video just slow to load? A real block leaves the
    // player idle (unstarted/cued); a slow connection leaves it BUFFERING. Keep waiting (up to ~12s) while it buffers, so a slow
    // load doesn't get mistaken for a block and throw up YouTube's play button.
    let waited = 0;
    const check = () => {
      if (y.played || playing !== p) return;
      waited += 3000;
      let st = -2; try { st = yt.player.getPlayerState(); } catch (_) {}
      if (st === 3 && waited < 12000) { y.timer = setTimeout(check, 3000); return; }       // 3 = BUFFERING
      ytBlocked(p);
    };
    y.timer = setTimeout(check, 3000);
  }).catch(() => {});
}
// The browser wouldn't start the video with sound from a tap on OUR page. Don't fight the player: show it, and let the tap
// land on YouTube's own play button (the whole tile is the target). Once it's playing it goes back to ignoring touches.
function ytBlocked(p){ const y = p.yt; if (!y || y.played) return; y.blocked = true; y.show = true; }
function ytStop(p){
  const y = p.yt; if (!y) return;
  clearTimeout(y.timer);
  try { yt.player.stopVideo(); } catch (_) {}                   // the player stays alive (hidden) for the next video
  if (yt.frame) { yt.frame.style.opacity = '0'; yt.frame.style.pointerEvents = 'none'; }
  p.yt = null;
}
// Disco + a playing video: the ball becomes the plain mirror ball (no video on it) and the video is projected onto the room.
// It's the SAME player (moving an iframe would reload it): re-styled to cover the viewport and sent BEHIND the transparent
// canvas, where it shows through the see-through room (ROOM_VIDEO) but never through the opaque ball.
const roomVideo = () => !!(playing && playing.yt && playing.yt.show && disco > 0.5);
function ytPlace(){
  const p = playing;
  if (!p || !p.yt) { ytLayer.style.zIndex = ''; return; }
  const y = p.yt, c = cellsData[p.i], f = yt.frame, W = innerWidth, H = innerHeight;
  if (!f) return;
  if (roomVideo()) {
    const k = Math.max(W / YT_W, H / YT_H) * 1.25;             // 'cover' the viewport, a touch over so YouTube's edge overlays are off-screen
    ytLayer.style.zIndex = '-1';
    f.style.clipPath = 'none';
    f.style.transform = `translate(${((W - YT_W*k)/2).toFixed(1)}px,${((H - YT_H*k)/2).toFixed(1)}px) scale(${k.toFixed(4)})`;
    f.style.opacity = '1'; f.style.pointerEvents = 'none';
    return;
  }
  ytLayer.style.zIndex = ''; f.style.clipPath = y.clip;
  ball.updateMatrixWorld();
  const pt = (u, v) => { const w = c.center.clone().addScaledVector(c.e1, u).addScaledVector(c.e2, v).applyMatrix4(ball.matrixWorld).project(camera); return [(w.x + 1) / 2 * W, (1 - w.y) / 2 * H]; };
  const q = [pt(y.uc - y.Wt/2, y.vc + y.Ht/2), pt(y.uc + y.Wt/2, y.vc + y.Ht/2), pt(y.uc + y.Wt/2, y.vc - y.Ht/2), pt(y.uc - y.Wt/2, y.vc - y.Ht/2)];
  f.style.transform = quadMatrix(YT_W, YT_H, q);
  // facing: fade out as the tile turns away. Behind the ball it's invisible but keeps playing (audio carries on).
  const facing = c.p.clone().transformDirection(ball.matrixWorld).dot(camera.position.clone().sub(c.center.clone().applyMatrix4(ball.matrixWorld)).normalize());
  const vis = y.show ? Math.min(1, Math.max(0, (facing - 0.06) / 0.2)) * Math.max(0, 1 - disco*2) : 0;   // fades out as disco takes over the ball
  f.style.opacity = vis.toFixed(3); y.vis = vis;
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
  if (location.search.includes('stats')) setTimeout(() => { const L = camera.position.length(), p = ORIGIN.clone().project(camera); console.log('[disco] stage', JSON.stringify({ viewport: [stage.W, stage.H], picture: [Math.round(stage.dw), Math.round(stage.dh)], pictureTopY: Math.round(stage.ty), pictureLeftX: Math.round(stage.tx), ballTarget: [Math.round(stage.bx), Math.round(stage.by), Math.round(stage.R)], ballActual: [Math.round((p.x+1)/2*stage.W), Math.round((1-p.y)/2*stage.H), Math.round(camFocal()/Math.sqrt(L*L-1))], poolCentre: [Math.round(stage.ox), Math.round(stage.oy)], poolWidth: Math.round(stage.ovalW) })); }, 400);
  if (location.search.includes('stats')) window.__disco = { view: () => { const z = viewNow(), p = ORIGIN.clone().project(camera); return { R: ballR, stageR: stage.R, startDist: fitDist(), outDist: outDist(), R0: stage.R0, RFULL: stage.RFULL, shadowBg: shadowEl.style.background, z, bgScale, center: [(p.x+1)/2*stage.W, (1-p.y)/2*stage.H], target: [stage.bx, stage.by], shadow: shadowEl.style.transform, coveVisible: !!(coveMesh && coveMesh.visible), disco, camDist, fit: fitDist(), q: [ball.quaternion.x, ball.quaternion.y, ball.quaternion.z, ball.quaternion.w], pointers: pointers.size, pinching: !!pinch, dragging, yt: (() => { try { const pl = yt.player; return pl ? { state: pl.getPlayerState(), id: (pl.getVideoData() || {}).video_id, t: Math.round(pl.getCurrentTime()), err: yt.lastErr || null } : null; } catch (_) { return null; } })(), want: playing && playing.yt ? { id: playing.yt.videoId, played: playing.yt.played, blocked: playing.yt.blocked, show: playing.yt.show } : null }; }, logoPoints: () => LOGO_CENTERS.map((C, k) => { ball.updateMatrixWorld(); const w = C.clone().multiplyScalar(logoTiles[k].h).applyMatrix4(ball.matrixWorld), n = C.clone().transformDirection(ball.matrixWorld), p = w.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, facing: n.dot(camera.position.clone().sub(w).normalize()) }; }) };   // test-only (?stats): where each logo slab is on screen
  if (location.search.includes('stats')) console.log('[disco] stats', JSON.stringify({ reels: count, videoTileR: +reelR.toFixed(4), logoSlabR: +(logoTiles.reduce((a, c) => a + c.R, 0) / 4).toFixed(4) }));
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
function enterDisco(){ if (discoTarget === 0) camDistTarget = outDist();   // always pull FULLY out on entering disco: see more of the room
  if (discoTarget === 0 && !playing) discoAudio.start(); discoTarget = 1; }
// double-tap a logo: the page's reset — stop any reel, stop the disco loop, leave disco, stop the spin, face that logo square-on
function resetAll(k){ camDistTarget = fitDist(); stop(); discoAudio.stop(); discoTarget = 0; streak = 0; omega.set(0,0,0); faceLogo(k); }
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

// ---- finger bookkeeping that can never get stuck ----
// `pointers` remembers every finger that is down. If a "finger lifted" event is ever LOST (a system gesture, a pinch that drifts
// off the glass, the browser or an iframe stealing the touch) a phantom finger would stay in there forever: every new touch then
// reads as a 3rd finger (ignored) or a phantom pinch, and the ball ignores you until a refresh. So: phantoms are forgotten
// when they go quiet (STALE_MS), cross-checked against the browser's own list of fingers on the glass (touch events), and
// everything resets when the page loses focus.
const STALE_MS = 4000;
function startDrag(x, y){
  down = { x, y, t: performance.now(), hit: pick(x, y), moved: false, spinBefore: omega.clone() };
  lastMove = { x, y, t: performance.now() };
  dragging = true; omega.set(0,0,0); faceAnim = null; canvas.classList.add('grabbing');
}
function startPinch(){
  const [a,b] = [...pointers.values()];
  pinch = { d: Math.hypot(a.x-b.x, a.y-b.y), start: camDistTarget, ang: Math.atan2(b.y-a.y, b.x-a.x) };
  dragging = false; down = null; omega.set(0,0,0); faceAnim = null;
}
function resetPointers(){ pointers.clear(); pinch = null; dragging = false; down = null; canvas.classList.remove('grabbing'); }
function forgetStale(except){
  const now = performance.now();
  pointers.forEach((p, id) => { if (id !== except && now - p.t > STALE_MS) pointers.delete(id); });
  if (pointers.size < 2) pinch = null;
  if (!pointers.size) { dragging = false; down = null; canvas.classList.remove('grabbing'); }
}
// the browser's own count of fingers on the glass is the truth: drop remembered fingers that no longer match any real touch
function reconcileTouches(e){
  const n = e.touches.length;
  if (n === 0) { setTimeout(() => { if (pointers.size) resetPointers(); }, 40); return; }   // (after pointerup has had its turn)
  if (pointers.size > n) {
    const keep = new Set();
    [...e.touches].forEach(t => { let best = null, bd = Infinity; pointers.forEach((p, id) => { if (keep.has(id)) return; const d = (p.x - t.clientX) ** 2 + (p.y - t.clientY) ** 2; if (d < bd) { bd = d; best = id; } }); if (best !== null) keep.add(best); });
    [...pointers.keys()].forEach(id => { if (!keep.has(id)) pointers.delete(id); });
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) { dragging = false; down = null; canvas.classList.remove('grabbing'); }
    else if (pointers.size === 1 && !down) { const p = [...pointers.values()][0]; startDrag(p.x, p.y); }     // the touch that arrived while we were confused still works
    else if (pointers.size === 2 && !pinch) startPinch();
  }
}
['touchstart', 'touchend', 'touchcancel'].forEach(t => addEventListener(t, reconcileTouches, { passive: true, capture: true }));
addEventListener('blur', resetPointers); addEventListener('pagehide', resetPointers);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetPointers(); });
canvas.addEventListener('contextmenu', e => { e.preventDefault(); resetPointers(); });

canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  forgetStale(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
  lastInteract = performance.now();
  if (pointers.size === 2) { startPinch(); return; }
  if (pointers.size > 2) return;
  startDrag(e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
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
canvas.addEventListener('lostpointercapture', endPointer);
addEventListener('pointerup', endPointer); addEventListener('pointercancel', endPointer);     // in case the finger ended off the canvas (capture lost)
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
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault()));

/* ---------- the stage picture + camera fit ---------- */
// The room is a picture (CONFIG.stage). Measured from the file: the soft halo the ball hovers in, and the pale floor pool its
// shadow lands on, sit at fixed fractions of the picture. layoutStage() works out, for this screen, how the picture is scaled
// and placed (phones: fit the width and extend the sky upward; wide screens: show the halo-to-floor band, mirror the picture
// outward to fill the sides), then where the ball goes (hovering in the halo, sized to the stage, shadow on the pool).
const STAGE = CONFIG.stage, bgEl = $('bg'), shadowEl = $('shadow');
{ const a = STAGE.shadow; shadowEl.style.background = `radial-gradient(closest-side, rgba(38,32,22,${a}), rgba(38,32,22,${(a * 0.55).toFixed(3)}) 50%, rgba(38,32,22,0))`; }   // the ball's anchor shadow: peak opacity from the config
let stage = null;
const stageVariant = () => (innerWidth <= 820 || innerHeight > innerWidth * 1.05) ? 'mobile' : 'desktop';
function layoutStage(){
  const W = innerWidth, H = innerHeight, variant = stageVariant(), S = Object.assign({}, STAGE, STAGE[variant]);
  // 1. THE BALL IS ALWAYS CENTRED on the screen (horizontally and vertically), at every zoom level. Its size: R0 = fully zoomed out,
  //    R = where the page starts (STAGE.startZoom of the way from R0 to "the ball's sides touch the screen's sides", RFULL).
  const RFULL = Math.min(W, H) / 2;
  let R0 = Math.min(0.26 * W, 0.28 * H), R = R0 + S.startZoom * (RFULL - R0);
  if (S.startR) { R = S.startR * H; R0 = R * (S.outRatio || 0.8); }                         // desktop: sized as a fraction of the screen height
  const bx = W / 2, by = H / 2;
  // 2. THE PICTURE MOVES TO FIT THE BALL: it is placed (and scaled up just enough to still cover the screen) so the lighter patch of
  //    grass lands S.gap ball-radii below the ball's bottom, centred horizontally under it.
  const pyT = by + (S.refR ? S.refR * H : R) * (1 + S.gap);                                   // where the ball's shadow lands (it stays right under the ball)
  const pyP = pyT + (S.dropY || 0) * H;                               // where the picture's patch goes: dropY slides the PICTURE down under the shadow
  let sc = Math.max(W / S.w, (H - pyP) / ((1 - S.ovalY) * S.h));      // cover the width, and everything below the patch
  if (!S.extendTop) sc = Math.max(sc, H / S.h, pyP / (S.ovalY * S.h));                         // desktop: no sky to extend, so cover the top too
  const dw = S.w * sc, dh = S.h * sc;
  const ty = pyP - S.ovalY * dh;
  const tx = Math.min(0, Math.max(W - dw, W / 2 - S.ovalX * dw));
  const yo = pyT;
  stage = { W, H, dw, dh, tx, ty, R, R0, RFULL, variant, bx, by, ox: bx, oy: yo, ovalW: S.ovalW * dw };
  // the picture, then mirrored copies outward so the sides never stop abruptly; sky extended upward where the picture is shorter than the screen
  bgEl.textContent = '';
  const K = Math.ceil(Math.max(0, tx) / dw);
  for (let k = -K; k <= K; k++) {
    const flip = Math.abs(k) % 2 === 1 ? 'scaleX(-1)' : '';
    if (ty > 0) { const f = document.createElement('div'); f.className = 'fill'; f.style.cssText = `left:${(tx + k*dw).toFixed(1)}px;top:0;width:${dw.toFixed(1)}px;height:${(ty + 1).toFixed(1)}px;background:${S.topRow};transform:${flip}`; bgEl.appendChild(f); }
    const t = document.createElement('div'); t.className = 'tile';
    t.style.cssText = `left:${(tx + k*dw).toFixed(1)}px;top:${ty.toFixed(1)}px;width:${dw.toFixed(1)}px;height:${dh.toFixed(1)}px;background-image:url(${S.image});transform:${flip}`;
    bgEl.appendChild(t);
  }
}
let camDist = 4, camDistTarget = 4, zoomK = 1;
const camFocal = () => (innerHeight / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
// the camera distance at which the ball's radius on screen equals the stage's ball radius (unit sphere seen from L: radius = f / sqrt(L^2 - 1))
const distFor = R => Math.sqrt((camFocal() / R) ** 2 + 1) / 1.0384;     // 1.0384 = |(0, .28, 1)|, the camera's offset direction
function fitDist(){ return distFor(stage.R); }     // where the page STARTS (a little in from fully zoomed out: STAGE.startZoom)
function outDist(){ return distFor(stage.R0); }    // FULLY ZOOMED OUT: the farthest you can pinch to (= the original zoom-out limit; the size the picture was drawn for)
function clampDist(d){ const o = outDist(); if (!Number.isFinite(d)) d = fitDist(); return Math.min(o, Math.max(Math.max(1.45, o*0.32), d)); }   // zoom out as far as `o`, in to ~3.7x the fully-zoomed-out size
function resize(){
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;                                   // a transient 0-size (browser UI changing during a pinch) must not poison the layout
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
  coveMat.uniforms.res.value.set(w*renderer.getPixelRatio(), h*renderer.getPixelRatio());
  layoutStage();
  camDistTarget = clampDist(fitDist()*zoomK); camDist = camDistTarget; placeCamera();
}
const ORIGIN = new V();
function placeCamera(){
  camera.position.set(0, camDist*0.28, camDist); camera.lookAt(0,-0.18,0); camera.updateMatrixWorld();
  if (!stage) return;
  camera.clearViewOffset();
  const p = ORIGIN.clone().project(camera);                            // where the ball's centre lands before any shift
  camera.setViewOffset(stage.W, stage.H, (p.x + 1)/2*stage.W - stage.bx, (1 - p.y)/2*stage.H - stage.by, stage.W, stage.H);   // slide the view so the ball hovers on the stage
}
// Depth: the picture is a distant backdrop, so when the ball zooms in it grows a LITTLE (about DEPTH of the ball's growth), about
// the ball's anchor point. The ball swells in front of it instead of the whole scene scaling with it. The shadow rides the pool.
const DEPTH = STAGE.depth;
let bgScale = 1, ballR = 0;
function viewNow(){ const L = camera.position.length(); ballR = camFocal() / Math.sqrt(Math.max(1.0001, L*L - 1)); return Math.max(1, ballR / stage.R0); }   // 1 = fully zoomed out, the size the picture is anchored to
function applyDepth(){
  if (!stage) return;
  const dp = (STAGE[stage.variant] && STAGE[stage.variant].depth != null) ? STAGE[stage.variant].depth : DEPTH;      // per-picture depth (read live, so it can be tuned from the console)
  bgScale = 1 + dp * (viewNow() - 1);
  bgEl.style.transformOrigin = `${stage.bx}px ${stage.by}px`;
  bgEl.style.transform = bgScale > 1.0005 ? `scale(${bgScale.toFixed(4)})` : '';
}
// the shadow sits on the picture's floor pool, sized to the ball's current on-screen radius (so it grows as you zoom), gone in disco
function placeShadow(){
  if (!stage) return;
  const sx = stage.bx + (stage.ox - stage.bx) * bgScale, sy = stage.by + (stage.oy - stage.by) * bgScale;     // the pool, as scaled by the depth effect
  const w = Math.min(1.5 * ballR, 1.05 * stage.ovalW * bgScale), h = w * 0.26;
  shadowEl.style.width = w.toFixed(1) + 'px'; shadowEl.style.height = h.toFixed(1) + 'px';
  shadowEl.style.transform = `translate(${(sx - w/2).toFixed(1)}px,${(sy - h/2).toFixed(1)}px)`;
  shadowEl.style.opacity = (1 - Math.min(1, disco*1.6)).toFixed(3);
}
addEventListener('resize', resize);

/* ---------- loop ---------- */
const clock = new THREE.Clock(), lightW = [new V(), new V(), new V()], keyW = new V(-0.45, 0.7, 0.55).normalize();

// ---- light clouds (Jace, 2026-11-23): soft white puff-clusters drifting slowly across the sky, on a canvas BEHIND the birds (z -3, just above
// the picture). Each cloud is a pre-rendered sprite (many overlapping soft puffs, flat shaded underside), a few variants, drawn at several
// sizes/opacities; bigger = nearer = a touch faster. Hidden in disco. DISCO_CONFIG.clouds = { max } or clouds:false.
const CLOUDS = CONFIG.clouds === false ? null : Object.assign({ max: 6 }, CONFIG.clouds || {});
const cloudCv = document.getElementById('clouds');
if (CLOUDS && cloudCv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const cctx = cloudCv.getContext('2d'); let cloudsSeeded = false, clouds = [], lastC = performance.now(), cw = 0, ch = 0, dprC = 1, nextC = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sprites = [];
  const makeSprite = () => {
    const W = 512, H = 200, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const n = 14 + Math.floor(Math.random() * 8);
    for (let layer = 0; layer < 2; layer++) {          // layer 0: cool grey-blue underside, layer 1: bright tops, lifted a little
      for (let i = 0; i < n; i++) {
        const t = (i + Math.random() * 0.6) / n, x = 50 + t * (W - 100), hump = Math.sin(t * Math.PI);          // taller in the middle
        const r = (22 + hump * 38) * rnd(0.7, 1.15), y = H * 0.66 - hump * rnd(8, 46) * (layer ? 1.0 : 0.4) - rnd(0, 8) + (layer ? 0 : 7);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        if (layer === 0) { gr.addColorStop(0, 'rgba(170,180,190,0.30)'); gr.addColorStop(1, 'rgba(170,180,190,0)'); }
        else { gr.addColorStop(0, 'rgba(255,255,250,0.62)'); gr.addColorStop(0.55, 'rgba(255,255,250,0.30)'); gr.addColorStop(1, 'rgba(255,255,250,0)'); }
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      }
    }
    // flatten the base: fade everything below the cloud's bottom line
    g.globalCompositeOperation = 'destination-out'; const fg = g.createLinearGradient(0, H * 0.70, 0, H * 0.86); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fg; g.fillRect(0, H * 0.70, W, H * 0.30);
    return c;
  };
  for (let i = 0; i < 4; i++) sprites.push(makeSprite());
  // a cloud's visible bottom (~75% down its sprite) must stay above the ball's top + a little (about the mountain peaks), never down by the trees (limit = the ball's top, floor 20% of the height)
  const cloudLimit = () => Math.max(0.2 * ch, (stage ? stage.by - stage.R : 0.3 * ch));
  const spawnCloud = (initial) => {
    const w = rnd(190, 460), dir = Math.random() < 0.7 ? 1 : -1, near = (w - 190) / 270, t = 0.02 * ch, b = Math.max(t + 10, cloudLimit() - 0.75 * w * 200 / 512);
    clouds.push({ sp: sprites[Math.floor(Math.random() * sprites.length)], w, h: w * 200 / 512, y: rnd(t, b), dir, speed: rnd(4, 8) + near * 6, alpha: rnd(0.35, 0.6) * (0.75 + 0.25 * near),
      x: initial ? rnd(-w * 0.3, cw) : (dir > 0 ? -w : cw) , flip: Math.random() < 0.5 });
  };
  const cloudFrame = (now) => {
    requestAnimationFrame(cloudFrame);
    const dt = Math.min(0.1, (now - lastC) / 1000); lastC = now;
    const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 2), first = !cw;
    if (W !== cw || H !== ch || d !== dprC) { cw = W; ch = H; dprC = d; cloudCv.width = Math.round(W * d); cloudCv.height = Math.round(H * d); }
    if (stage && !cloudsSeeded) { cloudsSeeded = true; for (let i = 0; i < 3; i++) spawnCloud(true); }   // wait for the stage layout so the first clouds respect the height limit
    const vis = 1 - Math.min(1, disco * 2.5);
    cctx.setTransform(dprC, 0, 0, dprC, 0, 0); cctx.clearRect(0, 0, cw, ch);
    if (document.hidden || vis <= 0.01) return;
    nextC -= dt; if (nextC <= 0 && clouds.length < CLOUDS.max) { spawnCloud(false); nextC = rnd(6, 16); }
    for (const c of clouds) {
      c.x += c.dir * c.speed * dt;
      c.y = Math.min(c.y, Math.max(0.02 * ch, cloudLimit() - 0.75 * c.h));     // re-clamp (screen resize / layout change)
      cctx.save(); cctx.globalAlpha = c.alpha * vis;
      if (c.flip) { cctx.translate(c.x + c.w, c.y); cctx.scale(-1, 1); cctx.drawImage(c.sp, 0, 0, c.w, c.h); } else cctx.drawImage(c.sp, c.x, c.y, c.w, c.h);
      cctx.restore();
    }
    clouds = clouds.filter(c => c.dir > 0 ? c.x < cw + 20 : c.x > -c.w - 20);
  };
  requestAnimationFrame(cloudFrame);
}

// ---- distant birds (Jace, 2026-11-23): drift left/right across the sky behind the ball, on their own 2D canvas (z -2, under the shadow
// and the WebGL canvas). Different sizes and kinds: small fast flappers (far away, faint), medium flappers, big slow soarers (nearer, darker,
// mostly gliding), and the odd loose V-flock. Hidden in disco. Tune with DISCO_CONFIG.birds = { max, ... } or turn off with birds:false.
const BIRDS = CONFIG.birds === false ? null : Object.assign({ max: 9 }, CONFIG.birds || {});
const birdCv = document.getElementById('birds');
if (BIRDS && birdCv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const bctx = birdCv.getContext('2d'); let birds = [], lastT = performance.now(), nextSpawn = 0.5, dprB = 1, bw = 0, bh = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const skyBand = () => { const H = bh; const top = 0.05 * H; let bot = 0.22 * H; if (stage) bot = Math.max(bot, stage.by - stage.R0 * 1.05); return [top, Math.max(top + 40, Math.min(bot, 0.55 * H))]; };
  const spawn = (kind, x, y, dir, size, speed) => {
    const far = size < 18, soar = kind === 'soar';
    birds.push({ x, y, dir, size, speed, kind, ph: rnd(0, 6.28), rate: soar ? rnd(0.45, 0.75) : far ? rnd(1.6, 2.3) : rnd(1.1, 1.7), bobA: rnd(2, 7) * (size / 24), bobF: rnd(0.3, 0.8), bobP: rnd(0, 6.28),
      alpha: soar ? rnd(0.5, 0.65) : far ? rnd(0.22, 0.34) : rnd(0.34, 0.5), glide: soar ? 0.75 : 0.0, gT: rnd(0, 6) });
  };
  const launch = () => {
    const [t, b] = skyBand(), dir = Math.random() < 0.5 ? 1 : -1, y = rnd(t, b), r = Math.random();
    const x = dir > 0 ? -60 : bw + 60;
    if (r < 0.22) {           // a loose V-flock of small far birds
      const n = 3 + Math.floor(Math.random() * 5), sz = rnd(9, 15), sp = rnd(26, 38);
      for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2) * (i % 2 ? 1 : -1); spawn('flap', x - dir * Math.abs(k) * sz * 2.6, y + k * sz * 1.5 + rnd(-3, 3), dir, sz * rnd(0.9, 1.1), sp * rnd(0.97, 1.03)); }
    } else if (r < 0.45) spawn('soar', x, y, dir, rnd(22, 30), rnd(14, 22));
    else if (r < 0.75) spawn('flap', x, y, dir, rnd(14, 22), rnd(24, 38));
    else spawn('flap', x, y, dir, rnd(8, 14), rnd(22, 34));
  };
  const drawBird = (b, a) => {
    const w = b.size / 2, f = Math.sin(b.ph), amp = b.kind === 'soar' ? (1 - b.glide) * 0.55 + 0.12 : 0.5;
    const tipY = -f * w * amp - w * 0.12, midY = -f * w * amp * 0.45 - w * 0.22, th = Math.max(0.9, b.size * 0.075);
    bctx.globalAlpha = a; bctx.fillStyle = '#4a4636';      // filled wings that taper to points (a round-capped stroke read as a gummy worm up close)
    bctx.beginPath(); bctx.moveTo(-w, tipY);
    bctx.quadraticCurveTo(-w * 0.5, midY - th * 1.2, 0, -th * 0.5); bctx.quadraticCurveTo(w * 0.5, midY - th * 1.2, w, tipY);
    bctx.quadraticCurveTo(w * 0.5, midY + th * 0.3, 0, th * 0.9); bctx.quadraticCurveTo(-w * 0.5, midY + th * 0.3, -w, tipY);
    bctx.closePath(); bctx.fill();
  };
  const birdFrame = (now) => {
    requestAnimationFrame(birdFrame);
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 2);
    if (W !== bw || H !== bh || d !== dprB) { bw = W; bh = H; dprB = d; birdCv.width = Math.round(W * d); birdCv.height = Math.round(H * d); }
    const vis = 1 - Math.min(1, disco * 2.5);        // gone as disco starts
    bctx.setTransform(dprB, 0, 0, dprB, 0, 0); bctx.clearRect(0, 0, bw, bh);
    if (document.hidden || vis <= 0.01) { return; }
    nextSpawn -= dt;
    if (nextSpawn <= 0 && birds.length < BIRDS.max) { launch(); nextSpawn = rnd(2.5, 7); }
    bctx.strokeStyle = '#4a4636';
    for (const b of birds) {
      b.x += b.dir * b.speed * dt; b.ph += b.rate * dt * 6.28; b.bobP += b.bobF * dt * 6.28; b.gT += dt;
      if (b.kind === 'soar') b.glide = 0.5 + 0.5 * Math.sin(b.gT * 0.55);        // alternates between glide and a few lazy flaps
      bctx.save(); bctx.translate(b.x, b.y + Math.sin(b.bobP) * b.bobA); if (b.dir < 0) bctx.scale(-1, 1);
      drawBird(b, b.alpha * vis); bctx.restore();
    }
    birds = birds.filter(b => b.dir > 0 ? b.x < bw + 80 : b.x > -80);
  };
  requestAnimationFrame(birdFrame);
}

function frame(){
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime, now = performance.now();
  if (!Number.isFinite(camDistTarget) || !Number.isFinite(camDist)) camDist = camDistTarget = fitDist();      // never let a NaN stick
  const bq = ball.quaternion; if (!(Number.isFinite(bq.x) && Number.isFinite(bq.y) && Number.isFinite(bq.z) && Number.isFinite(bq.w))) { bq.set(0, 0, 0, 1); omega.set(0, 0, 0); }
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
    const onBall = Math.max(0, 1 - disco*2);                    // in disco the ball is only the mirror ball: no cover, no ring
    playing.mat.opacity = onBall * (1 - (playing.yt ? playing.yt.vis : 0));   // the cover steps aside as the video fades in over it
    playing.ringMat.opacity = (0.55 + 0.45*Math.sin(time*4)) * onBall;
    if (playing.mesh) { playing.mesh.visible = onBall > 0.01; playing.ring.visible = onBall > 0.01 && !!CONFIG.playingRing; }   // the amber ring is opt-in (playingRing in DISCO_CONFIG)
  }

  { const stp = dt / 1.5, df = discoTarget - disco; disco = Math.abs(df) <= stp ? discoTarget : disco + Math.sign(df) * stp; }   // a straight 1.5s ramp: the old exponential approach left a long faint tail (club lights hanging on at ~20% for seconds, then snapping off)
  DISCO.value = disco;
  coveMat.uniforms.uRoomVid.value += ((roomVideo() ? 1 : 0) - coveMat.uniforms.uRoomVid.value) * (1 - Math.exp(-dt*3));
  BALLROT.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(ball.quaternion.clone().invert()));
  if (coveMesh) coveMesh.visible = disco > 0.002;     // the 3D room is only drawn for disco; in the normal state only the ball is in the 3D scene
  applyDepth(); placeShadow();
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
  setTimeout(() => ytEnsure().catch(() => {}), 1500);        // boot the one persistent YouTube player in the background so the first double-tap isn't waiting on it
  faceLogo(2, true);                                        // on load: a logo slab square-on, centered and level, exactly as after a logo double-tap (instant, no turn)
  frame();
});
