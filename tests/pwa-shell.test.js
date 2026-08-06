const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('shell PWA pede login Google e possui manifesto e service worker', () => {
  const html = fs.readFileSync('pwa/index.html', 'utf8');
  const manifest = JSON.parse(fs.readFileSync('pwa/manifest.webmanifest', 'utf8'));
  const worker = fs.readFileSync('pwa/sw.js', 'utf8');
  assert.match(html, /accounts\.google\.com\/gsi\/client/);
  assert.match(html, /runtime-config\.js/);
  assert.match(html, /loginButton/);
  assert.equal(manifest.display, 'standalone');
  assert.match(worker, /addAll\(STATIC_ASSETS\)/);
  assert.match(worker, /fetch\(event\.request\)/);
  assert.doesNotMatch(worker, /script\.googleapis\.com/);
});

test('configuração de exemplo não contém segredo OAuth', () => {
  const config = fs.readFileSync('pwa/runtime-config.js.example', 'utf8');
  assert.match(config, /oauthClientId/);
  assert.doesNotMatch(config, /client_secret|refresh_token|password/i);
});
