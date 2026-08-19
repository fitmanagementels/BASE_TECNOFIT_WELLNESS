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

  function activeCatalog(catalog, type, group) {
    return (catalog || []).filter(function (item) {
      return item.ativo && item.tipo === type && item.grupo === group;
    }).sort(function (a, b) {
      return a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }

  function profileFormOptions(card, catalog) {
    var professorGroup = normalize(card.status).indexOf('cancel') !== -1
      ? 'cancelados' : 'matriculados';
    var professors = activeCatalog(catalog, 'professor', professorGroup).map(function (item) {
      return Object.assign({}, item, { valor: item.titulo });
    });
    var historical = String(card.perfil.professorResponsavel || '');
    if (historical && !professors.some(function (item) { return item.valor === historical; })) {
      professors.push({
        tipo: 'professor',
        grupo: professorGroup,
        chave: 'historico',
        titulo: historical + ' (histórico)',
        valor: historical,
        ativo: false,
        ordem: 9999
      });
    }
    return {
      professores: professors,
      pagamentos: activeCatalog(catalog, 'perfil_pagamento', 'global'),
      publico: activeCatalog(catalog, 'etiqueta', 'publico'),
      comercial: activeCatalog(catalog, 'etiqueta', 'comercial')
    };
  }

  function createProfilePatch(card, values) {
    return {
      tipo: 'perfilAluno',
      valores: {
        id: String(card.id || ''),
        aluno: String(card.aluno || ''),
        professorResponsavel: String(values.professorResponsavel || ''),
        perfilPagamento: String(values.perfilPagamento || 'Sem histórico'),
        observacaoPagamento: String(values.observacaoPagamento || ''),
        etiquetasPublico: (values.etiquetasPublico || []).slice(),
        etiquetasComerciais: (values.etiquetasComerciais || []).slice(),
        observacoesGerais: String(values.observacoesGerais || '')
      }
    };
  }

  function uiElement(doc, tag, className, text) {
    var element = doc.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = String(text);
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function displayValue(value) {
    return value == null || String(value).trim() === '' ? 'Não informado' : String(value);
  }

  function money(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function appendOption(doc, select, value, label, selected) {
    var option = uiElement(doc, 'option', '', label);
    option.value = value;
    option.selected = selected === true;
    select.appendChild(option);
  }

  function infoItem(doc, label, value) {
    var item = uiElement(doc, 'div', 'student-profile-info-item');
    item.appendChild(uiElement(doc, 'dt', '', label));
    item.appendChild(uiElement(doc, 'dd', '', displayValue(value)));
    return item;
  }

  function field(doc, labelText, control) {
    var label = uiElement(doc, 'label', 'student-profile-field');
    label.appendChild(uiElement(doc, 'span', 'student-profile-field-label', labelText));
    label.appendChild(control);
    return label;
  }

  function checkedValues(container) {
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function tagChoices(doc, title, items, selected) {
    var fieldset = uiElement(doc, 'fieldset', 'student-profile-fieldset');
    fieldset.appendChild(uiElement(doc, 'legend', 'student-profile-field-label', title));
    var choices = uiElement(doc, 'div', 'student-profile-tag-choices');
    items.forEach(function (item) {
      var label = uiElement(doc, 'label', 'student-profile-tag-choice');
      var input = uiElement(doc, 'input');
      input.type = 'checkbox';
      input.value = item.chave;
      input.checked = selected.indexOf(item.chave) !== -1;
      label.appendChild(input);
      label.appendChild(uiElement(doc, 'span', '', item.titulo));
      choices.appendChild(label);
    });
    fieldset.appendChild(choices);
    return fieldset;
  }

  function renderContractList(doc, card, panel) {
    var primary = card.contratoPrincipal;
    var ordered = primary ? [primary].concat(card.contratos.filter(function (item) {
      return item !== primary;
    })) : card.contratos.slice();
    if (ordered.length < 2) return;
    var block = uiElement(doc, 'section', 'student-profile-contracts');
    block.appendChild(uiElement(doc, 'h3', '', 'Outros contratos'));
    var list = uiElement(doc, 'div', 'student-profile-contract-list');
    ordered.slice(1).forEach(function (contract) {
      var item = uiElement(doc, 'div', 'student-profile-contract-item');
      item.appendChild(uiElement(doc, 'strong', '', displayValue(contract.contrato)));
      item.appendChild(uiElement(doc, 'span', '', [
        displayValue(contract.frequencia),
        displayValue(contract.statusContrato),
        displayValue(contract.vencimento)
      ].join(' · ')));
      list.appendChild(item);
    });
    block.appendChild(list);
    panel.appendChild(block);
  }

  function openProfileDialog(card, options) {
    var doc = options.document || document;
    var opener = doc.activeElement;
    var ids = 'student-profile-' + String(card.id || '').replace(/[^a-z0-9_-]/gi, '-');
    var dialog = uiElement(doc, 'dialog', 'student-profile-dialog');
    dialog.setAttribute('aria-labelledby', ids + '-title');

    var header = uiElement(doc, 'header', 'student-profile-dialog-header');
    var heading = uiElement(doc, 'div');
    var title = uiElement(doc, 'h2', '', card.aluno);
    title.id = ids + '-title';
    heading.appendChild(title);
    heading.appendChild(uiElement(doc, 'p', 'body-copy', 'ID ' + card.id + ' · ' + displayValue(card.status)));
    var close = uiElement(doc, 'button', 'icon-button', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fechar perfil');
    close.addEventListener('click', function () { dialog.close(); });
    header.appendChild(heading);
    header.appendChild(close);
    dialog.appendChild(header);

    var tabs = uiElement(doc, 'div', 'student-profile-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Seções do perfil');
    var infoTab = uiElement(doc, 'button', 'student-profile-tab', 'Informações');
    var configTab = uiElement(doc, 'button', 'student-profile-tab', 'Configuração');
    var infoPanel = uiElement(doc, 'section', 'student-profile-panel');
    var configPanel = uiElement(doc, 'section', 'student-profile-panel');
    infoTab.type = 'button'; configTab.type = 'button';
    infoTab.id = ids + '-info-tab'; configTab.id = ids + '-config-tab';
    infoPanel.id = ids + '-info-panel'; configPanel.id = ids + '-config-panel';
    infoTab.setAttribute('role', 'tab'); configTab.setAttribute('role', 'tab');
    infoTab.setAttribute('aria-controls', infoPanel.id); configTab.setAttribute('aria-controls', configPanel.id);
    infoPanel.setAttribute('role', 'tabpanel'); configPanel.setAttribute('role', 'tabpanel');
    infoPanel.setAttribute('aria-labelledby', infoTab.id); configPanel.setAttribute('aria-labelledby', configTab.id);

    function selectTab(showInfo, moveFocus) {
      infoTab.setAttribute('aria-selected', String(showInfo));
      configTab.setAttribute('aria-selected', String(!showInfo));
      infoTab.tabIndex = showInfo ? 0 : -1;
      configTab.tabIndex = showInfo ? -1 : 0;
      infoPanel.hidden = !showInfo;
      configPanel.hidden = showInfo;
      if (moveFocus) (showInfo ? infoTab : configTab).focus();
    }
    infoTab.addEventListener('click', function () { selectTab(true, false); });
    configTab.addEventListener('click', function () { selectTab(false, false); });
    tabs.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      selectTab(event.target === configTab, true);
    });
    tabs.appendChild(infoTab); tabs.appendChild(configTab); dialog.appendChild(tabs);

    var contract = card.contratoPrincipal || {};
    var infoGrid = uiElement(doc, 'dl', 'student-profile-info-grid');
    [
      ['Contato', card.contato],
      ['Status', card.status],
      ['Contrato', contract.contrato],
      ['Frequência', contract.frequencia],
      ['Valor', contract.valor == null ? '' : money(contract.valor)],
      ['Vencimento', contract.vencimento],
      ['Polo', contract.polo],
      ['Modalidade', contract.modalidade],
      ['Ficha / prescrição', card.dataFicha],
      ['Avaliação', card.dataAvaliacao]
    ].forEach(function (item) { infoGrid.appendChild(infoItem(doc, item[0], item[1])); });
    infoPanel.appendChild(infoGrid);
    renderContractList(doc, card, infoPanel);

    var form = uiElement(doc, 'form', 'student-profile-form');
    var formOptions = profileFormOptions(card, options.bootstrap.catalogoPerfisAlunos || []);
    var professor = uiElement(doc, 'select');
    appendOption(doc, professor, '', 'Sem responsável', !card.perfil.professorResponsavel);
    formOptions.professores.forEach(function (item) {
      appendOption(doc, professor, item.valor, item.titulo, item.valor === card.perfil.professorResponsavel);
    });
    var payment = uiElement(doc, 'select');
    formOptions.pagamentos.forEach(function (item) {
      appendOption(doc, payment, item.titulo, item.titulo, item.titulo === card.perfil.perfilPagamento);
    });
    if (!payment.value && formOptions.pagamentos.length) payment.value = formOptions.pagamentos[0].titulo;
    form.appendChild(field(doc, 'Professor responsável', professor));
    form.appendChild(field(doc, 'Perfil de pagamento', payment));

    var publicTags = tagChoices(
      doc, 'Público', formOptions.publico, card.perfil.etiquetasPublico || []
    );
    var commercialTags = tagChoices(
      doc, 'Comercial', formOptions.comercial, card.perfil.etiquetasComerciais || []
    );
    form.appendChild(publicTags);
    form.appendChild(commercialTags);

    var paymentNote = uiElement(doc, 'textarea');
    paymentNote.maxLength = 1000;
    paymentNote.rows = 3;
    paymentNote.value = card.perfil.observacaoPagamento || '';
    form.appendChild(field(doc, 'Observação de pagamento', paymentNote));
    var generalNotes = uiElement(doc, 'textarea');
    generalNotes.maxLength = 3000;
    generalNotes.rows = 5;
    generalNotes.value = card.perfil.observacoesGerais || '';
    form.appendChild(field(doc, 'Observações gerais', generalNotes));

    var agenda = uiElement(doc, 'fieldset', 'student-profile-agenda');
    agenda.disabled = true;
    agenda.appendChild(uiElement(doc, 'legend', 'student-profile-field-label', 'Agenda'));
    agenda.appendChild(uiElement(doc, 'p', 'body-copy', 'Em breve'));
    form.appendChild(agenda);

    var actions = uiElement(doc, 'div', 'student-profile-actions');
    var cancel = uiElement(doc, 'button', 'secondary', 'Cancelar');
    var save = uiElement(doc, 'button', 'primary', 'Salvar configurações');
    cancel.type = 'button'; save.type = 'submit';
    cancel.addEventListener('click', function () { dialog.close(); });
    actions.appendChild(cancel); actions.appendChild(save); form.appendChild(actions);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      save.disabled = true;
      save.textContent = 'Salvando…';
      options.onSave(createProfilePatch(card, {
        professorResponsavel: professor.value,
        perfilPagamento: payment.value,
        observacaoPagamento: paymentNote.value,
        etiquetasPublico: checkedValues(publicTags),
        etiquetasComerciais: checkedValues(commercialTags),
        observacoesGerais: generalNotes.value
      }));
      dialog.close();
    });
    configPanel.appendChild(form);
    dialog.appendChild(infoPanel); dialog.appendChild(configPanel);
    selectTab(true, false);
    dialog.addEventListener('close', function () {
      dialog.remove();
      if (opener && typeof opener.focus === 'function') opener.focus();
    });
    doc.body.appendChild(dialog);
    dialog.showModal();
  }

  function renderSection(options) {
    var doc = options.document || document;
    var all = buildStudentCards({
      alunos: options.data.alunos || [],
      contratos: options.data.contratos || [],
      perfisAlunos: options.bootstrap.perfisAlunos || [],
      catalogoPerfisAlunos: options.bootstrap.catalogoPerfisAlunos || []
    });
    var visible = 24;
    var section = uiElement(doc, 'section', 'section-card student-profiles-section');
    var heading = uiElement(doc, 'div', 'student-profiles-heading');
    var copy = uiElement(doc, 'div');
    copy.appendChild(uiElement(doc, 'span', 'eyebrow', 'GESTÃO INDIVIDUAL'));
    copy.appendChild(uiElement(doc, 'h2', '', 'Perfis dos alunos'));
    copy.appendChild(uiElement(doc, 'p', 'body-copy', 'Consulte dados e organize responsáveis, pagamentos e etiquetas.'));
    var search = uiElement(doc, 'input', 'student-profile-search');
    search.type = 'search';
    search.placeholder = 'Buscar por nome ou ID';
    search.setAttribute('aria-label', 'Buscar aluno por nome ou ID');
    heading.appendChild(copy); heading.appendChild(search); section.appendChild(heading);
    var summary = uiElement(doc, 'p', 'student-profile-summary');
    summary.setAttribute('aria-live', 'polite');
    var grid = uiElement(doc, 'div', 'student-profile-grid');
    var more = uiElement(doc, 'button', 'secondary student-profile-more', 'Mostrar mais');
    more.type = 'button';
    section.appendChild(summary); section.appendChild(grid); section.appendChild(more);

    function refresh() {
      var filtered = filterStudentCards(all, search.value);
      clearElement(grid);
      filtered.slice(0, visible).forEach(function (card) {
        var button = uiElement(doc, 'button', 'student-profile-card');
        button.type = 'button';
        button.setAttribute('aria-label', 'Abrir perfil de ' + card.aluno);
        var cardHead = uiElement(doc, 'span', 'student-profile-card-head');
        var identity = uiElement(doc, 'span');
        identity.appendChild(uiElement(doc, 'strong', 'student-profile-name', card.aluno));
        identity.appendChild(uiElement(doc, 'small', 'student-profile-id', 'ID ' + card.id));
        cardHead.appendChild(identity);
        cardHead.appendChild(uiElement(doc, 'span', 'chip', card.status || 'Sem status'));
        button.appendChild(cardHead);
        button.appendChild(uiElement(
          doc, 'span', 'student-profile-frequency',
          card.contratoPrincipal ? card.contratoPrincipal.frequencia || 'Sem frequência' : 'Sem contrato'
        ));
        button.appendChild(uiElement(
          doc, 'span', 'student-profile-professor',
          card.perfil.professorResponsavel || 'Sem responsável'
        ));
        var tags = uiElement(doc, 'span', 'student-profile-tags');
        card.etiquetas.slice(0, 3).forEach(function (tag) {
          tags.appendChild(uiElement(doc, 'span', 'student-profile-tag', tag));
        });
        if (card.etiquetas.length > 3) {
          tags.appendChild(uiElement(doc, 'span', 'student-profile-tag', '+' + (card.etiquetas.length - 3)));
        }
        button.appendChild(tags);
        button.addEventListener('click', function () { openProfileDialog(card, options); });
        grid.appendChild(button);
      });
      summary.textContent = filtered.length + ' aluno(s) no recorte';
      more.hidden = visible >= filtered.length;
      if (!filtered.length) {
        grid.appendChild(uiElement(doc, 'p', 'body-copy student-profile-empty', 'Nenhum aluno neste recorte.'));
      }
    }

    search.addEventListener('input', function () { visible = 24; refresh(); });
    more.addEventListener('click', function () { visible += 24; refresh(); });
    refresh();
    return section;
  }

  return {
    normalize: normalize,
    selectPrimaryContract: selectPrimaryContract,
    buildStudentCards: buildStudentCards,
    filterStudentCards: filterStudentCards,
    applyProfilePatch: applyProfilePatch,
    rollbackProfilePatch: rollbackProfilePatch,
    activeCatalog: activeCatalog,
    profileFormOptions: profileFormOptions,
    createProfilePatch: createProfilePatch,
    renderSection: renderSection,
    openProfileDialog: openProfileDialog
  };
}));
