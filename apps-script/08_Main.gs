function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TecnoFit')
    .addItem('Abrir painel', 'abrirPainel')
    .addToUi();
}

function abrirPainel() {
  var html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('TecnoFit — Atualização');
  SpreadsheetApp.getUi().showSidebar(html);
}

function obterStatusImportacao() {
  garantirEstruturaPlanilha();
  var inspecao = inspecionarPastaEntrada();
  return {
    ready: inspecao.ready,
    lote: inspecao.lote,
    ultimaImportacao: obterUltimaImportacaoBemSucedida(),
    erros: inspecao.erros
  };
}

function executarImportacao() {
  return executarImportacaoBackend_();
}
