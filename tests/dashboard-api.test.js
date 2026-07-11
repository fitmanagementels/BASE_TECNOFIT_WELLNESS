const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

const FILES = [
  'apps-script/00_Config.gs',
  'apps-script/04_PlanilhaRepositorio.gs',
  'apps-script/06_LogImportacoes.gs',
  'apps-script/09_DashboardMetricas.gs',
  'apps-script/10_DashboardPaginas.gs',
  'apps-script/11_DashboardRepositorio.gs',
  'apps-script/12_DashboardApi.gs'
];

function criarAba(valores) {
  const chamadas = [];
  return {
    chamadas,
    getLastRow: () => valores.length,
    getRange(linha, coluna, quantidadeLinhas, quantidadeColunas) {
      chamadas.push([linha, coluna, quantidadeLinhas, quantidadeColunas]);
      return {
        getValues: () => valores
          .slice(linha - 1, linha - 1 + quantidadeLinhas)
          .map(item => item.slice(coluna - 1, coluna - 1 + quantidadeColunas))
      };
    },
    getDataRange() {
      return {
        getDisplayValues: () => valores.map(item => item.map(valor => String(valor)))
      };
    }
  };
}

function criarCache() {
  const valores = new Map();
  return {
    valores,
    get: chave => valores.get(chave) || null,
    put: (chave, valor) => valores.set(chave, valor)
  };
}

function carregarComPlanilha(planilha, cache, extras = {}) {
  let aberturas = 0;
  const gas = loadGas(FILES, {
    SpreadsheetApp: {
      openById() {
        aberturas += 1;
        return planilha;
      }
    },
    CacheService: { getScriptCache: () => cache },
    ...extras
  });
  return { gas, aberturas: () => aberturas };
}

test('lerTabelaDashboard_ mapeia cabeçalhos exatos e limita a faixa lida', () => {
  const cabecalhos = ['id', 'aluno'];
  const aba = criarAba([
    ['id', 'aluno', 'coluna fora do contrato'],
    ['1', 'ALUNO TESTE', 'não deve ser lida'],
    ['', '', 'também não deve tornar a linha válida']
  ]);
  const { gas } = carregarComPlanilha({ getSheetByName: () => aba }, criarCache());

  const resultado = gas.lerTabelaDashboard_('BASE_ALUNOS', cabecalhos);

  assert.deepEqual(JSON.parse(JSON.stringify(resultado)), [{ id: '1', aluno: 'ALUNO TESTE' }]);
  assert.deepEqual(aba.chamadas, [[1, 1, 3, 2]]);
});

test('lerTabelaDashboard_ rejeita cabeçalho com texto ou posição diferente', () => {
  const aba = criarAba([['aluno', 'id'], ['ALUNO TESTE', '1']]);
  const { gas } = carregarComPlanilha({ getSheetByName: () => aba }, criarCache());

  assert.throws(
    () => gas.lerTabelaDashboard_('BASE_ALUNOS', ['id', 'aluno']),
    /^Error: Estrutura de dados incompatível\.$/
  );
});

test('lerTabelaDashboard_ valida o cabeçalho mesmo quando não há linhas de dados', () => {
  const aba = criarAba([['id', 'nome divergente']]);
  const { gas } = carregarComPlanilha({ getSheetByName: () => aba }, criarCache());

  assert.throws(
    () => gas.lerTabelaDashboard_('BASE_ALUNOS', ['id', 'aluno']),
    /^Error: Estrutura de dados incompatível\.$/
  );
});

