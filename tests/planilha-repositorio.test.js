const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers/load-gas');

class RangeMock {
  constructor(sheet, row, column, rows, columns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }
  setValues(values) {
    this.sheet.calls.push(['setValues', this.row, this.column, values]);
    return this;
  }
  setFontWeight() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setNumberFormat(format) {
    this.sheet.calls.push(['format', this.row, this.column, this.rows, this.columns, format]);
    return this;
  }
  createFilter() { this.sheet.calls.push(['filter']); return this; }
  protect() {
    return { setDescription() { return this; }, setWarningOnly() { return this; } };
  }
}

class SheetMock {
  constructor(name, values = [[]]) {
    this.name = name;
    this.values = values;
    this.calls = [];
  }
  getName() { return this.name; }
  getDataRange() { return { getValues: () => this.values.map(row => row.slice()) }; }
  getRange(row, column, rows = 1, columns = 1) { return new RangeMock(this, row, column, rows, columns); }
  clearContents() { this.calls.push(['clear']); return this; }
  setFrozenRows(rows) { this.calls.push(['freeze', rows]); return this; }
  getFilter() { return null; }
  hideColumns(column) { this.calls.push(['hide', column]); }
  getMaxColumns() { return 26; }
  getProtections() { return []; }
}

function createSpreadsheet() {
  const names = ['BASE_ALUNOS', 'CONTRATOS', 'VISAO_MESTRE', 'IMPORTACOES'];
  const sheets = Object.fromEntries(names.map(name => [name, new SheetMock(name, [[`old-${name}`]])]));
  return {
    sheets,
    getSheetByName: name => sheets[name] || null,
    insertSheet: name => (sheets[name] = new SheetMock(name)),
  };
}

function load(spreadsheet) {
  return loadGas(['apps-script/00_Config.gs', 'apps-script/04_PlanilhaRepositorio.gs'], {
    SpreadsheetApp: {
      openById: () => spreadsheet,
      flush: () => {},
      ProtectionType: { RANGE: 'RANGE' }
    }
  });
}

test('valida todas as larguras antes de limpar as abas', () => {
  const spreadsheet = createSpreadsheet();
  const gas = load(spreadsheet);
  assert.throws(() => gas.substituirAbasGerenciadas({
    alunos: [['curta']], contratos: [], visaoMestre: []
  }), /largura inválida/);
  assert.equal(spreadsheet.sheets.BASE_ALUNOS.calls.some(call => call[0] === 'clear'), false);
});

test('substitui as três abas e oculta a chave técnica', () => {
  const spreadsheet = createSpreadsheet();
  const gas = load(spreadsheet);
  gas.substituirAbasGerenciadas({
    alunos: [['1', 'A', '', 'Ativo', '', '', '', 'exec']],
    contratos: [['key', '1', '2X - P - PERSONAL', '2X', 10, '', '', 'Ativo', 'P', 'MUSCULAÇÃO', 'exec']],
    visaoMestre: [['1', 'A', '', 'Ativo', '2X', 10, '', '', '', 'P', '', '', 'key']]
  });
  assert.equal(spreadsheet.sheets.BASE_ALUNOS.calls.some(call => call[0] === 'clear'), true);
  assert.deepEqual(spreadsheet.sheets.VISAO_MESTRE.calls.find(call => call[0] === 'hide'), ['hide', 13]);
});

test('backup e restauração preservam os valores anteriores', () => {
  const spreadsheet = createSpreadsheet();
  const gas = load(spreadsheet);
  const backup = gas.criarBackupAbasGerenciadas();
  gas.restaurarBackupAbasGerenciadas(backup);
  const restoreCall = spreadsheet.sheets.CONTRATOS.calls.find(call => call[0] === 'setValues');
  assert.equal(restoreCall[3][0][0], 'old-CONTRATOS');
});
