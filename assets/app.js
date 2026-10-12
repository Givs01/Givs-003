/*
 * app.js — Energy Assessment Portal (front end)
 * Screens: Sign in · City profile · Consumption profiles · Connection form · Review & submit · Password
 * Security: every piece of user data is inserted with textContent (never innerHTML).
 * Styling: Tailwind classes; component classes (card, input, btn, chip…) live in src/styles.css.
 */
(function () {
  'use strict';
  const S = window.SCHEMA;
  const cfg = window.APP_CONFIG || {};
  const APP = cfg.APP_NAME || 'Energy Assessment Portal';
  const root = document.getElementById('app');

  const state = { user: null, profile: null, facilities: {}, view: 'profile', editing: null, dirty: false, navOpen: false, filter: 'all' };

  /* ================= helpers ================= */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) return c.forEach(x => add(el, x));
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }

  const ICONS = {
    menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    close: 'M6 18 18 6M6 6l12 12',
    building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    bolt: 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
    badge: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    key: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9',
    back: 'M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    upload: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
    doc: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    check: 'm4.5 12.75 6 6 9-13.5',
    alert: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
    print: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z',
    sun: 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    lock: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z',
    trash: 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
  };
  function icon(name, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', cls || 'size-5 shrink-0');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', ICONS[name]);
    svg.append(path);
    return svg;
  }

  const typeOf = key => S.facilityTypes.find(t => t.key === key);
  const pad2 = n => String(n).padStart(2, '0');
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const inr = n => (typeof n === 'number' && isFinite(n)) ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '–';
  const num = n => (typeof n === 'number' && isFinite(n)) ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : (n === 'NA' ? 'NA' : '–');
  function fmtDate(iso) {
    const d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return '';
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear() + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  const TOAST = {
    ok: 'pointer-events-auto rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg',
    error: 'pointer-events-auto rounded-xl bg-red-700 px-4 py-3 text-sm font-medium text-white shadow-lg',
    info: 'pointer-events-auto rounded-xl bg-sky-950 px-4 py-3 text-sm font-medium text-white shadow-lg'
  };
  function toast(msg, kind) {
    const box = document.getElementById('toast');
    const t = h('div', { class: TOAST[kind] || TOAST.info, role: 'status' }, msg);
    box.replaceChildren(t);
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.remove(), 4500);
  }
  function busy(btn, on, label) {
    if (!btn) return;
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Saving…'; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
  const isLocked = () => !!(state.profile && state.profile.status === 'submitted');
  const countSaved = () => { let c = 0; for (let i = 1; i <= state.profile.connections; i++) if (state.facilities[i]) c++; return c; };
  const linkedTo = key => Object.values(state.facilities).filter(c => (c.facility_types || []).indexOf(key) > -1).length;

  function handleError(e, where) {
    if (e && e.code === 'LOCKED_SUBMITTED' && state.user) {
      Api.call('getProfile').then(pr => { state.profile = pr; state.dirty = false; state.editing = null; renderApp(); }).catch(() => {});
    }
    if (e && e.code === 'AUTH' && state.user) { state.user = null; renderLogin('Your session has ended. Sign in again.'); return; }
    toast((e && e.message) || 'Something went wrong.', 'error');
    if (where) where.textContent = (e && e.message) || '';
  }
  window.addEventListener('beforeunload', ev => { if (state.dirty) { ev.preventDefault(); ev.returnValue = ''; } });

  /* Logo: assets/logo.png, then the fallback URL, then a text mark */
  function logo(cls) {
    const srcs = [cfg.LOGO_URL, cfg.LOGO_FALLBACK_URL].filter(Boolean);
    const mark = h('span', { class: 'grid size-10 place-items-center rounded-xl bg-sky-800 text-sm font-bold text-white', 'aria-hidden': 'true' }, 'EA');
    if (!srcs.length) return mark;
    const img = h('img', { class: cls, src: srcs[0], alt: cfg.LOGO_ALT || 'Logo', referrerpolicy: 'no-referrer' });
    let i = 0;
    img.addEventListener('error', () => { i++; if (i < srcs.length) img.src = srcs[i]; else img.replaceWith(mark); });
    return img;
  }

  /* ================= start-up ================= */
  async function boot() {
    if (cfg.BLOCK_FRAMING && window.top !== window.self) {
      document.body.textContent = 'For security, this portal cannot be opened inside another website.';
      return;
    }
    if (!Api.configured) return renderNotConfigured();
    if (Api.hasToken()) {
      try {
        state.user = await Api.call('me');
        await loadData();
        state.view = landing();
        return renderApp();
      } catch (e) { Api.clearToken(); }
    }
    renderLogin();
  }
  async function loadData() {
    const [profile, list] = await Promise.all([Api.call('getProfile'), Api.call('listConnections')]);
    state.profile = profile;
    state.facilities = {};
    list.forEach(c => { state.facilities[Number(c.seq)] = c; });
  }
  const landing = () => isLocked() ? 'review' : (state.profile.connections > 0 ? 'consumption' : 'profile');

  /* ================= auth screens ================= */
  function authLayout(content) {
    root.replaceChildren(h('div', { class: 'grid min-h-dvh lg:grid-cols-2' },
      h('aside', { class: 'relative hidden flex-col justify-between overflow-hidden bg-sky-950 p-12 text-white lg:flex' },
        h('div', { class: 'flex items-center gap-3' },
          h('span', { class: 'grid size-10 place-items-center rounded-xl bg-sky-800' }, icon('bolt', 'size-5 text-sky-400')),
          h('span', { class: 'text-lg font-semibold' }, APP)),
        h('div', { class: 'max-w-md' },
          h('h1', { class: 'text-4xl font-semibold leading-tight tracking-tight' }, 'Energy use of WASH and SWM facilities'),
          h('div', { class: 'mt-6 flex flex-wrap gap-2' },
            ['Water supply', 'Sewerage', 'Solid waste'].map(t => h('span', { class: 'rounded-full bg-sky-900 px-3 py-1 text-xs font-medium text-sky-100' }, t)))),
        h('p', { class: 'text-xs text-sky-100/60' }, 'For authorised Urban Local Body users only.'),
        h('div', { class: 'pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-sky-800/40 blur-3xl', 'aria-hidden': 'true' })),
      h('main', { class: 'flex items-center justify-center px-4 py-10 sm:px-8' }, content)));
  }

  function renderNotConfigured() {
    authLayout(h('div', { class: 'w-full max-w-sm' },
      h('div', { class: 'mb-8' }, logo('h-14 w-auto')),
      h('h2', { class: 'text-xl font-semibold text-sky-950' }, 'Not connected'),
      h('p', { class: 'mt-2 text-sm text-slate-600' }, 'Set API_URL in config.js to the Apps Script web app URL.')));
  }

  function renderLogin(message) {
    state.navOpen = false;
    const user = h('input', { id: 'u', class: 'input', type: 'text', autocomplete: 'username', maxlength: 40, autocapitalize: 'none', spellcheck: 'false', required: true });
    const pass = h('input', { id: 'p', class: 'input', type: 'password', autocomplete: 'current-password', maxlength: 128, required: true });
    const err = h('p', { class: 'form-error', role: 'alert' }, message || '');
    const btn = h('button', { class: 'btn btn-primary h-11 w-full', type: 'submit' }, 'Sign in');
    const form = h('form', { class: 'w-full max-w-sm', novalidate: true },
      h('div', { class: 'mb-8' }, logo('h-14 w-auto')),
      h('h2', { class: 'text-2xl font-semibold tracking-tight text-sky-950' }, 'Sign in'),
      h('p', { class: 'mt-1 text-sm text-slate-500' }, 'Use the account issued to your ULB.'),
      h('div', { class: 'mt-8 space-y-4' },
        h('div', null, h('label', { class: 'label', for: 'u' }, 'Username'), user),
        h('div', null, h('label', { class: 'label', for: 'p' }, 'Password'), pass),
        err, btn),
      h('p', { class: 'mt-6 text-xs text-slate-500' }, 'Forgot password? Contact ' + (cfg.SUPPORT_CONTACT || 'the portal administrator') + '.'));
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      err.textContent = '';
      if (!user.value.trim() || !pass.value) { err.textContent = 'Enter your username and password.'; return; }
      busy(btn, true, 'Signing in…');
      try {
        state.user = await Api.login(user.value.trim(), pass.value);
        pass.value = '';
        await loadData();
        state.view = landing();
        renderApp();
      } catch (e) { err.textContent = e.message; pass.value = ''; pass.focus(); busy(btn, false); }
    });
    authLayout(form);
    user.focus();
  }

  async function signOut() {
    if (state.dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
    state.dirty = false;
    await Api.logout();
    Object.assign(state, { user: null, profile: null, facilities: {}, editing: null });
    renderLogin('You have signed out.');
  }

  /* ================= app shell ================= */
  function go(view, editing) {
    if (state.dirty && !confirm('You have unsaved changes. Leave this page?')) return;
    Object.assign(state, { dirty: false, view, editing: editing || null, navOpen: false });
    renderApp();
  }

  function header() {
    return h('header', { class: 'fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 print:hidden' },
      h('div', { class: 'flex min-w-0 items-center gap-3' },
        h('button', { class: 'btn btn-ghost size-10 p-0 lg:hidden', type: 'button', 'aria-label': state.navOpen ? 'Close menu' : 'Open menu', 'aria-expanded': String(state.navOpen),
          onclick: () => { state.navOpen = !state.navOpen; renderApp(); } }, icon(state.navOpen ? 'close' : 'menu')),
        h('span', { class: 'hidden size-9 shrink-0 place-items-center rounded-lg bg-sky-800 sm:grid' }, icon('bolt', 'size-5 text-sky-400')),
        h('span', { class: 'truncate text-base font-semibold tracking-tight text-sky-950 sm:text-lg' }, APP)),
      logo('h-10 w-auto max-w-40 object-contain'));
  }

  function sidebar() {
    const p = state.profile, n = p.connections, saved = countSaved();
    const item = (view, ic, label, badge, disabled) => h('button', {
      class: 'nav-item', type: 'button', disabled: disabled || null,
      'aria-current': state.view === view ? 'page' : null, onclick: () => go(view)
    }, icon(ic), h('span', { class: 'flex-1' }, label), badge);
    const pill = (text, cls) => h('span', { class: 'rounded-full px-2 py-0.5 text-[11px] font-semibold ' + cls }, text);
    const initials = (state.user.ulb_name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return h('aside', {
      class: 'fixed bottom-0 left-0 top-16 z-40 flex w-72 flex-col bg-sky-950 transition-transform duration-200 lg:translate-x-0 print:hidden ' +
        (state.navOpen ? 'translate-x-0' : '-translate-x-full')
    },
      h('nav', { class: 'flex-1 space-y-1 overflow-y-auto p-4', 'aria-label': 'Assessment' },
        h('p', { class: 'px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sky-400/80' }, 'Assessment'),
        item('profile', 'building', 'City profile', p.updated_at ? pill(String(n), 'bg-sky-900 text-sky-100') : null),
        item('consumption', 'bolt', 'Consumption profiles', n ? pill(saved + '/' + n, saved === n ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-900 text-sky-100') : null, n === 0),
        item('review', 'badge', 'Review & submit',
          isLocked() ? pill('Submitted', 'bg-emerald-500/20 text-emerald-300') : p.status === 'reopened' ? pill('Reopened', 'bg-amber-400/20 text-amber-200') : null, n === 0)),
      h('div', { class: 'border-t border-sky-900 p-4' },
        h('div', { class: 'flex items-center gap-3' },
          h('span', { class: 'grid size-10 shrink-0 place-items-center rounded-full bg-sky-800 text-sm font-semibold text-white' }, initials),
          h('div', { class: 'min-w-0' },
            h('p', { class: 'line-clamp-2 text-sm font-semibold leading-snug text-white' }, state.user.ulb_name),
            h('p', { class: 'truncate text-xs text-sky-100/60' }, 'Class ' + state.user.ulb_class + ' · ' + state.user.username))),
        h('div', { class: 'mt-3 grid grid-cols-2 gap-2' },
          h('button', { class: 'nav-item justify-center px-2 py-2 text-xs', type: 'button', 'aria-current': state.view === 'password' ? 'page' : null, onclick: () => go('password') }, icon('key', 'size-4'), 'Password'),
          h('button', { class: 'nav-item justify-center px-2 py-2 text-xs', type: 'button', onclick: signOut }, icon('logout', 'size-4'), 'Sign out'))));
  }

  function renderApp() {
    let view;
    if (state.view === 'password') view = passwordView();
    else if (state.view === 'review') view = reviewView();
    else if (state.view === 'profile') view = profileView();
    else if (state.editing) view = editorView();
    else view = consumptionView();
    if (isLocked() && (state.view === 'profile' || state.editing)) readOnly(view);

    root.replaceChildren(...[
      header(),
      state.navOpen ? h('div', { class: 'fixed inset-0 top-16 z-30 bg-sky-950/40 lg:hidden', onclick: () => { state.navOpen = false; renderApp(); } }) : null,
      sidebar(),
      h('main', { id: 'main', class: 'pt-16 lg:pl-72' },
        h('div', { class: 'mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8' }, banner(), view))
    ].filter(Boolean));
    const t = root.querySelector('main h1');
    if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  function banner() {
    const p = state.profile;
    if (isLocked() && state.view !== 'review') {
      return h('div', { class: 'mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden' },
        icon('lock', 'size-5'), h('span', { class: 'flex-1 font-medium' }, 'Submitted · read-only'),
        h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: () => go('review') }, 'Acknowledgement'));
    }
    if (p.status === 'reopened') {
      return h('div', { class: 'mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden' },
        icon('alert', 'size-5'), 'Reopened for correction. Submit again when done.');
    }
    return null;
  }

  function pageHead(title, sub, right) {
    return h('div', { class: 'mb-6 flex flex-wrap items-end justify-between gap-3' },
      h('div', { class: 'min-w-0' },
        h('h1', { class: 'text-2xl font-semibold tracking-tight text-sky-950 outline-none' }, title),
        sub ? h('p', { class: 'mt-1 text-sm text-slate-500' }, sub) : null),
      right ? h('div', { class: 'flex flex-wrap items-center gap-2' }, right) : null);
  }

  function card(title, ic, right, body, bodyCls) {
    return h('section', { class: 'card' },
      title ? h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, ic ? icon(ic, 'size-5 text-sky-700') : null, title), right || null) : null,
      h('div', { class: bodyCls === undefined ? 'card-body' : bodyCls }, body));
  }

  /** After final submission: same screens, nothing editable. */
  function readOnly(view) {
    view.querySelectorAll('[data-edit]').forEach(el => el.remove());
    view.querySelectorAll('input, select, textarea, button[data-ctl]').forEach(el => { el.disabled = true; });
  }

  /* ================= reusable controls ================= */
  function stepper(id, value, max, label, onChange) {
    const input = h('input', { id, type: 'number', inputmode: 'numeric', min: 0, max, step: 1, value,
      class: 'h-10 w-14 border-x border-slate-300 bg-white text-center text-sm font-semibold tabular-nums text-slate-900 outline-none focus:bg-sky-50 disabled:bg-slate-100' });
    let cur = value;
    const set = v => {
      v = Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
      if (v !== cur) state.dirty = true;
      cur = v; input.value = v; onChange(v);
    };
    input.addEventListener('input', () => {
      const v = Number(input.value);
      cur = Number.isFinite(v) && v >= 0 ? Math.min(max, Math.floor(v)) : 0;
      state.dirty = true; onChange(cur);
    });
    input.addEventListener('blur', () => set(input.value));
    const b = (txt, aria, d) => h('button', { type: 'button', 'data-ctl': true, 'aria-label': aria + ' ' + label,
      class: 'grid h-10 w-10 place-items-center text-lg font-medium text-sky-800 transition hover:bg-sky-50 disabled:text-slate-400 disabled:hover:bg-transparent',
      onclick: () => set(cur + d) }, txt);
    return h('div', { class: 'inline-flex shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xs' },
      b('−', 'Decrease', -1), input, b('+', 'Increase', 1));
  }

  /** Single-choice chip group that behaves like a form control (.value, .disabled). */
  function chipRadio(id, options, value, onChange) {
    let cur = value == null ? '' : String(value);
    const group = h('div', { id, role: 'radiogroup', class: 'flex flex-wrap gap-2' });
    const btns = options.map(o => h('button', {
      type: 'button', role: 'radio', 'data-ctl': true, class: 'chip-option', 'aria-checked': String(cur === o.value),
      onclick: () => { cur = o.value; sync(); onChange && onChange(cur); }
    }, o.label));
    const sync = () => btns.forEach((b, i) => b.setAttribute('aria-checked', String(options[i].value === cur)));
    add(group, btns);
    Object.defineProperty(group, 'value', { get: () => cur, set: v => { cur = String(v); sync(); } });
    Object.defineProperty(group, 'disabled', { set: d => btns.forEach(b => { b.disabled = d; }) });
    return group;
  }

  /* ================= step 1 · city profile ================= */
  function profileView() {
    const p = state.profile;
    const counts = Object.assign({}, p.counts);
    let connections = p.connections;
    const err = h('p', { class: 'form-error', role: 'alert' });
    const statConn = h('span'), statFac = h('span'), facChip = h('span', { class: 'chip chip-sky' });
    const recalc = () => {
      const t = S.facilityTypes.reduce((s, ft) => s + (counts[ft.key] || 0), 0);
      statConn.textContent = connections;
      statFac.textContent = t;
      facChip.textContent = 'Total ' + t;
    };

    const stat = (label, valueEl, ic) => h('div', { class: 'card flex items-center gap-4 p-3 sm:p-5' },
      h('span', { class: 'hidden size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800 sm:grid' }, icon(ic)),
      h('div', { class: 'min-w-0' }, h('p', { class: 'text-[11px] font-medium leading-tight text-slate-500 sm:text-xs' }, label),
        h('p', { class: 'mt-1 text-xl font-semibold tabular-nums text-sky-950 sm:text-2xl' }, valueEl)));

    const facBoxes = S.facilityTypes.map(ft => {
      const used = linkedTo(ft.key);
      return h('div', { class: 'flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3' },
        h('label', { for: 'c_' + ft.key, class: 'min-w-0 cursor-pointer' },
          h('span', { class: 'flex items-center gap-2' }, h('span', { class: 'chip chip-sky' }, ft.code),
            used ? h('span', { class: 'chip chip-green' }, used + ' linked') : null),
          h('span', { class: 'mt-1.5 block text-sm font-medium leading-snug text-slate-700' }, ft.label)),
        stepper('c_' + ft.key, counts[ft.key] || 0, S.MAX_PER_TYPE, ft.label, v => { counts[ft.key] = v; recalc(); }));
    });
    recalc();

    const saveBtn = h('button', { class: 'btn btn-primary', type: 'button', 'data-edit': true }, 'Save city profile');
    saveBtn.addEventListener('click', async () => {
      err.textContent = '';
      busy(saveBtn, true);
      try {
        state.profile = await Api.call('saveProfile', { connections, counts });
        state.dirty = false;
        toast('City profile saved.', 'ok');
        renderApp();
      } catch (e) { handleError(e, err); } finally { busy(saveBtn, false); }
    });

    return h('div', { class: 'space-y-6' },
      pageHead('City profile', p.ulb_name + ' · Class ' + p.ulb_class),
      h('div', { class: 'grid grid-cols-3 gap-3 sm:gap-4' },
        stat('Connections', statConn, 'bolt'),
        stat('Facilities', statFac, 'building'),
        stat('Profiles saved', countSaved() + ' / ' + p.connections, 'chart')),
      card('Electricity connections', 'bolt', null,
        h('div', { class: 'flex flex-wrap items-center justify-between gap-4' },
          h('label', { for: 'c_conn', class: 'cursor-pointer' },
            h('span', { class: 'block text-sm font-medium text-slate-800' }, 'Number of electricity connections'),
            h('span', { class: 'block text-xs text-slate-500' }, 'One per consumer number')),
          stepper('c_conn', connections, S.MAX_CONNECTIONS, 'electricity connections', v => { connections = v; recalc(); }))),
      card('WASH facilities', 'building', facChip, h('div', { class: 'grid gap-3 md:grid-cols-2' }, facBoxes)),
      h('div', { class: 'flex flex-wrap items-center justify-end gap-3' },
        p.updated_at ? h('span', { class: 'mr-auto text-xs text-slate-500' }, 'Saved ' + fmtDate(p.updated_at) + ' by ' + p.updated_by) : null,
        err,
        p.connections ? h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => go('consumption') }, 'Consumption profiles') : null,
        saveBtn));
  }

  /* ================= step 2 · connection list ================= */
  function consumptionView() {
    const total = state.profile.connections;
    if (!total) {
      return h('div', null, pageHead('Consumption profiles'),
        card(null, null, null, h('div', { class: 'flex flex-col items-center gap-3 py-8 text-center' },
          h('p', { class: 'text-sm text-slate-500' }, 'Add electricity connections in the city profile first.'),
          h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('profile') }, 'Open city profile'))));
    }
    const all = [];
    for (let i = 1; i <= total; i++) all.push({ seq: i, c: state.facilities[i] || null });
    const groups = {
      all: all,
      pending: all.filter(x => !x.c),
      saved: all.filter(x => x.c && x.c.bill_file_name),
      nobill: all.filter(x => x.c && !x.c.bill_file_name)
    };
    if (!groups[state.filter]) state.filter = 'all';
    const done = total - groups.pending.length;
    const bar = h('div', { class: 'h-full rounded-full bg-sky-700 transition-all' });
    bar.style.width = Math.round(done / total * 100) + '%';

    const filters = [['all', 'All'], ['pending', 'Not started'], ['nobill', 'Bill missing'], ['saved', 'Complete']].map(([k, label]) =>
      h('button', { type: 'button', class: 'chip-option h-8 text-xs', 'aria-pressed': String(state.filter === k),
        onclick: () => { state.filter = k; renderApp(); } }, label, h('span', { class: 'opacity-70' }, groups[k].length)));

    const status = c => !c ? h('span', { class: 'chip chip-slate' }, 'Not started')
      : c.bill_file_name ? h('span', { class: 'chip chip-green' }, icon('check', 'size-3'), 'Complete')
        : h('span', { class: 'chip chip-amber' }, 'Bill missing');

    const tiles = groups[state.filter].map(({ seq, c }) => {
      const types = c ? S.parseTypes(c.facility_types).map(typeOf).filter(Boolean) : [];
      return h('button', {
        type: 'button', onclick: () => go('consumption', { seq }),
        class: 'group flex flex-col gap-3 rounded-2xl border bg-white p-4 text-left shadow-xs transition hover:border-sky-400 hover:shadow-md ' +
          (c ? 'border-slate-200' : 'border-dashed border-slate-300')
      },
        h('div', { class: 'flex items-center justify-between gap-2' },
          h('span', { class: 'text-sm font-semibold text-sky-950' }, 'Connection ' + seq), status(c)),
        c ? h('p', { class: 'truncate text-sm text-slate-700' }, c.facility_name)
          : h('p', { class: 'flex items-center gap-1.5 text-sm font-medium text-sky-700' }, icon('plus', 'size-4'), 'Add profile'),
        types.length ? h('div', { class: 'flex flex-wrap gap-1' }, types.map(t => h('span', { class: 'chip chip-sky' }, t.code))) : null,
        c ? h('p', { class: 'text-xs tabular-nums text-slate-500' }, 'Consumer no. ' + c.consumer_no) : null);
    });

    return h('div', { class: 'space-y-6' },
      pageHead('Consumption profiles', 'One profile per electricity connection',
        h('span', { class: 'chip chip-sky text-sm' }, done + ' / ' + total + ' saved')),
      h('div', { class: 'h-2 overflow-hidden rounded-full bg-slate-200', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, 'aria-label': 'Profiles saved' }, bar),
      h('div', { class: 'flex flex-wrap gap-2' }, filters),
      tiles.length ? h('div', { class: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }, tiles)
        : h('p', { class: 'rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500' }, 'Nothing here.'),
      done === total && !isLocked()
        ? h('div', { class: 'flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-950 px-5 py-4 text-white' },
          h('span', { class: 'text-sm font-medium' }, 'All connection profiles are saved.'),
          h('button', { class: 'btn bg-white text-sky-900 hover:bg-sky-50', type: 'button', onclick: () => go('review') }, 'Review & submit'))
        : null);
  }

  /* ================= step 2 · connection form ================= */
  function editorView() {
    const { seq } = state.editing;
    const existing = state.facilities[seq] || null;
    const val = k => existing && existing[k] !== undefined ? existing[k] : '';
    const controls = {}, errs = {};
    const markDirty = () => { state.dirty = true; };
    const summary = h('div', { class: 'flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700', role: 'alert', tabindex: '-1', hidden: true });
    const chosen = S.parseTypes(val('facility_types'));
    const typeChoices = S.facilityTypes.filter(ft => state.profile.counts[ft.key] > 0 || chosen.indexOf(ft.key) > -1);

    function field(f) {
      const id = 'f_' + f.key;
      const v = val(f.key);
      const err = h('p', { class: 'field-error', id: id + '_err' });
      errs[f.key] = err;
      let control, span = '';

      if (f.type === 'facilityTypes') {
        const picked = new Set(chosen);
        const btns = typeChoices.map(t => h('button', {
          type: 'button', 'data-ctl': true, class: 'chip-option', 'aria-pressed': String(picked.has(t.key)), title: t.label,
          onclick: ev => { const b = ev.currentTarget; picked.has(t.key) ? picked.delete(t.key) : picked.add(t.key); b.setAttribute('aria-pressed', String(picked.has(t.key))); markDirty(); }
        }, h('span', { class: 'font-semibold' }, t.code), h('span', { class: 'hidden font-normal sm:inline' }, t.label)));
        control = h('div', { id, role: 'group', class: 'flex flex-wrap gap-2', 'aria-labelledby': id + '_lbl' }, btns);
        control.getValue = () => typeChoices.map(t => t.key).filter(k => picked.has(k));
        span = 'sm:col-span-2 xl:col-span-3';
      } else if (f.type === 'select') {
        control = chipRadio(id, f.options.map(o => ({ value: o, label: o })), v, markDirty);
      } else if (f.type === 'tod') {
        control = chipRadio(id, S.todOptions, v, markDirty);
      } else {
        const im = f.type === 'number' ? 'decimal' : (f.type === 'digits' || f.type === 'year') ? 'numeric' : null;
        control = h('input', { id, class: 'input' + (f.unit ? ' pr-16' : ''), type: 'text', inputmode: im, autocomplete: 'off',
          maxlength: f.maxLen || 20, placeholder: f.placeholder || null, value: v === 'NA' ? '' : v });
        control.addEventListener('input', markDirty);
        if (f.wide) span = 'sm:col-span-2';
      }
      controls[f.key] = control;
      control.setAttribute('aria-describedby', id + '_err');

      if (f.type === 'tod') {   // label left, chips right — rows stay aligned
        return h('div', { class: 'grid items-center gap-2 border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]' },
          h('span', { class: 'text-sm font-medium tabular-nums text-slate-700', id: id + '_lbl' }, f.label),
          h('div', null, control, err));
      }
      const lbl = (f.type === 'facilityTypes' || f.type === 'select')
        ? h('span', { class: 'label', id: id + '_lbl' }, f.label)
        : h('label', { class: 'label', for: id }, f.label);
      if (f.type === 'select') control.setAttribute('aria-labelledby', id + '_lbl');
      return h('div', { class: span },
        lbl,
        f.unit ? h('div', { class: 'relative' }, control, h('span', { class: 'input-unit', 'aria-hidden': 'true' }, f.unit)) : control,
        err);
    }

    // solar NA switch
    const noSolar = h('input', { type: 'checkbox', id: 'no_solar', class: 'peer sr-only' });
    const syncSolar = () => ['solar_kw', 'solar_year'].forEach(k => {
      controls[k].disabled = noSolar.checked;
      if (noSolar.checked) { controls[k].value = ''; errs[k].textContent = ''; }
    });
    noSolar.addEventListener('change', () => { markDirty(); syncSolar(); });
    const solarSwitch = h('label', { for: 'no_solar', class: 'inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600' },
      noSolar,
      h('span', { class: 'relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-sky-800 peer-focus-visible:outline-2 peer-focus-visible:outline-sky-700 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4' }),
      'No solar');

    const ICON_FOR = { facility: 'building', solar: 'sun', load: 'bolt', billing: 'chart', tod: 'clock' };
    const GRID = { facility: 'grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3', solar: 'grid gap-x-5 gap-y-4 sm:grid-cols-2',
      load: 'grid gap-x-5 gap-y-4 sm:grid-cols-3', billing: 'grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4', tod: '' };
    const sections = S.groups.map(g => card(g.label, ICON_FOR[g.key],
      g.key === 'solar' ? solarSwitch : (g.badge ? h('span', { class: 'chip chip-sky' }, g.badge) : null),
      h('div', { class: GRID[g.key] }, S.fields.filter(f => f.group === g.key).map(field))));
    noSolar.checked = !!existing && existing.solar_kw === 'NA';
    syncSolar();

    // bill upload
    const file = h('input', { type: 'file', id: 'bill', accept: S.BILL.accept, class: 'sr-only' });
    const fileName = h('span', { class: 'text-sm font-medium text-sky-800' }, 'Choose file');
    const fileErr = h('p', { class: 'field-error', id: 'bill_err' });
    file.addEventListener('change', () => {
      fileErr.textContent = '';
      const f = file.files[0];
      if (!f) return;
      markDirty();
      if (S.BILL.mimes.indexOf(f.type) === -1) { fileErr.textContent = 'Use a PDF, JPG or PNG file.'; file.value = ''; return; }
      if (f.size > S.BILL.maxBytes) { fileErr.textContent = 'File is ' + (f.size / 1048576).toFixed(1) + ' MB. Limit is 10 MB.'; file.value = ''; return; }
      fileName.textContent = f.name;
    });
    const billCard = card('Electricity bill', 'doc',
      existing && existing.bill_file_name ? h('span', { class: 'chip chip-green' }, icon('check', 'size-3'), existing.bill_file_name) : h('span', { class: 'chip chip-amber' }, 'Not attached'),
      h('div', null,
        h('label', { for: 'bill', 'data-edit': true, class: 'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50/50' },
          icon('upload', 'size-7 text-sky-700'), fileName,
          h('span', { class: 'text-xs text-slate-500' }, 'PDF, JPG or PNG · max 10 MB'), file),
        fileErr));

    const saveBtn = h('button', { class: 'btn btn-primary', type: 'submit', 'data-edit': true }, 'Save profile');
    const delBtn = existing ? h('button', { class: 'btn btn-danger mr-auto', type: 'button', 'data-edit': true }, icon('trash', 'size-4'), 'Delete') : null;
    const back = () => go('consumption');

    const form = h('form', { class: 'space-y-6', novalidate: true }, summary, sections, billCard,
      h('div', { class: 'sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8' },
        delBtn, h('button', { class: 'btn btn-secondary', type: 'button', onclick: back }, isLocked() ? 'Back' : 'Cancel'), saveBtn));

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const data = {};
      S.fields.forEach(f => { const c = controls[f.key]; data[f.key] = c.getValue ? c.getValue() : c.value; });
      if (noSolar.checked) { data.solar_kw = 'NA'; data.solar_year = 'NA'; }
      const v = S.validateFacility(data);
      S.fields.forEach(f => { errs[f.key].textContent = v.errors[f.key] || ''; controls[f.key].setAttribute('aria-invalid', v.errors[f.key] ? 'true' : 'false'); });
      if (!v.valid) {
        const n = Object.keys(v.errors).length;
        summary.replaceChildren(icon('alert'), plural(n, 'field needs', 'fields need') + ' attention.');
        summary.hidden = false; summary.focus();
        return;
      }
      summary.hidden = true;
      busy(saveBtn, true);
      try {
        const saved = await Api.call('saveConnection', { seq, data: v.clean });
        state.facilities[seq] = saved;
        const f = file.files[0];
        if (f) {
          saveBtn.textContent = 'Uploading…';
          try {
            Object.assign(saved, await Api.call('uploadBill', { seq, fileName: f.name, mimeType: f.type, data: await toBase64(f) }));
          } catch (e) {
            state.dirty = false; busy(saveBtn, false);
            fileErr.textContent = 'Saved, but the bill did not upload: ' + e.message;
            toast('Profile saved. Bill upload failed.', 'error');
            return;
          }
        }
        state.dirty = false;
        toast('Connection ' + seq + ' saved.', 'ok');
        go('consumption');
      } catch (e) { busy(saveBtn, false); handleError(e); }
    });

    if (delBtn) delBtn.addEventListener('click', async () => {
      if (!confirm('Delete the profile for Connection ' + seq + '?')) return;
      busy(delBtn, true, 'Deleting…');
      try {
        await Api.call('deleteConnection', { seq });
        delete state.facilities[seq];
        state.dirty = false;
        toast('Connection ' + seq + ' deleted.', 'ok');
        go('consumption');
      } catch (e) { busy(delBtn, false); handleError(e); }
    });

    return h('div', null,
      h('button', { class: 'btn btn-ghost btn-sm -ml-3 mb-3', type: 'button', onclick: back }, icon('back', 'size-4'), 'All connections'),
      pageHead('Connection ' + seq, 'Consumption profile · ' + seq + ' of ' + state.profile.connections,
        existing ? h('span', { class: 'text-xs text-slate-500' }, 'Saved ' + fmtDate(existing.updated_at)) : h('span', { class: 'chip chip-slate' }, 'New')),
      form);
  }

  /* ================= step 3 · review & submit ================= */
  function reviewView() {
    const p = state.profile, n = p.connections, submitted = isLocked();
    const list = [];
    for (let i = 1; i <= n; i++) list.push({ seq: i, c: state.facilities[i] || null });
    const missing = list.filter(x => !x.c).map(x => x.seq);
    const noBill = list.filter(x => x.c && !x.c.bill_file_name).map(x => x.seq);
    const needBills = !p.rules || p.rules.require_bills !== false;
    const unlinked = S.facilityTypes.filter(t => p.counts[t.key] > 0 && !linkedTo(t.key));
    const ready = n > 0 && missing.length === 0 && (!needBills || noBill.length === 0);
    const saved = list.filter(x => x.c).map(x => x.c);
    const sum = k => saved.reduce((s, c) => s + (typeof c[k] === 'number' ? c[k] : 0), 0);

    const check = (kind, text) => {
      const m = { ok: ['check', 'bg-emerald-100 text-emerald-700'], bad: ['close', 'bg-red-100 text-red-700'], warn: ['alert', 'bg-amber-100 text-amber-700'] }[kind];
      return h('li', { class: 'flex items-start gap-3 py-2.5' },
        h('span', { class: 'grid size-6 shrink-0 place-items-center rounded-full ' + m[1] }, icon(m[0], 'size-3.5')),
        h('span', { class: 'text-sm text-slate-700' }, text));
    };
    const checks = h('ul', { class: 'divide-y divide-slate-100' },
      check(p.updated_at && n > 0 ? 'ok' : 'bad', 'City profile · ' + plural(n, 'connection') + ', ' + plural(p.total_facilities, 'facility', 'facilities')),
      check(missing.length ? 'bad' : 'ok', missing.length ? 'Profile missing · Connection ' + missing.join(', ') : 'All consumption profiles saved'),
      needBills ? check(noBill.length ? 'bad' : 'ok', noBill.length ? 'Bill missing · Connection ' + noBill.join(', ') : 'All bills attached') : null,
      unlinked.length ? check('warn', 'No connection linked · ' + unlinked.map(t => t.code).join(', ') + ' (optional)') : null);

    const facTable = h('div', { class: 'overflow-x-auto' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, h('th', null, 'Facility type'), h('th', { class: 'text-right' }, 'Facilities'), h('th', { class: 'text-right' }, 'Connections'))),
      h('tbody', null, S.facilityTypes.filter(t => p.counts[t.key] > 0).map(t => h('tr', null,
        h('td', null, h('span', { class: 'chip chip-sky mr-2' }, t.code), t.label),
        h('td', { class: 'text-right tabular-nums' }, p.counts[t.key]),
        h('td', { class: 'text-right tabular-nums' }, linkedTo(t.key))))),
      h('tfoot', null, h('tr', null, h('td', null, 'Total'), h('td', { class: 'text-right tabular-nums' }, p.total_facilities), h('td', { class: 'text-right tabular-nums' }, n)))));

    const connTable = h('div', { class: 'overflow-x-auto' }, h('table', { class: 'table min-w-[44rem]' },
      h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Facility'), h('th', null, 'Consumer no.'),
        h('th', { class: 'text-right' }, 'kVAh / month'), h('th', { class: 'text-right' }, 'Bill / month'), h('th', null, 'Bill copy'),
        submitted ? null : h('th', { class: 'print:hidden' }))),
      h('tbody', null, list.map(({ seq, c }) => h('tr', null,
        h('td', { class: 'tabular-nums' }, seq),
        h('td', null, c ? h('div', null, h('p', { class: 'font-medium text-slate-900' }, c.facility_name),
          h('div', { class: 'mt-1 flex flex-wrap gap-1' }, S.parseTypes(c.facility_types).map(typeOf).filter(Boolean).map(t => h('span', { class: 'chip chip-sky' }, t.code))))
          : h('span', { class: 'chip chip-red' }, 'Not filled')),
        h('td', { class: 'tabular-nums' }, c ? c.consumer_no : '–'),
        h('td', { class: 'text-right tabular-nums' }, c ? num(c.avg_units_kvah) : '–'),
        h('td', { class: 'text-right tabular-nums' }, c ? inr(c.avg_bill_amount) : '–'),
        h('td', null, c ? (c.bill_file_name ? h('span', { class: 'chip chip-green' }, 'Yes') : h('span', { class: 'chip chip-amber' }, 'No')) : '–'),
        submitted ? null : h('td', { class: 'text-right print:hidden' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => go('consumption', { seq }) }, c ? 'Edit' : 'Fill'))))),
      h('tfoot', null, h('tr', null, h('td'), h('td', null, 'Total'), h('td'),
        h('td', { class: 'text-right tabular-nums' }, num(sum('avg_units_kvah'))),
        h('td', { class: 'text-right tabular-nums' }, inr(sum('avg_bill_amount'))), h('td'), submitted ? null : h('td', { class: 'print:hidden' })))));

    let action;
    if (submitted) {
      const row = (k, v) => h('div', null, h('dt', { class: 'text-xs text-slate-500' }, k), h('dd', { class: 'mt-0.5 text-sm font-semibold text-slate-900' }, v));
      action = h('section', { class: 'card overflow-hidden' },
        h('div', { class: 'flex flex-wrap items-center justify-between gap-4 bg-sky-950 px-6 py-5 text-white' },
          h('div', null, h('p', { class: 'text-xs font-medium uppercase tracking-wider text-sky-400' }, 'Acknowledgement'),
            h('p', { class: 'mt-1 font-mono text-xl font-semibold tracking-wide sm:text-2xl' }, p.submission_ref)),
          h('button', { class: 'btn bg-white text-sky-900 hover:bg-sky-50 print:hidden', type: 'button', onclick: () => window.print() }, icon('print', 'size-4'), 'Print / PDF')),
        h('dl', { class: 'grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4' },
          row('ULB', p.ulb_name + ' (Class ' + p.ulb_class + ')'),
          row('Submitted on', fmtDate(p.submitted_at)),
          row('Submitted by', p.submitter_name + ', ' + p.submitter_designation),
          row('Connections / facilities', n + ' / ' + p.total_facilities)));
    } else {
      const nameIn = h('input', { id: 'sub_name', class: 'input', type: 'text', maxlength: 80, autocomplete: 'name' });
      const desigIn = h('input', { id: 'sub_desig', class: 'input', type: 'text', maxlength: 80, autocomplete: 'organization-title' });
      const decl = h('input', { type: 'checkbox', id: 'sub_decl', class: 'mt-0.5 size-4 shrink-0 rounded accent-sky-800' });
      const err = h('p', { class: 'form-error', role: 'alert' });
      const btn = h('button', { class: 'btn btn-primary', type: 'submit', disabled: !ready }, 'Submit final data');
      const form = h('form', { class: 'space-y-5', novalidate: true },
        h('div', { class: 'grid gap-x-5 gap-y-4 sm:grid-cols-2' },
          h('div', null, h('label', { class: 'label', for: 'sub_name' }, 'Officer name'), nameIn),
          h('div', null, h('label', { class: 'label', for: 'sub_desig' }, 'Designation'), desigIn)),
        h('label', { for: 'sub_decl', class: 'flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700' }, decl,
          'I confirm the information is correct as per the electricity bills and records of ' + p.ulb_name + '.'),
        err,
        h('div', { class: 'flex flex-wrap items-center justify-end gap-3' },
          h('span', { class: 'mr-auto flex items-center gap-1.5 text-xs text-slate-500' }, icon('lock', 'size-4'), 'Data is locked after submission'),
          btn));
      form.addEventListener('submit', async ev => {
        ev.preventDefault();
        err.textContent = '';
        if (nameIn.value.trim().length < 3) { err.textContent = 'Enter the officer name.'; nameIn.focus(); return; }
        if (desigIn.value.trim().length < 2) { err.textContent = 'Enter the designation.'; desigIn.focus(); return; }
        if (!decl.checked) { err.textContent = 'Tick the declaration.'; return; }
        if (!confirm('Submit final data for ' + p.ulb_name + '? It will be locked.')) return;
        busy(btn, true, 'Submitting…');
        try {
          state.profile = await Api.call('submit', { name: nameIn.value.trim(), designation: desigIn.value.trim(), declaration: true });
          toast('Submitted · Ref. ' + state.profile.submission_ref, 'ok');
          renderApp();
        } catch (e) { busy(btn, false); handleError(e, err); }
      });
      action = card('Declaration', 'badge', null, form);
    }

    return h('div', { class: 'space-y-6' },
      pageHead(submitted ? 'Final submission' : 'Review & submit', p.ulb_name,
        submitted ? h('span', { class: 'chip chip-green text-sm' }, icon('check', 'size-3.5'), 'Submitted')
          : h('span', { class: 'chip text-sm ' + (ready ? 'chip-green' : 'chip-amber') }, ready ? 'Ready to submit' : 'Incomplete')),
      submitted ? action : card('Checklist', 'badge', null, checks, 'px-5 py-2'),
      card('City profile', 'building', null, facTable, 'p-2'),
      card('Electricity connections', 'bolt', null, connTable, 'p-2'),
      submitted ? null : action);
  }

  /* ================= change password ================= */
  function passwordView() {
    const mk = (id, label, ac) => {
      const input = h('input', { id, class: 'input', type: 'password', autocomplete: ac, maxlength: 128, required: true });
      return { input, wrap: h('div', null, h('label', { class: 'label', for: id }, label), input) };
    };
    const cur = mk('pw_cur', 'Current password', 'current-password');
    const nxt = mk('pw_new', 'New password', 'new-password');
    const rep = mk('pw_rep', 'Confirm new password', 'new-password');
    const err = h('p', { class: 'form-error', role: 'alert' });
    const btn = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Update password');
    const form = h('form', { class: 'space-y-4', novalidate: true }, cur.wrap, nxt.wrap, rep.wrap,
      h('p', { class: 'text-xs text-slate-500' }, 'Minimum 10 characters. Other sessions will be signed out.'),
      err,
      h('div', { class: 'flex justify-end gap-2' }, h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => go(landing()) }, 'Cancel'), btn));
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      err.textContent = '';
      const a = cur.input.value, b = nxt.input.value, c = rep.input.value;
      if (!a || !b) { err.textContent = 'Fill in all fields.'; return; }
      if (b.length < 10) { err.textContent = 'Use at least 10 characters.'; return; }
      if (b !== c) { err.textContent = 'New passwords do not match.'; return; }
      if (b === a) { err.textContent = 'Choose a different password.'; return; }
      busy(btn, true, 'Updating…');
      try {
        await Api.changePassword(a, b);
        toast('Password updated.', 'ok');
        go(landing());
      } catch (e) {
        busy(btn, false);
        if (e.code === 'AUTH' && /session/i.test(e.message)) return handleError(e);
        err.textContent = e.message;
      }
    });
    return h('div', null, pageHead('Change password'), h('div', { class: 'max-w-md' }, card(null, null, null, form)));
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(new Error('Could not read the file.'));
      r.readAsDataURL(file);
    });
  }

  boot();
})();
