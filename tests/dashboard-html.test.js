const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('shell contém as quatro páginas e regiões acessíveis', () => {
  const html = fs.readFileSync('apps-script/DashboardComponents.html', 'utf8');
  for (const page of ['vencimentos', 'fichas', 'avaliacoes', 'planos']) {
    const buttons = html.match(new RegExp(`<button\\b[^>]*data-page="${page}"[^>]*>`, 'g')) || [];
    assert.equal(buttons.length, 2, `${page} deve existir uma vez em cada navegação`);
    assert.equal(buttons.every(button => /aria-label="[^"]+"/.test(button)), true, `${page} deve ter aria-label`);
  }
  for (const id of ['navDesktop', 'navMobile', 'pageTitle', 'lastUpdate', 'importWarning', 'filters', 'kpiGrid', 'chartGrid', 'listPanel', 'detailDialog', 'detailTitle', 'detailContent', 'detailClose']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /<section\s+id="appState"[^>]*aria-live="polite"/);
  const dots = html.match(/●/g) || [];
  const hiddenDots = html.match(/<span aria-hidden="true">●<\/span>/g) || [];
  assert.equal(hiddenDots.length, dots.length, 'pontos decorativos devem ficar ocultos da árvore acessível');
  assert.match(html, /id="lastUpdate"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="importWarning"[^>]*role="alert"[^>]*aria-live="assertive"/);
  assert.doesNotMatch(html, /class="nav-meta"[^>]*>[^<]*●/);
});

test('Chart.js 4.4.7 usa integridade SRI e crossorigin', () => {
  const html = fs.readFileSync('apps-script/Dashboard.html', 'utf8');
  assert.match(html, /<script[^>]+src="<\?= CONFIG\.dashboard\.chartJsUrl \?>"[^>]+integrity="sha384-vsrfeLOOY6KuIYKDlmVH5UiBmgIdB1oEf7p01YgWHuqmOHfZr374\+odEv96n9tNC"[^>]+crossorigin="anonymous"/);
});

test('estilos definem breakpoints desktop e mobile da marca', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /--lime:\s*#dfff22/i);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /\.mobile-nav/);
  assert.match(css, /\.filter-control\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9]\d)px/s);
  assert.match(css, /\.content\s*\{[^}]*padding-bottom:\s*calc\([^)]*env\(safe-area-inset-bottom\)[^)]*\)/s);
  assert.match(css, /\.table-scroll\s*\{[^}]*max-height:[^;}]+;[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.table-scroll\s*\{[^}]*display:\s*block/s);
  assert.match(css, /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.table-scroll\s*\{\s*display:\s*none;?\s*\}[\s\S]*?@media\s*\(prefers-reduced-motion:/);
});

test('navegação compacta mantém tooltip textual em hover e foco', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /@media\s*\(min-width:\s*721px\)\s*and\s*\(max-width:\s*1050px\)/);
  assert.match(css, /\.nav-button::after\s*\{[^}]*content:\s*attr\(aria-label\)/s);
  assert.match(css, /\.nav-button:hover::after[^{]*\.nav-button:focus-visible::after\s*\{[^}]*opacity:\s*1/s);
});

test('cliente usa Apps Script, Chart.js e renderização segura de texto', () => {
  const client = fs.readFileSync('apps-script/DashboardClient.html', 'utf8');
  assert.match(client, /withSuccessHandler/);
  assert.match(client, /withFailureHandler/);
  assert.match(client, /obterDadosPaginaDashboard/);
  assert.match(client, /\bChart\b/);
  assert.match(client, /textContent/);
  assert.doesNotMatch(client, /innerHTML\s*=/);
});

