const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('shell contém as quatro páginas e regiões acessíveis', () => {
  const html = fs.readFileSync('apps-script/DashboardComponents.html', 'utf8');
  for (const page of ['vencimentos', 'fichas', 'avaliacoes', 'planos']) {
    assert.match(html, new RegExp(`data-page="${page}"`));
  }
  for (const id of ['pageTitle', 'filters', 'kpiGrid', 'chartGrid', 'listPanel', 'appState']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /aria-live="polite"/);
});

test('estilos definem breakpoints desktop e mobile da marca', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /--lime:\s*#dfff22/i);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /\.mobile-nav/);
});
