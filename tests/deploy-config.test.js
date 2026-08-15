const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { gerarRuntimeConfig } = require('../scripts/gerar-runtime-config');

test('gerador publica somente a URL pública do Worker', () => {
  assert.throws(() => gerarRuntimeConfig({}), /PUBLIC_WORKER_URL/);
  assert.throws(() => gerarRuntimeConfig({ PUBLIC_WORKER_URL: 'https://api.example', CLIENT_SECRET: 'segredo' }), /CLIENT_SECRET/);
  const output = gerarRuntimeConfig({ PUBLIC_WORKER_URL: 'https://xsteam.example.workers.dev/' });
  assert.match(output, /"workerUrl": "https:\/\/xsteam\.example\.workers\.dev"/);
  assert.doesNotMatch(output, /oauthClientId|client_secret|secret/i);
});

test('workflows publicam Pages e Worker sem OAuth público', () => {
  const pages = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  const gas = fs.readFileSync('.github/workflows/deploy-apps-script.yml', 'utf8');
  const worker = fs.readFileSync('.github/workflows/deploy-worker.yml', 'utf8');
  assert.match(pages, /path: pwa/);
  assert.match(pages, /PUBLIC_WORKER_URL/);
  assert.doesNotMatch(pages, /PUBLIC_OAUTH_CLIENT_ID|PUBLIC_OAUTH_SCOPES/);
  assert.match(worker, /cloudflare\/wrangler-action@v3/);
  assert.match(worker, /APPS_SCRIPT_SHARED_SECRET/);
  assert.match(worker, /name: Criar ou atualizar o Worker/);
  assert.match(worker, /name: Enviar segredos do Worker/);
  assert.match(worker, /wranglerVersion: "4"/);
  assert.match(gas, /clasp push --force/);
  assert.match(gas, /APPS_SCRIPT_AUTODEPLOY/);
  assert.match(gas, /APPS_SCRIPT_API_DEPLOYMENT_ID/);
});