test('cliente declara os contratos de navegação, concorrência e acessibilidade', () => {
  const client = fs.readFileSync('apps-script/DashboardClient.html', 'utf8');
  assert.match(client, /DOMContentLoaded/);
  assert.match(client, /filtersByPage/);
  assert.match(client, /requestId/);
  assert.match(client, /chart\.destroy\(\)/);
  assert.match(client, /typeof Chart/);
  assert.match(client, /prefers-reduced-motion/);
  assert.match(client, /aria-current/);
  assert.match(client, /table-scroll/);
  assert.match(client, /tabindex/);
  assert.match(client, /Detalhamento dos dados/);
  assert.match(client, /Não foi possível carregar esta página\./);
  assert.match(client, /Nenhum resultado para os filtros selecionados\./);
  assert.match(client, /Tentar novamente/);
  assert.match(client, /Limpar filtros/);
  assert.match(client, /replace\(\/\\d\(\?=\\d\{2\}\)\/g,\s*['"]•['"]\)/);
});

test('helpers puros formatam valores e mascaram contatos', () => {
  const source = fs.readFileSync('apps-script/DashboardClient.html', 'utf8')
    .replace(/^\s*<script>\s*/, '')
    .replace(/\s*<\/script>\s*$/, '');
  const context = {
    document: { createElement: () => ({}) },
    Intl,
    console,
    google: { script: { run: {} } }
  };
  vm.runInNewContext(source, context);
  assert.equal(context.number(1234), '1.234');
  assert.match(context.money(1234.5), /^R\$\s?1\.234,50$/);
  assert.equal(context.percent(92.5), '92,5%');
  assert.equal(context.maskContact('(85) 98765-4321'), '(85) •••65-••21');
});

test('helpers interpretam o envelope da API e classificam estados sem colisão de substring', () => {
  const source = fs.readFileSync('apps-script/DashboardClient.html', 'utf8')
    .replace(/^\s*<script>\s*/, '')
    .replace(/\s*<\/script>\s*$/, '');
  const context = {
    document: { createElement: () => ({}) },
    Intl,
    console,
    google: { script: { run: {} } }
  };
  vm.runInNewContext(source, context);
  const dados = { lista: [{ aluno: 'Teste' }], kpis: {}, graficos: {}, filtros: {}, paginacao: { pagina: 1, limite: 25, totalItens: 1, totalPaginas: 1 } };
  assert.equal(context.responseData({ ok: true, pagina: 'vencimentos', dados }), dados);
  assert.equal(context.statusClass('atualizada'), 'status status-success');
  assert.equal(context.statusClass('desatualizada'), 'status status-warning');
  assert.equal(context.statusClass('inativo'), 'status status-warning');
});

class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName || '').toUpperCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.hidden = false;
    this.className = '';
    this.textContent = '';
    this.value = '';
    this.disabled = false;
    this.open = false;
    this.classList = {
      toggle: (name, active) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (active) classes.add(name); else classes.delete(name);
        this.className = Array.from(classes).join(' ');
      },
      contains: name => this.className.split(/\s+/).includes(name)
    };
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  replaceChildren(...children) {
    this.children = [];
    children.forEach(child => this.appendChild(child));
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(type, listener) {
    (this.listeners[type] ||= []).push(listener);
  }

  dispatch(type, event = {}) {
    const payload = { target: this, preventDefault() {}, ...event };
    (this.listeners[type] || []).forEach(listener => listener(payload));
  }

  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
}

function descendants(node) {
  return node.children.flatMap(child => [child, ...descendants(child)]);
}

function nodeByText(node, text) {
  return [node, ...descendants(node)].find(child => child.textContent === text);
}

function validResponse(page = 'vencimentos', overrides = {}) {
  const filtros = {
    polos: ['POLO A', 'POLO B'], statusAlunos: ['Ativo', 'Inativo'], frequencias: ['2X'],
    modalidades: ['MUSCULAÇÃO'], statusContratos: ['Ativo']
  };
  const fixtures = {
    vencimentos: {
      kpis: { vencidos: 1, ate7: 2, ate30: 3, valorAte30: 100 },
      graficos: { situacao: { vencido: 1 }, semanas: [{ label: 'Semana 1', valor: 1 }] },
      lista: [{ aluno: 'ALUNO TESTE', contato: '85987654321', polo: 'POLO A', vencimento: '11/07/2026', situacao: 'ate7', valor: 100 }],
      filtros
    },
    fichas: {
      kpis: { atualizadas: 1, ausentes: 2, desatualizadas: 3, cobertura: 75 },
      graficos: { situacao: { atualizada: 1 }, faixas: { '0–30 dias': 1 }, coberturaPorPolo: [{ polo: 'POLO A', cobertura: 75 }] },
      lista: [{ aluno: 'ALUNO FICHA', contato: '85987654321', polos: ['POLO A'], data: '11/07/2026', diasSemAtualizacao: 10, situacao: 'atualizada' }],
      filtros
    },
    avaliacoes: {
      kpis: { atualizadas: 1, ausentes: 0, desatualizadas: 0, cobertura: 100 },
      graficos: { situacao: { atualizada: 1 }, faixas: { '0–30 dias': 1 }, coberturaPorPolo: [{ polo: 'POLO A', cobertura: 100 }] },
      lista: [{ aluno: 'ALUNO AVALIAÇÃO', contato: '85987654321', polos: ['POLO A'], data: '11/07/2026', diasSemAtualizacao: 0, situacao: 'atualizada' }],
      filtros
    },
    planos: {
      kpis: { alunos: 1, contratos: 1, valor: 100, ticketMedio: 100 },
      graficos: { polos: { 'POLO A': 1 }, frequencias: { '2X': 1 }, modalidades: { MUSCULAÇÃO: 1 }, status: { Ativo: 1 }, valorPorPolo: { 'POLO A': 100 } },
      lista: [{ aluno: 'ALUNO PLANO', statusAluno: 'Ativo', frequencia: '2X', modalidade: 'MUSCULAÇÃO', polo: 'POLO A', inicioCorrente: '01/07/2026', vencimento: '31/07/2026', statusContrato: 'Ativo', valor: 100 }],
      filtros
    }
  };
  const dados = { ...(fixtures[page] || fixtures.vencimentos), ...overrides };
  dados.paginacao ||= { pagina: 1, limite: 25, totalItens: Array.isArray(dados.lista) ? dados.lista.length : 0, totalPaginas: 1 };
  return { ok: true, pagina: page, atualizadoEm: '11/07/2026 08:05', avisoImportacao: '', dados };
}

function setupClient(options = {}) {
  const ids = ['filters', 'kpiGrid', 'chartGrid', 'listPanel', 'appState', 'mainContent', 'pageTitle', 'lastUpdate', 'importWarning', 'detailDialog', 'detailTitle', 'detailContent', 'detailClose'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id === 'pageTitle' ? 'h1' : 'section')]));
  const pages = ['vencimentos', 'fichas', 'avaliacoes', 'planos'];
  const buttons = pages.flatMap(page => [0, 1].map(() => {
    const button = new FakeNode('button');
    button.dataset.page = page;
    return button;
  }));
  const documentListeners = {};
  const document = {
    activeElement: null,
    createElement(tag) {
      const node = new FakeNode(tag);
      node.focus = () => { document.activeElement = node; };
      return node;
    },
    getElementById: id => nodes[id],
    querySelectorAll: selector => selector === '[data-page]' ? buttons : [],
    addEventListener(type, listener) {
      (documentListeners[type] ||= []).push(listener);
    }
  };
  Object.values(nodes).forEach(node => { node.focus = () => { document.activeElement = node; }; });
  const requests = [];
  let successHandler;
  let failureHandler;
  const runner = {
    withSuccessHandler(handler) { successHandler = handler; return runner; },
    withFailureHandler(handler) { failureHandler = handler; return runner; },
    obterDadosPaginaDashboard(page, filters) {
      requests.push({ page, filters, success: successHandler, failure: failureHandler });
      successHandler = undefined;
      failureHandler = undefined;
    }
  };
  const charts = [];
  function FakeChart(canvas, config) {
    if (options.chartThrows) throw new Error('CDN inválida');
    this.canvas = canvas;
    this.config = config;
    this.destroyed = false;
    this.destroy = () => { this.destroyed = true; };
    charts.push(this);
  }
  const source = fs.readFileSync('apps-script/DashboardClient.html', 'utf8')
    .replace(/^\s*<script>\s*/, '')
    .replace(/\s*<\/script>\s*$/, '') + '\nthis.__state = state;';
  const mediaListeners = [];
  const mediaQuery = {
    matches: Boolean(options.mobile),
    addEventListener(type, listener) { if (type === 'change') mediaListeners.push(listener); }
  };
  const context = {
    document,
    window: { matchMedia: () => mediaQuery },
    Intl,
    console,
    google: { script: { run: runner } }
  };
  if (!options.chartMissing) context.Chart = FakeChart;
  vm.runInNewContext(source, context);
  return { context, document, nodes, buttons, documentListeners, requests, charts, mediaQuery, mediaListeners };
}

