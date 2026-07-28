const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('shell contém splash, quatro áreas principais, subabas e modal acessível', () => {
  const html = fs.readFileSync('apps-script/DashboardComponents.html', 'utf8');
  assert.match(html, /id="loading-screen"/);
  for (const page of ['home', 'financeiro', 'acompanhamento', 'configuracoes']) {
    const buttons = html.match(new RegExp(`<button\\b[^>]*data-page="${page}"[^>]*>`, 'g')) || [];
    assert.equal(buttons.length, 2, `${page} deve existir no menu desktop e no dock mobile`);
  }
  for (const tab of ['planos', 'vencimentos', 'prescricoes', 'avaliacoes']) {
    assert.match(html, new RegExp(`data-subpage="${tab}"`));
  }
  assert.match(html, /<dialog[^>]+id="detailDialog"[^>]+role="dialog"/);
  assert.match(html, /id="globalStatus"/);
  assert.match(html, /id="globalPolo"/);
});

test('shell usa a logo oficial XSTEAM em todas as áreas de marca', () => {
  const html = fs.readFileSync('apps-script/DashboardComponents.html', 'utf8');
  const logoUses = html.match(/src="XsteamLogo\.svg"/g) || [];
  assert.equal(logoUses.length, 3);
  assert.match(html, /class="brand-logo brand-logo-splash"/);
  assert.match(html, /class="brand-logo brand-logo-sidebar"/);
  assert.match(html, /class="brand-logo brand-logo-mobile"/);
  assert.ok(fs.statSync('apps-script/XsteamLogo.svg').size > 200);
});

test('tema traz branding escuro, dock móvel e leitura confortável', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /--lime:\s*#dfff22/i);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /\.mobile-dock/);
  assert.match(css, /\.body-copy\s*\{[^}]*font-size:\s*14px/s);
  assert.match(css, /\.detail-dialog/);
});

test('cliente usa bootstrap local, cache persistente e fila de mutações', () => {
  const client = fs.readFileSync('apps-script/DashboardClient.html', 'utf8');
  assert.match(client, /obterBootstrapDashboard/);
  assert.match(client, /obterVersaoDashboard/);
  assert.match(client, /localStorage/);
  assert.match(client, /mutationQueue/);
  assert.match(client, /salvarMutacoesDashboard/);
  assert.match(client, /withFailureHandler/);
  assert.doesNotMatch(client, /contato/);
  assert.doesNotMatch(client, /innerHTML\s*=/);
});
