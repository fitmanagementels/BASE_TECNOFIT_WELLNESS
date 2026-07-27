function paraDataDashboard_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return new Date(valor.getTime());
  }
  if (typeof valor === 'number' && isFinite(valor)) return new Date(valor);
  var texto = String(valor == null ? '' : valor).trim();
  if (!texto) return null;
  var br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  var iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  var partes = br ? [br[3], br[2], br[1]] : (iso ? [iso[1], iso[2], iso[3]] : null);
  if (!partes) return null;
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12);
}

function formatarDataDashboard_(valor) {
  var data = paraDataDashboard_(valor);
  if (!data) return '';
  return [
    String(data.getDate()).padStart(2, '0'),
    String(data.getMonth() + 1).padStart(2, '0'),
    data.getFullYear()
  ].join('/');
}

function inicioDiaDashboard_(valor) {
  var data = paraDataDashboard_(valor);
  return data ? new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12) : null;
}

function diasEntreDashboard_(inicio, fim) {
  var a = inicioDiaDashboard_(inicio);
  var b = inicioDiaDashboard_(fim);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function classificarVencimento_(vencimento, hoje) {
  var dias = diasEntreDashboard_(hoje, vencimento);
  if (dias == null) return 'semData';
  if (dias < 0) return 'vencido';
  if (dias <= 7) return 'ate7';
  if (dias <= 30) return 'ate30';
  return 'futuro';
}

function classificarAtualizacao_(data, hoje, limiteDias) {
  if (!paraDataDashboard_(data)) return 'ausente';
  var idade = diasEntreDashboard_(data, hoje);
  return idade > limiteDias ? 'desatualizada' : 'atualizada';
}

function unicosPor_(linhas, chave) {
  var vistos = Object.create(null);
  return (linhas || []).filter(function (linha) {
    var valor = String(linha[chave] == null ? '' : linha[chave]).trim();
    if (!valor || vistos[valor]) return false;
    vistos[valor] = true;
    return true;
  });
}