function startClient(client) {
  assert.equal(client.documentListeners.DOMContentLoaded.length, 1);
  client.documentListeners.DOMContentLoaded[0]();
}

test('DOMContentLoaded registra navegação e inicia a primeira chamada Apps Script', () => {
  const client = setupClient();
  startClient(client);
  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0].page, 'vencimentos');
  assert.deepEqual({ ...client.requests[0].filters }, {});
  assert.ok(client.buttons.every(button => button.listeners.click.length === 1));
});

test('navegação sincroniza as duas navs e preserva filtros independentes por página', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse());
  const polo = client.nodes.filters.children[0].children[1];
  polo.value = 'POLO A';
  polo.dispatch('change');
  client.buttons.find(button => button.dataset.page === 'fichas').dispatch('click');
  client.requests.at(-1).success(validResponse('fichas'));
  assert.equal(client.nodes.kpiGrid.children[0].children[1].textContent, '1');
  assert.ok(nodeByText(client.nodes.listPanel, 'ALUNO FICHA'));
  const statusAluno = client.nodes.filters.children[1].children[1];
  statusAluno.value = 'Ativo';
  statusAluno.dispatch('change');
  client.buttons.find(button => button.dataset.page === 'vencimentos').dispatch('click');

  const vencimentos = client.buttons.filter(button => button.dataset.page === 'vencimentos');
  const demais = client.buttons.filter(button => button.dataset.page !== 'vencimentos');
  assert.ok(vencimentos.every(button => button.classList.contains('active') && button.getAttribute('aria-current') === 'page'));
  assert.ok(demais.every(button => !button.classList.contains('active') && button.getAttribute('aria-current') === null));
  assert.deepEqual({ ...client.context.__state.filters }, { polo: 'POLO A' });
  assert.deepEqual({ ...client.context.__state.filtersByPage.fichas }, { statusAluno: 'Ativo' });
  assert.equal(client.nodes.pageTitle.textContent, 'Vencimentos dos alunos');
});

