import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from './documentParser';

test('parseDocument parses h1, hanging paragraphs, and footnotes correctly', () => {
  const doc = `# IFRS 8 מגזרי פעילות
**IG1** סעיף ראשון בהנחיות היישום.
המשך הסעיף הראשון באותה פסקה.

**IG2** סעיף שני בהנחיות.

(א) הערת שוליים לטבלה.`;

  const blocks = parseDocument(doc);
  assert.equal(blocks.length, 4);

  assert.equal(blocks[0].type, 'h1');
  if (blocks[0].type === 'h1') {
    assert.equal(blocks[0].text, 'IFRS 8 מגזרי פעילות');
  }

  assert.equal(blocks[1].type, 'hanging_paragraph');
  if (blocks[1].type === 'hanging_paragraph') {
    assert.equal(blocks[1].code, 'IG1');
    assert.ok(blocks[1].body.includes('סעיף ראשון'));
    assert.ok(blocks[1].body.includes('המשך הסעיף הראשון'));
  }

  assert.equal(blocks[2].type, 'hanging_paragraph');
  if (blocks[2].type === 'hanging_paragraph') {
    assert.equal(blocks[2].code, 'IG2');
  }

  assert.equal(blocks[3].type, 'footnote');
  if (blocks[3].type === 'footnote') {
    assert.equal(blocks[3].marker, '(א)');
    assert.ok(blocks[3].text.includes('הערת שוליים לטבלה'));
  }
});
