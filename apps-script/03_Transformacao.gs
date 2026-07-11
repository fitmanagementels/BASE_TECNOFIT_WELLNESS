function compararDatas_(a, b) {
  var tempoA = a instanceof Date ? a.getTime() : -Infinity;
  var tempoB = b instanceof Date ? b.getTime() : -Infinity;
  return tempoA - tempoB;
}

function indexarMaisRecentePorId_(linhas, campoData) {
  return linhas.reduce(function (indice, linha) {
    var id = normalizarId(linha.codigo);
    if (!id) return indice;
    var data = parseDataBr(linha[campoData]);
    if (!data) return indice;
    if (!indice[id] || compararDatas_(data, parseDataBr(indice[id][campoData])) > 0) {
      indice[id] = linha;
    }
    return indice;
  }, {});
}

function escolherCadastroMaisRecente_(atual, candidato) {
  if (!atual) return candidato;
  var inicioAtual = parseDataBr(atual.inicio);
  var inicioCandidato = parseDataBr(candidato.inicio);
  var comparacaoInicio = compararDatas_(inicioCandidato, inicioAtual);
  if (comparacaoInicio > 0) return candidato;
  if (comparacaoInicio < 0) return atual;
  var vencimentoAtual = parseDataBr(atual.vencimento);
  var vencimentoCandidato = parseDataBr(candidato.vencimento);
  return compararDatas_(vencimentoCandidato, vencimentoAtual) > 0 ? candidato : atual;
}

function construirDadosMestre(vencimentos, fichas, avaliacoes, importacaoId) {
  var fichasPorId = indexarMaisRecentePorId_(fichas, 'data inicio');
  var avaliacoesPorId = indexarMaisRecentePorId_(avaliacoes, 'data da avaliacao');
  var cadastroPorId = {};

  vencimentos.forEach(function (linha) {
    var id = normalizarId(linha.codigo);
    if (!id) throw new Error('ID vazio em vencimentos.');
    cadastroPorId[id] = escolherCadastroMaisRecente_(cadastroPorId[id], linha);
  });

  var resumoAvisos = {
    semFicha: 0,
    semAvaliacao: 0,
    contratoSemPadrao: 0
  };
  var alunosPorId = {};

  Object.keys(cadastroPorId).forEach(function (id) {
    var cadastro = cadastroPorId[id];
    var ficha = fichasPorId[id] || null;
    var avaliacao = avaliacoesPorId[id] || null;
    if (!ficha) resumoAvisos.semFicha += 1;
    if (!avaliacao) resumoAvisos.semAvaliacao += 1;
    alunosPorId[id] = [
      id,
      String(cadastro.cliente || '').trim(),
      ficha ? String(ficha.contato || '').trim() : '',
      String(cadastro['status cliente'] || '').trim(),
      '',
      ficha ? parseDataBr(ficha['data inicio']) : '',
      avaliacao ? parseDataBr(avaliacao['data da avaliacao']) : '',
      importacaoId
    ];
  });

  var chaves = {};
  var contratos = vencimentos.map(function (linha) {
    var id = normalizarId(linha.codigo);
    var contratoCompleto = String(linha.contrato || '').trim();
    var inicio = parseDataBr(linha.inicio);
    var vencimento = parseDataBr(linha.vencimento);
    var partes = separarContrato(contratoCompleto);
    if (!partes.frequencia || !partes.polo) resumoAvisos.contratoSemPadrao += 1;
    var chave = criarChaveContrato(id, contratoCompleto, inicio);
    if (chaves[chave]) throw new Error('Chave de contrato duplicada: ' + chave);
    chaves[chave] = true;
    return [
      chave,
      id,
      contratoCompleto,
      partes.frequencia,
      parseValorBr(linha.valor),
      inicio,
      vencimento,
      String(linha['status contrato'] || '').trim(),
      partes.polo,
      String(linha.modalidade || '').trim(),
      importacaoId
    ];
  });

  var alunos = Object.keys(alunosPorId)
    .sort(function (a, b) { return Number(a) - Number(b); })
    .map(function (id) { return alunosPorId[id]; });

  var visaoMestre = contratos.map(function (contrato) {
    var aluno = alunosPorId[contrato[1]];
    return [
      aluno[0], aluno[1], aluno[2], aluno[3], contrato[3], contrato[4], aluno[4],
      contrato[5], contrato[6], contrato[8], aluno[5], aluno[6], contrato[0]
    ];
  });

  var avisos = [];
  if (resumoAvisos.semFicha) avisos.push(resumoAvisos.semFicha + ' aluno(s) sem ficha');
  if (resumoAvisos.semAvaliacao) avisos.push(resumoAvisos.semAvaliacao + ' aluno(s) sem avaliação');
  if (resumoAvisos.contratoSemPadrao) {
    avisos.push(resumoAvisos.contratoSemPadrao + ' contrato(s) sem frequência/polo identificáveis');
  }

  return {
    alunos: alunos,
    contratos: contratos,
    visaoMestre: visaoMestre,
    resumoAvisos: resumoAvisos,
    avisos: avisos
  };
}