test('resposta stale não renderiza e mudança de filtro envia uma cópia', () => {
  const client = setupClient();
  startClient(client);
  const stale = client.requests[0];
  client.context.loadPage();
  const current = client.requests[1];
  assert.equal(stale.page, 'vencimentos');
  assert.equal(current.page, 'vencimentos');

  stale.success(validResponse('vencimentos', {
    kpis: { vencidos: 99, ate7: 99, ate30: 99, valorAte30: 9900 },
    lista: [{ aluno: 'RESPOSTA ANTIGA', contato: '85999999999', polo: 'POLO A', vencimento: '01/01/2020', situacao: 'vencido', valor: 9900 }]
  }));
  assert.equal(client.nodes.kpiGrid.children.length, 4);
  assert.equal(client.nodes.appState.hidden, false);
  assert.ok(nodeByText(client.nodes.appState, 'Carregando dashboard…'));
  assert.equal(nodeByText(client.nodes.listPanel, 'RESPOSTA ANTIGA'), undefined);

  current.success(validResponse('vencimentos', {
    kpis: { vencidos: 7, ate7: 2, ate30: 3, valorAte30: 100 },
    lista: [{ aluno: 'RESPOSTA ATUAL', contato: '85987654321', polo: 'POLO B', vencimento: '11/07/2026', situacao: 'ate7', valor: 100 }]
  }));
  assert.equal(client.nodes.kpiGrid.children[0].children[1].textContent, '7');
  assert.ok(nodeByText(client.nodes.listPanel, 'RESPOSTA ATUAL'));
  assert.equal(nodeByText(client.nodes.listPanel, 'RESPOSTA ANTIGA'), undefined);
  const polo = client.nodes.filters.children[0].children[1];
  polo.value = 'POLO B';
  polo.dispatch('change');
  const filtered = client.requests.at(-1);
  assert.deepEqual({ ...filtered.filters }, { polo: 'POLO B' });
  assert.notEqual(filtered.filters, client.context.__state.filters);
  client.context.__state.filters.polo = 'ALTERADO';
  assert.equal(filtered.filters.polo, 'POLO B');
});

