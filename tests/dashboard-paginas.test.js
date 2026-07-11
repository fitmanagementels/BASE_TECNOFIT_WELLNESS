const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

const gas = loadGas([
  'apps-script/00_Config.gs',
  'apps-script/09_DashboardMetricas.gs',
  'apps-script/10_DashboardPaginas.gs'
]);
const hoje = new Date(2026, 6, 11, 12);
const alunos = [
  { id: '1', aluno: 'ALUNO A', contato: '8500000001', status: 'Ativo', data_ficha: '', data_avaliacao: new Date(2026, 6, 1) },
  { id: '2', aluno: 'ALUNO B', contato: '8500000002', status: 'Ativo', data_ficha: new Date(2026, 5, 1), data_avaliacao: '' }
];
const contratos = [
  { _chave_contrato: 'c1', id: '1', contrato_x_sem: '2X', valor: 100, vencimento: new Date(2026, 6, 10), status_contrato: 'Finalizado', polo: 'POLO A', modalidade: 'MUSCULAÇÃO' },
  { _chave_contrato: 'c2', id: '1', contrato_x_sem: '3X', valor: 200, vencimento: new Date(2026, 6, 18), status_contrato: 'Ativo', polo: 'POLO B', modalidade: 'CORRIDA' },
  { _chave_contrato: 'c3', id: '2', contrato_x_sem: '2X', valor: 300, vencimento: new Date(2026, 7, 1), status_contrato: 'Ativo', polo: 'POLO A', modalidade: 'MUSCULAÇÃO' }
];

test('vencimentos deduplica contratos e soma apenas a janela de 30 dias', () => {
  const page = gas.montarPaginaVencimentos_(alunos, contratos.concat(contratos[0]), hoje);
  assert.deepEqual(JSON.parse(JSON.stringify(page.kpis)), { vencidos: 1, ate7: 1, ate30: 2, valorAte30: 500 });
  assert.equal(page.lista[0].chave, 'c1');
  assert.equal(page.graficos.semanas.length, 6);
});

test('fichas e avaliações contam alunos, não contratos', () => {
  const fichas = gas.montarPaginaFichas_(alunos, contratos, hoje);
  const avaliacoes = gas.montarPaginaAvaliacoes_(alunos, contratos, hoje);
  assert.equal(fichas.kpis.ausentes, 1);
  assert.equal(fichas.kpis.desatualizadas, 1);
  assert.equal(avaliacoes.kpis.ausentes, 1);
  assert.equal(avaliacoes.kpis.atualizadas, 1);
  assert.ok(fichas.graficos.faixas);
  assert.ok(avaliacoes.graficos.faixas);
  assert.ok(Array.isArray(fichas.graficos.coberturaPorPolo));
  assert.ok(Array.isArray(avaliacoes.graficos.coberturaPorPolo));
});

test('planos calcula alunos, contratos, valor e ticket sem duplicar', () => {
  const page = gas.montarPaginaPlanos_(alunos, contratos.concat(contratos[0]));
  assert.deepEqual(JSON.parse(JSON.stringify(page.kpis)), { alunos: 2, contratos: 3, valor: 600, ticketMedio: 200 });
  assert.deepEqual(JSON.parse(JSON.stringify(page.graficos.valorPorPolo)), { 'POLO A': 400, 'POLO B': 200 });
});

test('ids herdados do protótipo preservam associação entre alunos e contratos', () => {
  const ids = ['toString', 'constructor', '__proto__'];
  const alunosEspeciais = ids.map((id, indice) => ({
    id, aluno: `ALUNO ${indice}`, contato: `CONTATO ${indice}`, status: 'Ativo',
    data_ficha: new Date(2026, 6, 1), data_avaliacao: new Date(2026, 6, 1)
  }));
  const contratosEspeciais = ids.map((id, indice) => ({
    _chave_contrato: `especial-${indice}`, id, contrato_x_sem: '2X', valor: 100,
    vencimento: new Date(2026, 6, 20), status_contrato: 'Ativo', polo: `POLO ${indice}`,
    modalidade: 'MUSCULAÇÃO'
  }));

  const vencimentos = gas.montarPaginaVencimentos_(alunosEspeciais, contratosEspeciais, hoje);
  const fichas = gas.montarPaginaFichas_(alunosEspeciais, contratosEspeciais, hoje);

  assert.deepEqual(vencimentos.lista.map(item => item.aluno).sort(), ['ALUNO 0', 'ALUNO 1', 'ALUNO 2']);
  assert.equal(fichas.lista.length, 3);
  assert.deepEqual(fichas.lista.map(item => item.polos[0]).sort(), ['POLO 0', 'POLO 1', 'POLO 2']);
});

test('rótulos herdados do protótipo são contados como grupos próprios', () => {
  const rotulos = ['toString', 'constructor', '__proto__'];
  const contratosEspeciais = rotulos.map((rotulo, indice) => ({
    _chave_contrato: `grupo-${indice}`, id: String(indice), contrato_x_sem: rotulo,
    valor: indice + 1, vencimento: new Date(2026, 6, 20), status_contrato: rotulo,
    polo: rotulo, modalidade: rotulo
  }));

  const page = gas.montarPaginaPlanos_([], contratosEspeciais);
  const polos = JSON.parse(JSON.stringify(page.graficos.polos));
  const valores = JSON.parse(JSON.stringify(page.graficos.valorPorPolo));

  rotulos.forEach((rotulo, indice) => {
    assert.equal(polos[rotulo], 1);
    assert.equal(valores[rotulo], indice + 1);
  });
});
