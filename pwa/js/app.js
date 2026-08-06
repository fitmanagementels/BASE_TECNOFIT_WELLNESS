(function () {
  var loginButton = document.getElementById('loginButton');
  var authError = document.getElementById('authError');
  loginButton.addEventListener('click', async function () {
    loginButton.disabled = true;
    authError.textContent = '';
    try {
      var account = await XsteamApi.login();
      document.getElementById('authScreen').hidden = true;
      var app = document.getElementById('app');
      app.hidden = false;
      var script = document.createElement('script');
      script.src = './js/dashboard.js';
      script.onload = function () { window.iniciarDashboardPwa(); };
      script.onerror = function () {
        app.hidden = true;
        document.getElementById('authScreen').hidden = false;
        authError.textContent = 'Não foi possível preparar o dashboard.';
      };
      document.body.appendChild(script);
    } catch (erro) {
      authError.textContent = erro.message || 'Não foi possível entrar.';
    } finally {
      loginButton.disabled = false;
    }
  });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
}());
