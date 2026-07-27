function contarPorDashboard_(linhas, campo) {
  return (linhas || []).reduce(function (acc, linha) {
    var chave = String(linha[campo] || 'Não informado');
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, Object.create(null));
}

function opcoesDashboard_(linhas, campo) {
  return Array.from(new Set((linhas || []).map(function (linha) {
    return String(linha[campo] || '').trim();
  }).filter(Boolean))).sort(function (a, b) {
    return a.localeCompare(b, 'pt-BR');
  });
}

function filtrarBaseDashboard_(alunos, contratos, filtros, hoje, pagina) {
  filtros = filtros || {};
  hoje = hoje || new Date();
  var busca = String(filtros.busca || '').toLocaleLowerCase('pt-BR');
  var alunosFiltrados = (alunos || []).filter(function (aluno) {
    var correspondeBusca = !busca || String(aluno.aluno || '').toLocaleLowerCase('pt-BR').indexOf(busca) !== -1 ||
      String(aluno.id || '').toLocaleLowerCase('pt-BR').indexOf(busca) !== -1;
    var correspondeSituacao = true;
    if (filtros.situacao && (pagina === 'fichas' || pagina === 'avaliacoes')) {
      var campo = pagina === 'fichas' ? 'data_ficha' : 'data_avaliacao';
      var limite = pagina === 'fichas' ? CONFIG.dashboard.diasFicha : CONFIG.dashboard.diasAvaliacao;
      correspondeSituacao = classificarAtualizacao_(aluno[campo], hoje, limite) === filtros.situacao;
    }
    return correspondeBusca && correspondeSituacao &&
      (!filtros.statusAluno || String(aluno.status || '') === filtros.statusAluno);
  });
  var idsPermitidos = alunosFiltrados.reduce(function (acc, aluno) {
    acc[String(aluno.id)] = true;
    return acc;
  }, Object.create(null));
  var contratosFiltrados = (contratos || []).filter(function (contrato) {
    var dias = diasEntreDashboard_(hoje, contrato.vencimento);
    var correspondePeriodo = !filtros.periodoDias ||
      (dias != null && dias >= 0 && dias <= Number(filtros.periodoDias));
    var correspondeSituacao = !filtros.situacao || pagina === 'fichas' || pagina === 'avaliacoes';
    if (filtros.situacao && pagina === 'vencimentos') {
      correspondeSituacao = classificarVencimento_(contrato.vencimento, hoje) === filtros.situacao;
    }
    return idsPermitidos[String(contrato.id)] &&
      correspondePeriodo && correspondeSituacao &&
      (!filtros.polo || String(contrato.polo || '') === filtros.polo) &&
      (!filtros.frequencia || String(contrato.contrato_x_sem || '') === filtros.frequencia) &&
      (!filtros.modalidade || String(contrato.modalidade || '') === filtros.modalidade) &&
      (!filtros.statusContrato || String(contrato.status_contrato || '') === filtros.statusContrato);
  });
  if (filtros.polo || filtros.periodoDias || filtros.frequencia || filtros.modalidade ||
      filtros.statusContrato || (filtros.situacao && pagina !== 'fichas' && pagina !== 'avaliacoes')) {
    var idsComContrato = contratosFiltrados.reduce(function (acc, contrato) {
      acc[String(contrato.id)] = true;
      return acc;
    }, Object.create(null));
    alunosFiltrados = alunosFiltrados.filter(function (aluno) {
      return idsComContrato[String(aluno.id)];
    });
  }
  return { alunos: alunosFiltrados, contratos: contratosFiltrados };
}

function mapaAlunosDashboard_(alunos) {
  return unicosPor_(alunos, 'id').reduce(function (acc, aluno) {
    acc[String(aluno.id)] = aluno;
    return acc;
  }, Object.create(null));
}

function polosPorAlunoDashboard_(contratos) {
  return (contratos || []).reduce(function (acc, contrato) {
    var id = String(contrato.id || '');
    var polo = String(contrato.polo || 'Não informado');
    if (!acc[id]) acc[id] = [];
    if (acc[id].indexOf(polo) === -1) acc[id].push(polo);
    return acc;
  }, Object.create(null));
}

function vencimentosPorSemanaDashboard_(linhas, hoje) {
  var semanas = [0, 1, 2, 3, 4, 5].map(function (indice) {
    var inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + indice * 7, 12);
    var fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 12);
    return { chave: String(indice), label: formatarDataDashboard_(inicio) + '–' + formatarDataDashboard_(fim), valor: 0 };
  });
  linhas.forEach(function (linha) {
    if (linha.diasParaVencer == null || linha.diasParaVencer < 0) return;
    var indice = Math.floor(linha.diasParaVencer / 7);
    if (semanas[indice]) semanas[indice].valor += 1;
  });
  return semanas;
}

