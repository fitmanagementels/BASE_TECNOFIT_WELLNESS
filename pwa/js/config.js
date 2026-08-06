(function () {
  var value = window.XSTEAM_RUNTIME_CONFIG || {};
  window.XsteamConfig = Object.freeze({
    oauthClientId: String(value.oauthClientId || ''),
    appsScriptDeploymentId: String(value.appsScriptDeploymentId || ''),
    oauthScopes: Array.isArray(value.oauthScopes) ? value.oauthScopes.slice() : []
  });
}());
