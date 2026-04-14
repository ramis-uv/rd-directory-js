/**
 * Vedic Nutrition — RD directory (mounts into #vedic-rd-directory)
 *
 * DEFAULT providers come from Webflow CMS (Collection List in #vd-cms-defaults) — zero JS, instant paint.
 * NON-DEFAULT providers come from the API (mode=providers) and are checked via batched mode=availability.
 *
 * data-vd-main="true" — force main directory (show search/filters) even if a parent has data-fixed-insurance.
 * Insurance SEO: data-fixed-insurance="Anthem" OR URL /insurance/anthem → filter + hide controls.
 * data-vd-header-offset="96" (px) or "5rem" — top padding for fixed nav (default 88px).
 */
(function () {
  'use strict';

  var SLOT_WINDOW_DAYS = 21;

  var STYLES =
    ':root{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740}' +
    '#vedic-rd-directory{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740;--vd-header-offset:88px;padding-top:var(--vd-header-offset);box-sizing:border-box;position:relative}' +
    '.vd-embed-root{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}' +
    '.vd-controls{max-width:1100px;margin:16px auto 12px;padding:16px 20px;border:1px solid var(--vd-border);border-radius:12px;background:var(--vd-card);box-shadow:var(--vd-shadow);display:flex;flex-wrap:wrap;gap:.75rem;align-items:stretch;box-sizing:border-box}' +
    '#vedic-rd-directory.vd-main-mode .vd-controls{display:flex!important;flex-wrap:wrap!important;visibility:visible!important;opacity:1!important;min-height:0}' +
    '#vedic-rd-directory.vd-insurance-mode .vd-controls{display:none!important}' +
    '#vedic-rd-directory input.vd-search-input,#vedic-rd-directory #vd-search{display:block!important;visibility:visible!important;opacity:1!important;-webkit-appearance:none;appearance:none;box-sizing:border-box;min-height:44px!important;flex:1 1 220px;max-width:100%;width:auto!important;min-width:120px!important;border:1px solid var(--vd-border);border-radius:8px;padding:10px 14px;font-size:15px!important;line-height:1.3!important;color:var(--vd-text)!important;background:#fff!important}' +
    '#vedic-rd-directory input.vd-search-input::placeholder,#vedic-rd-directory #vd-search::placeholder{color:var(--vd-muted)}' +
    '.vd-controls select{border:1px solid var(--vd-border);border-radius:8px;padding:10px 14px;font-size:15px;flex:1 1 180px;min-height:44px;background:#fff;color:var(--vd-text);box-sizing:border-box}' +
    '.vd-grid{display:flex;flex-direction:column;gap:16px;max-width:1100px;margin:0 auto;width:100%;box-sizing:border-box;padding:0 0 24px}' +
    '.vd-profile-card{border:1px solid var(--vd-border);border-radius:16px;padding:28px;box-shadow:var(--vd-shadow);display:flex;gap:28px;flex-wrap:wrap;background:var(--vd-card);transition:box-shadow .3s ease;overflow:visible;box-sizing:border-box;min-width:0}' +
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
    '.vd-count{max-width:1100px;margin:0 auto 8px;font-size:.875rem;color:var(--vd-muted);min-height:1.25em;box-sizing:border-box;padding:0 4px}' +
    '.vd-status{max-width:1100px;margin:8px auto;text-align:center;color:var(--vd-muted);font-size:.875rem;box-sizing:border-box}' +
    '.vd-card-hidden{display:none!important}' +
    '.vd-card-reveal{animation:vd-fade-in .35s ease forwards}' +
    '@keyframes vd-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '#vd-cms-defaults .w-dyn-items{display:flex;flex-direction:column;gap:16px;max-width:1100px;margin:0 auto;width:100%;box-sizing:border-box;padding:0}' +
    '#vd-cms-defaults.vd-cms-absorbed{display:none!important}' +
    '.vd-cms-card .vd-cms-ins ul,.vd-cms-card .vd-cms-ins ol{list-style:none;margin:0;padding:0;display:inline}' +
    '.vd-cms-card .vd-cms-ins li{display:inline}.vd-cms-card .vd-cms-ins li+li::before{content:", "}' +
    '.vd-cms-card .vd-cms-tags ul,.vd-cms-card .vd-cms-tags ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}' +
    '.vd-cms-card .vd-cms-tags li{display:inline-flex;align-items:center;padding:5px 12px;background:#fff;border:1.5px solid var(--vd-accent);color:var(--vd-accent);border-radius:16px;font-size:.75rem;font-weight:600;white-space:nowrap}' +
    '.vd-cms-card .vd-cms-specs ul,.vd-cms-card .vd-cms-specs ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '.vd-cms-card .vd-cms-specs li{display:inline-flex;align-items:center;padding:6px 12px;background:#f9fafb;border:1px solid var(--vd-border);border-radius:8px;font-size:.8125rem;color:var(--vd-text);font-weight:500;white-space:nowrap}' +
    '.vd-cms-card .vd-cms-bio p{margin:0}' +
    '.vd-api-loading{width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(24,106,208,.18);border-top-color:var(--vd-primary);animation:vd-spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px;box-sizing:border-box}' +
    '@keyframes vd-spin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){.vd-api-loading{animation:none;border-color:rgba(24,106,208,.45)}}' +
    '@media (max-width:720px){.vd-profile-card{padding:16px;gap:12px;flex-direction:row;flex-wrap:nowrap;align-items:flex-start}.vd-profile-left{flex:0 0 70px}.vd-profile-left img{width:70px;height:70px;border-width:2px}.vd-profile-right{flex:1;min-width:0}.vd-profile-name{font-size:1.1rem}.vd-line{font-size:.8rem}.vd-bio-text{display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.vd-bio-text.vd-expanded{display:block;-webkit-line-clamp:unset;line-clamp:unset}.vd-bio-toggle{display:inline-block}.vd-tag-pill{padding:2px 6px;font-size:.6rem;border-radius:8px;border-width:1px;background:transparent}.vd-specialties-wrapper{margin-top:10px}.vd-actions{margin-top:14px;padding-top:14px;border-top-width:1px}.vd-btn{padding:12px 22px;font-size:1rem}}' +
    '@media (max-width:479px){.vd-embed-root{width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);padding-left:max(12px,env(safe-area-inset-left,0));padding-right:max(12px,env(safe-area-inset-right,0))}.vd-profile-card{flex-direction:column;align-items:stretch;padding:14px 12px;gap:14px}.vd-profile-left{align-self:center;flex:0 0 auto}.vd-profile-left img{width:88px;height:88px}.vd-profile-name{text-align:center}.vd-specialties-wrapper{display:none}}';

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

  function mount(root) {
    injectStylesOnce();
    var cmsContainer = document.getElementById('vd-cms-defaults');
    var cmsCards = cmsContainer
      ? [].slice.call(cmsContainer.querySelectorAll('.vd-cms-card'))
      : [];

    if (!root.querySelector('#vd-grid')) {
      if (!/\bvd-container\b/.test(root.className)) {
        root.className = root.className ? root.className.trim() + ' vd-container' : 'vd-container';
      }
      root.innerHTML = INNER_HTML;
    }

    var grid = root.querySelector('#vd-grid');
    if (grid && cmsCards.length) {
      cmsCards.forEach(function (card) {
        grid.appendChild(card);
      });
      if (cmsContainer) cmsContainer.classList.add('vd-cms-absorbed');
    }
  }

  function mergeDirectoryConfig(root) {
    var out = {
      apiBase: '',
      apiKey: '',
      fixedInsurance: '',
      fixedSpecialty: '',
      fixedTag: '',
      vdMain: '',
    };
    var chain = [];
    var el = root;
    for (var i = 0; i < 12 && el && el.nodeType === 1; i++) {
      chain.push(el);
      el = el.parentElement;
    }
    function pick(getter) {
      for (var j = 0; j < chain.length; j++) {
        var d = chain[j].dataset || {};
        var v = getter(d);
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    }
    out.apiBase = pick(function (d) { return d.apiBase; });
    out.apiKey = pick(function (d) { return d.apiKey; });
    out.fixedInsurance = pick(function (d) { return d.fixedInsurance; });
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

  function pathInsuranceSegment() {
    var m = location.pathname.match(/\/insurances?\/([^/?#]+)/i);
    if (!m) return '';
    try {
      return decodeURIComponent(m[1] || '').replace(/\+/g, ' ').trim();
    } catch (e) {
      return (m[1] || '').trim();
    }
  }

  function slugToInsuranceLabel(slug) {
    if (!slug) return '';
    return slug
      .split(/[-_]+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); })
      .join(' ');
  }

  function mainFlagTrue(v) {
    var s = String(v || '').trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  function main() {
    var $root = document.getElementById('vedic-rd-directory');
    if (!$root) return;

    mount($root);

    var merged = mergeDirectoryConfig($root);
    $root.style.setProperty('--vd-header-offset', resolveHeaderOffset($root, merged));
    var forceMain =
      mainFlagTrue($root.getAttribute('data-vd-main')) || mainFlagTrue(merged.vdMain);

    var pathSeg = pathInsuranceSegment();
    var fromPath = !forceMain && pathSeg ? slugToInsuranceLabel(pathSeg) : '';
    var fixedIns = forceMain ? '' : merged.fixedInsurance || fromPath;
    var fixedSpec = merged.fixedSpecialty;
    var fixedTagVal = merged.fixedTag;

    var DEFAULT_API =
      'https://script.google.com/macros/s/AKfycbxev-lmv8hBefUnj48SMY_B6Hdrzw-UtxF0k-aIxrum5PkRnWeY_QC2hEzKIWm_GqQpcQ/exec';
    var API_BASE = merged.apiBase || DEFAULT_API;
    var API_KEY = merged.apiKey || '';

    var isInsuranceLanding = !!fixedIns;

    $root.classList.toggle('vd-main-mode', !isInsuranceLanding);
    $root.classList.toggle('vd-insurance-mode', isInsuranceLanding);

    var ACTIVE_ONLY = true;
    var BOOK_PATH_PREFIX = '/dietitians';

    var $grid = $root.querySelector('#vd-grid');
    var $count = $root.querySelector('#vd-count');
    var $status = $root.querySelector('#vd-status');
    var $search = $root.querySelector('#vd-search');
    var $insurance = $root.querySelector('#vd-insurance');
    var $accepting = $root.querySelector('#vd-accepting');

    if (!$grid || !$accepting) return;

    var cmsSlugSet = {};
    [].slice.call($grid.querySelectorAll('.vd-cms-card')).forEach(function (el) {
      var s = (el.getAttribute('data-slug') || '').trim().toLowerCase();
      if (s) cmsSlugSet[s] = true;
    });
    var cmsDefaultCount = Object.keys(cmsSlugSet).length;

    upgradeCmsCards($grid);

    var ctrlBar = $root.querySelector('.vd-controls');
    if (isInsuranceLanding) {
      if (ctrlBar) ctrlBar.style.display = 'none';
      if ($search) {
        $search.setAttribute('tabindex', '-1');
        $search.setAttribute('aria-hidden', 'true');
      }
      if ($accepting) {
        $accepting.value = 'yes';
        $accepting.setAttribute('aria-hidden', 'true');
      }
    } else {
      if (ctrlBar) {
        ctrlBar.style.removeProperty('display');
        ctrlBar.style.removeProperty('visibility');
      }
      if ($search) {
        $search.style.display = '';
        $search.style.removeProperty('display');
        $search.style.visibility = '';
        $search.removeAttribute('aria-hidden');
        $search.removeAttribute('tabindex');
      }
      if ($accepting) {
        $accepting.style.removeProperty('display');
        $accepting.removeAttribute('aria-hidden');
      }
    }

    if (cmsDefaultCount > 0) {
      $count.textContent = cmsDefaultCount + ' dietitian' + (cmsDefaultCount !== 1 ? 's' : '');
    }

    function getQS() { return new URLSearchParams(location.search); }
    function setQS(params) {
      var next = new URLSearchParams(location.search);
      Object.entries(params).forEach(function (kv) {
        if (kv[1] == null || kv[1] === '') next.delete(kv[0]);
        else next.set(kv[0], kv[1]);
      });
      history.replaceState({}, '', location.pathname + '?' + next.toString());
    }
    function optionize(list, select) {
      var cur = getQS().get(select.id.replace('vd-', '')) || '';
      var frag = document.createDocumentFragment();
      var base = document.createElement('option');
      base.value = '';
      base.textContent = select.options[0].textContent;
      frag.appendChild(base);
      list.forEach(function (v) {
        var opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        if (v === cur) opt.selected = true;
        frag.appendChild(opt);
      });
      select.innerHTML = '';
      select.appendChild(frag);
    }
    function debounce(fn, ms) {
      ms = ms || 300;
      var t;
      return function () {
        var args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(null, args); }, ms);
      };
    }

    function api(params) {
      params = params || {};
      var p = new URLSearchParams(params);
      if (API_KEY) p.set('key', API_KEY);
      var url = API_BASE + (API_BASE.indexOf('?') >= 0 ? '&' : '?') + p.toString();
      return fetch(url, { credentials: 'omit' }).then(function (res) {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      });
    }

    function loadFacets() {
      if (isInsuranceLanding || !$insurance) return Promise.resolve();
      return api({ mode: 'facets' }).then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Facets failed');
        optionize(data.facets.insurances || [], $insurance);
      });
    }

    function batchCheckAvailability(ids) {
      if (!ids || !ids.length) return Promise.resolve({});
      return api({
        mode: 'availability',
        ids: ids.join(','),
        days: String(SLOT_WINDOW_DAYS),
      }).then(function (data) {
        return (data && data.ok && data.availability) ? data.availability : {};
      }).catch(function () {
        return {};
      });
    }

    function clearApiCards() {
      [].slice.call($grid.querySelectorAll('.vd-api-card')).forEach(function (el) {
        el.remove();
      });
    }

    function loadProviders() {
      clearApiCards();
      $status.textContent = '';

      var acceptingYes = isInsuranceLanding || $accepting.value === 'yes';
      var insVal = fixedIns || ($insurance && $insurance.value) || '';

      if (cmsDefaultCount === 0) {
        $status.textContent = acceptingYes
          ? '<span class="vd-api-loading" aria-hidden="true"></span>Loading dietitians\u2026'
          : 'Loading providers\u2026';
        $status.innerHTML = $status.textContent;
      } else if (acceptingYes) {
        $count.textContent =
          cmsDefaultCount + ' dietitian' + (cmsDefaultCount !== 1 ? 's' : '') +
          ' \u00b7 loading more\u2026';
      }

      var params = {
        mode: 'providers',
        surface: 'profile',
        activeOnly: ACTIVE_ONLY ? 'true' : 'false',
        sort: 'name',
      };
      if ($search && $search.value) params.search = $search.value.trim();
      if (insVal) params.insurance = insVal;
      if (fixedSpec) params.specialty = fixedSpec;
      if (fixedTagVal) params.tag = fixedTagVal;

      return api(params)
        .then(function (data) {
          if (!data.ok) throw new Error(data.error || 'Load failed');

          var providers = (data.providers || []).filter(function (p) {
            var s = String(p.slug || '').trim().toLowerCase();
            return !cmsSlugSet[s];
          });

          if (acceptingYes) {
            var ids = providers.map(function (p) { return p.id; }).filter(Boolean);
            return batchCheckAvailability(ids).then(function (avail) {
              var available = providers.filter(function (p) { return avail[p.id]; });
              renderApiCards(sortProviders(available));
              var total = cmsDefaultCount + available.length;
              $count.textContent = total + ' dietitian' + (total !== 1 ? 's' : '') + ' with openings soon';
              $status.textContent = total ? '' : 'No providers are currently accepting new clients.';
            });
          }

          renderApiCards(sortProviders(providers));
          var total = cmsDefaultCount + providers.length;
          $count.textContent = total + ' dietitians found';
          $status.textContent = total ? '' : 'No matching providers.';
        })
        .catch(function (err) {
          $status.textContent = 'Error loading directory.';
          console.error(err);
        });
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }
    function escapeAttr(s) {
      return escapeHtml(s).replace(/"/g, '&quot;');
    }
    function firstName(full) {
      return (full || '').split(' ')[0] || 'Provider';
    }

    function cardHtml(p) {
      var slug = String(p.slug || '').trim();
      var href = slug ? BOOK_PATH_PREFIX + '/' + encodeURIComponent(slug) : '#';
      var specs = (p.specialties || []).map(escapeHtml);
      var vis = specs.slice(0, 3);
      var hid = specs.slice(3);
      var tags = (p.tags || []).map(escapeHtml);
      var ins = (p.insurances || []).map(escapeHtml);
      var safeBio = escapeHtml(p.bio || '');
      var safeName = escapeHtml(p.name || '');
      var safeCred = escapeHtml(p.credentials || '');

      var tagsHtml = tags.length
        ? '<div class="vd-tags-wrapper"><div class="vd-tags">' +
          tags.map(function (t) { return '<span class="vd-tag-pill">' + t + '</span>'; }).join('') +
          '</div></div>'
        : '';

      var bioHtml = safeBio
        ? '<div class="vd-bio"><div class="vd-bio-text">' +
          safeBio +
          '</div><button type="button" class="vd-bio-toggle">View more</button></div>'
        : '';

      var visSpec = vis.map(function (s) { return '<span class="vd-specialty-tag">' + s + '</span>'; }).join('');
      var hidSpec = hid.map(function (s) { return '<span class="vd-specialty-tag">' + s + '</span>'; }).join('');
      var moreSpec =
        hid.length > 0
          ? '<span class="vd-hidden-spec">' + hidSpec + '</span><button type="button" class="vd-more-spec">+More</button>'
          : '';

      return (
        '<div class="vd-profile-card vd-api-card vd-card-reveal" data-id="' +
        escapeAttr(p.id || '') + '" data-email="' + escapeAttr(p.email || '') + '">' +
        '<div class="vd-profile-left"><img src="' +
        escapeAttr(p.photoUrl || '') + '" alt="' + escapeAttr(p.name || 'Dietitian') +
        '" loading="lazy"></div>' +
        '<div class="vd-profile-right">' +
        '<div class="vd-profile-name">' + safeName + (safeCred ? ', ' + safeCred : '') + '</div>' +
        '<div class="vd-line"><strong>Insurances:</strong> ' + ins.join(', ') + '</div>' +
        tagsHtml + bioHtml +
        '<div class="vd-specialties-wrapper"><span class="vd-specialties-label">Specialties:</span><div class="vd-specialties">' +
        visSpec + moreSpec + '</div></div>' +
        '<div class="vd-actions"><a class="vd-btn" href="' + escapeAttr(href) +
        '" target="_self">Book with ' + escapeHtml(firstName(p.name || '')) + '</a></div>' +
        '</div></div>'
      );
    }

    function renderApiCards(list) {
      if (!list.length) return;
      var html = list.map(function (p) { return cardHtml(p); }).join('');
      $grid.insertAdjacentHTML('beforeend', html);
    }

    $grid.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('vd-bio-toggle')) {
        var text = t.previousElementSibling;
        if (!text) return;
        var expanded = text.classList.toggle('vd-expanded');
        t.textContent = expanded ? 'View less' : 'View more';
      }
      if (t.classList.contains('vd-more-spec')) {
        var hid = t.previousElementSibling;
        if (hid && hid.classList.contains('vd-hidden-spec')) {
          var show = hid.classList.toggle('vd-show');
          t.textContent = show ? 'Less' : '+More';
        }
      }
    });

    function getProfileRank(p) {
      var r =
        p.profileRank != null ? p.profileRank
          : p['profile-rank'] != null ? p['profile-rank']
            : p.profile_rank;
      if (r === '' || r === null || r === undefined) return 999;
      if (typeof r === 'string' && r.trim() === '') return 999;
      var n = Number(r);
      if (!Number.isFinite(n) || n < 1) return 999;
      return n;
    }

    function sortProviders(list) {
      var pinned = list
        .filter(function (p) { return getProfileRank(p) < 999; })
        .sort(function (a, b) { return getProfileRank(a) - getProfileRank(b); });
      var unpinned = list
        .filter(function (p) { return getProfileRank(p) >= 999; })
        .sort(function (a, b) { return firstName(a.name || '').localeCompare(firstName(b.name || '')); });
      return pinned.concat(unpinned);
    }

    if ($search) $search.value = getQS().get('q') || '';
    if (!isInsuranceLanding) {
      $accepting.value = getQS().get('accepting') || 'yes';
    } else {
      $accepting.value = 'yes';
    }

    loadFacets()
      .then(function () {
        if (isInsuranceLanding) return;
        var i = getQS().get('insurance') || '';
        if (i && $insurance) $insurance.value = i;
      })
      .then(loadProviders)
      .catch(function (err) {
        $status.textContent = 'Error loading directory.';
        console.error(err);
      });

    if ($search) {
      $search.addEventListener(
        'input',
        debounce(function () {
          setQS({ q: $search.value });
          loadProviders();
        }, 350)
      );
    }
    if (!isInsuranceLanding && $insurance) {
      $insurance.addEventListener('change', function () {
        setQS({ insurance: $insurance.value });
        loadProviders();
      });
    }
    if (!isInsuranceLanding) {
      $accepting.addEventListener('change', function () {
        setQS({ accepting: $accepting.value });
        loadProviders();
      });
    }
  }

  function upgradeCmsCards(grid) {
    [].slice.call(grid.querySelectorAll('.vd-cms-card')).forEach(function (card) {
      var btn = card.querySelector('.vd-btn');
      if (btn) {
        var name = (card.getAttribute('data-name') || '').trim();
        if (name) btn.textContent = 'Book with ' + name.split(' ')[0];
      }

      var specsWrap = card.querySelector('.vd-cms-specs');
      if (specsWrap) {
        var items = [].slice.call(specsWrap.querySelectorAll('li'));
        if (items.length > 3) {
          items.slice(3).forEach(function (li) { li.style.display = 'none'; li.classList.add('vd-cms-hidden-spec'); });
          var moreBtn = document.createElement('button');
          moreBtn.type = 'button';
          moreBtn.className = 'vd-more-spec';
          moreBtn.textContent = '+More';
          moreBtn.addEventListener('click', function () {
            var hidden = specsWrap.querySelectorAll('.vd-cms-hidden-spec');
            var showing = hidden.length && hidden[0].style.display !== 'none' ? false : true;
            [].slice.call(hidden).forEach(function (li) { li.style.display = showing ? '' : 'none'; });
            moreBtn.textContent = showing ? 'Less' : '+More';
          });
          specsWrap.appendChild(moreBtn);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
