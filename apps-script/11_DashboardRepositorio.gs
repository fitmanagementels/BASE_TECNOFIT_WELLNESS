function lerTabelaDashboard_(nomeAba, cabecalhos) {
  return lerTabelaDashboardDaPlanilha_(obterPlanilhaMestre_(), nomeAba, cabecalhos);
}

function lerTabelaDashboardDaPlanilha_(planilha, nomeAba, cabecalhos) {
  var aba = planilha.getSheetByName(nomeAba);
  if (!aba) throw new Error('Aba necessária não encontrada.');
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 1) throw new Error('Estrutura de dados incompatível.');
  var valores = aba.getRange(1, 1, ultimaLinha, cabecalhos.length).getValues();
  var recebidos = valores[0].map(String);
  cabecalhos.forEach(function (cabecalho, indice) {
    if (recebidos[indice] !== cabecalho) throw new Error('Estrutura de dados incompatível.');
  });
  if (ultimaLinha < 2) return [];
  return valores.slice(1).filter(function (linha) {
    return linha.some(function (valor) { return valor !== '' && valor != null; });
  }).map(function (linha) {
    return cabecalhos.reduce(function (objeto, cabecalho, indice) {
      objeto[cabecalho] = linha[indice];
      return objeto;
    }, {});
  });
}

function obterUltimaImportacaoDashboard_(planilha) {
  var aba = planilha.getSheetByName(CONFIG.abas.importacoes);
  if (!aba) throw new Error('Aba necessária não encontrada.');
  var valores = aba.getDataRange().getDisplayValues();
  for (var indice = valores.length - 1; indice >= 1; indice -= 1) {
    if (valores[indice][11] === 'SUCESSO') {
      return {
        execucaoId: valores[indice][0],
        concluidaEm: valores[indice][2],
        dataReferencia: valores[indice][6],
        revisao: valores[indice][7]
      };
    }
  }
  return null;
}

function lerBaseDashboard_() {
  var planilha = obterPlanilhaMestre_();
  return {
    alunos: lerTabelaDashboardDaPlanilha_(planilha, CONFIG.abas.alunos, CONFIG.cabecalhos.alunos),
    contratos: lerTabelaDashboardDaPlanilha_(planilha, CONFIG.abas.contratos, CONFIG.cabecalhos.contratos),
    ultimaImportacao: obterUltimaImportacaoDashboard_(planilha)
  };
}
