(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.XSteamStudentProfiles = api;
}(typeof window !== 'undefined' ? window : this, function () {
  function normalize(value) {
    return String(value == null ? '' : value).trim().toLocaleLowerCase('pt-BR')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function dateValue(value) {
    var text = String(value || '');
    var br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
    if (br) {
      return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 12).getTime();
    }
    var parsed = Date.parse(text);
    return isNaN(parsed) ? 0 : parsed;
  }

  function selectPrimaryContract(contracts) {
    return (contracts || []).slice().sort(function (a, b) {
      var activeA = normalize(a.statusContrato) === 'ativo' ? 1 : 0;
      var activeB = normalize(b.statusContrato) === 'ativo' ? 1 : 0;
      return activeB - activeA || dateValue(b.vencimento) - dateValue(a.vencimento);
    })[0] || null;
  }

  function buildStudentCards(input) {
    var contractsById = Object.create(null);
    var profilesById = Object.create(null);
    var labels = Object.create(null);
    (input.contratos || []).forEach(function (contract) {
      var id = String(contract.id || '');
      (contractsById[id] || (contractsById[id] = [])).push(contract);
    });
    (input.perfisAlunos || []).forEach(function (profile) {
      profilesById[String(profile.id || '')] = profile;
    });
    (input.catalogoPerfisAlunos || []).forEach(function (item) {
      labels[item.grupo + ':' + item.chave] = item.titulo;
    });
    return (input.alunos || []).map(function (student) {
      var id = String(student.id || '');
      var profile = profilesById[id] || {
        id: id,
        aluno: student.aluno,
        professorResponsavel: '',
        perfilPagamento: 'Sem histórico',
        observacaoPagamento: '',
        etiquetasPublico: [],
        etiquetasComerciais: [],
        observacoesGerais: ''
      };
      var publicTags = profile.etiquetasPublico || [];
      var commercialTags = profile.etiquetasComerciais || [];
      return {
        id: id,
        aluno: String(student.aluno || ''),
        contato: String(student.contato || ''),
        status: String(student.status || ''),
        dataFicha: String(student.dataFicha || ''),
        dataAvaliacao: String(student.dataAvaliacao || ''),
        perfil: profile,
        contratos: contractsById[id] || [],
        contratoPrincipal: selectPrimaryContract(contractsById[id] || []),
        etiquetas: publicTags.map(function (key) {
          return labels['publico:' + key] || key;
        }).concat(commercialTags.map(function (key) {
          return labels['comercial:' + key] || key;
        }))
      };
    }).sort(function (a, b) {
      return a.aluno.localeCompare(b.aluno, 'pt-BR');
    });
  }

  function filterStudentCards(cards, query) {
    var search = normalize(query);
    if (!search) return cards.slice();
    return cards.filter(function (card) {
      return normalize(card.aluno).indexOf(search) !== -1 ||
        normalize(card.id).indexOf(search) !== -1;
    });
  }

  function applyProfilePatch(bootstrap, values) {
    var list = bootstrap.perfisAlunos || (bootstrap.perfisAlunos = []);
    var id = String(values.id || '');
    var index = list.findIndex(function (item) { return String(item.id || '') === id; });
    var previous = index === -1 ? null : Object.assign({}, list[index]);
    var next = Object.assign({}, previous || {}, values);
    if (index === -1) list.push(next);
    else list[index] = next;
    return { id: id, index: index, previous: previous };
  }

  function rollbackProfilePatch(bootstrap, rollback) {
    var list = bootstrap.perfisAlunos || (bootstrap.perfisAlunos = []);
    var index = list.findIndex(function (item) {
      return String(item.id || '') === rollback.id;
    });
    if (rollback.previous) {
      if (index === -1) list.splice(Math.max(0, rollback.index), 0, rollback.previous);
      else list[index] = rollback.previous;
    } else if (index !== -1) {
      list.splice(index, 1);
    }
  }

  return {
    normalize: normalize,
    selectPrimaryContract: selectPrimaryContract,
    buildStudentCards: buildStudentCards,
    filterStudentCards: filterStudentCards,
    applyProfilePatch: applyProfilePatch,
    rollbackProfilePatch: rollbackProfilePatch
  };
}));
