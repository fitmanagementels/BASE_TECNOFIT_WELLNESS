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
