
(function () {
  'use strict';

  var LS_THEME = 'rendli_theme';
  var LS_MODE  = 'rendli_mode';
  var DEFAULT_THEME = 'kompakt';
  var DEFAULT_MODE  = 'auto';

  var THEMES = [
    { id: 'kompakt', name: 'Stúdió', desc: 'Tiszta, sans betűs, feszes rács.', sw: ['#3b5bdb', '#f5f7fb', '#2e9e6b'] }
  ];

  function themeExists(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return true;
    return false;
  }

  function getTheme() {
    var t;
    try { t = localStorage.getItem(LS_THEME); } catch (e) {}
    return themeExists(t) ? t : DEFAULT_THEME;
  }
  function getModePref() {
    var m;
    try { m = localStorage.getItem(LS_MODE); } catch (e) {}
    return (m === 'light' || m === 'dark' || m === 'auto') ? m : DEFAULT_MODE;
  }

  function isNightNow() {
    var h = new Date().getHours();
    return (h >= 19 || h < 6);
  }
  function effectiveMode(pref) {
    if (pref === 'light') return 'light';
    if (pref === 'dark')  return 'dark';
    return isNightNow() ? 'dark' : 'light';
  }

  function applyToDocument() {
    var theme = getTheme();
    var pref  = getModePref();
    var mode  = effectiveMode(pref);
    var root  = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);

    try {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      var surf = getComputedStyle(root).getPropertyValue('--surface').trim();
      if (surf) meta.setAttribute('content', surf);
    } catch (e) {}
  }

  function redrawCharts() {
    try {
      var biz = document.getElementById('tab-bizdash');
      if (biz && biz.classList.contains('active') && typeof window.renderBizDash === 'function') {
        window.renderBizDash();
      }
    } catch (e) {}
  }

  function apply() {
    applyToDocument();
    refreshAccountUI();
    redrawCharts();
  }

  window.setAppearanceTheme = function (id) {
    if (!themeExists(id)) return;
    try { localStorage.setItem(LS_THEME, id); } catch (e) {}
    apply();
  };
  window.setAppearanceMode = function (pref) {
    if (pref !== 'light' && pref !== 'dark' && pref !== 'auto') return;
    try { localStorage.setItem(LS_MODE, pref); } catch (e) {}
    apply();
  };

  window.refreshAppearanceControls = function () {
    buildThemeGrid();
    refreshAccountUI();
    var email = '';
    try { if (typeof LocalStore !== 'undefined' && LocalStore.currentUser) email = LocalStore.currentUser.email || ''; } catch (e) {}
    var el = document.getElementById('acct-email');
    if (el) el.textContent = email || '—';
  };

  window.openAccountModal = function () {
    if (typeof window.showTab === 'function') window.showTab('account');
  };

  function buildThemeGrid() {
    var grid = document.getElementById('acct-theme-grid');
    if (!grid || grid.getAttribute('data-built') === '1') return;
    grid.innerHTML = THEMES.map(function (t) {
      var sw = t.sw.map(function (c) { return '<span style="background:' + c + '"></span>'; }).join('');
      return '<button type="button" class="theme-option" data-theme-id="' + t.id + '" onclick="setAppearanceTheme(\'' + t.id + '\')">' +
               '<span class="theme-swatch">' + sw + '</span>' +
               '<span class="theme-name">' + t.name + '</span>' +
               '<span class="theme-desc">' + t.desc + '</span>' +
               '<span class="theme-check" data-check>&nbsp;</span>' +
             '</button>';
    }).join('');
    grid.setAttribute('data-built', '1');
  }

  function refreshAccountUI() {
    var theme = getTheme();
    var pref  = getModePref();
    var mode  = effectiveMode(pref);

    var opts = document.querySelectorAll('#acct-theme-grid .theme-option');
    for (var i = 0; i < opts.length; i++) {
      var sel = opts[i].getAttribute('data-theme-id') === theme;
      opts[i].classList.toggle('selected', sel);
      var chk = opts[i].querySelector('[data-check]');
      if (chk) chk.innerHTML = sel ? '✓ Kiválasztva' : '&nbsp;';
    }

    var segs = document.querySelectorAll('#acct-mode-seg [data-mode-pref]');
    for (var j = 0; j < segs.length; j++) {
      segs[j].classList.toggle('selected', segs[j].getAttribute('data-mode-pref') === pref);
    }

    var note = document.getElementById('acct-mode-note');
    if (note) {
      if (pref === 'auto') {
        note.textContent = 'Automatikus: 19:00 és 06:00 között sötét, egyébként világos. Most ' +
          (mode === 'dark' ? 'sötét' : 'világos') + ' változat aktív.';
      } else if (pref === 'dark') {
        note.textContent = 'Mindig sötét változat, a napszaktól függetlenül.';
      } else {
        note.textContent = 'Mindig világos változat, a napszaktól függetlenül.';
      }
    }
  }

  var _lastMode = null;
  function tick() {
    if (getModePref() !== 'auto') return;
    var m = effectiveMode('auto');
    if (m !== _lastMode) {
      _lastMode = m;
      apply();
    }
  }

  applyToDocument();
  _lastMode = effectiveMode(getModePref());

  document.addEventListener('DOMContentLoaded', function () {
    buildThemeGrid();
    refreshAccountUI();
  });

  setInterval(tick, 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick();
  });
})();
