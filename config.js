/*
 * config.js — this file is PUBLIC (it is served by GitHub Pages).
 * Never put passwords, API keys, Sheet IDs or Drive folder IDs here.
 *
 * API_URL (required): the Web app URL of your Google Apps Script deployment,
 *   e.g. https://script.google.com/macros/s/AKfycb.../exec
 *   Get it from Apps Script: Deploy > Manage deployments > Web app > URL.
 * LOGO_URL: save your logo in the repository as assets/logo.png.
 * LOGO_FALLBACK_URL: used only if assets/logo.png is missing. It must also be
 *   listed under img-src in the Content-Security-Policy in index.html.
 */
window.APP_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbxP0OlkVPfN8bFUqTkPKqh8RV0eS_UpA9UDmj1_PZSYBpYG3w2pES7KdKApWGwtQFIo5Q/exec',
  APP_NAME: 'Energy Assessment Portal',
  LOGO_URL: 'assets/logo.png',
  LOGO_FALLBACK_URL: 'https://pas.org.in/image/company_logo?img_id=17511&t=1791000247227',
  LOGO_ALT: 'Organisation logo',
  SUPPORT_CONTACT: 'the portal administrator',   // e.g. 'CRDF, CEPT University – [email / phone]'
  BLOCK_FRAMING: true                            // refuse to run inside another site's frame (clickjacking)
});