function faixasAtualizacaoDashboard_(lista) {
  return lista.reduce(function (acc, linha) {
    var dias = linha.diasSemAtualizacao;
    var faixa = linha.situacao === 'ausente' ? 'Sem data'
      : dias <= 30 ? '0–30 dias'
      : dias <= 60 ? '31–60 dias'
      : dias <= 90 ? '61–90 dias' : 'Mais de 90 dias';
    acc[faixa] = (acc[faixa] || 0) + 1;
    return acc;
  }, Object.create(null));
}

function coberturaPorPoloDashboard_(lista) {
  var grupos = Object.create(null);
  lista.forEach(function (linha) {
    (linha.polos || ['Não informado']).forEach(function (polo) {
      if (!grupos[polo]) grupos[polo] = { total: 0, cobertos: 0 };
      grupos[polo].total += 1;
      if (linha.situacao !== 'ausente') grupos[polo].cobertos += 1;
    });
  });
  return Object.keys(grupos).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }).map(function (polo) {
    return { polo: polo, cobertura: Math.round((grupos[polo].cobertos / grupos[polo].total) * 1000) / 10 };
  });
}

function somarPorDashboard_(linhas, grupo, valor) {
  return (linhas || []).reduce(function (acc, linha) {
    var chave = String(linha[grupo] || 'Não informado');
    acc[chave] = (acc[chave] || 0) + (Number(linha[valor]) || 0);
    return acc;
  }, Object.create(null));
}

function linhaContratoDashboard_(contrato, aluno, hoje) {
  return {
    chave: contrato._chave_contrato,
    id: String(contrato.id || ''),
    aluno: aluno ? aluno.aluno : '',
    contato: aluno ? aluno.contato : '',
    statusAluno: aluno ? aluno.status : '',
    frequencia: contrato.contrato_x_sem || '',
    modalidade: contrato.modalidade || '',
    polo: contrato.polo || 'Não informado',
    inicioCorrente: formatarDataDashboard_(contrato.inicio_corrente),
    vencimento: formatarDataDashboard_(contrato.vencimento),
    diasParaVencer: diasEntreDashboard_(hoje, contrato.vencimento),
    situacao: classificarVencimento_(contrato.vencimento, hoje),
    statusContrato: contrato.status_contrato || '',
    valor: Number(contrato.valor) || 0
  };
}

function montarPaginaVencimentos_(alunos, contratos, hoje) {
  var unicos = unicosPor_(contratos, '_chave_contrato');
  var mapa = mapaAlunosDashboard_(alunos);
  var lista = unicos.map(function (contrato) {
    return linhaContratoDashboard_(contrato, mapa[String(contrato.id)], hoje);
  }).sort(function (a, b) {
    var da = a.diasParaVencer == null ? 999999 : a.diasParaVencer;
    var db = b.diasParaVencer == null ? 999999 : b.diasParaVencer;
    return da - db || String(a.chave || '').localeCompare(String(b.chave || ''), 'pt-BR');
  });
  var kpis = { vencidos: 0, ate7: 0, ate30: 0, valorAte30: 0 };
  lista.forEach(function (linha) {
    if (linha.situacao === 'vencido') kpis.vencidos += 1;
    if (linha.situacao === 'ate7') kpis.ate7 += 1;
    if (linha.diasParaVencer != null && linha.diasParaVencer >= 0 && linha.diasParaVencer <= 30) {
      kpis.ate30 += 1;
      kpis.valorAte30 += linha.valor;
    }
  });
  return {
    kpis: kpis,
    graficos: {
      situacao: contarPorDashboard_(lista, 'situacao'),
      semanas: vencimentosPorSemanaDashboard_(lista, hoje),
      porPolo: contarPorDashboard_(lista, 'polo')
    },
    lista: lista,
    filtros: {}
  };
}

