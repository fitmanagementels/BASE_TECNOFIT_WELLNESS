const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

const gas = loadGas(['apps-script/00_Config.gs', 'apps-script/05_DriveRepositorio.gs']);

function file(name, id = name) {
  return { nome: name, id };
}

test('aceita datas com hífen ou sublinhado e normaliza', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(gas.parseNomeArquivo('fichas_2026_07_08_r01.xls'))),
    { tipo: 'fichas', dataReferencia: '2026-07-08', revisao: '01', nomeCanonico: 'fichas_2026-07-08_r01.xls' }
  );
  assert.equal(gas.parseNomeArquivo('vencimentos_2026-07-08_r01.xls').dataReferencia, '2026-07-08');
});

test('exige exatamente os três tipos no mesmo lote', () => {
  assert.throws(
    () => gas.agruparLote([file('fichas_2026-07-08_r01.xls'), file('vencimentos_2026-07-08_r01.xls')]),
    /Lote incompleto/
  );
  assert.throws(
    () => gas.agruparLote([
      file('fichas_2026-07-08_r01.xls'),
      file('vencimentos_2026-07-08_r01.xls'),
      file('avaliacao_fisica_2026-07-08_r02.xls')
    ]),
    /mesma data e revisão/
  );
});

test('rejeita arquivo extra e tipo repetido', () => {
  assert.throws(() => gas.agruparLote([
    file('fichas_2026-07-08_r01.xls'),
    file('vencimentos_2026-07-08_r01.xls'),
    file('avaliacao_fisica_2026-07-08_r01.xls'),
    file('notas.txt')
  ]), /Arquivo inválido/);
  assert.throws(() => gas.agruparLote([
    file('fichas_2026-07-08_r01.xls', '1'),
    file('fichas_2026-07-08_r01.xls', '2'),
    file('vencimentos_2026-07-08_r01.xls'),
    file('avaliacao_fisica_2026-07-08_r01.xls')
  ]), /Tipo repetido/);
});
