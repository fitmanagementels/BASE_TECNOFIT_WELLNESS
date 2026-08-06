const fs = require('node:fs');
const path = require('node:path');

function required(name, env) {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`Variável pública ausente: ${name}`);
  return value;
}

function gerarRuntimeConfig(env = process.env) {
  for (const name of Object.keys(env)) {
    if (/secret|password|refresh_token/i.test(name)) throw new Error(`Variável não permitida na configuração pública: ${name}`);
  }
  return 'window.XSTEAM_RUNTIME_CONFIG = ' + JSON.stringify({
    oauthClientId: required('PUBLIC_OAUTH_CLIENT_ID', env),
    appsScriptDeploymentId: required('PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID', env),
    oauthScopes: required('PUBLIC_OAUTH_SCOPES', env).split(/\s+/)
  }, null, 2) + ';\n';
}

if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, '..', 'pwa', 'runtime-config.js'), gerarRuntimeConfig({
    PUBLIC_OAUTH_CLIENT_ID: process.env.PUBLIC_OAUTH_CLIENT_ID,
    PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID: process.env.PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID,
    PUBLIC_OAUTH_SCOPES: process.env.PUBLIC_OAUTH_SCOPES
  }));
}

module.exports = { gerarRuntimeConfig };
