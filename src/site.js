(function () {
  var btn = document.getElementById('copy-email');
  var el = document.getElementById('email');
  if (!btn || !el) return;
  btn.addEventListener('click', function () {
    var text = el.textContent.trim();
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy address'; }, 1800); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = 'Selected, press Ctrl+C';
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    } catch (e) { fallback(); }
  });
})();



(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var groups = Array.prototype.slice.call(document.querySelectorAll('.comp, .track .shot, .badge-comp'));
  // Each colour field drifts at its own rate; blue and red move in opposite directions.
  groups.forEach(function (g) {
    g._fields = Array.prototype.slice.call(g.querySelectorAll('.field')).map(function (f, i) {
      var dir = f.classList.contains('f-eu') ? 1 : -1;
      return { el: f, scroll: dir * (g.classList.contains('comp') ? 0.09 : 0.05), point: dir * (i + 1) * 9 };
    });
    g._img = g.querySelector('img');
    g._mx = 0; g._my = 0;
  });
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    groups.forEach(function (g) {
      var r = g.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var off = (r.top + r.height / 2) - vh / 2;
      g._fields.forEach(function (f) {
        f.el.style.setProperty('--py', (off * f.scroll + g._my * f.point).toFixed(1) + 'px');
        f.el.style.setProperty('--px', (g._mx * f.point).toFixed(1) + 'px');
      });
      if (g._img) {
        g._img.style.setProperty('--ix', (g._mx * -4).toFixed(1) + 'px');
        g._img.style.setProperty('--iy', (off * -0.02 + g._my * -4).toFixed(1) + 'px');
      }
    });
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  // Pointer parallax on the two large compositions (mouse and pen only).
  Array.prototype.forEach.call(document.querySelectorAll('.comp'), function (c) {
    c.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = c.getBoundingClientRect();
      c._mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      c._my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      request();
    });
    c.addEventListener('pointerleave', function () { c._mx = 0; c._my = 0; request(); });
  });
  request();
})();
