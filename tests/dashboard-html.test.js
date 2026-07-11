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
  for (const id of ['navDesktop', 'navMobile', 'pageTitle', 'filters', 'kpiGrid', 'chartGrid', 'listPanel']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /<section\s+id="appState"[^>]*aria-live="polite"/);
  const dots = html.match(/●/g) || [];
  const hiddenDots = html.match(/<span aria-hidden="true">●<\/span>/g) || [];
  assert.equal(hiddenDots.length, dots.length, 'pontos decorativos devem ficar ocultos da árvore acessível');
  assert.match(html, /class="header-status"[^>]*>\s*<span aria-hidden="true">●<\/span>\s*Dados disponíveis/);
  assert.doesNotMatch(html, /class="nav-meta"[^>]*>[^<]*●/);
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
  const dados = { lista: [{ aluno: 'Teste' }], kpis: {}, graficos: {}, filtros: {} };
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

  dispatch(type) {
    (this.listeners[type] || []).forEach(listener => listener({ target: this }));
  }
}

function descendants(node) {
  return node.children.flatMap(child => [child, ...descendants(child)]);
}

function nodeByText(node, text) {
  return [node, ...descendants(node)].find(child => child.textContent === text);
}

function validResponse(page = 'vencimentos', overrides = {}) {
  const filtros = { polos: ['POLO A', 'POLO B'], statusAlunos: ['Ativo', 'Inativo'] };
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
    }
  };
  const dados = { ...(fixtures[page] || fixtures.vencimentos), ...overrides };
  return { ok: true, pagina: page, atualizadoEm: '', avisoImportacao: '', dados };
}

function setupClient(options = {}) {
  const ids = ['filters', 'kpiGrid', 'chartGrid', 'listPanel', 'appState', 'mainContent', 'pageTitle'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id === 'pageTitle' ? 'h1' : 'section')]));
  const pages = ['vencimentos', 'fichas', 'avaliacoes', 'planos'];
  const buttons = pages.flatMap(page => [0, 1].map(() => {
    const button = new FakeNode('button');
    button.dataset.page = page;
    return button;
  }));
  const documentListeners = {};
  const document = {
    createElement: tag => new FakeNode(tag),
    getElementById: id => nodes[id],
    querySelectorAll: selector => selector === '[data-page]' ? buttons : [],
    addEventListener(type, listener) {
      (documentListeners[type] ||= []).push(listener);
    }
  };
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
  const context = {
    document,
    window: { matchMedia: () => ({ matches: false }) },
    Intl,
    console,
    google: { script: { run: runner } }
  };
  if (!options.chartMissing) context.Chart = FakeChart;
  vm.runInNewContext(source, context);
  return { context, nodes, buttons, documentListeners, requests, charts };
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
  assert.equal(client.nodes.kpiGrid.children.length, 0);
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
  assert.equal(client.charts.length, 2);
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
