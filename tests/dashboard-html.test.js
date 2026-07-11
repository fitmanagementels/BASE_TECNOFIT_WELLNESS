const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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
