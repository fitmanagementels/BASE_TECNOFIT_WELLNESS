const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const profiles = require('../pwa/js/student-profiles.js');

test('gera WhatsApp somente para telefones brasileiros válidos sem duplicar o DDI', () => {
  assert.equal(
    profiles.whatsappUrl('(85) 98840-0309'),
    'https://wa.me/5585988400309'
  );
  assert.equal(
    profiles.whatsappUrl('+55 (85) 98840-0309'),
    'https://wa.me/5585988400309'
  );
  assert.equal(profiles.whatsappUrl('9884-0309'), '');
  assert.equal(profiles.whatsappUrl(''), '');
});

test('contato do perfil oferece ação acessível e segura de WhatsApp', () => {
  const client = fs.readFileSync('pwa/js/student-profiles.js', 'utf8');
  assert.match(client, /function contactInfoItem\(doc, card\)/);
  assert.match(client, /target\s*=\s*'_blank'/);
  assert.match(client, /rel\s*=\s*'noopener noreferrer'/);
  assert.match(client, /Abrir WhatsApp com/);
  assert.match(client, /student-profile-contact-value/);
});

test('seleciona contrato ativo mais recente e filtra por nome ou ID', () => {
  const cards = profiles.buildStudentCards({
    alunos: [{
      id: '42', aluno: 'MARIA SAÚDE', contato: '85999999999', status: 'Ativo',
      dataFicha: '10/08/2026', dataAvaliacao: '11/08/2026'
    }],
    contratos: [
      { id: '42', statusContrato: 'Cancelado', vencimento: '20/09/2026', frequencia: '1X' },
      { id: '42', statusContrato: 'Ativo', vencimento: '10/09/2026', frequencia: '3X' },
      { id: '42', statusContrato: 'Ativo', vencimento: '30/09/2026', frequencia: '2X' }
    ],
    perfisAlunos: [{
      id: '42', professorResponsavel: 'Elohim', perfilPagamento: 'Bom pagador',
      etiquetasPublico: ['saude'], etiquetasComerciais: []
    }],
    catalogoPerfisAlunos: [
      { tipo: 'etiqueta', grupo: 'publico', chave: 'saude', titulo: 'Saúde', ativo: true, ordem: 10 }
    ]
  });

  assert.equal(cards[0].contratoPrincipal.frequencia, '2X');
  assert.equal(cards[0].etiquetas[0], 'Saúde');
  assert.equal(profiles.filterStudentCards(cards, '42')[0].aluno, 'MARIA SAÚDE');
  assert.equal(profiles.filterStudentCards(cards, 'maria saude').length, 1);
});

test('aplica e reverte criação e atualização otimistas', () => {
  const bootstrap = {
    perfisAlunos: [{ id: '42', professorResponsavel: 'Cadu', etiquetasPublico: [] }]
  };
  const updateRollback = profiles.applyProfilePatch(bootstrap, {
    id: '42', professorResponsavel: 'Elohim', etiquetasPublico: ['saude']
  });
  assert.equal(bootstrap.perfisAlunos[0].professorResponsavel, 'Elohim');
  profiles.rollbackProfilePatch(bootstrap, updateRollback);
  assert.equal(bootstrap.perfisAlunos[0].professorResponsavel, 'Cadu');

  const createRollback = profiles.applyProfilePatch(bootstrap, {
    id: '43', professorResponsavel: 'Wallyson'
  });
  assert.equal(bootstrap.perfisAlunos.length, 2);
  profiles.rollbackProfilePatch(bootstrap, createRollback);
  assert.equal(bootstrap.perfisAlunos.length, 1);
});

test('monta opções por status, preserva professor histórico e cria patch completo', () => {
  const catalog = [
    { tipo: 'professor', grupo: 'matriculados', chave: 'aquiles', titulo: 'Aquiles', ativo: true, ordem: 10 },
    { tipo: 'professor', grupo: 'cancelados', chave: 'wallyson', titulo: 'Wallyson', ativo: true, ordem: 10 },
    { tipo: 'perfil_pagamento', grupo: 'global', chave: 'bom_pagador', titulo: 'Bom pagador', ativo: true, ordem: 10 },
    { tipo: 'etiqueta', grupo: 'publico', chave: 'idoso', titulo: 'Idoso', ativo: true, ordem: 10 },
    { tipo: 'etiqueta', grupo: 'comercial', chave: 'risco_de_churn', titulo: 'Risco de Churn', ativo: true, ordem: 10 }
  ];
  const card = {
    id: '43', aluno: 'ALUNO CANCELADO', status: 'Cancelado',
    perfil: { professorResponsavel: 'Professor antigo' }
  };

  const options = profiles.profileFormOptions(card, catalog);
  assert.deepEqual(options.professores.map(item => item.titulo), ['Wallyson', 'Professor antigo (histórico)']);
  assert.equal(options.pagamentos[0].titulo, 'Bom pagador');

  assert.deepEqual(profiles.createProfilePatch(card, {
    professorResponsavel: 'Wallyson', perfilPagamento: 'Bom pagador',
    observacaoPagamento: 'Paga em dia', etiquetasPublico: ['idoso'],
    etiquetasComerciais: ['risco_de_churn'], observacoesGerais: 'Treina cedo'
  }), {
    tipo: 'perfilAluno',
    valores: {
      id: '43', aluno: 'ALUNO CANCELADO', professorResponsavel: 'Wallyson',
      perfilPagamento: 'Bom pagador', observacaoPagamento: 'Paga em dia',
      etiquetasPublico: ['idoso'], etiquetasComerciais: ['risco_de_churn'],
      observacoesGerais: 'Treina cedo'
    }
  });
});
