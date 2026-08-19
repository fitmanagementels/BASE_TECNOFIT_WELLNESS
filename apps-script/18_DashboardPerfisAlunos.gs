var CATALOGO_PERFIS_ALUNOS_PADRAO = Object.freeze([
  Object.freeze(['professor', 'matriculados', 'iranildo', 'Iranildo', true, 10]),
  Object.freeze(['professor', 'matriculados', 'elohim', 'Elohim', true, 20]),
  Object.freeze(['professor', 'matriculados', 'xico', 'Xico', true, 30]),
  Object.freeze(['professor', 'matriculados', 'aquiles', 'Aquiles', true, 40]),
  Object.freeze(['professor', 'matriculados', 'ruan', 'Ruan', true, 50]),
  Object.freeze(['professor', 'matriculados', 'cadu', 'Cadu', true, 60]),
  Object.freeze(['professor', 'cancelados', 'iranildo', 'Iranildo', true, 10]),
  Object.freeze(['professor', 'cancelados', 'elohim', 'Elohim', true, 20]),
  Object.freeze(['professor', 'cancelados', 'xico', 'Xico', true, 30]),
  Object.freeze(['professor', 'cancelados', 'ruan', 'Ruan', true, 40]),
  Object.freeze(['professor', 'cancelados', 'cadu', 'Cadu', true, 50]),
  Object.freeze(['professor', 'cancelados', 'wallyson', 'Wallyson', true, 60]),
  Object.freeze(['professor', 'cancelados', 'lucas', 'Lucas', true, 70]),
  Object.freeze(['professor', 'cancelados', 'genuca', 'Genuca', true, 80]),
  Object.freeze(['etiqueta', 'publico', 'idoso', 'Idoso', true, 10]),
  Object.freeze(['etiqueta', 'publico', 'saude', 'Saúde', true, 20]),
  Object.freeze(['etiqueta', 'publico', 'estetica', 'Estética', true, 30]),
  Object.freeze(['etiqueta', 'publico', 'dores', 'Dores', true, 40]),
  Object.freeze(['etiqueta', 'publico', 'corrida', 'Corrida', true, 50]),
  Object.freeze(['etiqueta', 'comercial', 'risco_de_churn', 'Risco de Churn', true, 10]),
  Object.freeze(['etiqueta', 'comercial', 'sem_fidelizacao', 'Sem fidelização', true, 20]),
  Object.freeze(['etiqueta', 'comercial', 'elohim', 'Elohim', true, 30]),
  Object.freeze(['perfil_pagamento', 'global', 'sem_historico', 'Sem histórico', true, 10]),
  Object.freeze(['perfil_pagamento', 'global', 'bom_pagador', 'Bom pagador', true, 20]),
  Object.freeze(['perfil_pagamento', 'global', 'eventual_fora_prazo', 'Pagamento eventual fora do prazo', true, 30]),
  Object.freeze(['perfil_pagamento', 'global', 'frequente_fora_prazo', 'Pagamento frequentemente fora do prazo', true, 40]),
  Object.freeze(['perfil_pagamento', 'global', 'cobranca_recorrente', 'Cobrança recorrente necessária', true, 50]),
  Object.freeze(['perfil_pagamento', 'global', 'em_acompanhamento', 'Em acompanhamento', true, 60])
]);

function migrarGestaoPagamentosParaPerfisAlunos_(planilha, abaPerfis) {
  if (abaPerfis.getLastRow() >= 2) return;
  var legada = planilha.getSheetByName(CONFIG.abas.gestaoPagamentos);
  if (!legada || legada.getLastRow() < 2) return;
  var linhas = legada.getRange(
    2, 1, legada.getLastRow() - 1, CONFIG.cabecalhos.gestaoPagamentos.length
  ).getValues();
  var migradas = linhas.filter(function (linha) {
    return String(linha[0] || '').trim();
  }).map(function (linha) {
    return [
      linha[0], linha[1], '', linha[2] || 'Sem histórico', linha[3] || '',
      '[]', '[]', '', linha[4] || ''
    ];
  });
  if (migradas.length) {
    abaPerfis.getRange(
      2, 1, migradas.length, CONFIG.cabecalhos.perfisAlunos.length
    ).setValues(migradas);
  }
}

function garantirPerfisAlunosNaPlanilha_(planilha) {
  var perfis = garantirAbaConfiguracaoDashboard_(
    planilha,
    CONFIG.abas.perfisAlunos,
    CONFIG.cabecalhos.perfisAlunos,
    []
  );
  garantirAbaConfiguracaoDashboard_(
    planilha,
    CONFIG.abas.configPerfisAlunos,
    CONFIG.cabecalhos.configPerfisAlunos,
    CATALOGO_PERFIS_ALUNOS_PADRAO
  );
  migrarGestaoPagamentosParaPerfisAlunos_(planilha, perfis);
}

function listaJsonPerfilAluno_(valor) {
  var lista = jsonDashboardSeguro_(valor, []);
  return Array.isArray(lista) ? lista.map(function (item) {
    return String(item || '').trim();
  }).filter(Boolean) : [];
}

function lerPerfisAlunosDashboard_(planilha) {
  if (!planilha.getSheetByName(CONFIG.abas.perfisAlunos)) return [];
  return lerTabelaDashboardDaPlanilha_(
    planilha, CONFIG.abas.perfisAlunos, CONFIG.cabecalhos.perfisAlunos
  ).map(function (linha) {
    return {
      id: String(linha.id || ''),
      aluno: String(linha.aluno || ''),
      professorResponsavel: String(linha.professor_responsavel || ''),
      perfilPagamento: String(linha.perfil_pagamento || 'Sem histórico'),
      observacaoPagamento: String(linha.observacao_pagamento || ''),
      etiquetasPublico: listaJsonPerfilAluno_(linha.etiquetas_publico),
      etiquetasComerciais: listaJsonPerfilAluno_(linha.etiquetas_comerciais),
      observacoesGerais: String(linha.observacoes_gerais || ''),
      atualizadoEm: String(linha.atualizado_em || '')
    };
  });
}

function catalogoPerfilAlunoSeguro_(linha) {
  return {
    tipo: String(linha.tipo || linha[0] || ''),
    grupo: String(linha.grupo || linha[1] || ''),
    chave: String(linha.chave || linha[2] || ''),
    titulo: String(linha.titulo || linha[3] || ''),
    ativo: linha.ativo === true || linha[4] === true ||
      String(linha.ativo == null ? linha[4] : linha.ativo).toLowerCase() === 'true',
    ordem: Number(linha.ordem == null ? linha[5] : linha.ordem) || 0
  };
}

function lerCatalogoPerfisAlunosDashboard_(planilha) {
  var linhas;
  if (planilha.getSheetByName(CONFIG.abas.configPerfisAlunos)) {
    linhas = lerTabelaDashboardDaPlanilha_(
      planilha, CONFIG.abas.configPerfisAlunos, CONFIG.cabecalhos.configPerfisAlunos
    );
  } else {
    linhas = CATALOGO_PERFIS_ALUNOS_PADRAO;
  }
  return linhas.map(catalogoPerfilAlunoSeguro_).sort(function (a, b) {
    return a.tipo.localeCompare(b.tipo, 'pt-BR') ||
      a.grupo.localeCompare(b.grupo, 'pt-BR') || a.ordem - b.ordem ||
      a.titulo.localeCompare(b.titulo, 'pt-BR');
  });
}