test('failure oferece retry e limpar filtros zera apenas a página atual', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].failure(new Error('segredo'));
  const retry = nodeByText(client.nodes.appState, 'Tentar novamente');
  assert.ok(retry);
  retry.dispatch('click');
  assert.equal(client.requests.length, 2);

  client.context.__state.filters = { polo: 'POLO A' };
  client.context.__state.filtersByPage.vencimentos = { polo: 'POLO A' };
  client.context.__state.filtersByPage.fichas = { statusAluno: 'Ativo' };
  client.requests.at(-1).success(validResponse('vencimentos', { lista: [] }));
  const clear = nodeByText(client.nodes.appState, 'Limpar filtros');
  assert.ok(clear);
  clear.dispatch('click');
  assert.deepEqual({ ...client.context.__state.filtersByPage.vencimentos }, {});
  assert.deepEqual({ ...client.context.__state.filtersByPage.fichas }, { statusAluno: 'Ativo' });
  assert.deepEqual({ ...client.requests.at(-1).filters }, {});
});

test('Chart é destruído e falhas do CDN não impedem KPIs, lista e tabela acessível', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse());
  assert.equal(client.charts.length, 3);
  const scroll = client.nodes.listPanel.children.find(child => child.className === 'table-scroll');
  assert.equal(scroll.getAttribute('tabindex'), '0');
  assert.match(scroll.getAttribute('aria-label'), /Detalhamento dos dados/);
  client.context.loadPage();
  assert.ok(client.charts.every(chart => chart.destroyed));

  for (const options of [{ chartMissing: true }, { chartThrows: true }]) {
    const fallback = setupClient(options);
    startClient(fallback);
    fallback.requests[0].success(validResponse());
    assert.equal(fallback.nodes.kpiGrid.children.length, 4);
    assert.ok(fallback.nodes.listPanel.children.some(child => child.className === 'table-scroll'));
    assert.ok(nodeByText(fallback.nodes.chartGrid, 'Gráfico indisponível. Consulte os indicadores e a lista abaixo.'));
  }
});

test('envelopes inválidos exibem erro com retry em vez de estado vazio', () => {
  const variants = [
    { ...validResponse(), ok: false },
    { ...validResponse(), pagina: 'planos' },
    validResponse('vencimentos', { kpis: undefined }),
    validResponse('vencimentos', { graficos: undefined }),
    validResponse('vencimentos', { lista: undefined }),
    validResponse('vencimentos', { filtros: undefined })
  ];
  variants.forEach(response => {
    const client = setupClient();
    startClient(client);
    client.requests[0].success(response);
    assert.ok(nodeByText(client.nodes.appState, 'Não foi possível carregar esta página.'));
    assert.ok(nodeByText(client.nodes.appState, 'Tentar novamente'));
    assert.equal(nodeByText(client.nodes.appState, 'Nenhum resultado para os filtros selecionados.'), undefined);
  });
});

test('health UI anuncia atualização e alerta sem alegar saúde nos demais estados', () => {
  const client = setupClient();
  startClient(client);
  assert.equal(client.nodes.lastUpdate.textContent, 'Atualização indisponível durante o carregamento');
  client.requests[0].success({ ...validResponse(), avisoImportacao: 'A última tentativa falhou. Exibindo a última base válida.' });
  assert.match(client.nodes.lastUpdate.textContent, /11\/07\/2026 08:05/);
  assert.equal(client.nodes.importWarning.textContent, 'A última tentativa falhou. Exibindo a última base válida.');
  assert.equal(client.nodes.importWarning.getAttribute('role'), 'alert');
  client.context.loadPage();
  client.requests.at(-1).failure(new Error('falha'));
  assert.equal(client.nodes.lastUpdate.textContent, 'Atualização indisponível');
});

