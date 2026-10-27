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
          var n = +b.getAttribute('data-count'), from = +(b.getAttribute('data-from') || 0), dec = +(b.getAttribute('data-dec') || 0), pre = b.getAttribute('data-prefix') || '', suf = b.getAttribute('data-suffix') || '', st = performance.now();
          (function f(now){ var k = Math.min(1, (now - st) / 1400), v = from + (n - from) * (1 - Math.pow(1 - k, 3)); b.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + suf; if (k < 1) requestAnimationFrame(f); })(st);
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

  /* site assistant: answers from the site's own knowledge base, in the browser */
  (function(){
    var btn = document.querySelector('.ask-btn'), panel = document.getElementById('askPanel'), kbEl = document.getElementById('askKB');
    if (!btn || !panel || !kbEl) return;
    var KB = JSON.parse(kbEl.textContent), log = document.getElementById('askLog'), chips = document.getElementById('askChips');
    var form = document.getElementById('askForm'), input = document.getElementById('askInput'), started = false, lead = null, lastQ = '';
    var STOP = 'a an the is are am be to of for and or in on at by with do does did you your we our us i me my it this that what which how can could would should will about tell please there any from have has get'.split(' ');
    var SYN = {cost:'price',costs:'price',pricing:'price',fee:'price',fees:'price',charge:'price',charges:'price',quote:'price',budget:'price',
               banks:'bank',banking:'bank',nbfc:'bank',kyc:'bank',rbi:'bank',bangalore:'bengaluru',testing:'test',tests:'test',tested:'test',
               agents:'agent',agentic:'agent',demos:'demo',videos:'demo',video:'demo',founders:'founder',ceo:'founder',secure:'security',
               cheaper:'cheap',saving:'cheap',savings:'cheap',onprem:'premises',contact:'talk',call:'talk',email:'talk',phone:'talk'};
    function stem(w){ w = SYN[w] || w; if (w.length > 4) w = w.replace(/(ing|ed|es|s)$/,''); return SYN[w] || w; }
    function toks(t){ return (t.toLowerCase().match(/[a-z0-9₹%-]+/g) || []).filter(function(w){ return STOP.indexOf(w) < 0 && w.length > 1; }).map(stem); }
    var docs = KB.map(function(e){ return {e:e, k:toks(e.k + ' ' + e.t), t:toks(e.t), a:toks(e.a)}; });
    var df = {}; docs.forEach(function(d){ var seen = {}; d.k.concat(d.a).forEach(function(w){ if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
    function idf(w){ return Math.log(1 + (docs.length - (df[w] || 0) + .5) / ((df[w] || 0) + .5)); }
    function score(q){
      var qt = toks(q);
      if (!qt.length) qt = (q.toLowerCase().match(/[a-z0-9]+/g) || []).map(stem);
      if (!qt.length) return null;
      var best = null;
      docs.forEach(function(d){
        var s = 0;
        qt.forEach(function(w){
          var i = idf(w);
          if (d.k.indexOf(w) >= 0) s += 3 * i;
          if (d.t.indexOf(w) >= 0) s += 1.5 * i;
          if (d.a.indexOf(w) >= 0) s += .6 * i;
        });
        s = s / Math.sqrt(qt.length);
        if (!best || s > best.s) best = {s:s, e:d.e};
      });
      return best;
    }
    function el(tag, cls, html){ var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
    function esc(t){ return t.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function scroll(){ log.scrollTop = log.scrollHeight; }
    function user(t){ var m = el('div', 'msg me'); m.textContent = t; log.appendChild(m); scroll(); }
    function bot(text, links, next, delay){
      var typing = el('div', 'msg bot typing', '<span></span><span></span><span></span>'); log.appendChild(typing); scroll();
      chips.innerHTML = '';
      setTimeout(function(){
        typing.remove();
        var m = el('div', 'msg bot'); m.appendChild(el('p', null, esc(text)));
        if (links && links.length) { var l = el('div', 'msg-links'); links.forEach(function(x){ var a = el('a', null, esc(x[0]) + ' <span aria-hidden="true">→</span>'); a.href = x[1]; l.appendChild(a); }); m.appendChild(l); }
        log.appendChild(m); scroll(); setChips(next);
      }, still ? 0 : (delay || Math.min(1100, 380 + text.length * 4)));
    }
    function setChips(list){
      chips.innerHTML = '';
      (list || []).forEach(function(t){ var c = el('button', 'chip'); c.type = 'button'; c.textContent = t; c.addEventListener('click', function(){ ask(t); }); chips.appendChild(c); });
    }
    function find(t){ for (var i = 0; i < KB.length; i++) if (KB[i].t.toLowerCase() === t.toLowerCase()) return KB[i]; return null; }
    function startLead(q){
      lead = {step:'name', q:q || lastQ};
      bot('Happy to connect you with a founder. What is your name?', null, []);
      input.placeholder = 'Your name';
    }
    function leadStep(t){
      if (lead.step === 'name') { lead.name = t; lead.step = 'email'; input.placeholder = 'Work email'; bot('Thanks, ' + t.split(' ')[0] + '. What is the best email to reach you?', null, []); return; }
      if (lead.step === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { bot('That email does not look right. Could you check it?', null, []); return; }
        lead.email = t; lead.step = 'msg'; input.placeholder = 'Your question or a line about your AI system';
        bot(lead.q ? 'And your question was: “' + lead.q + '”. Add anything else, or type “send”.' : 'What would you like to ask, or what AI system should we look at?', null, lead.q ? ['send'] : []); return;
      }
      if (lead.step === 'msg') {
        var msg = (t.toLowerCase() === 'send' ? '' : t), fd = new FormData();
        fd.append('form_type', 'site-assistant'); fd.append('name', lead.name); fd.append('email', lead.email);
        fd.append('message', [lead.q, msg].filter(Boolean).join('\n\n') || '(no message)'); fd.append('page', location.pathname);
        lead = null; input.placeholder = 'Ask about services, banking, pricing…';
        var typing = el('div', 'msg bot typing', '<span></span><span></span><span></span>'); log.appendChild(typing); scroll();
        fetch('https://formspree.io/f/mdenzqll', {method:'POST', headers:{'Accept':'application/json'}, body:fd})
          .then(function(r){ if (!r.ok) throw 0; typing.remove(); bot('Sent. A founder will reply within one business day. Anything else I can help with?', null, ['What do you do?', 'See a demo'], 200); })
          .catch(function(){ typing.remove(); bot('Sorry, that did not go through. Please try the contact form instead.', [['Contact form', 'index.html#contact']], [], 200); });
      }
    }
    function ask(t){
      t = (t || '').trim(); if (!t) return;
      user(t); input.value = '';
      if (lead) { leadStep(t); return; }
      var e = find(t), nq = t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!e && nq.length >= 6) for (var i = 0; i < KB.length; i++) if ((' ' + KB[i].k + ' ').indexOf(' ' + nq + ' ') >= 0) { e = KB[i]; break; }
      if (!e) { var r = score(t); if (r && r.s >= 1.6) e = r.e; }
      if (e && e.id === 'human') { startLead(lastQ); return; }
      if (!e) { lastQ = t; bot('I don’t have a confident answer to that from our site, and I’d rather not guess. Shall I pass your question to a founder?', null, ['Yes, contact a founder', 'Services', 'Banking and RBI']); return; }
      lastQ = t; bot(e.a, e.l, e.n);
    }
    var _ask = ask; ask = function(t){ if (t === 'Yes, contact a founder') { user(t); startLead(lastQ); return; } _ask(t); };
    function open(o){
      panel.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); btn.classList.toggle('on', o);
      if (o && !started) { started = true; bot('Hello! I’m the Chaitrishodaya assistant. Ask me about our services, our eleven AI systems, banking and RBI, or how to start.', null, ['What do you do?', 'Banking and RBI', 'See a demo', 'How do we start?', 'Pricing', 'Talk to a founder'], 450); }
      if (o) setTimeout(function(){ input.focus(); }, 60);
    }
    btn.addEventListener('click', function(){ open(panel.hidden); });
    panel.querySelector('.ask-x').addEventListener('click', function(){ open(false); btn.focus(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
    form.addEventListener('submit', function(e){ e.preventDefault(); ask(input.value); });
    document.querySelectorAll('[data-ask]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); open(true); }); });
  })();

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
