const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

const gas = loadGas([
  'apps-script/00_Config.gs',
  'apps-script/09_DashboardMetricas.gs'
]);

const hoje = new Date(2026, 6, 11, 12);

test('classifica vencimento nos limites de 7 e 30 dias', () => {
  assert.equal(gas.classificarVencimento_(new Date(2026, 6, 10, 12), hoje), 'vencido');
  assert.equal(gas.classificarVencimento_(new Date(2026, 6, 18, 12), hoje), 'ate7');
  assert.equal(gas.classificarVencimento_(new Date(2026, 7, 10, 12), hoje), 'ate30');
  assert.equal(gas.classificarVencimento_(new Date(2026, 7, 11, 12), hoje), 'futuro');
});

test('classifica ficha e avaliação com limite estritamente excedido', () => {
  assert.equal(gas.classificarAtualizacao_('', hoje, 30), 'ausente');
  assert.equal(gas.classificarAtualizacao_(new Date(2026, 5, 11, 12), hoje, 30), 'atualizada');
  assert.equal(gas.classificarAtualizacao_(new Date(2026, 5, 10, 12), hoje, 30), 'desatualizada');
  assert.equal(gas.classificarAtualizacao_(new Date(2026, 3, 12, 12), hoje, 90), 'atualizada');
  assert.equal(gas.classificarAtualizacao_(new Date(2026, 3, 11, 12), hoje, 90), 'desatualizada');
});

test('deduplica pelo primeiro valor não vazio da chave', () => {
  const rows = [{ id: '1', nome: 'A' }, { id: '1', nome: 'A2' }, { id: '2', nome: 'B' }];
  assert.deepEqual(Array.from(gas.unicosPor_(rows, 'id'), row => row.nome), ['A', 'B']);
});
