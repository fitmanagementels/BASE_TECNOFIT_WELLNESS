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
    this.sheet.writes.push({ row: this.row, column: this.column, values });
    return this;
  }
  setFontWeight() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  protect() { return { setDescription() { return this; }, setWarningOnly() { return this; } }; }
}

class SheetMock {
  constructor(name) {
    this.name = name;
    this.writes = [];
  }
  getMaxColumns() { return 20; }
  getLastRow() { return 0; }
  getRange(row, column, rows = 1, columns = 1) { return new RangeMock(this, row, column, rows, columns); }
  getProtections() { return []; }
  setFrozenRows() { return this; }
}

test('inicializa as três tabelas persistentes sem alterar as abas do retrato importado', () => {
  const sheets = {};
  const spreadsheet = {
    getSheetByName: name => sheets[name] || null,
    insertSheet(name) {
      sheets[name] = new SheetMock(name);
      return sheets[name];
    }
  };
  const gas = loadGas([
    'apps-script/00_Config.gs',
    'apps-script/13_DashboardConfiguracao.gs'
  ], {
    SpreadsheetApp: { ProtectionType: { RANGE: 'RANGE' }, flush() {} }
  });

  gas.garantirConfiguracoesDashboardNaPlanilha_(spreadsheet);

  assert.deepEqual(Object.keys(sheets).sort(), [
    'CONFIG_ALERTAS', 'CONFIG_DASHBOARD', 'GESTAO_PAGAMENTOS'
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(sheets.CONFIG_ALERTAS.writes[0].values[0])),
    ['tipo', 'chave', 'ativo', 'ordem', 'valor', 'titulo', 'estados']
  );
  assert.equal(sheets.CONFIG_DASHBOARD.writes[1].values.length, 3);
  assert.equal(sheets.CONFIG_ALERTAS.writes[1].values.length, 2);
});

test('incrementa uma versão persistente para invalidar apenas dados já superados', () => {
  const values = new Map([['tecnofit.dashboard.versao', '7']]);
  const gas = loadGas([
    'apps-script/00_Config.gs',
    'apps-script/13_DashboardConfiguracao.gs'
  ], {
    PropertiesService: {
      getDocumentProperties: () => ({
        getProperty: key => values.get(key) || null,
        setProperty: (key, value) => values.set(key, value)
      })
    }
  });

  assert.equal(gas.incrementarVersaoDashboard_(), 8);
  assert.equal(values.get('tecnofit.dashboard.versao'), '8');
});
