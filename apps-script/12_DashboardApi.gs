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

function objetoDashboardValido_(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function camposNumericosDashboardValidos_(objeto, campos) {
  return campos.every(function (campo) { return typeof objeto[campo] === 'number'; });
}

function dadosCacheDashboardValidos_(dados, pagina) {
  if (!objetoDashboardValido_(dados) || !objetoDashboardValido_(dados.kpis) ||
      !objetoDashboardValido_(dados.graficos) || !Array.isArray(dados.lista) ||
      !objetoDashboardValido_(dados.filtros) || !Array.isArray(dados.filtros.polos) ||
      !Array.isArray(dados.filtros.statusAlunos)) return false;

  if (pagina === 'vencimentos') {
    return camposNumericosDashboardValidos_(dados.kpis, ['vencidos', 'ate7', 'ate30', 'valorAte30']) &&
      objetoDashboardValido_(dados.graficos.situacao) && Array.isArray(dados.graficos.semanas);
  }
  if (pagina === 'fichas' || pagina === 'avaliacoes') {
    return camposNumericosDashboardValidos_(dados.kpis, ['atualizadas', 'desatualizadas', 'ausentes', 'cobertura']) &&
      objetoDashboardValido_(dados.graficos.situacao) &&
      objetoDashboardValido_(dados.graficos.faixas) &&
      Array.isArray(dados.graficos.coberturaPorPolo);
  }
  return camposNumericosDashboardValidos_(dados.kpis, ['alunos', 'contratos', 'valor', 'ticketMedio']) &&
    objetoDashboardValido_(dados.graficos.polos) &&
    objetoDashboardValido_(dados.graficos.frequencias) &&
    objetoDashboardValido_(dados.graficos.modalidades) &&
    objetoDashboardValido_(dados.graficos.status) &&
    objetoDashboardValido_(dados.graficos.valorPorPolo);
}

function dataAvisoImportacaoDashboard_(valor) {
  var texto = String(valor || '').trim();
  var brasileira = /^(\d{2}\/\d{2}\/\d{4})/.exec(texto);
  if (brasileira) return brasileira[1];
  var iso = /^(\d{4}-\d{2}-\d{2})/.exec(texto);
  if (iso) return formatarDataDashboard_(iso[1]);
  return formatarDataDashboard_(valor) || texto;
}

function respostaCacheDashboardValida_(resposta, pagina) {
  return objetoDashboardValido_(resposta) &&
    resposta.ok === true && resposta.pagina === pagina &&
    typeof resposta.atualizadoEm === 'string' &&
    typeof resposta.avisoImportacao === 'string' &&
    dadosCacheDashboardValidos_(resposta.dados, pagina);
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
    if (existente) {
      var respostaCache = JSON.parse(existente);
      if (respostaCacheDashboardValida_(respostaCache, pagina)) return respostaCache;
    }
    var base = lerBaseDashboard_();
    var hoje = new Date();
    var opcoes = {
      polos: opcoesDashboard_(base.contratos, 'polo'),
      statusAlunos: opcoesDashboard_(base.alunos, 'status')
    };
    var filtrada = filtrarBaseDashboard_(base.alunos, base.contratos, filtros);
    var dados = construtores[pagina](filtrada.alunos, filtrada.contratos, hoje);
    dados.filtros = opcoes;
    var aviso = base.ultimaTentativa && base.ultimaTentativa.status === 'ERRO'
      ? 'A última tentativa de atualização falhou em ' +
        dataAvisoImportacaoDashboard_(base.ultimaTentativa.concluidaEm || base.ultimaTentativa.dataReferencia) +
        '. Exibindo a última base válida.'
      : '';
    var resposta = {
      ok: true,
      pagina: pagina,
      atualizadoEm: base.ultimaImportacao ? base.ultimaImportacao.concluidaEm : '',
      avisoImportacao: aviso,
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
