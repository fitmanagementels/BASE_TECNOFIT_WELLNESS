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
