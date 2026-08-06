(function () {
  var token = '';
  var account = null;
  function configurationReady() { return window.XsteamConfig && XsteamConfig.oauthClientId && XsteamConfig.appsScriptDeploymentId; }
  function error(message, code) { var e = new Error(message); e.code = code || 'API_ERROR'; return e; }
  async function accountFromToken() {
    var response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw error('Não foi possível identificar a conta Google.', 'UNAUTHORIZED');
    var profile = await response.json();
    account = { accountId: String(profile.sub || ''), email: String(profile.email || '') };
    return account;
  }
  function login() {
    if (!configurationReady()) return Promise.reject(error('O PWA ainda não foi configurado para produção.', 'CONFIG_ERROR'));
    return new Promise(function (resolve, reject) {
      var timer = setInterval(function () {
        if (!(window.google && google.accounts && google.accounts.oauth2)) return;
        clearInterval(timer);
        google.accounts.oauth2.initTokenClient({
          client_id: XsteamConfig.oauthClientId,
          scope: XsteamConfig.oauthScopes.join(' '),
          callback: function (response) {
            if (!response || response.error) return reject(error('A autorização Google não foi concluída.', 'UNAUTHORIZED'));
            token = response.access_token;
            accountFromToken().then(resolve, reject);
          }
        }).requestAccessToken({ prompt: 'select_account' });
      }, 50);
      setTimeout(function () { clearInterval(timer); reject(error('O login Google não foi carregado.', 'AUTH_UNAVAILABLE')); }, 10000);
    });
  }
  async function call(action, payload) {
    if (!token) throw error('Entre com sua conta Google para continuar.', 'UNAUTHORIZED');
    var response = await fetch('https://script.googleapis.com/v1/scripts/' + encodeURIComponent(XsteamConfig.appsScriptDeploymentId) + ':run', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'executarApiDashboard', parameters: [{ action: action, payload: payload || {} }], devMode: false })
    });
    var body;
    try { body = await response.json(); } catch (e) { body = {}; }
    var result = body && body.response && body.response.result;
    if (!response.ok || !result || result.ok !== true) throw error((result && result.error && result.error.message) || 'Não foi possível comunicar com o dashboard.', result && result.error && result.error.code);
    return result.data;
  }
  function logout() { token = ''; account = null; }
  window.XsteamApi = { login: login, call: call, logout: logout, account: function () { return account; } };
}());
