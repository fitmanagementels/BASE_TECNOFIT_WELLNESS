const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGas } = require('./helpers/load-gas');

function setup() {
  const calls = [];
  const menu = {
    addItem(label, fn) { calls.push(['item', label, fn]); return this; },
    addToUi() { calls.push(['menu-added']); return this; }
  };
  const ui = {
    createMenu(name) { calls.push(['menu', name]); return menu; },
    showSidebar(html) { calls.push(['sidebar', html.title]); },
    showModalDialog(html, title) { calls.push(['show-modal', title, html.content]); }
  };
  const gas = loadGas(['apps-script/08_Main.gs'], {
    SpreadsheetApp: { getUi: () => ui },
    HtmlService: {
      XFrameOptionsMode: { DEFAULT: 'DEFAULT' },
      createTemplateFromFile(name) {
        calls.push(['template', name]);
        return {
          evaluate: () => ({
            setTitle(title) { this.title = title; return this; },
            setXFrameOptionsMode(mode) { this.xFrameOptionsMode = mode; return this; },
            addMetaTag(name, content) { this[name] = content; return this; }
          })
        };
      },
      createHtmlOutputFromFile(name) {
        calls.push(['html-output', name]);
        return { getContent: () => `<p>${name}</p>` };
      },
      createHtmlOutput(content) {
        return {
          content,
          setWidth() { return this; },
          setHeight() { return this; }
        };
      }
    },
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.google.com/mock' })
    },
    garantirEstruturaPlanilha: () => calls.push(['ensure']),
    inspecionarPastaEntrada: () => ({ ready: true, lote: { dataReferencia: '2026-07-08' }, erros: [] }),
    obterUltimaImportacaoBemSucedida: () => ({ execucaoId: 'old' }),
    executarImportacaoBackend_: () => ({ ok: true, alunos: 330, contratos: 339 })
  });
  return { gas, calls };
}

test('onOpen cria menu TecnoFit com ações para atualização e dashboard', () => {
  const { gas, calls } = setup();
  gas.onOpen();
  assert.deepEqual(calls, [
    ['menu', 'TecnoFit'],
    ['item', 'Abrir painel', 'abrirPainel'],
    ['item', 'Abrir dashboard', 'abrirDashboard'],
    ['menu-added']
  ]);
});

test('abrirDashboard abre a URL publicada em uma nova janela', () => {
  const { gas, calls } = setup();
  gas.abrirDashboard();
  assert.deepEqual(calls, [[
    'show-modal', 'Abrindo dashboard',
    '<script>window.open("https://script.google.com/mock", "_blank");google.script.host.close();</script>'
  ]]);
});

test('abrirPainel renderiza Sidebar com título', () => {
  const { gas, calls } = setup();
  gas.abrirPainel();
  assert.deepEqual(calls, [
    ['template', 'Sidebar'],
    ['sidebar', 'TecnoFit — Atualização']
  ]);
});

test('doGet monta a web app do dashboard', () => {
  const { gas, calls } = setup();
  const output = gas.doGet();
  assert.equal(output.title, 'XSTEAM — Gestão');
  assert.equal(output.viewport, 'width=device-width, initial-scale=1');
  assert.equal(calls.some(call => call[0] === 'template' && call[1] === 'Dashboard'), true);
});

test('incluirArquivo_ retorna o conteúdo da parcial', () => {
  const { gas, calls } = setup();
  assert.equal(gas.incluirArquivo_('DashboardStyles'), '<p>DashboardStyles</p>');
  assert.deepEqual(calls, [['html-output', 'DashboardStyles']]);
});

test('obterUrlDashboard retorna a URL publicada', () => {
  const { gas } = setup();
  assert.equal(gas.obterUrlDashboard(), 'https://script.google.com/mock');
});

test('Dashboard compõe as parciais e carrega Chart.js pela configuração', () => {
  const html = fs.readFileSync('apps-script/Dashboard.html', 'utf8');
  assert.match(html, /incluirArquivo_\('DashboardStyles'\)/);
  assert.match(html, /CONFIG\.dashboard\.chartJsUrl/);
  assert.match(html, /incluirArquivo_\('DashboardComponents'\)/);
  assert.match(html, /incluirArquivo_\('DashboardClient'\)/);
});

test('obterStatusImportacao combina lote e última execução', () => {
  const { gas, calls } = setup();
  const status = gas.obterStatusImportacao();
  assert.equal(status.ready, true);
  assert.equal(status.lote.dataReferencia, '2026-07-08');
  assert.equal(status.ultimaImportacao.execucaoId, 'old');
  assert.deepEqual(calls, [['ensure']]);
});

test('executarImportacao delega ao backend', () => {
  const { gas } = setup();
  assert.deepEqual(
    JSON.parse(JSON.stringify(gas.executarImportacao())),
    { ok: true, alunos: 330, contratos: 339 }
  );
});