test('obterDadosPaginaDashboard despacha a página e reutiliza resposta JSON do cache', () => {
  const config = loadGas(['apps-script/00_Config.gs']).CONFIG;
  const abas = {
    BASE_ALUNOS: criarAba([
      Array.from(config.cabecalhos.alunos),
      ['1', 'ALUNO TESTE', '8500000000', 'Ativo', '', '', '', 'exec-1']
    ]),
    CONTRATOS: criarAba([
      Array.from(config.cabecalhos.contratos),
      ['c1', '1', '2X - POLO - PERSONAL', '2X', 100, '', new Date(2026, 6, 10, 12), 'Finalizado', 'POLO', 'MUSCULAÇÃO', 'exec-1']
    ]),
    IMPORTACOES: criarAba([
      Array.from(config.cabecalhos.importacoes),
      ['exec-1', '11/07/2026 08:00', '11/07/2026 08:05', 'vencimentos', 'arquivo.html', 'drive-1', '2026-07-11', 'r1', '1', '1', '0', 'SUCESSO', 'OK']
    ])
  };
  const cache = criarCache();
  const { gas, aberturas } = carregarComPlanilha({ getSheetByName: nome => abas[nome] || null }, cache);

  const result = gas.obterDadosPaginaDashboard('vencimentos', {});
  const repetido = gas.obterDadosPaginaDashboard('vencimentos', {});

  assert.equal(result.ok, true);
  assert.equal(result.pagina, 'vencimentos');
  assert.equal(result.dados.kpis.vencidos, 1);
  assert.equal(aberturas(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(repetido)), JSON.parse(JSON.stringify(result)));
  const serializado = Array.from(cache.valores.values())[0];
  assert.equal(JSON.parse(serializado).dados.lista[0].vencimento, '10/07/2026');
  assert.equal(serializado.includes('2026-07-10T'), false);
  assert.throws(() => gas.obterDadosPaginaDashboard('inexistente', {}), /Página inválida/);
  assert.throws(() => gas.obterDadosPaginaDashboard('toString', {}), /^Error: Página inválida\.$/);
});

test('chaveCacheDashboard_ mantém filtros grandes dentro do limite do Apps Script', () => {
  const gas = loadGas(FILES);
  const chaveA = gas.chaveCacheDashboard_('vencimentos', { busca: 'A'.repeat(500) });
  const chaveB = gas.chaveCacheDashboard_('vencimentos', { busca: 'B'.repeat(500) });

  assert.ok(chaveA.length <= 250);
  assert.notEqual(chaveA, chaveB);
});

test('obterDadosPaginaDashboard oculta erro interno e não registra PII', () => {
  const logs = [];
  const cache = criarCache();
  const broken = loadGas(FILES, {
    SpreadsheetApp: {
      openById() {
        const erro = new Error('linha 2: ALUNA SEGREDO contato 85999999999');
        erro.name = 'ALUNA SEGREDO 85999999999';
        throw erro;
      }
    },
    CacheService: { getScriptCache: () => cache },
    console: { error: (...argumentos) => logs.push(argumentos) }
  });

  assert.throws(
    () => broken.obterDadosPaginaDashboard('vencimentos', {}),
    /^Error: Não foi possível carregar o dashboard\.$/
  );
  const textoLog = JSON.stringify(logs);
  assert.equal(textoLog.includes('ALUNA SEGREDO'), false);
  assert.equal(textoLog.includes('85999999999'), false);
  assert.equal(textoLog.includes('linha 2'), false);
});

test('obterDadosPaginaDashboard sanitiza falha ao desserializar o cache', () => {
  const logs = [];
  const gas = loadGas(FILES, {
    SpreadsheetApp: { openById: () => assert.fail('não deveria abrir a planilha') },
    CacheService: {
      getScriptCache: () => ({
        get: () => '{ALUNA SEGREDO 85999999999',
        put: () => assert.fail('não deveria gravar cache')
      })
    },
    console: { error: (...argumentos) => logs.push(argumentos) }
  });

  assert.throws(
    () => gas.obterDadosPaginaDashboard('vencimentos', {}),
    /^Error: Não foi possível carregar o dashboard\.$/
  );
  assert.equal(JSON.stringify(logs).includes('ALUNA SEGREDO'), false);
  assert.equal(JSON.stringify(logs).includes('85999999999'), false);
});

test('obterDadosPaginaDashboard devolve dados calculados quando a gravação do cache falha', () => {
  const config = loadGas(['apps-script/00_Config.gs']).CONFIG;
  const abas = {
    BASE_ALUNOS: criarAba([Array.from(config.cabecalhos.alunos)]),
    CONTRATOS: criarAba([Array.from(config.cabecalhos.contratos)]),
    IMPORTACOES: criarAba([Array.from(config.cabecalhos.importacoes)])
  };
  const cache = {
    get: () => null,
    put() { throw new Error('cache contém ALUNA SEGREDO 85999999999'); }
  };
  const { gas } = carregarComPlanilha({ getSheetByName: nome => abas[nome] || null }, cache);

  const resultado = gas.obterDadosPaginaDashboard('planos', {});

  assert.equal(resultado.ok, true);
  assert.equal(resultado.pagina, 'planos');
});