test('estado vazio preserva fatos e aviso do envelope sem declarar saúde', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success({
    ...validResponse('vencimentos', { lista: [], paginacao: { pagina: 1, limite: 25, totalItens: 0, totalPaginas: 0 } }),
    avisoImportacao: 'Falha posterior; exibindo a última base válida.'
  });
  assert.match(client.nodes.lastUpdate.textContent, /11\/07\/2026 08:05/);
  assert.equal(client.nodes.importWarning.textContent, 'Falha posterior; exibindo a última base válida.');
  assert.equal(nodeByText(client.nodes.appState, 'Dados disponíveis'), undefined);
});

test('cliente renderiza busca, filtros completos e reseta página ao alterar filtro', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse('vencimentos'));
  const controls = descendants(client.nodes.filters).filter(node => node.name || node.getAttribute('name'));
  const names = controls.map(node => node.name || node.getAttribute('name'));
  for (const name of ['busca', 'polo', 'statusAluno', 'periodoDias', 'situacao', 'frequencia', 'modalidade', 'statusContrato']) {
    assert.ok(names.includes(name), `filtro ${name}`);
  }
  client.context.__state.filters.paginaLista = 3;
  const busca = controls.find(node => (node.name || node.getAttribute('name')) === 'busca');
  busca.value = 'ALUNO';
  busca.dispatch('change');
  assert.equal(client.requests.at(-1).filters.paginaLista, undefined);
  assert.equal(client.requests.at(-1).filters.busca, 'ALUNO');
});

test('situações usam rótulos amigáveis e preservam values técnicos', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse());
  const situation = descendants(client.nodes.filters).find(node => node.name === 'situacao');
  const options = situation.children.map(option => [option.value, option.textContent]);
  assert.ok(options.some(([value, label]) => value === 'ate7' && label === 'Até 7 dias'));
  assert.ok(options.some(([value, label]) => value === 'ate30' && label === 'De 8 a 30 dias'));
  assert.ok(options.some(([value, label]) => value === 'semData' && label === 'Sem data'));
});

test('cada gráfico tem resumo textual associado ao canvas', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse());
  const canvases = descendants(client.nodes.chartGrid).filter(node => node.tagName === 'CANVAS');
  assert.ok(canvases.length >= 3);
  canvases.forEach(canvas => {
    const describedBy = canvas.getAttribute('aria-describedby');
    assert.ok(describedBy);
    assert.ok(descendants(client.nodes.chartGrid).some(node => node.id === describedBy && node.tagName === 'UL'));
  });
});

test('cliente renderiza todos os gráficos e colunas exigidos em cada página', () => {
  const expected = {
    vencimentos: { charts: 3, columns: ['Aluno', 'Contato', 'Frequência', 'Polo', 'Vencimento', 'Situação', 'Valor', 'Detalhes'] },
    fichas: { charts: 3, columns: ['Aluno', 'Contato', 'Polos', 'Última ficha', 'Dias sem atualização', 'Situação', 'Detalhes'] },
    avaliacoes: { charts: 3, columns: ['Aluno', 'Contato', 'Polos', 'Última avaliação', 'Dias sem atualização', 'Situação', 'Detalhes'] },
    planos: { charts: 5, columns: ['Aluno', 'Status do aluno', 'Frequência', 'Modalidade', 'Polo', 'Início corrente', 'Vencimento', 'Status do contrato', 'Valor'] }
  };
  const client = setupClient();
  startClient(client);
  for (const page of Object.keys(expected)) {
    if (page !== 'vencimentos') client.buttons.find(button => button.dataset.page === page).dispatch('click');
    client.requests.at(-1).success(validResponse(page));
    assert.equal(descendants(client.nodes.chartGrid).filter(node => node.tagName === 'CANVAS').length, expected[page].charts, page);
    const headings = descendants(client.nodes.listPanel).filter(node => node.tagName === 'TH').map(node => node.textContent);
    assert.deepEqual(headings, expected[page].columns, page);
  }
});

