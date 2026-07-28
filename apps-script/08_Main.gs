function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TecnoFit')
    .addItem('Abrir painel', 'abrirPainel')
    .addItem('Abrir dashboard', 'abrirDashboard')
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

function incluirArquivo_(nome) {
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('XSTEAM — Gestão')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function obterUrlDashboard() {
  return ScriptApp.getService().getUrl() || '';
}

function abrirDashboard() {
  var url = obterUrlDashboard();
  if (!url) throw new Error('Publique o web app antes de abrir o dashboard.');
  var html = HtmlService.createHtmlOutput(
    '<script>window.open(' + JSON.stringify(url) + ', "_blank");google.script.host.close();</script>'
  ).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abrindo dashboard');
}
