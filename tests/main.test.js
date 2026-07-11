const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

function setup() {
  const calls = [];
  const menu = {
    addItem(label, fn) { calls.push(['item', label, fn]); return this; },
    addToUi() { calls.push(['menu-added']); return this; }
  };
  const ui = {
    createMenu(name) { calls.push(['menu', name]); return menu; },
    showSidebar(html) { calls.push(['sidebar', html.title]); }
  };
  const gas = loadGas(['apps-script/08_Main.gs'], {
    SpreadsheetApp: { getUi: () => ui },
    HtmlService: {
      createTemplateFromFile: () => ({
        evaluate: () => ({ setTitle(title) { this.title = title; return this; } })
      })
    },
    garantirEstruturaPlanilha: () => calls.push(['ensure']),
    inspecionarPastaEntrada: () => ({ ready: true, lote: { dataReferencia: '2026-07-08' }, erros: [] }),
    obterUltimaImportacaoBemSucedida: () => ({ execucaoId: 'old' }),
    executarImportacaoBackend_: () => ({ ok: true, alunos: 330, contratos: 339 })
  });
  return { gas, calls };
}

test('onOpen cria menu TecnoFit com ação para abrir o painel', () => {
  const { gas, calls } = setup();
  gas.onOpen();
  assert.deepEqual(calls, [
    ['menu', 'TecnoFit'],
    ['item', 'Abrir painel', 'abrirPainel'],
    ['menu-added']
  ]);
});

test('abrirPainel renderiza Sidebar com título', () => {
  const { gas, calls } = setup();
  gas.abrirPainel();
  assert.deepEqual(calls, [['sidebar', 'TecnoFit — Atualização']]);
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
