(function(){
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header shadow + mobile menu */
  var hdr = document.querySelector('.site-header');
  if (hdr) {
    var onScroll = function(){ hdr.classList.toggle('scrolled', window.scrollY > 8); };
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
    var burger = hdr.querySelector('.burger'), menu = hdr.querySelector('.menu');
    if (burger && menu) {
      burger.addEventListener('click', function(){
        var open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }); });
    }
  }

  /* only one video plays at a time */
  var vids = document.querySelectorAll('video');
  vids.forEach(function(v){ v.addEventListener('play', function(){ vids.forEach(function(o){ if (o !== v) o.pause(); }); }); });

  /* rise-in + count-up (html.js is set in <head> only when this can run) */
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(function(b){
          var n = +b.getAttribute('data-count'), pre = b.getAttribute('data-prefix') || '', suf = b.getAttribute('data-suffix') || '', st = performance.now();
          (function f(now){ var k = Math.min(1, (now - st) / 1200); b.textContent = pre + Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN') + suf; if (k < 1) requestAnimationFrame(f); })(st);
        });
        io.unobserve(e.target);
      });
    }, {threshold: .08, rootMargin: '0px 0px -40px 0px'});
    document.querySelectorAll('.rise').forEach(function(el){ io.observe(el); });
  } else { document.documentElement.classList.remove('js'); }

  /* roadmap: the active step moves along the line; hover or focus picks a step */
  document.querySelectorAll('.roadmap').forEach(function(rm){
    var steps = rm.querySelectorAll('.rm-step'), i = 0, timer = null;
    function set(k){ steps.forEach(function(s, j){ s.classList.toggle('on', j === k); }); i = k; }
    function play(){ if (still) return; stop(); timer = setInterval(function(){ set((i + 1) % steps.length); }, 2600); }
    function stop(){ if (timer) clearInterval(timer); timer = null; }
    steps.forEach(function(s, j){
      s.addEventListener('mouseenter', function(){ stop(); set(j); });
      s.addEventListener('focusin', function(){ stop(); set(j); });
    });
    rm.addEventListener('mouseleave', play);
    set(0); play();
  });

  /* 60-second AI risk check */
  var rc = document.getElementById('riskCheck');
  if (rc) {
    var qItems = rc.querySelectorAll('.q'), prog = rc.querySelector('.qprog i'), out = document.getElementById('riskResult');
    var update = function(){
      var answered = 0, yes = 0, gaps = [];
      qItems.forEach(function(q){
        var c = q.querySelector('input:checked');
        if (c) { answered++; if (c.value === 'yes') yes++; else gaps.push(q.getAttribute('data-gap')); }
      });
      prog.style.width = (answered / qItems.length * 100) + '%';
      if (answered < qItems.length) { out.hidden = true; return; }
      var band = yes >= 7 ? ['Strong foundations', 'Your AI has most of the controls we look for. A short review can confirm the evidence holds up.'] :
                 yes >= 4 ? ['Some gaps', 'Some important controls are missing. These are usually quick to close once they are named.'] :
                            ['High risk', 'Your AI could be wrong without anyone noticing, and you may not be able to prove what it did.'];
      out.querySelector('b').textContent = yes + '/' + qItems.length;
      out.querySelector('.band').textContent = band[0];
      out.querySelector('.msg').textContent = band[1];
      var ul = out.querySelector('ul'); ul.innerHTML = '';
      gaps.slice(0, 4).forEach(function(g){ var li = document.createElement('li'); li.textContent = g; ul.appendChild(li); });
      ul.hidden = !gaps.length; out.querySelector('.gl').hidden = !gaps.length;
      out.hidden = false;
      var f = document.getElementById('cf-message'); if (f && !f.value) f.value = 'Risk check score: ' + yes + '/' + qItems.length + ' (' + band[0] + ').';
    };
    rc.addEventListener('change', update);
  }

  /* cost of a bad AI answer (illustrative calculator) */
  var calc = document.getElementById('calc');
  if (calc) {
    var inr = function(n){ return '₹' + Math.round(n).toLocaleString('en-IN'); };
    var num = function(n){ return Math.round(n).toLocaleString('en-IN'); };
    var run = function(){
      var v = {}; calc.querySelectorAll('input').forEach(function(i){ v[i.name] = +i.value; var o = calc.querySelector('output[for="' + i.id + '"]'); if (o) o.textContent = i.dataset.fmt === 'inr' ? inr(i.value) : (i.dataset.fmt === 'pct' ? i.value + '%' : num(i.value)); });
      var wrong = v.volume * v.wrong / 100, costly = wrong * v.impact / 100, exposure = costly * v.cost, kept = exposure * (1 - v.caught / 100);
      document.getElementById('cWrong').textContent = num(wrong);
      document.getElementById('cCostly').textContent = num(costly);
      document.getElementById('cExposure').textContent = inr(exposure);
      document.getElementById('cKept').textContent = inr(kept);
    };
    calc.addEventListener('input', run); run();
  }

  /* every lead form posts to the same inbox (Formspree) */
  document.querySelectorAll('form[data-form]').forEach(function(f){
    var s = f.querySelector('.status');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (!f.checkValidity()) { s.className = 'status'; s.textContent = 'Please add your name, a valid work email and a short message.'; return; }
      s.className = 'status'; s.textContent = 'Sending…';
      fetch('https://formspree.io/f/mdenzqll', {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(f)})
        .then(function(r){ if (!r.ok) throw new Error(); s.className = 'status ok'; s.textContent = 'Thank you. We will reply within one business day.'; f.reset(); })
        .catch(function(){ s.className = 'status'; s.textContent = 'The message could not be sent just now. Please try again in a moment, or message us on LinkedIn.'; });
    });
  });

  /* quick message panel (goes to the inbox; no phone number is shown) */
  var cb = document.querySelector('.chat-btn'), cp = document.getElementById('chatPanel');
  if (cb && cp) {
    var setOpen = function(o){ cp.hidden = !o; cb.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) { var f1 = document.getElementById('qm-name'); if (f1) f1.focus(); } };
    cb.addEventListener('click', function(){ setOpen(cp.hidden); });
    cp.querySelector('.chat-close').addEventListener('click', function(){ setOpen(false); cb.focus(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !cp.hidden) { setOpen(false); cb.focus(); } });
    var qf = document.getElementById('chatForm'), qs = document.getElementById('qm-status');
    qf.addEventListener('submit', function(e){
      e.preventDefault();
      if (!qf.checkValidity()) { qs.className = 'status'; qs.textContent = 'Please add your name, an email or phone number, and a message.'; return; }
      qs.className = 'status'; qs.textContent = 'Sending…';
      fetch('https://formspree.io/f/mdenzqll', {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(qf)})
        .then(function(r){ if (!r.ok) throw new Error(); qs.className = 'status ok'; qs.textContent = 'Thank you. Your message has reached us.'; qf.reset(); })
        .catch(function(){ qs.className = 'status'; qs.textContent = 'The message could not be sent just now. Please try again in a moment.'; });
    });
  }

  /* hero: AI outputs flowing through evaluate -> gate -> audit */
  var c = document.getElementById('aiCanvas');
  if (!c) return;
  var x = c.getContext('2d'), W = 0, H = 0;
  function size(){ var r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
  size(); addEventListener('resize', size);
  var css = getComputedStyle(document.documentElement);
  function tok(n){ return css.getPropertyValue(n).trim(); }
  var DOT = tok('--stage-dot'), GOLD = tok('--stage-goldrgb'), FLAG = tok('--stage-flagrgb');
  var G = [.2, .5, .8], parts = [], flashes = [0, 0, 0], passed = 0, blocked = 0;
  var elP = document.getElementById('hudPassed'), elB = document.getElementById('hudBlocked');
  function spread(p){
    if (p < G[0]) return 1 - .82 * (p / G[0]);
    if (p > G[2]) return .18 + .82 * ((p - G[2]) / (1 - G[2]));
    var s = Math.sin(Math.PI * (p - G[0]) / (G[1] - G[0]));
    return .18 + .82 * s * s;
  }
  function spawn(){ parts.push({p: 0, yb: Math.random() * 2 - 1, v: .085 + Math.random() * .05, flag: false, state: 'flow', a: 1, r: 1.6 + Math.random() * 1.8, gold: 0}); }
  for (var i = 0; i < 60; i++) { spawn(); parts[i].p = Math.random(); }
  var last = performance.now(), acc = 0, score = [], sc = .935;
  for (var k = 0; k < 60; k++) { sc += (Math.random() - .5) * .012; sc = Math.min(.975, Math.max(.905, sc)); score.push(sc); }
  function frame(now){
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var cy = H * .5, A = H * .2;
    x.clearRect(0, 0, W, H);
    // faint dot grid
    x.fillStyle = 'rgba(' + DOT + ',.08)';
    for (var gx = 22; gx < W; gx += 26) for (var gy = 22; gy < H; gy += 26) { x.fillRect(gx, gy, 1.2, 1.2); }
    // guide lanes
    x.strokeStyle = 'rgba(' + GOLD + ',.22)'; x.lineWidth = 1;
    [-1, 1].forEach(function(sg){ x.beginPath(); for (var q = 0; q <= 1.0001; q += .01) { var yy = cy + sg * A * spread(q); q ? x.lineTo(q * W, yy) : x.moveTo(q * W, yy); } x.stroke(); });
    // spawn
    acc += dt; while (acc > .07) { spawn(); acc -= .07; }
    // particles
    parts = parts.filter(function(o){
      var p0 = o.p; o.p += o.v * dt * (o.state === 'flow' ? 1 : .6);
      if (o.state === 'flow') {
        if (p0 < G[0] && o.p >= G[0]) { flashes[0] = 1; if (Math.random() < .13) o.flag = true; }
        if (p0 < G[1] && o.p >= G[1]) { flashes[1] = 1; if (o.flag) { o.state = 'drop'; o.dx = G[1] * W; o.dy = cy + o.yb * A * spread(G[1]); blocked++; } }
        if (p0 < G[2] && o.p >= G[2]) { flashes[2] = 1; o.gold = 1; passed++; }
      }
      var px, py;
      if (o.state === 'drop') { o.dy += dt * H * .32; o.dx += (Math.random() - .5) * .6; o.a -= dt * .9; px = o.dx; py = o.dy; }
      else { px = o.p * W; py = cy + o.yb * A * spread(o.p); }
      if (o.a <= 0 || o.p > 1.02) return false;
      var col = o.flag ? FLAG : (o.gold ? GOLD : DOT), al = o.a * (o.state === 'drop' ? .8 : .85);
      var g = x.createRadialGradient(px, py, 0, px, py, o.r * 4);
      g.addColorStop(0, 'rgba(' + col + ',' + (al * .35) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, o.r * 4, 0, 6.283); x.fill();
      x.fillStyle = 'rgba(' + col + ',' + al + ')'; x.beginPath(); x.arc(px, py, o.r, 0, 6.283); x.fill();
      return true;
    });
    // gates
    G.forEach(function(gp, i){
      var gx = gp * W, base = 24 + (i === 1 ? 4 : 0);
      flashes[i] = Math.max(0, flashes[i] - dt * 2.2);
      var glow = x.createRadialGradient(gx, cy, base * .3, gx, cy, base * 2.4);
      glow.addColorStop(0, 'rgba(' + GOLD + ',' + (.16 + flashes[i] * .22) + ')'); glow.addColorStop(1, 'rgba(' + GOLD + ',0)');
      x.fillStyle = glow; x.beginPath(); x.arc(gx, cy, base * 2.4, 0, 6.283); x.fill();
      x.strokeStyle = 'rgba(' + GOLD + ',' + (.65 + flashes[i] * .35) + ')'; x.lineWidth = 1.6;
      x.beginPath(); x.arc(gx, cy, base, 0, 6.283); x.stroke();
      x.strokeStyle = 'rgba(' + GOLD + ',.28)'; x.lineWidth = 1;
      x.beginPath(); x.arc(gx, cy, base + 7 + flashes[i] * 6, 0, 6.283); x.stroke();
      x.fillStyle = 'rgba(' + GOLD + ',.9)'; x.beginPath(); x.arc(gx, cy, 3, 0, 6.283); x.fill();
    });
    // quality score sparkline against the 0.90 threshold
    var sx0 = W * .58, sx1 = W - 26, sy1 = H - 46, sy0 = H - 96;
    if (Math.random() < dt * 4) { sc += (Math.random() - .5) * .012; sc = Math.min(.975, Math.max(.905, sc)); score.push(sc); score.shift(); }
    var Y = function(v){ return sy1 - (v - .86) / (.98 - .86) * (sy1 - sy0); };
    x.setLineDash([4, 4]); x.strokeStyle = 'rgba(' + FLAG + ',.55)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(sx0, Y(.9)); x.lineTo(sx1, Y(.9)); x.stroke(); x.setLineDash([]);
    x.strokeStyle = 'rgba(' + GOLD + ',.9)'; x.lineWidth = 1.6; x.beginPath();
    score.forEach(function(v, i){ var px = sx0 + (sx1 - sx0) * i / (score.length - 1); i ? x.lineTo(px, Y(v)) : x.moveTo(px, Y(v)); }); x.stroke();
    if (elP) elP.textContent = passed.toLocaleString('en-IN');
    if (elB) elB.textContent = blocked.toLocaleString('en-IN');
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
