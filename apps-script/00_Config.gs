var CONFIG = Object.freeze({
  planilhaId: '1I63DuNBk1mR-U5gNe9EvGhSu-QryqXxfVrG0RC0vtfM',
  pastaEntradaId: '1-kQzPkz4aGkby2fgOG7tOmWUPVjZ7A0R',
  pastaProcessadosId: '1t8GJKi_VDI8kSEzxv1Q0wxk1evzOPSUr',
  pastaRejeitadosId: '1ttdgt5lvXwEacgkDYurhuMoZ09yPENNb',
  fusoHorario: 'America/Fortaleza',
  tiposObrigatorios: Object.freeze(['vencimentos', 'fichas', 'avaliacao_fisica']),
  abas: Object.freeze({
    alunos: 'BASE_ALUNOS',
    contratos: 'CONTRATOS',
    visaoMestre: 'VISAO_MESTRE',
    importacoes: 'IMPORTACOES'
  }),
  cabecalhos: Object.freeze({
    alunos: Object.freeze([
      'id', 'aluno', 'contato', 'status', 'inicio_plano', 'data_ficha',
      'data_avaliacao', 'importacao_id'
    ]),
    contratos: Object.freeze([
      '_chave_contrato', 'id', 'contrato_completo', 'contrato_x_sem', 'valor',
      'inicio_corrente', 'vencimento', 'status_contrato', 'polo', 'modalidade',
      'importacao_id'
    ]),
    visaoMestre: Object.freeze([
      'id', 'aluno', 'contato', 'status', 'contrato_x_sem', 'valor',
      'inicio_plano', 'inicio_corrente', 'vencimento', 'polo', 'data_ficha',
      'data_avaliacao', '_chave_contrato'
    ]),
    importacoes: Object.freeze([
      'execucao_id', 'data_hora_inicio', 'data_hora_fim', 'tipo_arquivo',
      'nome_arquivo', 'drive_file_id', 'data_referencia', 'revisao',
      'linhas_lidas', 'linhas_validas', 'linhas_rejeitadas', 'status', 'mensagem'
    ])
  })
});

var CABECALHOS_ORIGEM = Object.freeze({
  vencimentos: Object.freeze([
    'codigo', 'cliente', 'status cliente', 'contrato', 'valor', 'inicio',
    'vencimento', 'status contrato', 'modalidade'
  ]),
  fichas: Object.freeze(['codigo', 'data inicio', 'contato']),
  avaliacao_fisica: Object.freeze(['codigo', 'data da avaliacao'])
});
