/**
 * Vedic Nutrition — RD directory (mounts into #vedic-rd-directory)
 * Config can live on #vedic-rd-directory OR any ancestor (Webflow wrapper / Section custom attrs).
 * data-vd-main="true" — force main directory (show search/filters) even if a parent has data-fixed-insurance.
 * Insurance SEO: data-fixed-insurance="Anthem" OR URL /insurance/anthem → filter + hide controls (slug → "Anthem").
 */
(function () {
  'use strict';

  var SLOT_WINDOW_DAYS = 10; // one batch slots call per provider (faster than N× single-day calls)

  var STYLES =
    ':root{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740}' +
    '#vedic-rd-directory{--vd-bg:#F3F1E7;--vd-card:#FFFFFF;--vd-border:#e5e7eb;--vd-shadow:0 2px 8px rgba(0,0,0,.06);--vd-shadow-hover:0 6px 20px rgba(0,0,0,.12);--vd-text:#3E3E3E;--vd-muted:#6b7280;--vd-primary:#186AD0;--vd-primary-hover:#1557ab;--vd-accent:#D0A740}' +
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
    '#vedic-rd-directory .vd-loader-panel{max-width:1100px;margin:0 auto 20px;padding:clamp(.9rem,2vw,1.2rem) clamp(1rem,3vw,1.25rem);border:1px solid rgba(0,0,0,.06);border-radius:14px;background:rgba(255,255,255,.9);box-shadow:0 8px 24px rgba(17,24,39,.07);box-sizing:border-box}' +
    '.vd-loader-kicker{margin:0 0 .35rem;color:#1f4f8f;font-size:.72rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase}' +
    '.vd-loader-title{margin:0 0 .25rem;font-size:1rem;font-weight:700;color:var(--vd-text)}' +
    '.vd-loader-sub{margin:0;font-size:.8rem;color:var(--vd-muted);line-height:1.45}' +
    '.vd-loader-bar{height:4px;border-radius:999px;background:#e8e8e8;margin-top:12px;overflow:hidden}' +
    '.vd-loader-bar>i{display:block;height:100%;width:34%;border-radius:999px;background:var(--vd-primary);animation:vd-bar 1.1s ease-in-out infinite}' +
    '@keyframes vd-bar{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}' +
    '.vd-loader-hidden{display:none!important}' +
    '.vd-card-hidden{display:none!important}' +
    '.vd-card-reveal{animation:vd-fade-in .35s ease forwards}' +
    '@keyframes vd-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '@media (max-width:720px){.vd-profile-card{padding:16px;gap:12px;flex-direction:row;flex-wrap:nowrap;align-items:flex-start}.vd-profile-left{flex:0 0 70px}.vd-profile-left img{width:70px;height:70px;border-width:2px}.vd-profile-right{flex:1;min-width:0}.vd-profile-name{font-size:1.1rem}.vd-line{font-size:.8rem}.vd-bio-text{display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.vd-bio-text.vd-expanded{display:block;-webkit-line-clamp:unset;line-clamp:unset}.vd-bio-toggle{display:inline-block}.vd-tag-pill{padding:2px 6px;font-size:.6rem;border-radius:8px;border-width:1px;background:transparent}.vd-specialties-wrapper{margin-top:10px}.vd-actions{margin-top:14px;padding-top:14px;border-top-width:1px}.vd-btn{padding:12px 22px;font-size:1rem}}' +
    '@media (max-width:479px){.vd-embed-root{width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);padding-left:max(12px,env(safe-area-inset-left,0));padding-right:max(12px,env(safe-area-inset-right,0))}.vd-profile-card{flex-direction:column;align-items:stretch;padding:14px 12px;gap:14px}.vd-profile-left{align-self:center;flex:0 0 auto}.vd-profile-left img{width:88px;height:88px}.vd-profile-name{text-align:center}.vd-specialties-wrapper{display:none}}';

  var INNER_HTML =
    '<div class="vd-embed-root">' +
    '<div class="vd-controls">' +
    '<input id="vd-search" class="vd-search-input" type="text" name="vd-search" inputmode="search" autocomplete="off" placeholder="Search by name…" aria-label="Search by name" />' +
    '<select id="vd-insurance" aria-label="Insurance"><option value="">All insurances</option></select>' +
    '<select id="vd-accepting" aria-label="Accepting new clients">' +
    '<option value="yes">Accepting new clients: Yes</option>' +
    '<option value="all">Show all dietitians</option>' +
    '</select></div>' +
    '<div id="vd-count" class="vd-count"></div>' +
    '<div id="vd-loader" class="vd-loader-hidden" role="status" aria-live="polite">' +
    '<div class="vd-loader-panel">' +
    '<p class="vd-loader-kicker">Almost ready</p>' +
    '<p id="vd-loader-title" class="vd-loader-title">Loading dietitians</p>' +
    '<p id="vd-loader-sub" class="vd-loader-sub">Matching you with providers who fit your preferences.</p>' +
    '<div class="vd-loader-bar" aria-hidden="true"><i></i></div>' +
    '</div></div>' +
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

  function mount(root) {
    injectStylesOnce();
    if (!root.querySelector('#vd-grid')) {
      if (!/\bvd-container\b/.test(root.className)) {
        root.className = root.className ? root.className.trim() + ' vd-container' : 'vd-container';
      }
      root.innerHTML = INNER_HTML;
    }
  }

  /** Walk #vedic-rd-directory and ancestors — Webflow often puts CMS custom attrs on a wrapper, not on the mount id. */
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
    out.apiBase = pick(function (d) {
      return d.apiBase;
    });
    out.apiKey = pick(function (d) {
      return d.apiKey;
    });
    out.fixedInsurance = pick(function (d) {
      return d.fixedInsurance;
    });
    out.fixedSpecialty = pick(function (d) {
      return d.fixedSpecialty;
    });
    out.fixedTag = pick(function (d) {
      return d.fixedTag;
    });
    out.vdMain = pick(function (d) {
      return d.vdMain;
    });
    return out;
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
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  }

  function mainFlagTrue(v) {
    var s = String(v || '')
      .trim()
      .toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  function main() {
    var $root = document.getElementById('vedic-rd-directory');
    if (!$root) return;

    mount($root);

    var merged = mergeDirectoryConfig($root);
    // Prefer raw attribute — some Webflow embed runtimes expose dataset inconsistently.
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
    var SLOTS_API = API_BASE;
    var API_KEY = merged.apiKey || '';

    var isInsuranceLanding = !!fixedIns;

    $root.classList.toggle('vd-main-mode', !isInsuranceLanding);
    $root.classList.toggle('vd-insurance-mode', isInsuranceLanding);

    var ACTIVE_ONLY = true;
    var BOOK_PATH_PREFIX = '/dietitians';

    var $grid = $root.querySelector('#vd-grid');
    var $count = $root.querySelector('#vd-count');
    var $status = $root.querySelector('#vd-status');
    var $loader = $root.querySelector('#vd-loader');
    var $loaderTitle = $root.querySelector('#vd-loader-title');
    var $loaderSub = $root.querySelector('#vd-loader-sub');
    var $search = $root.querySelector('#vd-search');
    var $insurance = $root.querySelector('#vd-insurance');
    var $accepting = $root.querySelector('#vd-accepting');

    if (!$grid || !$accepting) return;

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

    function getQS() {
      return new URLSearchParams(location.search);
    }
    function setQS(params) {
      var next = new URLSearchParams(location.search);
      Object.entries(params).forEach(function (kv) {
        var k = kv[0];
        var v = kv[1];
        if (v == null || v === '') next.delete(k);
        else next.set(k, v);
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
        t = setTimeout(function () {
          fn.apply(null, args);
        }, ms);
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

    function setLoader(visible, title, sub) {
      if (!$loader) return;
      if (visible) {
        $loader.classList.remove('vd-loader-hidden');
        if ($loaderTitle && title) $loaderTitle.textContent = title;
        if ($loaderSub && sub != null) $loaderSub.textContent = sub;
      } else {
        $loader.classList.add('vd-loader-hidden');
      }
    }

    function loadProviders() {
      $status.textContent = '';
      $grid.innerHTML = '';
      $count.textContent = '';
      setLoader(false);

      var acceptingYes = isInsuranceLanding || $accepting.value === 'yes';

      if (!acceptingYes) {
        $status.textContent = 'Loading providers…';
      } else {
        setLoader(true, 'Loading dietitians', 'Finding providers with openings soon.');
      }

      var params = {
        mode: 'providers',
        surface: 'profile',
        activeOnly: ACTIVE_ONLY ? 'true' : 'false',
        sort: 'name',
      };
      if ($search && $search.value) params.search = $search.value.trim();
      var insVal = fixedIns || ($insurance && $insurance.value) || '';
      if (insVal) params.insurance = insVal;
      if (fixedSpec) params.specialty = fixedSpec;
      if (fixedTagVal) params.tag = fixedTagVal;

      return api(params)
        .then(function (data) {
          if (!data.ok) throw new Error(data.error || 'Load failed');

          if (acceptingYes) {
            setLoader(true, 'Checking availability', 'Scanning calendars for the next ' + SLOT_WINDOW_DAYS + ' days…');
          }

          render(sortProviders(data.providers || []), acceptingYes);

          if (acceptingYes) {
            return applyAcceptingFilter();
          }
          $count.textContent = (data.total || 0) + ' dietitians found';
          $status.textContent = data.total ? '' : 'No matching providers.';
        })
        .finally(function () {
          setLoader(false);
        });
    }

    /** One API call per provider: multi-day slots, then test for on-the-hour future openings */
    function providerHasOpenSlots(id, email) {
      if (!id && !email) return Promise.resolve(false);
      var p = new URLSearchParams({ mode: 'slots', days: String(SLOT_WINDOW_DAYS) });
      if (id) p.set('id', id);
      if (email) p.set('email', email);
      if (API_KEY) p.set('key', API_KEY);
      return fetch(SLOTS_API + '?' + p.toString(), { cache: 'no-store', credentials: 'omit' })
        .then(function (res) {
          if (!res.ok) return false;
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.ok) return false;
          var now = new Date();
          var slotList = [];
          if (data.slots && data.slots.length) slotList = data.slots;
          else if (data.slotsByDate && typeof data.slotsByDate === 'object') {
            Object.keys(data.slotsByDate).forEach(function (k) {
              var arr = data.slotsByDate[k];
              if (arr && arr.length) slotList = slotList.concat(arr);
            });
          }
          return slotList.some(function (iso) {
            try {
              var dt = new Date(iso);
              return dt.getMinutes() === 0 && dt > now;
            } catch (e) {
              return false;
            }
          });
        })
        .catch(function () {
          return false;
        });
    }

    function applyAcceptingFilter() {
      var cards = [].slice.call($grid.querySelectorAll('.vd-profile-card'));
      if (!cards.length) {
        setLoader(false);
        $status.textContent = 'No matching providers.';
        return Promise.resolve();
      }

      var visible = 0;

      return Promise.all(
        cards.map(function (card) {
          return providerHasOpenSlots(card.dataset.id || '', card.dataset.email || '').then(function (open) {
            if (open) {
              card.classList.remove('vd-card-hidden');
              card.classList.add('vd-card-reveal');
              visible++;
              $count.textContent =
                visible + ' dietitian' + (visible !== 1 ? 's' : '') + ' with openings soon';
            }
          });
        })
      ).then(function () {
        setLoader(false);
        if (!visible) {
          $status.textContent = 'No providers are currently accepting new clients.';
        }
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
          tags.map(function (t) {
            return '<span class="vd-tag-pill">' + t + '</span>';
          }).join('') +
          '</div></div>'
        : '';

      var bioHtml = safeBio
        ? '<div class="vd-bio"><div class="vd-bio-text">' +
          safeBio +
          '</div><button type="button" class="vd-bio-toggle">View more</button></div>'
        : '';

      var visSpec = vis
        .map(function (s) {
          return '<span class="vd-specialty-tag">' + s + '</span>';
        })
        .join('');
      var hidSpec = hid
        .map(function (s) {
          return '<span class="vd-specialty-tag">' + s + '</span>';
        })
        .join('');
      var moreSpec =
        hid.length > 0
          ? '<span class="vd-hidden-spec">' +
            hidSpec +
            '</span><button type="button" class="vd-more-spec">+More</button>'
          : '';

      return (
        '<div class="vd-profile-card vd-card-hidden" data-id="' +
        escapeAttr(p.id || '') +
        '" data-email="' +
        escapeAttr(p.email || '') +
        '">' +
        '<div class="vd-profile-left"><img src="' +
        escapeAttr(p.photoUrl || '') +
        '" alt="' +
        escapeAttr(p.name || 'Dietitian') +
        '" loading="lazy"></div>' +
        '<div class="vd-profile-right">' +
        '<div class="vd-profile-name">' +
        safeName +
        (safeCred ? ', ' + safeCred : '') +
        '</div>' +
        '<div class="vd-line"><strong>Insurances:</strong> ' +
        ins.join(', ') +
        '</div>' +
        tagsHtml +
        bioHtml +
        '<div class="vd-specialties-wrapper"><span class="vd-specialties-label">Specialties:</span><div class="vd-specialties">' +
        visSpec +
        moreSpec +
        '</div></div>' +
        '<div class="vd-actions"><a class="vd-btn" href="' +
        escapeAttr(href) +
        '" target="_self">Book with ' +
        escapeHtml(firstName(p.name || '')) +
        '</a></div>' +
        '</div></div>'
      );
    }

    function render(list, acceptingMode) {
      $grid.innerHTML = list
        .map(function (p) {
          return cardHtml(p);
        })
        .join('');
      if (!acceptingMode) {
        [].slice.call($grid.querySelectorAll('.vd-profile-card')).forEach(function (el) {
          el.classList.remove('vd-card-hidden');
        });
      }
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
        p.profileRank != null
          ? p.profileRank
          : p['profile-rank'] != null
            ? p['profile-rank']
            : p.profile_rank;
      if (r === '' || r === null || r === undefined) return 999;
      if (typeof r === 'string' && r.trim() === '') return 999;
      var n = Number(r);
      if (!Number.isFinite(n) || n < 1) return 999;
      return n;
    }

    function sortProviders(list) {
      var pinned = list
        .filter(function (p) {
          return getProfileRank(p) < 999;
        })
        .sort(function (a, b) {
          return getProfileRank(a) - getProfileRank(b);
        });
      var unpinned = list
        .filter(function (p) {
          return getProfileRank(p) >= 999;
        })
        .sort(function (a, b) {
          return firstName(a.name || '').localeCompare(firstName(b.name || ''));
        });
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
        setLoader(false);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
