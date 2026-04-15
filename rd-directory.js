/**
 * Vedic Nutrition — RD directory (mounts into #vedic-rd-directory)
 *
 * Source of truth: Google Sheet via Apps Script API.
 *   mode=providers  — full roster (surface=profile, activeOnly)
 *   mode=facets     — insurance list for main-page dropdown
 *   mode=availability — batched FreeBusy, early-exit per calendar
 *
 * DEFAULT providers render instantly (no FreeBusy).
 * TRUE providers render blurred + spinner, then unblur/hide after availability check.
 * FALSE / inactive rows are excluded server-side.
 *
 * Embeds:
 *   Main page:     data-vd-main="true"
 *   SEO landings (no search bar; accepting=yes; DEFAULT always on top, merge if no match):
 *     Insurance:  data-fixed-insurance="Anthem"  or URL /insurance/anthem
 *     Condition:  data-fixed-condition="GLP-1"   or URL /condition/glp-1  (plural /conditions/… also)
 *     Location:   data-fixed-location="Austin"   or URL /location/austin  (plural /locations/… also)
 */
(function () {
  'use strict';

  var SLOT_WINDOW_DAYS = 21;
  var SKELETON_COUNT = 3;
  var BOOK_PATH = '/dietitians';

  var STYLES =
    ':root{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740}' +
    '#vedic-rd-directory{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740;--vd-header-offset:88px;padding-top:var(--vd-header-offset);box-sizing:border-box;position:relative}' +
    '.vd-embed-root{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}' +
    '.vd-controls{max-width:1100px;margin:16px auto 12px;padding:16px 20px;border:1px solid var(--vd-border);border-radius:12px;background:var(--vd-card);box-shadow:var(--vd-shadow);display:flex;flex-wrap:wrap;gap:.75rem;align-items:stretch;box-sizing:border-box}' +
    '@media screen and (max-width:991px){.vd-controls{flex-direction:column;align-items:stretch;gap:.65rem;padding:14px 16px}.vd-controls #vd-search,.vd-controls select{flex:1 1 auto!important;width:100%!important;max-width:100%!important;min-width:0!important}}' +
    '#vedic-rd-directory.vd-main-mode .vd-controls{display:flex!important;flex-wrap:wrap!important;visibility:visible!important;opacity:1!important;min-height:0}' +
    '#vedic-rd-directory.vd-fixed-landing-mode .vd-controls,#vedic-rd-directory.vd-insurance-mode .vd-controls{display:none!important}' +
    '#vedic-rd-directory.vd-fixed-landing-mode .vd-count--loading,#vedic-rd-directory.vd-insurance-mode .vd-count--loading{margin-top:4px}' +
    '#vedic-rd-directory input.vd-search-input,#vedic-rd-directory #vd-search{display:block!important;visibility:visible!important;opacity:1!important;-webkit-appearance:none;appearance:none;box-sizing:border-box;min-height:44px!important;flex:1 1 220px;max-width:100%;width:auto!important;min-width:120px!important;border:1px solid var(--vd-border);border-radius:8px;padding:10px 14px;font-size:15px!important;line-height:1.3!important;color:var(--vd-text)!important;background:#fff!important}' +
    '#vedic-rd-directory input.vd-search-input::placeholder,#vedic-rd-directory #vd-search::placeholder{color:var(--vd-muted)}' +
    '.vd-controls select{border:1px solid var(--vd-border);border-radius:8px;padding:10px 14px;font-size:15px;flex:1 1 180px;min-height:44px;background:#fff;color:var(--vd-text);box-sizing:border-box}' +
    '.vd-grid{display:flex;flex-direction:column;gap:16px;max-width:1100px;margin:0 auto;width:100%;box-sizing:border-box;padding:0 0 24px}' +
    '.vd-profile-card{border:1px solid var(--vd-border);border-radius:16px;padding:28px;box-shadow:var(--vd-shadow);display:flex;gap:28px;flex-wrap:wrap;background:var(--vd-card);transition:box-shadow .3s ease;overflow:visible;box-sizing:border-box;min-width:0;position:relative}' +
    '.vd-profile-card:hover{box-shadow:var(--vd-shadow-hover)}' +
    '.vd-profile-left{flex:0 0 120px;text-align:center;min-width:0}' +
    '.vd-profile-left img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid var(--vd-border);display:block;margin:0 auto}' +
    '.vd-profile-right{flex:1;min-width:0;overflow:visible}' +
    '.vd-profile-name{margin:0 0 6px;font-size:1.375rem;font-weight:700;color:var(--vd-text);line-height:1.3}' +
    '.vd-line{font-size:.875rem;color:var(--vd-muted);margin:5px 0;line-height:1.6;word-wrap:break-word;overflow-wrap:anywhere}' +
    '.vd-line strong{color:var(--vd-text);font-weight:600}' +
    '.vd-tags-wrapper{margin-top:12px}' +
    '.vd-tags{display:flex;flex-wrap:wrap;gap:6px}' +
    '.vd-tag-pill{display:inline-flex;align-items:center;padding:5px 12px;background:#fff;border:1.5px solid var(--vd-accent);color:var(--vd-accent);border-radius:16px;font-size:.75rem;font-weight:600;white-space:nowrap}' +
    '.vd-bio{margin-top:12px;font-size:.875rem;color:var(--vd-muted);line-height:1.7}' +
    '.vd-bio-text{display:block}' +
    '.vd-bio-toggle{display:none;background:none;border:none;color:var(--vd-primary);font-size:.875rem;font-weight:600;padding:4px 0;cursor:pointer;margin-top:4px}' +
    '.vd-bio-toggle:hover{color:var(--vd-primary-hover)}' +
    '.vd-specialties-wrapper{margin-top:14px}' +
    '.vd-specialties-label{font-size:.875rem;color:var(--vd-text);font-weight:600;display:block;margin-bottom:8px}' +
    '.vd-specialties{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '.vd-specialty-tag{display:inline-flex;align-items:center;padding:6px 12px;background:#f9fafb;border:1px solid var(--vd-border);border-radius:8px;font-size:.8125rem;color:var(--vd-text);font-weight:500;white-space:nowrap}' +
    '.vd-more-spec{display:inline-flex;align-items:center;background:none;border:none;color:var(--vd-primary);font-weight:600;cursor:pointer;padding:6px 8px;font-size:.8125rem;border-radius:6px}' +
    '.vd-more-spec:hover{color:var(--vd-primary-hover);background:rgba(24,106,208,.08)}' +
    '.vd-hidden-spec{display:none}' +
    '.vd-hidden-spec.vd-show{display:contents}' +
    '.vd-actions{margin-top:24px;padding-top:24px;border-top:2px solid var(--vd-border);display:flex;flex-wrap:wrap;gap:12px;align-items:center}' +
    '.vd-btn{display:inline-block;background:var(--vd-primary);color:#fff!important;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:1.05rem;transition:all .2s ease;box-shadow:0 4px 12px rgba(24,106,208,.25);border:2px solid var(--vd-primary);box-sizing:border-box}' +
    '.vd-btn:hover{background:var(--vd-primary-hover);border-color:var(--vd-primary-hover);transform:translateY(-2px);box-shadow:0 8px 24px rgba(24,106,208,.35)}' +
    '.vd-count{max-width:1100px;margin:0 auto 10px;font-size:.875rem;color:var(--vd-muted);min-height:1.5em;box-sizing:border-box;padding:0 4px}' +
    '.vd-count--loading{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem .65rem;padding:6px 4px 10px;color:var(--vd-text);font-size:.9375rem;font-weight:500;line-height:1.4}' +
    '.vd-count-msg{flex:1;min-width:0}' +
    '.vd-count-spinner{flex-shrink:0;width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(24,106,208,.18);border-top-color:var(--vd-primary);animation:vd-count-spin .7s linear infinite;box-sizing:border-box}' +
    '@keyframes vd-count-spin{to{transform:rotate(360deg)}}' +
    '.vd-status{max-width:1100px;margin:8px auto;text-align:center;color:var(--vd-muted);font-size:.875rem;box-sizing:border-box}' +
    '.vd-card-hidden{display:none!important}' +
    '.vd-card-reveal{animation:vd-fade-in .35s ease forwards}' +
    '@keyframes vd-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '.vd-skeleton{border:1px solid var(--vd-border);border-radius:16px;padding:28px;background:var(--vd-card);display:flex;gap:28px;min-height:160px;animation:vd-pulse 1.4s ease-in-out infinite}' +
    '.vd-skeleton-avatar{width:120px;height:120px;border-radius:50%;background:#e5e7eb;flex-shrink:0}' +
    '.vd-skeleton-lines{flex:1;display:flex;flex-direction:column;gap:12px;padding-top:8px}' +
    '.vd-skeleton-line{height:14px;background:#e5e7eb;border-radius:6px}' +
    '.vd-skeleton-line:first-child{width:45%;height:20px}' +
    '.vd-skeleton-line:nth-child(2){width:70%}' +
    '.vd-skeleton-line:nth-child(3){width:55%}' +
    '.vd-skeleton-line:nth-child(4){width:35%}' +
    '@keyframes vd-pulse{0%,100%{opacity:1}50%{opacity:.45}}' +
    '.vd-card-checking .vd-profile-left,.vd-card-checking .vd-profile-right{filter:blur(4px);opacity:.5;transition:filter .4s ease,opacity .4s ease;pointer-events:none;-webkit-user-select:none;user-select:none}' +
    '.vd-card-checking::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;border:3px solid rgba(24,106,208,.15);border-top-color:var(--vd-primary);animation:vd-spin .7s linear infinite;z-index:2}' +
    '@keyframes vd-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){.vd-skeleton,.vd-card-checking::after,.vd-count-spinner{animation:none;border-color:rgba(24,106,208,.45)}}' +
    '@media (max-width:720px){.vd-profile-card{padding:16px;gap:12px;flex-direction:row;flex-wrap:nowrap;align-items:flex-start}.vd-profile-left{flex:0 0 70px}.vd-profile-left img{width:70px;height:70px;border-width:2px}.vd-profile-right{flex:1;min-width:0}.vd-profile-name{font-size:1.1rem}.vd-line{font-size:.8rem}.vd-bio-text{display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.vd-bio-text.vd-expanded{display:block;-webkit-line-clamp:unset;line-clamp:unset}.vd-bio-toggle{display:inline-block}.vd-tag-pill{padding:2px 6px;font-size:.6rem;border-radius:8px;border-width:1px;background:transparent}.vd-specialties-wrapper{margin-top:10px}.vd-actions{margin-top:14px;padding-top:14px;border-top-width:1px}.vd-btn{padding:12px 22px;font-size:1rem}.vd-skeleton{padding:16px;gap:12px;min-height:100px}.vd-skeleton-avatar{width:70px;height:70px}}' +
    '@media (max-width:479px){.vd-embed-root{width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);padding-left:max(12px,env(safe-area-inset-left,0));padding-right:max(12px,env(safe-area-inset-right,0))}.vd-profile-card{flex-direction:column;align-items:stretch;padding:14px 12px;gap:14px}.vd-profile-left{align-self:center;flex:0 0 auto}.vd-profile-left img{width:88px;height:88px}.vd-profile-name{text-align:center}.vd-specialties-wrapper{display:none}.vd-skeleton{flex-direction:column;align-items:center;padding:14px 12px}.vd-skeleton-avatar{width:88px;height:88px}}';

  var INNER_HTML =
    '<div class="vd-embed-root">' +
    '<div class="vd-controls">' +
    '<input id="vd-search" class="vd-search-input" type="text" name="vd-search" inputmode="search" autocomplete="off" placeholder="Search by name\u2026" aria-label="Search by name" />' +
    '<select id="vd-insurance" aria-label="Insurance"><option value="">All insurances</option></select>' +
    '<select id="vd-accepting" aria-label="Accepting new clients">' +
    '<option value="yes">Accepting new clients: Yes</option>' +
    '<option value="all">Show all dietitians</option>' +
    '</select></div>' +
    '<div id="vd-count" class="vd-count"></div>' +
    '<div id="vd-grid" class="vd-grid" aria-live="polite"></div>' +
    '<div id="vd-status" class="vd-status"></div>' +
    '</div>';

  function injectStylesOnce() {
    if (document.getElementById('vedic-rd-directory-styles')) return;
    var el = document.createElement('style');
    el.id = 'vedic-rd-directory-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  injectStylesOnce();

  /* ==================== Utilities ==================== */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
  function firstName(full) { return (full || '').split(' ')[0] || 'Provider'; }
  function mainFlagTrue(v) {
    var s = String(v || '').trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  function debounce(fn, ms) {
    ms = ms || 300;
    var t;
    return function () {
      var a = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, a); }, ms);
    };
  }

  /* ==================== Config ==================== */

  function mergeDirectoryConfig(root) {
    var out = { apiBase: '', apiKey: '', fixedInsurance: '', fixedCondition: '', fixedLocation: '', fixedSpecialty: '', fixedTag: '', vdMain: '', headerOffset: '' };
    var chain = [];
    var el = root;
    for (var i = 0; i < 12 && el && el.nodeType === 1; i++) { chain.push(el); el = el.parentElement; }
    function pick(g) {
      for (var j = 0; j < chain.length; j++) {
        var d = chain[j].dataset || {};
        var v = g(d);
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    }
    out.apiBase = pick(function (d) { return d.apiBase; });
    out.apiKey = pick(function (d) { return d.apiKey; });
    out.fixedInsurance = pick(function (d) { return d.fixedInsurance; });
    out.fixedCondition = pick(function (d) { return d.fixedCondition; });
    out.fixedLocation = pick(function (d) { return d.fixedLocation; });
    out.fixedSpecialty = pick(function (d) { return d.fixedSpecialty; });
    out.fixedTag = pick(function (d) { return d.fixedTag; });
    out.vdMain = pick(function (d) { return d.vdMain; });
    out.headerOffset = pick(function (d) { return d.vdHeaderOffset; });
    return out;
  }

  function normalizeHeaderOffset(raw) {
    raw = String(raw == null ? '' : raw).trim();
    if (!raw) return '88px';
    if (raw === '0' || raw === '0px') return '0px';
    if (/^\d+(\.\d+)?$/.test(raw)) return raw + 'px';
    return raw;
  }

  function resolveHeaderOffset(root, merged) {
    var a = root.getAttribute('data-vd-header-offset');
    if (a != null && String(a).trim() !== '') return normalizeHeaderOffset(String(a).trim());
    if (merged.headerOffset) return normalizeHeaderOffset(merged.headerOffset);
    return '88px';
  }

  function pathSlugSegment(regex) {
    var m = location.pathname.match(regex);
    if (!m) return '';
    try { return decodeURIComponent(m[1] || '').replace(/\+/g, ' ').trim(); } catch (e) { return (m[1] || '').trim(); }
  }

  function pathInsuranceSlug() {
    return pathSlugSegment(/\/insurances?\/([^/?#]+)/i);
  }

  function pathConditionSlug() {
    return pathSlugSegment(/\/conditions?\/([^/?#]+)/i);
  }

  function pathLocationSlug() {
    return pathSlugSegment(/\/locations?\/([^/?#]+)/i);
  }

  /** Turn URL slug (e.g. glp-1-support) into a display string; may not match sheet tokens — prefer data-fixed-* with exact sheet names. */
  function slugToDisplayLabel(slug) {
    if (!slug) return '';
    return slug.split(/[-_]+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join(' ');
  }

  /* ==================== Main ==================== */

  function main() {
    var $root = document.getElementById('vedic-rd-directory');
    if (!$root) return;

    if (!$root.querySelector('#vd-grid')) {
      if (!/\bvd-container\b/.test($root.className)) {
        $root.className = $root.className ? $root.className.trim() + ' vd-container' : 'vd-container';
      }
      $root.innerHTML = INNER_HTML;
    }

    var merged = mergeDirectoryConfig($root);
    $root.style.setProperty('--vd-header-offset', resolveHeaderOffset($root, merged));

    var forceMain = mainFlagTrue($root.getAttribute('data-vd-main')) || mainFlagTrue(merged.vdMain);
    var insSlug = pathInsuranceSlug();
    var condSlug = pathConditionSlug();
    var locSlug = pathLocationSlug();
    var fromPathIns = !forceMain && insSlug ? slugToDisplayLabel(insSlug) : '';
    var fromPathCond = !forceMain && condSlug ? slugToDisplayLabel(condSlug) : '';
    var fromPathLoc = !forceMain && locSlug ? slugToDisplayLabel(locSlug) : '';
    var fixedIns = forceMain ? '' : merged.fixedInsurance || fromPathIns;
    var fixedCond = forceMain ? '' : merged.fixedCondition || fromPathCond;
    var fixedLoc = forceMain ? '' : merged.fixedLocation || fromPathLoc;
    var fixedSpec = merged.fixedSpecialty;
    var fixedTag = merged.fixedTag;

    var DEFAULT_API = 'https://script.google.com/macros/s/AKfycbynql_zmBQHn7-iTj2PQhpUCYw8Wbw1SMrYQQHguHhzELt8132Lrxh7VObv037j7mkI/exec';
    var API_BASE = merged.apiBase || DEFAULT_API;
    var API_KEY = merged.apiKey || '';

    var isFixedLanding = !!(fixedIns || fixedCond || fixedLoc);

    $root.classList.toggle('vd-main-mode', !isFixedLanding);
    $root.classList.toggle('vd-fixed-landing-mode', isFixedLanding);
    $root.classList.toggle('vd-insurance-mode', isFixedLanding);

    var $grid = $root.querySelector('#vd-grid');
    var $count = $root.querySelector('#vd-count');
    var $status = $root.querySelector('#vd-status');
    var $search = $root.querySelector('#vd-search');
    var $insurance = $root.querySelector('#vd-insurance');
    var $accepting = $root.querySelector('#vd-accepting');

    if (!$grid || !$accepting) return;

    if (isFixedLanding) {
      var ctrlBar = $root.querySelector('.vd-controls');
      if (ctrlBar) ctrlBar.style.display = 'none';
      $accepting.value = 'yes';
    }

    /* ---------- State ---------- */

    var allProviders = [];
    var availCache = {};
    var pendingAvailCheck = false;
    var providersReady = false;
    var facetsReady = !!isFixedLanding;

    /* ---------- Top status (conversion copy + spinner until APIs settle) ---------- */

    function updateTopLine() {
      var acceptYes = isFixedLanding || $accepting.value === 'yes';
      var loading = !providersReady || !facetsReady;
      if (!loading && acceptYes) {
        var filtered = isFixedLanding ? allProviders : applyFilters(allProviders);
        var needAvail = false;
        for (var ti = 0; ti < filtered.length; ti++) {
          var tp = filtered[ti];
          if ((tp.profileStatusRaw || '').toUpperCase() === 'DEFAULT') continue;
          if (availCache[tp.id] === undefined) {
            needAvail = true;
            break;
          }
        }
        if (needAvail || pendingAvailCheck) loading = true;
      }
      if (loading) {
        $count.className = 'vd-count vd-count--loading';
        $count.innerHTML =
          '<span class="vd-count-spinner" aria-hidden="true"></span>' +
          '<span class="vd-count-msg" role="status" aria-live="polite">Finding in-network dietitians for you\u2026</span>';
        $root.setAttribute('aria-busy', 'true');
      } else {
        $count.className = 'vd-count';
        $count.innerHTML = '';
        $root.removeAttribute('aria-busy');
      }
    }

    /* ---------- Query-string helpers ---------- */

    function getQS() { return new URLSearchParams(location.search); }
    function setQS(p) {
      var n = new URLSearchParams(location.search);
      Object.keys(p).forEach(function (k) {
        if (p[k] == null || p[k] === '') n.delete(k); else n.set(k, p[k]);
      });
      history.replaceState({}, '', location.pathname + '?' + n.toString());
    }

    /* ---------- API ---------- */

    function api(params) {
      var p = new URLSearchParams(params);
      if (API_KEY) p.set('key', API_KEY);
      var url = API_BASE + (API_BASE.indexOf('?') >= 0 ? '&' : '?') + p.toString();
      return fetch(url, { credentials: 'omit' }).then(function (r) {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      });
    }

    /* ---------- Skeletons ---------- */

    function showSkeletons() {
      var html = '';
      for (var i = 0; i < SKELETON_COUNT; i++) {
        html +=
          '<div class="vd-skeleton" aria-hidden="true">' +
          '<div class="vd-skeleton-avatar"></div>' +
          '<div class="vd-skeleton-lines">' +
          '<div class="vd-skeleton-line"></div><div class="vd-skeleton-line"></div>' +
          '<div class="vd-skeleton-line"></div><div class="vd-skeleton-line"></div>' +
          '</div></div>';
      }
      $grid.innerHTML = html;
      $status.textContent = '';
      updateTopLine();
    }

    /* ---------- Card HTML ---------- */

    function cardHtml(p, checking) {
      var slug = String(p.slug || '').trim();
      var href = slug ? BOOK_PATH + '/' + encodeURIComponent(slug) : '#';
      var cls = 'vd-profile-card vd-card-reveal' + (checking ? ' vd-card-checking' : '');
      var specs = (p.specialties || []).map(escapeHtml);
      var vis = specs.slice(0, 3);
      var hid = specs.slice(3);
      var tags = (p.tags || []).map(escapeHtml);
      var ins = (p.insurances || []).map(escapeHtml);
      var conds = (p.conditions || []).map(escapeHtml);
      var locs = (p.locations || []).map(escapeHtml);

      var tagsHtml = tags.length
        ? '<div class="vd-tags-wrapper"><div class="vd-tags">' +
          tags.map(function (t) { return '<span class="vd-tag-pill">' + t + '</span>'; }).join('') +
          '</div></div>' : '';

      var bioSafe = escapeHtml(p.bio || '');
      var bioHtml = bioSafe
        ? '<div class="vd-bio"><div class="vd-bio-text">' + bioSafe +
          '</div><button type="button" class="vd-bio-toggle">View more</button></div>' : '';

      var visSpec = vis.map(function (s) { return '<span class="vd-specialty-tag">' + s + '</span>'; }).join('');
      var hidSpec = hid.map(function (s) { return '<span class="vd-specialty-tag">' + s + '</span>'; }).join('');
      var moreSpec = hid.length
        ? '<span class="vd-hidden-spec">' + hidSpec + '</span><button type="button" class="vd-more-spec">+More</button>' : '';

      var condLine = conds.length
        ? '<div class="vd-line"><strong>Conditions:</strong> ' + conds.join(', ') + '</div>'
        : '';
      var locLine = locs.length
        ? '<div class="vd-line"><strong>Locations:</strong> ' + locs.join(', ') + '</div>'
        : '';

      return (
        '<div class="' + cls + '" data-pid="' + escapeAttr(p.id || '') + '" data-status="' + escapeAttr(p.profileStatusRaw || '') + '">' +
        '<div class="vd-profile-left"><img src="' + escapeAttr(p.photoUrl || '') +
        '" alt="' + escapeAttr(p.name || 'Dietitian') + '" loading="lazy"></div>' +
        '<div class="vd-profile-right">' +
        '<div class="vd-profile-name">' + escapeHtml(p.name || '') +
        (p.credentials ? ', ' + escapeHtml(p.credentials) : '') + '</div>' +
        '<div class="vd-line"><strong>Insurances:</strong> ' + (ins.length ? ins.join(', ') : 'N/A') + '</div>' +
        condLine + locLine +
        tagsHtml + bioHtml +
        '<div class="vd-specialties-wrapper"><span class="vd-specialties-label">Specialties:</span>' +
        '<div class="vd-specialties">' + visSpec + moreSpec + '</div></div>' +
        '<div class="vd-actions"><a class="vd-btn" href="' + escapeAttr(href) +
        '" target="_self">Book with ' + escapeHtml(firstName(p.name)) + '</a></div>' +
        '</div></div>'
      );
    }

    /* ---------- Sorting ---------- */

    function sortDefaults(list) {
      return list.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    }

    function sortNonDefaults(list) {
      return list.slice().sort(function (a, b) {
        var ra = (typeof a.profileRank === 'number' && a.profileRank > 0) ? a.profileRank : 999;
        var rb = (typeof b.profileRank === 'number' && b.profileRank > 0) ? b.profileRank : 999;
        return (ra - rb) || (a.name || '').localeCompare(b.name || '');
      });
    }

    /* ---------- Filtering (client-side, main page only) ---------- */

    function matchInsurance(p, ins) {
      if (!ins) return true;
      var want = ins.toLowerCase();
      return (p.insurances || []).some(function (x) { return x.toLowerCase() === want; });
    }

    function matchSearch(p, q) {
      if (!q) return true;
      var lc = q.toLowerCase();
      return (p.name || '').toLowerCase().indexOf(lc) >= 0 ||
             (p.bio || '').toLowerCase().indexOf(lc) >= 0 ||
             (p.specialties || []).join(',').toLowerCase().indexOf(lc) >= 0;
    }

    function applyFilters(providers) {
      var q = ($search && !isFixedLanding) ? ($search.value || '').trim() : '';
      var ins = isFixedLanding ? '' : ($insurance ? $insurance.value : '');

      return providers.filter(function (p) {
        if (!matchSearch(p, q)) return false;
        if (ins && !matchInsurance(p, ins)) return false;
        return true;
      });
    }

    /* ---------- Render ---------- */

    function renderAll() {
      var acceptYes = isFixedLanding || $accepting.value === 'yes';
      var filtered;

      if (isFixedLanding) {
        filtered = allProviders;
      } else {
        filtered = applyFilters(allProviders);
      }

      var defaults = [];
      var nonDefaults = [];
      filtered.forEach(function (p) {
        if ((p.profileStatusRaw || '').toUpperCase() === 'DEFAULT') defaults.push(p);
        else nonDefaults.push(p);
      });

      defaults = sortDefaults(defaults);
      nonDefaults = sortNonDefaults(nonDefaults);

      var html = '';

      defaults.forEach(function (p) { html += cardHtml(p, false); });

      nonDefaults.forEach(function (p) {
        if (acceptYes) {
          if (availCache[p.id] === true) {
            html += cardHtml(p, false);
          } else if (availCache[p.id] === false) {
            /* no openings — omit */
          } else {
            html += cardHtml(p, true);
          }
        } else {
          html += cardHtml(p, false);
        }
      });

      $grid.innerHTML = html;

      var visibleCount = $grid.querySelectorAll('.vd-profile-card').length;
      if (acceptYes) {
        $status.textContent = visibleCount ? '' : 'No providers are currently accepting new clients.';
      } else {
        $status.textContent = visibleCount ? '' : 'No matching providers.';
      }

      updateTopLine();

      if (acceptYes) {
        var unchecked = nonDefaults.filter(function (p) { return availCache[p.id] === undefined; });
        if (unchecked.length && !pendingAvailCheck) checkAvailability(unchecked);
      }
    }

    /* ---------- Availability ---------- */

    function checkAvailability(list) {
      var ids = list.map(function (p) { return p.id; }).filter(Boolean);
      if (!ids.length) return;

      pendingAvailCheck = true;
      updateTopLine();
      api({
        mode: 'availability',
        ids: ids.join(','),
        days: String(SLOT_WINDOW_DAYS)
      }).then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Availability error');
        var avail = data.availability || {};
        ids.forEach(function (id) {
          availCache[id] = !!avail[id];
        });
      }).catch(function (err) {
        console.error('[vd-directory] availability error:', err);
        ids.forEach(function (id) {
          if (availCache[id] === undefined) availCache[id] = false;
        });
      }).then(function () {
        pendingAvailCheck = false;
        renderAll();
      });
    }

    /* ---------- Facets (main page only) ---------- */

    function loadFacets() {
      if (isFixedLanding || !$insurance) return Promise.resolve();
      return api({ mode: 'facets' }).then(function (data) {
        if (!data.ok) return;
        var list = data.facets && data.facets.insurances ? data.facets.insurances : [];
        var cur = getQS().get('insurance') || '';
        var frag = document.createDocumentFragment();
        var base = document.createElement('option');
        base.value = '';
        base.textContent = 'All insurances';
        frag.appendChild(base);
        list.forEach(function (v) {
          var opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          if (v === cur) opt.selected = true;
          frag.appendChild(opt);
        });
        $insurance.innerHTML = '';
        $insurance.appendChild(frag);
      }).catch(function () {});
    }

    /* ---------- Load providers ---------- */

    function loadProviders() {
      var params = {
        mode: 'providers',
        surface: 'profile',
        activeOnly: 'true',
        sort: 'name',
        limit: '500'
      };
      if (isFixedLanding) {
        if (fixedIns) params.insurance = fixedIns;
        if (fixedCond) params.condition = fixedCond;
        if (fixedLoc) params.location = fixedLoc;
        if (fixedIns || fixedCond || fixedLoc) params.mergeDefaultProfiles = 'true';
      }
      if (fixedSpec) params.specialty = fixedSpec;
      if (fixedTag) params.tag = fixedTag;

      return api(params).then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Load failed');
        allProviders = data.providers || [];
      });
    }

    /* ---------- Event delegation for card interactivity ---------- */

    $grid.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('vd-bio-toggle')) {
        var text = t.previousElementSibling;
        if (!text) return;
        var expanded = text.classList.toggle('vd-expanded');
        t.textContent = expanded ? 'View less' : 'View more';
      }
      if (t.classList.contains('vd-more-spec')) {
        var hidden = t.previousElementSibling;
        if (hidden && hidden.classList.contains('vd-hidden-spec')) {
          var show = hidden.classList.toggle('vd-show');
          t.textContent = show ? 'Less' : '+More';
        }
      }
    });

    /* ---------- Init ---------- */

    if (!isFixedLanding && $search) $search.value = getQS().get('q') || '';
    if (!isFixedLanding) $accepting.value = getQS().get('accepting') || 'yes';

    showSkeletons();

    var ready = [loadProviders()];
    if (!isFixedLanding) ready.push(loadFacets());

    Promise.all(ready).then(function () {
      providersReady = true;
      if (!isFixedLanding) facetsReady = true;
      renderAll();
    }).catch(function (err) {
      providersReady = true;
      if (!isFixedLanding) facetsReady = true;
      $grid.innerHTML = '';
      $count.className = 'vd-count';
      $count.innerHTML = '';
      $status.textContent = 'Error loading directory.';
      $root.removeAttribute('aria-busy');
      console.error('[vd-directory]', err);
    });

    /* ---------- Controls ---------- */

    if ($search && !isFixedLanding) {
      $search.addEventListener('input', debounce(function () {
        setQS({ q: $search.value });
        renderAll();
      }, 350));
    }
    if ($insurance && !isFixedLanding) {
      $insurance.addEventListener('change', function () {
        setQS({ insurance: $insurance.value });
        renderAll();
      });
    }
    if (!isFixedLanding) {
      $accepting.addEventListener('change', function () {
        setQS({ accepting: $accepting.value });
        renderAll();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
