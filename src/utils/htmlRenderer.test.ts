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

test('renderDocumentToHtml renders running header, h1 title, ifrs-para positioning and accounting tables', () => {
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
  assert.ok(html.includes('ifrs-para'));
  assert.ok(html.includes('para-num'));
  assert.ok(html.includes('class="summary-row"'));
  assert.ok(html.includes('class="table-footnote"'));
  assert.ok(html.includes('class="running-footer"'));
  // Page number only, outside edge aligned (odd = left)
  assert.ok(html.includes('<span>1</span>'));
  assert.ok(html.includes('text-align: left'));
});

test('renderDocumentToHtml automatically detects internal headings and formats TOC with line breaks', () => {
  const doc = `# דוגמאות להמחשה
תוכן עניינים: 1 שירותי בנייה 2 מרכז מסחרי 3 ייצור

ניתוח

ישות א' מחזיקה ב-50% מהמניות.

וריאציה 1

הסכם בעלי מניות`;

  const blocks = parseDocument(doc);
  const html = renderDocumentToHtml(blocks, testSettings);

  // TOC should contain <br> before numbers 2 and 3, and bold title
  assert.ok(html.includes('toc-title'));
  assert.ok(html.includes('תוכן עניינים'));
  assert.ok(html.includes('<br>2'));
  assert.ok(html.includes('<br>3'));

  // Internal headings should be rendered with class internal-heading and break-after avoid
  assert.ok(html.includes('internal-heading'));
  assert.ok(html.includes('ניתוח'));
  assert.ok(html.includes('וריאציה 1'));
  assert.ok(html.includes('הסכם בעלי מניות'));
});
