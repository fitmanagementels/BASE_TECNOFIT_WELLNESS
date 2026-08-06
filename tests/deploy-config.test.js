const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { gerarRuntimeConfig } = require('../scripts/gerar-runtime-config');

test('gerador aceita somente configuração pública', () => {
  assert.throws(() => gerarRuntimeConfig({ PUBLIC_OAUTH_CLIENT_ID: 'id', PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID: 'deployment', PUBLIC_OAUTH_SCOPES: 'scope', CLIENT_SECRET: 'segredo' }), /CLIENT_SECRET/);
  const output = gerarRuntimeConfig({ PUBLIC_OAUTH_CLIENT_ID: 'id', PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID: 'deployment', PUBLIC_OAUTH_SCOPES: 'scope-a scope-b' });
  assert.match(output, /"oauthClientId": "id"/);
  assert.match(output, /"appsScriptDeploymentId": "deployment"/);
  assert.doesNotMatch(output, /segredo/);
});

test('workflows separam deploy de Pages e Apps Script', () => {
  const pages = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  const gas = fs.readFileSync('.github/workflows/deploy-apps-script.yml', 'utf8');
  assert.match(pages, /path: pwa/);
  assert.match(pages, /PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID/);
  assert.match(pages, /vars\.PUBLIC_OAUTH_CLIENT_ID/);
  assert.match(gas, /clasp push --force/);
  assert.match(gas, /APPS_SCRIPT_AUTODEPLOY/);
  assert.match(gas, /APPS_SCRIPT_API_DEPLOYMENT_ID/);
});
