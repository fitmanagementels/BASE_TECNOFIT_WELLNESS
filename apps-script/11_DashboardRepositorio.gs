function lerTabelaDashboard_(nomeAba, cabecalhos) {
  return lerTabelaDashboardDaPlanilha_(obterPlanilhaMestre_(), nomeAba, cabecalhos);
}

function validarCabecalhosDashboard_(recebidos, cabecalhos) {
  cabecalhos.forEach(function (cabecalho, indice) {
    if (String(recebidos[indice]) !== cabecalho) {
      throw new Error('Estrutura de dados incompatível.');
    }
  });
}

function lerTabelaDashboardDaPlanilha_(planilha, nomeAba, cabecalhos) {
  var aba = planilha.getSheetByName(nomeAba);
  if (!aba) throw new Error('Aba necessária não encontrada.');
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 1) throw new Error('Estrutura de dados incompatível.');
  var valores = aba.getRange(1, 1, ultimaLinha, cabecalhos.length).getValues();
  validarCabecalhosDashboard_(valores[0], cabecalhos);
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
  var cabecalhos = CONFIG.cabecalhos.importacoes;
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 1) throw new Error('Estrutura de dados incompatível.');
  var recebidos = aba.getRange(1, 1, 1, cabecalhos.length).getValues()[0];
  validarCabecalhosDashboard_(recebidos, cabecalhos);
  if (ultimaLinha < 2) return null;

  var tamanhoChunk = 200;
  var fim = ultimaLinha;
  while (fim >= 2) {
    var inicio = Math.max(2, fim - tamanhoChunk + 1);
    var valores = aba.getRange(inicio, 1, fim - inicio + 1, cabecalhos.length).getDisplayValues();
    for (var indice = valores.length - 1; indice >= 0; indice -= 1) {
      if (valores[indice][11] === 'SUCESSO') {
        return {
          execucaoId: valores[indice][0],
          concluidaEm: valores[indice][2],
          dataReferencia: valores[indice][6],
          revisao: valores[indice][7]
        };
      }
    }
    fim = inicio - 1;
  }
  return null;
}

function obterUltimoRegistroImportacaoDashboard_(planilha) {
  var aba = planilha
    ? planilha.getSheetByName(CONFIG.abas.importacoes)
    : obterAbaImportacoes_();
  if (!aba) throw new Error('Aba necessária não encontrada.');
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return null;
  var linha = aba.getRange(
    ultimaLinha, 1, 1, CONFIG.cabecalhos.importacoes.length
  ).getDisplayValues()[0];
  return {
    concluidaEm: linha[2],
    dataReferencia: linha[6],
    status: linha[11]
  };
}

function lerBaseDashboard_() {
  var planilha = obterPlanilhaMestre_();
  return {
    alunos: lerTabelaDashboardDaPlanilha_(planilha, CONFIG.abas.alunos, CONFIG.cabecalhos.alunos),
    contratos: lerTabelaDashboardDaPlanilha_(planilha, CONFIG.abas.contratos, CONFIG.cabecalhos.contratos),
    ultimaImportacao: obterUltimaImportacaoDashboard_(planilha),
    ultimaTentativa: obterUltimoRegistroImportacaoDashboard_(planilha)
  };
}
