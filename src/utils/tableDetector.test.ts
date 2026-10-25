import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAccountingNumeric,
  detectTableType,
  isCurrencyUnitRow,
  isSectionSubheaderRow,
  isSummaryTotalRow,
  parseMarkdownTable,
} from './tableDetector';

test('isAccountingNumeric correctly classifies numbers, negative parentheses and dashes', () => {
  assert.equal(isAccountingNumeric('4,200'), true);
  assert.equal(isAccountingNumeric('(4,500)'), true);
  assert.equal(isAccountingNumeric('–'), true);
  assert.equal(isAccountingNumeric('-'), true);
  assert.equal(isAccountingNumeric('15%'), true);
  assert.equal(isAccountingNumeric('מגזר רכיבים'), false);
});

test('detectTableType classifies decision vs accounting tables', () => {
  assert.equal(detectTableType(['שלב ובדיקה', 'קריטריון כמותי', 'אם כן', 'אם לא']), 'decision');
  assert.equal(detectTableType(['מידע מגזרי', 'מגזר א', 'סך הכול']), 'accounting');
});

test('isCurrencyUnitRow detects unit rows with empty first column and י"מ', () => {
  assert.equal(isCurrencyUnitRow(['', 'י"מ', 'י"מ', 'י"מ']), true);
  assert.equal(isCurrencyUnitRow(['', 'אלפי ש"ח', 'אלפי ש"ח']), true);
  assert.equal(isCurrencyUnitRow(['הכנסות', 'י"מ', 'י"מ']), false);
});

test('isSummaryTotalRow detects total rows and double border targets', () => {
  assert.equal(isSummaryTotalRow(['סך הכול הכנסות הישות', '21,350'], false), true);
  assert.equal(isSummaryTotalRow(['סה"כ נכסים', '58,200'], false), true);
  assert.equal(isSummaryTotalRow(['הכנסות הישות', '21,350'], false), true);
  assert.equal(isSummaryTotalRow(['מכירות חומרה', '13,150'], false), false);
});

test('parseMarkdownTable parses accounting table with headers and data', () => {
  const markdown = [
    '| מידע מגזרי | מגזר רכיבים | סך הכול |',
    '| :--- | :---: | :---: |',
    '| | י"מ | י"מ |',
    '| **הכנסות** | | |',
    '| מכירות | 4,200 | 4,200 |',
    '| סך הכול | 4,200 | 4,200 |',
  ];
  const table = parseMarkdownTable(markdown);
  assert.ok(table);
  assert.equal(table.headers.length, 3);
  assert.equal(table.type, 'accounting');
  assert.equal(table.rows[0].isUnitRow, true);
  assert.equal(table.rows[1].isSubheader, true);
  assert.equal(table.rows[3].isSummaryRow, true);
});
