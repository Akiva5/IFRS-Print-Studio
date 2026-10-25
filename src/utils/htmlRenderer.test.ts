import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from './documentParser';
import { renderDocumentToHtml } from './htmlRenderer';
import { DocumentSettings } from '../types';

const testSettings: DocumentSettings = {
  runningHeaderRight: 'IFRS 8 - דוגמאות להמחשה',
  runningHeaderLeft: 'תקינה חשבונאית בינלאומית (IFRS)',
  runningFooterRight: 'המוסד הישראלי לתקינה',
  runningFooterLeft: 'IFRS',
  showPageNumbers: true,
  hangingIndent: true,
  fontSizePt: 11.5,
  lineHeight: 1.48,
  marginMm: 18,
  showPageGuides: true,
  paperSize: 'A4',
};

test('renderDocumentToHtml renders running header, h1 title, hanging grid and accounting tables', () => {
  const doc = `# דוגמאות להמחשה
**IG1** סעיף ראשון.

| סעיף | סכום |
| :--- | :---: |
| סך הכול | 100 |

(א) הערה.`;

  const blocks = parseDocument(doc);
  const html = renderDocumentToHtml(blocks, testSettings);

  assert.ok(html.includes('class="running-header"'));
  assert.ok(html.includes('class="standard-title"'));
  assert.ok(html.includes('class="hanging-grid"'));
  assert.ok(html.includes('class="hanging-code"'));
  assert.ok(html.includes('class="summary-row"'));
  assert.ok(html.includes('class="table-footnote"'));
  assert.ok(html.includes('class="running-footer"'));
  assert.ok(html.includes('עמוד 1 מתוך 1'));
});
