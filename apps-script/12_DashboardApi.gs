function hashTextoDashboard_(texto) {
  var hashA = 0;
  var hashB = 5381;
  for (var indice = 0; indice < texto.length; indice += 1) {
    var codigo = texto.charCodeAt(indice);
    hashA = ((hashA << 5) - hashA + codigo) | 0;
    hashB = (((hashB << 5) + hashB) ^ codigo) | 0;
  }
  return (hashA >>> 0).toString(36) + (hashB >>> 0).toString(36);
}

function chaveCacheDashboard_(pagina, filtros) {
  var prefixo = 'dashboard:v1:' + pagina + ':';
  var serializado = JSON.stringify(filtros || {});
  var chave = prefixo + serializado;
  if (chave.length <= 250) return chave;
  return prefixo + 'hash:' + hashTextoDashboard_(serializado) + ':' + serializado.length;
}

function tipoErroDashboardSeguro_(erro) {
  var permitidos = ['Error', 'TypeError', 'RangeError', 'SyntaxError'];
  var nome = erro && erro.name ? String(erro.name) : 'Error';
  return permitidos.indexOf(nome) === -1 ? 'Error' : nome;
}

function obterDadosPaginaDashboard(pagina, filtros) {
  var construtores = {
    vencimentos: montarPaginaVencimentos_,
    fichas: montarPaginaFichas_,
    avaliacoes: montarPaginaAvaliacoes_,
    planos: montarPaginaPlanos_
  };
  if (!Object.prototype.hasOwnProperty.call(construtores, pagina)) {
    throw new Error('Página inválida.');
  }
  filtros = filtros || {};
  try {
    var cache = CacheService.getScriptCache();
    var chave = chaveCacheDashboard_(pagina, filtros);
    var existente = cache.get(chave);
    if (existente) return JSON.parse(existente);
    var base = lerBaseDashboard_();
    var hoje = new Date();
    var dados = construtores[pagina](base.alunos, base.contratos, hoje);
    var resposta = {
      ok: true,
      pagina: pagina,
      atualizadoEm: base.ultimaImportacao ? base.ultimaImportacao.concluidaEm : '',
      avisoImportacao: '',
      dados: dados
    };
    try {
      cache.put(chave, JSON.stringify(resposta), CONFIG.dashboard.cacheSegundos);
    } catch (erroCache) {
      // Cache é uma otimização: falhas de capacidade não invalidam os dados calculados.
    }
    return resposta;
  } catch (erro) {
    console.error('dashboard_error', {
      pagina: pagina,
      tipo: tipoErroDashboardSeguro_(erro)
    });
    throw new Error('Não foi possível carregar o dashboard.');
  }
}
