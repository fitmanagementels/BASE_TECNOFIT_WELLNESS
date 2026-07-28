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
  const page = fs.readFileSync('apps-script/Dashboard.html', 'utf8');
  const logo = fs.readFileSync('apps-script/XsteamLogo.html', 'utf8');
  const logoUses = html.match(/href="#xsteam-logo-symbol"/g) || [];
  assert.equal(logoUses.length, 3);
  assert.match(page, /incluirArquivo_\('XsteamLogo'\)/);
  assert.match(logo, /<symbol id="xsteam-logo-symbol"/);
  assert.match(html, /class="brand-logo brand-logo-splash"/);
  assert.match(html, /class="brand-logo brand-logo-sidebar"/);
  assert.match(html, /class="brand-logo brand-logo-mobile"/);
});

test('tema traz branding escuro, dock móvel e leitura confortável', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /--lime:\s*#dfff22/i);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /\.mobile-dock/);
  assert.match(css, /\.body-copy\s*\{[^}]*font-size:\s*14px/s);
  assert.match(css, /\.detail-dialog/);
});

test('tema premium define superfícies, foco e adaptação de movimento', () => {
  const css = fs.readFileSync('apps-script/DashboardStyles.html', 'utf8');
  assert.match(css, /--radius-card:\s*16px/);
  assert.match(css, /--shadow-card:/);
  assert.match(css, /background:\s*radial-gradient/);
  assert.match(css, /\.nav-button:focus-visible/);
  assert.match(css, /\.kpi:hover/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.mobile-dock[^}]*border-radius:/s);
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
  assert.doesNotMatch(client, /\.x-mark/);
  assert.doesNotMatch(client, /innerHTML\s*=/);
});

test('cliente oferece filtro Matriculados e normaliza os três status elegíveis', () => {
  const client = fs.readFileSync('apps-script/DashboardClient.html', 'utf8');
  assert.match(client, /__matriculados__/);
  assert.match(client, /function isEnrolledStatus\(status\)/);
  assert.match(client, /ativo.*bloqueado.*licenca/s);
});
