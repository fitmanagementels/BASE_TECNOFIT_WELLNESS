const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGas } = require('./helpers/load-gas');

const gas = loadGas(['apps-script/02_ParserHtml.gs']);

test('interpreta células vazias, acentos e linhas HTML', () => {
  const html = fs.readFileSync('tests/fixtures/vencimentos.html', 'utf8');
  const rows = gas.parseTabelaHtml(html);
  assert.equal(rows[0][1], 'Código');
  assert.equal(rows[1][11], 'MUSCULAÇÃO');
});

test('mapeia os dados pelos cabeçalhos normalizados', () => {
  const html = fs.readFileSync('tests/fixtures/vencimentos.html', 'utf8');
  const rows = gas.parseTabelaHtml(html);
  const objects = gas.tabelaParaObjetos(rows, ['codigo', 'cliente', 'contrato']);
  assert.equal(objects.length, 3);
  assert.equal(objects[0].codigo, '100');
  assert.equal(objects[2].contrato, 'CONSULTORIA EM CORRIDA');
});

test('rejeita relatório sem cabeçalho obrigatório', () => {
  assert.throws(
    () => gas.tabelaParaObjetos([['Código', 'Cliente'], ['1', 'Teste']], ['codigo', 'contrato']),
    /Cabeçalhos obrigatórios/
  );
});

test('ignora a linha-resumo Total na coluna de código', () => {
  const html = fs.readFileSync('tests/fixtures/fichas.html', 'utf8');
  const objects = gas.tabelaParaObjetos(
    gas.parseTabelaHtml(html),
    ['codigo', 'data inicio', 'contato']
  );
  assert.equal(objects.length, 2);
  assert.equal(objects.some(row => row.codigo.startsWith('Total:')), false);
});
