/* fit-text.js — a nagy statisztikai értékeket (.stat-value) automatikusan
   kicsinyíti, ha nem férnek ki a kártyán, hogy ne törjenek csúnyán új sorba.
   Tiszta CSS-sel nincs „shrink to fit", ezért méréssel oldjuk meg. */
(function () {
  var MIN = 14; // legkisebb megengedett betűméret (px)
  function fit(el) {
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = '';
    var max = parseFloat(getComputedStyle(el).fontSize) || 24;
    var size = max, guard = 0;
    while (el.scrollWidth > el.clientWidth + 1 && size > MIN && guard < 60) {
      size -= 1; guard++;
      el.style.fontSize = size + 'px';
    }
  }
  function fitAll() {
    var els = document.querySelectorAll('.stat-value');
    for (var i = 0; i < els.length; i++) fit(els[i]);
  }
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; fitAll(); });
  }
  function start() {
    schedule();
    try {
      var mo = new MutationObserver(schedule);
      mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    } catch (e) {}
    window.addEventListener('resize', schedule);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
