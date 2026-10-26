import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from './documentParser';

test('parseDocument parses h1, hanging paragraphs with subparagraphs, and table footnotes correctly', () => {
  const doc = `# IFRS 11 הסדרים משותפים
**IE4** ההסדר החוזי בין א' ל-ב' קובע בנוסף כי:
(א) הזכויות לכל הנכסים הדרושים לביצוע פעילויות ההסדר משותפות.
(ב) לצדדים יש אחריות יחד ולחוד.

| סעיף | סכום |
| :--- | :---: |
| פעילות | 100 |

(א) הערת שוליים לטבלה.`;

  const blocks = parseDocument(doc);
  assert.equal(blocks.length, 4);

  assert.equal(blocks[0].type, 'h1');
  if (blocks[0].type === 'h1') {
    assert.ok(blocks[0].text.includes('IFRS 11'));
  }

  assert.equal(blocks[1].type, 'hanging_paragraph');
  if (blocks[1].type === 'hanging_paragraph') {
    assert.equal(blocks[1].code, 'IE4');
    assert.ok(blocks[1].body.includes('ההסדר החוזי'));
    assert.ok(blocks[1].subparagraphs && blocks[1].subparagraphs.length === 2);
    assert.equal(blocks[1].subparagraphs?.[0].marker, '(א)');
    assert.equal(blocks[1].subparagraphs?.[1].marker, '(ב)');
  }

  assert.equal(blocks[2].type, 'table');

  assert.equal(blocks[3].type, 'footnote');
  if (blocks[3].type === 'footnote') {
    assert.equal(blocks[3].marker, '(א)');
    assert.ok(blocks[3].text.includes('הערת שוליים לטבלה'));
  }
});

test('parseDocument parses Table of Contents into structured TOC block', () => {
  const doc = `תוכן עניינים 1 שירותי בנייה 2 מרכז מסחרי 3 ייצור מוצר`;
  const blocks = parseDocument(doc);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'toc');
  if (blocks[0].type === 'toc') {
    assert.equal(blocks[0].items.length, 3);
    assert.equal(blocks[0].items[0].number, '1');
    assert.equal(blocks[0].items[0].title, 'שירותי בנייה');
    assert.equal(blocks[0].items[1].number, '2');
    assert.equal(blocks[0].items[1].title, 'מרכז מסחרי');
    assert.equal(blocks[0].items[2].number, '3');
    assert.equal(blocks[0].items[2].title, 'ייצור מוצר');
  }
});
