const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGas } = require('../tests/helpers/load-gas');

const paths = process.argv.slice(2);
if (paths.length !== 3) {
  throw new Error(
    'Uso: npm run validate:real -- <vencimentos.xls> <fichas.xls> <avaliacao-fisica.xls>'
  );
}

const gas = loadGas([
  'apps-script/00_Config.gs',
  'apps-script/01_Normalizacao.gs',
  'apps-script/02_ParserHtml.gs',
  'apps-script/03_Transformacao.gs'
]);

function parse(path, type) {
  const html = fs.readFileSync(path, 'utf8');
  return gas.tabelaParaObjetos(
    gas.parseTabelaHtml(html),
    Array.from(gas.CABECALHOS_ORIGEM[type])
  );
}

const vencimentos = parse(paths[0], 'vencimentos');
const fichas = parse(paths[1], 'fichas');
const avaliacoes = parse(paths[2], 'avaliacao_fisica');
const result = gas.construirDadosMestre(
  vencimentos,
  fichas,
  avaliacoes,
  'validacao-local'
);

const contratos2321 = result.contratos.filter(row => row[1] === '2321');
const chaves2321 = new Set(contratos2321.map(row => row[0]));

assert.equal(result.alunos.length, 330, 'quantidade de alunos');
assert.equal(result.contratos.length, 339, 'quantidade de contratos');
assert.equal(result.visaoMestre.length, 339, 'quantidade da visão mestre');
assert.equal(contratos2321.length, 3, 'contratos do ID 2321');
assert.equal(chaves2321.size, 3, 'chaves distintas do ID 2321');

console.log(JSON.stringify({
  alunos: result.alunos.length,
  contratos: result.contratos.length,
  visaoMestre: result.visaoMestre.length,
  contratosId2321: contratos2321.length,
  chavesDistintasId2321: chaves2321.size,
  resumoAvisos: result.resumoAvisos
}, null, 2));
