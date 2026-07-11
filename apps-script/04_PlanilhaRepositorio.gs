function obterPlanilhaMestre_() {
  return SpreadsheetApp.openById(CONFIG.planilhaId);
}

function obterAbaImportacoes_() {
  var aba = obterPlanilhaMestre_().getSheetByName(CONFIG.abas.importacoes);
  if (!aba) throw new Error('Aba IMPORTACOES não encontrada.');
  return aba;
}

function garantirEstruturaPlanilha() {
  var planilha = obterPlanilhaMestre_();
  Object.keys(CONFIG.abas).forEach(function (chave) {
    var nome = CONFIG.abas[chave];
    var cabecalhos = CONFIG.cabecalhos[chave];
    var aba = planilha.getSheetByName(nome) || planilha.insertSheet(nome);
    if (aba.getMaxColumns() < cabecalhos.length) {
      aba.insertColumnsAfter(aba.getMaxColumns(), cabecalhos.length - aba.getMaxColumns());
    }
    aba.getRange(1, 1, 1, cabecalhos.length)
      .setValues([cabecalhos])
      .setFontWeight('bold')
      .setBackground('#14324A')
      .setFontColor('#FFFFFF');
    aba.setFrozenRows(1);

    var protecoes = aba.getProtections(SpreadsheetApp.ProtectionType.RANGE).filter(function (protecao) {
      return protecao.getDescription() === 'TecnoFit - cabeçalho';
    });
    if (!protecoes.length) {
      aba.getRange(1, 1, 1, cabecalhos.length)
        .protect()
        .setDescription('TecnoFit - cabeçalho')
        .setWarningOnly(true);
    }
  });
  planilha.getSheetByName(CONFIG.abas.visaoMestre).hideColumns(13);
  SpreadsheetApp.flush();
}

function validarLarguras_(linhas, largura, nomeAba) {
  linhas.forEach(function (linha, indice) {
    if (!Array.isArray(linha) || linha.length !== largura) {
      throw new Error(nomeAba + ': largura inválida na linha ' + (indice + 2) + '.');
    }
  });
}

function escreverAbaGerenciada_(aba, cabecalhos, linhas) {
  aba.clearContents();
  aba.getRange(1, 1, 1, cabecalhos.length)
    .setValues([cabecalhos])
    .setFontWeight('bold')
    .setBackground('#14324A')
    .setFontColor('#FFFFFF');
  if (linhas.length) {
    aba.getRange(2, 1, linhas.length, cabecalhos.length).setValues(linhas);
  }
  aba.setFrozenRows(1);
  var filtro = aba.getFilter();
  if (filtro) filtro.remove();
  aba.getRange(1, 1, Math.max(linhas.length + 1, 2), cabecalhos.length).createFilter();
}

function substituirAbasGerenciadas(dados) {
  validarLarguras_(dados.alunos, CONFIG.cabecalhos.alunos.length, CONFIG.abas.alunos);
  validarLarguras_(dados.contratos, CONFIG.cabecalhos.contratos.length, CONFIG.abas.contratos);
  validarLarguras_(dados.visaoMestre, CONFIG.cabecalhos.visaoMestre.length, CONFIG.abas.visaoMestre);

  var planilha = obterPlanilhaMestre_();
  var abaAlunos = planilha.getSheetByName(CONFIG.abas.alunos);
  var abaContratos = planilha.getSheetByName(CONFIG.abas.contratos);
  var abaVisao = planilha.getSheetByName(CONFIG.abas.visaoMestre);
  if (!abaAlunos || !abaContratos || !abaVisao) {
    throw new Error('As abas gerenciadas não estão configuradas.');
  }

  escreverAbaGerenciada_(abaAlunos, CONFIG.cabecalhos.alunos, dados.alunos);
  escreverAbaGerenciada_(abaContratos, CONFIG.cabecalhos.contratos, dados.contratos);
  escreverAbaGerenciada_(abaVisao, CONFIG.cabecalhos.visaoMestre, dados.visaoMestre);

  var linhasAlunos = Math.max(dados.alunos.length, 1);
  var linhasContratos = Math.max(dados.contratos.length, 1);
  var linhasVisao = Math.max(dados.visaoMestre.length, 1);
  abaAlunos.getRange(2, 6, linhasAlunos, 2).setNumberFormat('dd/MM/yyyy');
  abaContratos.getRange(2, 5, linhasContratos, 1).setNumberFormat('R$ #,##0.00');
  abaContratos.getRange(2, 6, linhasContratos, 2).setNumberFormat('dd/MM/yyyy');
  abaVisao.getRange(2, 6, linhasVisao, 1).setNumberFormat('R$ #,##0.00');
  abaVisao.getRange(2, 8, linhasVisao, 2).setNumberFormat('dd/MM/yyyy');
  abaVisao.getRange(2, 11, linhasVisao, 2).setNumberFormat('dd/MM/yyyy');
  abaVisao.hideColumns(13);
  SpreadsheetApp.flush();
}

function criarBackupAbasGerenciadas() {
  var planilha = obterPlanilhaMestre_();
  return ['alunos', 'contratos', 'visaoMestre'].reduce(function (backup, chave) {
    var aba = planilha.getSheetByName(CONFIG.abas[chave]);
    if (!aba) throw new Error('Aba não encontrada para backup: ' + CONFIG.abas[chave]);
    backup[chave] = aba.getDataRange().getValues();
    return backup;
  }, {});
}

function restaurarBackupAbasGerenciadas(backup) {
  var planilha = obterPlanilhaMestre_();
  ['alunos', 'contratos', 'visaoMestre'].forEach(function (chave) {
    var aba = planilha.getSheetByName(CONFIG.abas[chave]);
    var valores = backup[chave] || [CONFIG.cabecalhos[chave]];
    aba.clearContents();
    if (valores.length && valores[0].length) {
      aba.getRange(1, 1, valores.length, valores[0].length).setValues(valores);
    }
  });
  SpreadsheetApp.flush();
}
