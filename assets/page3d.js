/* Chaitrishodaya inner pages: live 3D header scene + tilt cards.
   A network globe of gold points, linked like a knowledge graph, with an orbit gate ring and
   signals travelling between nodes. Colour accent follows the page's lifecycle stage.
   Falls back to the static CSS background when WebGL is unavailable or motion is reduced. */
(function(){
  var hero = document.querySelector('.page-hero');
  if (!hero) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = window.THREE;
  function gl(){ try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch(e){ return false; } }
  var can3d = !!T && !reduce && gl();

  // stage accent per page
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var stage = { qaip:0, zentravix:0, scip:0, aria:0, bdis:0, mts:1, bct:1, utf:1, locator:1, aipq:2, aimo:3 };
  var accents = ['#E3B95A', '#93ADE6', '#F08A5D', '#5BC08A'];
  var accent = accents[stage[page] !== undefined ? stage[page] : 0];
  var stillName = ['gold', 'blue', 'coral', 'green'][stage[page] !== undefined ? stage[page] : 0];

  function tilt(){
    if (!can3d || !(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    document.querySelectorAll('#main .card, #main .tool, #main .person').forEach(function(el){
      if (el.closest('.page-hero')) return;
      el.classList.add('tilt');
      el.addEventListener('pointermove', function(e){ var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * 6).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 8).toFixed(2) + 'deg) translateZ(4px)';
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%'); });
      el.addEventListener('pointerleave', function(){ el.style.transform = ''; });
    });
  }

  function scene(){
    var cv = document.createElement('canvas'); cv.className = 'ph3d'; cv.setAttribute('aria-hidden', 'true');
    var R; try { R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch(e){ return false; }
    hero.insertBefore(cv, hero.firstChild);
    var tag = document.createElement('span'); tag.className = 'ph-tag'; tag.textContent = 'Live 3D · move your pointer'; hero.appendChild(tag);
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); R.setClearColor(0x000000, 0);
    var S = new T.Scene(), C = new T.PerspectiveCamera(45, 1, .1, 100); C.position.set(0, 0, 9);
    var tex = (function(){ var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), r = g.createRadialGradient(32,32,0,32,32,32);
      r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.25,'rgba(255,255,255,.7)'); r.addColorStop(.6,'rgba(255,255,255,.14)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0,0,64,64); return new T.CanvasTexture(c); })();
    function pmat(size){ return new T.PointsMaterial({ size: size, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }); }
    var G = new T.Group(); S.add(G); G.rotation.z = .18;
    var gold = new T.Color('#E3B95A'), pale = new T.Color('#FFF0C8'), acc = new T.Color(accent), c = new T.Color();

    // globe nodes (fibonacci sphere)
    var N = 380, RAD = 2.1, P = [], pos = [], col = [];
    for (var i = 0; i < N; i++){
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      var v = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(RAD * (1 + (Math.random() - .5) * .04)); P.push(v);
      pos.push(v.x, v.y, v.z); c.copy(gold).lerp(pale, Math.random() * .6).multiplyScalar(.55 + Math.random() * .45); col.push(c.r, c.g, c.b);
    }
    var ng = new T.BufferGeometry(); ng.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ng.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    G.add(new T.Points(ng, pmat(.11)));
    // knowledge-graph links: each node to its two nearest neighbours
    var lp = [];
    for (var a = 0; a < N; a++){
      var best = [[1e9, -1], [1e9, -1]];
      for (var b = 0; b < N; b++){ if (a === b) continue; var d = P[a].distanceToSquared(P[b]);
        if (d < best[1][0]){ if (d < best[0][0]){ best[1] = best[0]; best[0] = [d, b]; } else best[1] = [d, b]; } }
      for (var k = 0; k < 2; k++) if (best[k][1] > a){ var q = P[best[k][1]]; lp.push(P[a].x, P[a].y, P[a].z, q.x, q.y, q.z); }
    }
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
    G.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: gold, transparent: true, opacity: .26, blending: T.AdditiveBlending, depthWrite: false })));
    // core glow
    var core = new T.Sprite(new T.SpriteMaterial({ map: tex, color: 0xFFB648, transparent: true, opacity: .32, blending: T.AdditiveBlending, depthWrite: false })); core.scale.set(5.2, 5.2, 1); G.add(core);

    // signals: arcs above the surface with travelling pulses (accent colour)
    var arcs = [], AP = new Float32Array(26 * 3), AC = new Float32Array(26 * 3);
    for (var s = 0; s < 26; s++){
      var A = P[Math.floor(Math.random() * N)], B = P[Math.floor(Math.random() * N)]; if (A.distanceTo(B) < 1.2){ s--; continue; }
      var mid = A.clone().add(B).multiplyScalar(.5), lift = mid.length() < .01 ? new T.Vector3(0, 1, 0) : mid.clone().normalize();
      var curve = new T.QuadraticBezierCurve3(A, mid.clone().add(lift.multiplyScalar(RAD * .55 + A.distanceTo(B) * .35)), B);
      var g2 = new T.BufferGeometry().setFromPoints(curve.getPoints(40));
      var line = new T.Line(g2, new T.LineBasicMaterial({ color: acc, transparent: true, opacity: .22, blending: T.AdditiveBlending, depthWrite: false }));
      G.add(line); arcs.push({ curve: curve, t: Math.random(), v: .18 + Math.random() * .22, line: line });
    }
    var ag = new T.BufferGeometry(); ag.setAttribute('position', new T.BufferAttribute(AP, 3)); ag.setAttribute('color', new T.BufferAttribute(AC, 3));
    G.add(new T.Points(ag, pmat(.2)));

    // orbit gate ring
    var ring = new T.Mesh(new T.TorusGeometry(RAD * 1.45, .014, 8, 160), new T.MeshBasicMaterial({ color: gold, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = 1.15; ring.rotation.y = .25; G.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(RAD * 1.62, .006, 6, 160), new T.MeshBasicMaterial({ color: acc, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }));
    ring2.rotation.x = 1.25; ring2.rotation.y = -.15; G.add(ring2);
    var OP = new Float32Array(90 * 3), OC = new Float32Array(90 * 3), ot = []; for (var o = 0; o < 90; o++){ ot.push(Math.random()); }
    var og = new T.BufferGeometry(); og.setAttribute('position', new T.BufferAttribute(OP, 3)); og.setAttribute('color', new T.BufferAttribute(OC, 3));
    var orbitPts = new T.Points(og, pmat(.13)); orbitPts.rotation.copy(ring.rotation); G.add(orbitPts);

    // distant dust
    var dp = [], dc = []; for (var dd = 0; dd < 700; dd++){ var rr = 6 + Math.random() * 14, t1 = Math.random() * 6.283, t2 = Math.acos(Math.random() * 2 - 1);
      dp.push(rr * Math.sin(t2) * Math.cos(t1), rr * Math.cos(t2) * .6, -Math.abs(rr * Math.sin(t2) * Math.sin(t1)) - 2); var bb = .2 + Math.random() * .5; dc.push(bb, bb * .95, bb * .8); }
    var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.Float32BufferAttribute(dp, 3)); dg.setAttribute('color', new T.Float32BufferAttribute(dc, 3));
    S.add(new T.Points(dg, pmat(.12)));

    var mx = 0, my = 0, cx = 0, cy = 0, W = 0, H = 0, running = false, onScreen = true, last = performance.now(), time = 0, sp = 0;
    hero.addEventListener('pointermove', function(e){ var r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; });
    hero.addEventListener('pointerleave', function(){ mx = my = 0; });
    function resize(){ W = hero.clientWidth; H = hero.clientHeight; R.setSize(W, H, false); C.aspect = W / Math.max(1, H); C.updateProjectionMatrix();
      var wide = W >= 900; G.position.set(wide ? Math.max(2.3, Math.min(4.3, 1.75 * C.aspect)) : 1.2, wide ? 0 : 1.1, wide ? 0 : -3); var s0 = wide ? 1 : .9; G.scale.set(s0, s0, s0); }
    addEventListener('resize', resize); resize();
    addEventListener('scroll', function(){ var r = hero.getBoundingClientRect(); sp = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height))); }, { passive: true });
    var V = new T.Vector3();
    function frame(now){
      if (!running) return;
      var dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; time += dt;
      cx += (mx - cx) * .05; cy += (my - cy) * .05;
      C.position.set(cx * .7, -cy * .4 + sp * .8, 9 - sp * 2.5); C.lookAt(0, 0, 0);
      G.rotation.y += dt * (.09 + sp * .3);
      ring.rotation.z += dt * .22; ring2.rotation.z -= dt * .14; orbitPts.rotation.z = ring.rotation.z;
      core.material.opacity = .26 + .08 * Math.sin(time * 1.2);
      for (var i = 0; i < arcs.length; i++){ var a = arcs[i]; a.t += a.v * dt; if (a.t > 1.25) a.t = 0;
        var tt = Math.min(1, a.t); a.curve.getPoint(tt, V); AP[i*3] = V.x; AP[i*3+1] = V.y; AP[i*3+2] = V.z;
        var f = a.t > 1 ? Math.max(0, 1 - (a.t - 1) * 4) : Math.min(1, a.t * 6); AC[i*3] = acc.r * f; AC[i*3+1] = acc.g * f; AC[i*3+2] = acc.b * f;
        a.line.material.opacity = .12 + .25 * f; }
      ag.attributes.position.needsUpdate = true; ag.attributes.color.needsUpdate = true;
      var RR = RAD * 1.45;
      for (var o = 0; o < 90; o++){ ot[o] = (ot[o] + dt * .05) % 1; var an = ot[o] * 6.283; OP[o*3] = Math.cos(an) * RR; OP[o*3+1] = Math.sin(an) * RR; OP[o*3+2] = 0;
        var w = .35 + .65 * Math.pow(Math.sin(ot[o] * 3.14159 * 6) * .5 + .5, 3); c.copy(gold).lerp(pale, .4).multiplyScalar(w); OC[o*3] = c.r; OC[o*3+1] = c.g; OC[o*3+2] = c.b; }
      og.attributes.position.needsUpdate = true; og.attributes.color.needsUpdate = true;
      R.render(S, C); requestAnimationFrame(frame);
    }
    function setRun(){ var want = onScreen && !document.hidden; if (want && !running){ running = true; last = performance.now(); requestAnimationFrame(frame); } else if (!want) running = false; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ onScreen = es[0].isIntersecting; setRun(); }, { threshold: .01 }).observe(hero);
    document.addEventListener('visibilitychange', setRun); setRun();
    window.__page3d = true;
    return true;
  }

  var live = false;
  if (can3d) { try { live = scene(); } catch(e){ live = false; } }
  if (!live) { hero.classList.add('ph-still'); hero.setAttribute('data-still', stillName); }  // pre-rendered picture of the same 3D scene
  tilt();
})();
