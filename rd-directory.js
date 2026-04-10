/**
 * Vedic Nutrition — RD directory (mounts into #vedic-rd-directory)
 * Optional data-* on the root div:
 *   data-api-base, data-api-key, data-fixed-insurance, data-fixed-specialty, data-fixed-tag
 * Host on your CDN (e.g. jsDelivr raw GitHub) and load after the mount div.
 */
(function () {
  'use strict';

  var STYLES =
    '.vd-container{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}' +
    '.vd-controls{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin:12px 0 16px}' +
    '.vd-controls input,.vd-controls select{border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:15px;flex:1 1 220px}' +
    '.vd-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}' +
    '@media (max-width:820px){.vd-grid{grid-template-columns:repeat(6,1fr)}}' +
    '@media (max-width:480px){.vd-grid{grid-template-columns:repeat(2,1fr)}}' +
    '.vd-card{grid-column:span 6;border:1px solid #e8e8e8;border-radius:14px;padding:18px;box-shadow:0 4px 10px rgb(0 0 0 / 6%);text-align:center;background:#fff}' +
    '.vd-card-hidden{display:none!important}' +
    '.vd-card-reveal{animation:vd-fade-in .35s ease forwards}' +
    '@keyframes vd-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '.vd-imgwrap{position:relative;width:150px;height:150px;margin:0 auto 12px}' +
    '.vd-imgwrap img{width:100%;height:100%;border-radius:50%;object-fit:cover}' +
    '.vd-name{font-size:20px;margin:6px 0 2px;font-weight:700}' +
    '.vd-line{margin:6px 0;color:#333;font-size:14px}' +
    '.vd-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0 12px}' +
    '.vd-badge{background:#f5f5f5;border-radius:999px;padding:6px 10px;font-size:12px}' +
    '.vd-bio{font-size:14px;color:#333;margin:8px 0 14px}' +
    '.vd-btn{display:inline-block;background:#406AD0;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600}' +
    '.vd-count{font-size:14px;color:#555;margin-bottom:6px;min-height:20px}' +
    '.vd-status{text-align:center;color:#777;margin:10px 0}' +
    '.vd-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 0 40px;gap:18px}' +
    '.vd-loader-hidden{display:none!important}' +
    '.vd-loader-spinner{width:44px;height:44px;border:4px solid #e8e8e8;border-top-color:#406AD0;border-radius:50%;animation:vd-spin .75s linear infinite}' +
    '@keyframes vd-spin{to{transform:rotate(360deg)}}' +
    '.vd-loader-text{color:#555;font-size:15px;font-weight:500;margin:0;text-align:center}' +
    '.vd-dots::after{content:\'\';display:inline-block;width:1.5ch;text-align:left;animation:vd-dot-cycle 1.4s steps(4,end) infinite}' +
    '@keyframes vd-dot-cycle{0%{content:\'\'}25%{content:\'.\'}50%{content:\'..\'}75%{content:\'...\'}}';

  var INNER_HTML =
    '<div class="vd-controls">' +
    '<input id="vd-search" type="search" placeholder="Search by name…" />' +
    '<select id="vd-insurance"><option value="">All insurances</option></select>' +
    '<select id="vd-accepting">' +
    '<option value="yes">Accepting New Clients: Yes</option>' +
    '<option value="all">Show All Dietitians</option>' +
    '</select></div>' +
    '<div id="vd-count" class="vd-count"></div>' +
    '<div id="vd-loader" class="vd-loader vd-loader-hidden" aria-live="polite" aria-label="Loading dietitians">' +
    '<div class="vd-loader-spinner"></div>' +
    '<p class="vd-loader-text">Finding dietitians that are accepting new clients<span class="vd-dots"></span></p>' +
    '</div>' +
    '<div id="vd-grid" class="vd-grid" aria-live="polite"></div>' +
    '<div id="vd-status" class="vd-status"></div>';

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

  function main() {
    var $root = document.getElementById('vedic-rd-directory');
    if (!$root) return;

    mount($root);

    var ds = $root.dataset || {};

    var DEFAULT_API =
      'https://script.google.com/macros/s/AKfycbxev-lmv8hBefUnj48SMY_B6Hdrzw-UtxF0k-aIxrum5PkRnWeY_QC2hEzKIWm_GqQpcQ/exec';
    var API_BASE = (ds.apiBase && String(ds.apiBase).trim()) || DEFAULT_API;
    var SLOTS_API = API_BASE;
    var API_KEY = (ds.apiKey && String(ds.apiKey).trim()) || '';

    function fixedInsurance() {
      return (ds.fixedInsurance && String(ds.fixedInsurance).trim()) || '';
    }
    function fixedSpecialty() {
      return (ds.fixedSpecialty && String(ds.fixedSpecialty).trim()) || '';
    }
    function fixedTag() {
      return (ds.fixedTag && String(ds.fixedTag).trim()) || '';
    }

    var ACTIVE_ONLY = true;
    var DAYS_TO_CHECK = 14;
    var BOOK_PATH_PREFIX = '/dietitians';

    var $grid = document.getElementById('vd-grid');
    var $count = document.getElementById('vd-count');
    var $status = document.getElementById('vd-status');
    var $loader = document.getElementById('vd-loader');
    var $search = document.getElementById('vd-search');
    var $insurance = document.getElementById('vd-insurance');
    var $accepting = document.getElementById('vd-accepting');

    if (!$grid || !$search || !$accepting) return;

    if (fixedInsurance() && $insurance) $insurance.style.display = 'none';

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
    var fmtISO = function (d) {
      return d.toISOString().slice(0, 10);
    };

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
      return api({ mode: 'facets' }).then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Facets failed');
        if ($insurance) optionize(data.facets.insurances || [], $insurance);
      });
    }

    function loadProviders() {
      $status.textContent = '';
      $grid.innerHTML = '';
      $count.textContent = '';
      $loader.classList.add('vd-loader-hidden');

      if ($accepting.value !== 'yes') {
        $status.textContent = 'Loading providers…';
      }

      var params = {
        mode: 'providers',
        surface: 'profile',
        activeOnly: ACTIVE_ONLY ? 'true' : 'false',
        sort: 'name',
      };
      if ($search.value) params.search = $search.value.trim();
      var insVal = fixedInsurance() || ($insurance && $insurance.value) || '';
      if (insVal) params.insurance = insVal;
      var specVal = fixedSpecialty();
      if (specVal) params.specialty = specVal;
      var tagVal = fixedTag();
      if (tagVal) params.tag = tagVal;

      return api(params).then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Load failed');

        render(sortProviders(data.providers || []), $accepting.value === 'yes');

        if ($accepting.value === 'yes') {
          return applyAcceptingFilter();
        }
        $count.textContent = (data.total || 0) + ' dietitians found';
        $status.textContent = data.total ? '' : 'No matching providers.';
      });
    }

    function fetchSlotsForDay(id, email, dateStr) {
      var p = new URLSearchParams({ mode: 'slots', date: dateStr, days: '1' });
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
          var slotList = data.slots || [];
          if (!slotList.length && data.slotsByDate && typeof data.slotsByDate === 'object') {
            slotList = Object.keys(data.slotsByDate).reduce(function (acc, k) {
              return acc.concat(data.slotsByDate[k] || []);
            }, []);
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

    function hasUpcomingSlots(id, email) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      return new Promise(function (resolve) {
        var pending = DAYS_TO_CHECK;
        var done = false;

        for (var i = 0; i < DAYS_TO_CHECK; i++) {
          (function (dayOffset) {
            var d = new Date(today);
            d.setDate(today.getDate() + dayOffset);
            fetchSlotsForDay(id, email, fmtISO(d)).then(function (hasSlots) {
              if (done) return;
              if (hasSlots) {
                done = true;
                resolve(true);
              } else if (--pending === 0) {
                resolve(false);
              }
            });
          })(i);
        }
      });
    }

    function applyAcceptingFilter() {
      var cards = [].slice.call($grid.querySelectorAll('.vd-card'));
      if (!cards.length) {
        $loader.classList.add('vd-loader-hidden');
        $status.textContent = 'No matching providers.';
        return Promise.resolve();
      }

      $loader.classList.remove('vd-loader-hidden');
      $count.textContent = '';
      $status.textContent = '';

      var visible = 0;

      return Promise.all(
        cards.map(function (card) {
          return hasUpcomingSlots(card.dataset.id || '', card.dataset.email || '').then(function (open) {
            if (open) {
              card.classList.remove('vd-card-hidden');
              card.classList.add('vd-card-reveal');
              visible++;
              $count.textContent = visible + ' dietitian' + (visible !== 1 ? 's' : '') + ' found';
            }
          });
        })
      ).then(function () {
        $loader.classList.add('vd-loader-hidden');
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
      return ((full || '').split(' ')[0] || 'Provider');
    }

    function render(list, acceptingMode) {
      var frag = document.createDocumentFragment();
      list.forEach(function (p) {
        var card = document.createElement('div');
        card.className = 'vd-card' + (acceptingMode ? ' vd-card-hidden' : '');
        card.dataset.id = p.id || '';
        card.dataset.email = p.email || '';
        var slug = String(p.slug || '').trim();
        var href = slug ? BOOK_PATH_PREFIX + '/' + encodeURIComponent(slug) : '#';
        card.innerHTML =
          '<div class="vd-imgwrap">' +
          '<img src="' +
          escapeAttr(p.photoUrl || '') +
          '" alt="' +
          escapeAttr(p.name || 'Dietitian') +
          '" loading="lazy">' +
          '</div>' +
          '<div class="vd-name">' +
          escapeHtml(p.name || '') +
          (p.credentials ? ', ' + escapeHtml(p.credentials) : '') +
          '</div>' +
          '<div class="vd-line"><strong>Insurances:</strong> ' +
          escapeHtml((p.insurances || []).join(', ')) +
          '</div>' +
          '<div class="vd-line"><strong>Specialties:</strong> ' +
          escapeHtml((p.specialties || []).join(', ')) +
          '</div>' +
          '<div class="vd-badges">' +
          (p.tags || [])
            .map(function (t) {
              return '<span class="vd-badge">' + escapeHtml(t) + '</span>';
            })
            .join('') +
          '</div>' +
          '<div class="vd-bio">' +
          escapeHtml(p.bio || '') +
          '</div>' +
          '<a class="vd-btn" href="' +
          escapeAttr(href) +
          '" target="_self">Book with ' +
          escapeHtml(firstName(p.name || '')) +
          '</a>';
        frag.appendChild(card);
      });
      $grid.appendChild(frag);
    }

    function getProfileRank(p) {
      var r = p.profileRank != null ? p.profileRank : p['profile-rank'] != null ? p['profile-rank'] : p.profile_rank;
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

    $search.value = getQS().get('q') || '';
    $accepting.value = getQS().get('accepting') || 'yes';

    loadFacets()
      .then(function () {
        var i = fixedInsurance() || getQS().get('insurance') || '';
        if (i && $insurance) $insurance.value = i;
      })
      .then(loadProviders)
      .catch(function (err) {
        $status.textContent = 'Error loading directory.';
        console.error(err);
      });

    $search.addEventListener(
      'input',
      debounce(function () {
        setQS({ q: $search.value });
        loadProviders();
      }, 350)
    );
    if (!fixedInsurance() && $insurance) {
      $insurance.addEventListener('change', function () {
        setQS({ insurance: $insurance.value });
        loadProviders();
      });
    }
    $accepting.addEventListener('change', function () {
      setQS({ accepting: $accepting.value });
      loadProviders();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