function montarPaginaAtualizacao_(alunos, contratos, hoje, campo, limiteDias) {
  var polos = polosPorAlunoDashboard_(contratos);
  var lista = unicosPor_(alunos, 'id').map(function (aluno) {
    var situacao = classificarAtualizacao_(aluno[campo], hoje, limiteDias);
    return {
      id: String(aluno.id || ''), aluno: aluno.aluno || '', contato: aluno.contato || '',
      polos: polos[String(aluno.id)] || ['Não informado'], situacao: situacao,
      data: formatarDataDashboard_(aluno[campo]), diasSemAtualizacao: diasEntreDashboard_(aluno[campo], hoje)
    };
  }).sort(function (a, b) {
    var peso = { ausente: 0, desatualizada: 1, atualizada: 2 };
    return peso[a.situacao] - peso[b.situacao] ||
      (b.diasSemAtualizacao || 0) - (a.diasSemAtualizacao || 0) ||
      String(a.id || '').localeCompare(String(b.id || ''), 'pt-BR');
  });
  var contagem = contarPorDashboard_(lista, 'situacao');
  var total = lista.length;
  return {
    kpis: {
      atualizadas: contagem.atualizada || 0,
      desatualizadas: contagem.desatualizada || 0,
      ausentes: contagem.ausente || 0,
      cobertura: total ? Math.round(((total - (contagem.ausente || 0)) / total) * 1000) / 10 : 0
    },
    graficos: {
      situacao: contagem,
      faixas: faixasAtualizacaoDashboard_(lista),
      coberturaPorPolo: coberturaPorPoloDashboard_(lista)
    },
    lista: lista,
    filtros: {}
  };
}

function montarPaginaFichas_(alunos, contratos, hoje) {
  return montarPaginaAtualizacao_(alunos, contratos, hoje, 'data_ficha', CONFIG.dashboard.diasFicha);
}

function montarPaginaAvaliacoes_(alunos, contratos, hoje) {
  return montarPaginaAtualizacao_(alunos, contratos, hoje, 'data_avaliacao', CONFIG.dashboard.diasAvaliacao);
}

function montarPaginaPlanos_(alunos, contratos, hoje) {
  var unicos = unicosPor_(contratos, '_chave_contrato');
  var mapa = mapaAlunosDashboard_(alunos);
  var valor = unicos.reduce(function (soma, contrato) { return soma + (Number(contrato.valor) || 0); }, 0);
  var lista = unicos.map(function (contrato) {
    var aluno = mapa[String(contrato.id)];
    return {
      chaveOrdenacao: String(contrato._chave_contrato || ''),
      linha: {
        aluno: aluno ? aluno.aluno : '',
        statusAluno: aluno ? aluno.status : '',
        frequencia: contrato.contrato_x_sem || '',
        modalidade: contrato.modalidade || '',
        polo: contrato.polo || 'Não informado',
        inicioCorrente: formatarDataDashboard_(contrato.inicio_corrente),
        vencimento: formatarDataDashboard_(contrato.vencimento),
        statusContrato: contrato.status_contrato || '',
        valor: Number(contrato.valor) || 0
      }
    };
  }).sort(function (a, b) {
    var da = paraDataDashboard_(a.linha.vencimento);
    var db = paraDataDashboard_(b.linha.vencimento);
    var diferenca = (da ? da.getTime() : Infinity) - (db ? db.getTime() : Infinity);
    return diferenca || a.chaveOrdenacao.localeCompare(b.chaveOrdenacao, 'pt-BR');
  }).map(function (item) {
    return item.linha;
  });
  return {
    kpis: { alunos: unicosPor_(alunos, 'id').length, contratos: unicos.length, valor: valor, ticketMedio: unicos.length ? valor / unicos.length : 0 },
    graficos: {
      polos: contarPorDashboard_(unicos, 'polo'), frequencias: contarPorDashboard_(unicos, 'contrato_x_sem'),
      modalidades: contarPorDashboard_(unicos, 'modalidade'), status: contarPorDashboard_(unicos, 'status_contrato'),
      valorPorPolo: somarPorDashboard_(unicos, 'polo', 'valor')
    },
    lista: lista, filtros: {}
  };
}

function paginarPaginaDashboard_(dados, pagina, limite) {
  var totalItens = dados.lista.length;
  var totalPaginas = totalItens ? Math.ceil(totalItens / limite) : 0;
  pagina = totalPaginas ? Math.min(pagina, totalPaginas) : 1;
  var inicio = (pagina - 1) * limite;
  return {
    kpis: dados.kpis,
    graficos: dados.graficos,
    lista: dados.lista.slice(inicio, inicio + limite),
    filtros: dados.filtros,
    paginacao: { pagina: pagina, limite: limite, totalItens: totalItens, totalPaginas: totalPaginas }
  };
}
