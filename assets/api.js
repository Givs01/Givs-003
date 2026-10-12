/*
 * api.js — talks to the Google Apps Script web app (the portal's web API).
 * Every request is a POST with a text/plain body. This is a "simple"
 * cross-origin request, so the browser sends no CORS pre-flight, which
 * Apps Script cannot answer.
 * The session token lives in sessionStorage: it is cleared when the tab
 * closes and is never put in the URL.
 */
(function () {
  'use strict';
  const TOKEN_KEY = 'wea_session';
  const cfg = window.APP_CONFIG || {};
  const API_URL = String(cfg.API_URL || '').trim();
  // Only a Google Apps Script web-app URL is accepted.
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(API_URL);

  function getToken() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setToken(t) {
    try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
  }

  // Tells the page how many requests are running (drives the progress bar).
  let pending = 0;
  const signal = d => { pending += d; window.dispatchEvent(new CustomEvent('api:activity', { detail: { pending } })); };

  async function call(action, payload) {
    signal(1);
    try { return await request(action, payload); } finally { signal(-1); }
  }

  async function request(action, payload) {
    if (!configured) throw Object.assign(new Error('The portal is not connected to its server yet.'), { code: 'CONFIG' });
    const req = { action, token: getToken(), payload: payload || {} };
    let r, res;
    try {
      r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(req),
        redirect: 'follow',
        credentials: 'omit',
        cache: 'no-store'
      });
    } catch (e) {
      throw Object.assign(new Error('Cannot reach the server. Check your internet connection and try again.'), { code: 'NETWORK' });
    }
    if (!r.ok) throw Object.assign(new Error('The server returned an error (' + r.status + '). Try again shortly.'), { code: 'HTTP' });
    try { res = await r.json(); } catch (e) { throw Object.assign(new Error('The server sent an unreadable reply. Try again shortly.'), { code: 'HTTP' }); }
    if (!res || !res.ok) {
      if (res && res.code === 'AUTH' && action !== 'login') setToken(null);
      throw Object.assign(new Error((res && res.error) || 'Request failed.'), { code: res && res.code });
    }
    return res.data;
  }

  async function login(username, password) {
    const data = await call('login', { username, password });
    setToken(data.token);
    return data.user;
  }

  async function logout() {
    try { await call('logout'); } catch (e) { /* session may already be gone */ }
    setToken(null);
  }

  async function changePassword(current, next) {
    const data = await call('changePassword', { current, next });
    setToken(data.token);          // the server issues a fresh session after a password change
    return true;
  }

  window.Api = {
    call, login, logout, changePassword, configured,
    hasToken: () => !!getToken(), clearToken: () => setToken(null)
  };
})();
