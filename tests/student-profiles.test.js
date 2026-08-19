const test = require('node:test');
const assert = require('node:assert/strict');
const profiles = require('../pwa/js/student-profiles.js');

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