test('resumos de gráficos formatam cobertura como percentual e valor como moeda', () => {
  const client = setupClient();
  startClient(client);
  client.buttons.find(button => button.dataset.page === 'avaliacoes').dispatch('click');
  client.requests.at(-1).success(validResponse('avaliacoes'));
  assert.ok(nodeByText(client.nodes.chartGrid, 'POLO A: 100%'));
  client.buttons.find(button => button.dataset.page === 'planos').dispatch('click');
  client.requests.at(-1).success(validResponse('planos'));
  assert.match(nodeByText(client.nodes.chartGrid, 'POLO A: R$ 100,00').textContent, /R\$/);
});

test('mobile nunca cria contato completo e breakpoint rerenderiza sem nova API', () => {
  const client = setupClient({ mobile: true });
  startClient(client);
  client.requests[0].success(validResponse());
  assert.equal(descendants(client.nodes.listPanel).some(node => node.tagName === 'TABLE'), false);
  assert.equal(nodeByText(client.nodes.listPanel, '85987654321'), undefined);
  assert.ok(nodeByText(client.nodes.listPanel, '•••••••••21'));
  const requestCount = client.requests.length;
  client.mediaQuery.matches = false;
  client.mediaListeners[0]({ matches: false });
  assert.equal(client.requests.length, requestCount);
  assert.ok(descendants(client.nodes.listPanel).some(node => node.tagName === 'TABLE'));
  assert.ok(nodeByText(client.nodes.listPanel, '85987654321'));
  assert.equal(descendants(client.nodes.listPanel).some(node => node.className === 'mobile-cards'), false);
});

test('detalhes móveis revelam contato apenas em dialog acessível e restauram foco', () => {
  const client = setupClient({ mobile: true });
  startClient(client);
  client.requests[0].success(validResponse());
  assert.equal(nodeByText(client.nodes.listPanel, '85987654321'), undefined);
  const trigger = nodeByText(client.nodes.listPanel, 'Ver detalhes');
  assert.ok(trigger);
  trigger.dispatch('click');
  assert.equal(client.nodes.detailDialog.open, true);
  assert.ok(nodeByText(client.nodes.detailContent, 'ALUNO TESTE'));
  assert.ok(nodeByText(client.nodes.detailContent, '85987654321'));
  assert.equal(client.document.activeElement, client.nodes.detailClose);
  client.nodes.detailClose.dispatch('click');
  assert.equal(client.nodes.detailDialog.open, false);
  assert.equal(nodeByText(client.nodes.detailContent, '85987654321'), undefined);
  assert.equal(client.document.activeElement, trigger);

  trigger.dispatch('click');
  client.nodes.detailDialog.dispatch('keydown', { key: 'Escape' });
  assert.equal(client.nodes.detailDialog.open, false);
  assert.equal(client.document.activeElement, trigger);
});

test('paginação exibe total global e controles com estados acessíveis', () => {
  const client = setupClient();
  startClient(client);
  client.requests[0].success(validResponse('vencimentos', {
    paginacao: { pagina: 2, limite: 25, totalItens: 60, totalPaginas: 3 }
  }));
  assert.ok(nodeByText(client.nodes.listPanel, '60 registros'));
  assert.ok(nodeByText(client.nodes.listPanel, 'Página 2 de 3'));
  const previous = nodeByText(client.nodes.listPanel, 'Anterior');
  const next = nodeByText(client.nodes.listPanel, 'Próxima');
  assert.equal(previous.disabled, false);
  assert.equal(next.disabled, false);
  next.dispatch('click');
  assert.equal(client.requests.at(-1).filters.paginaLista, 3);
  client.requests.at(-1).success(validResponse('vencimentos', {
    paginacao: { pagina: 3, limite: 25, totalItens: 60, totalPaginas: 3 }
  }));
  assert.equal(nodeByText(client.nodes.listPanel, 'Próxima').disabled, true);
  assert.equal(nodeByText(client.nodes.listPanel, 'Anterior').disabled, false);
});

test('carregamento renderiza skeletons de KPI, gráfico e lista', () => {
  const client = setupClient();
  startClient(client);
  for (const id of ['kpiGrid', 'chartGrid', 'listPanel']) {
    assert.ok(descendants(client.nodes[id]).some(node => node.classList.contains('skeleton')), id);
  }
});
