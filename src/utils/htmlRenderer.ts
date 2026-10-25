import { DocumentBlock, DocumentSettings, ParsedTable, TableRow } from '../types';
import { paginateBlocks } from './paginator';

/**
 * Formats inline markdown formatting:
 * - **bold** to <strong>bold</strong>
 * - Ensures negative numbers and accounting codes inside parentheses are properly wrapped for RTL display
 */
export function formatInlineText(text: string): string {
  if (!text) return '';

  // Escape HTML characters first
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert **bold** to <strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return escaped;
}

/**
 * Formats table cell content, ensuring accounting numbers with parentheses or dashes
 * don't flip inverted in RTL.
 */
export function formatTableCell(text: string, isNumeric: boolean): string {
  const formatted = formatInlineText(text);
  if (isNumeric) {
    return `<span class="num-cell" dir="ltr">${formatted}</span>`;
  }
  return formatted;
}

/**
 * Renders a parsed table into clean IFRS HTML table markup.
 */
export function renderTableToHtml(table: ParsedTable): string {
  const isDecision = table.type === 'decision';
  const tableClass = isDecision ? 'ifrs-table table-decision' : 'ifrs-table table-accounting';

  let html = `<table class="${tableClass}" dir="rtl">\n`;

  // thead
  html += `  <thead>\n    <tr>\n`;
  table.headers.forEach((h, idx) => {
    const alignClass = h.align === 'right' ? 'align-right' : h.align === 'left' ? 'align-left' : 'align-center';
    html += `      <th class="${alignClass}">${formatInlineText(h.text)}</th>\n`;
  });
  html += `    </tr>\n  </thead>\n`;

  // tbody
  html += `  <tbody>\n`;
  table.rows.forEach((row: TableRow) => {
    let rowClasses: string[] = [];
    if (row.isUnitRow) rowClasses.push('unit-row');
    if (row.isSubheader) rowClasses.push('subheader-row');
    if (row.isSummaryRow) rowClasses.push('summary-row');

    const classAttr = rowClasses.length > 0 ? ` class="${rowClasses.join(' ')}"` : '';
    html += `    <tr${classAttr}>\n`;

    row.cells.forEach((cell, cellIdx) => {
      let alignClass = 'align-center';
      if (cellIdx === 0 || row.isSubheader) {
        alignClass = 'align-right';
      } else if (cell.align === 'left') {
        alignClass = 'align-left';
      }

      html += `      <td class="${alignClass}">${formatTableCell(cell.text, cell.isNumeric)}</td>\n`;
    });

    html += `    </tr>\n`;
  });
  html += `  </tbody>\n`;
  html += `</table>\n`;

  return html;
}

function renderSingleBlock(block: DocumentBlock, settings: DocumentSettings): string {
  switch (block.type) {
    case 'h1':
      return `<h1 class="standard-title" id="${block.id}">${formatInlineText(block.text)}</h1>\n`;

    case 'h2':
      return `<h2 class="section-h2" id="${block.id}">${formatInlineText(block.text)}</h2>\n`;

    case 'h3':
      return `<h3 class="section-h3" id="${block.id}">${formatInlineText(block.text)}</h3>\n`;

    case 'hanging_paragraph':
      if (settings.hangingIndent) {
        return `<div class="hanging-grid">\n  <div class="hanging-code">${formatInlineText(block.code)}</div>\n  <div class="hanging-body">${formatInlineText(block.body)}</div>\n</div>\n`;
      }
      return `<p class="standard-paragraph"><strong>${formatInlineText(block.code)}</strong> ${formatInlineText(block.body)}</p>\n`;

    case 'paragraph':
      return `<p class="standard-paragraph">${formatInlineText(block.text)}</p>\n`;

    case 'table':
      return renderTableToHtml(block.table);

    case 'footnote':
      return `<div class="table-footnote">\n  <span class="footnote-marker">${formatInlineText(block.marker)}</span>\n  <span class="footnote-text">${formatInlineText(block.text)}</span>\n</div>\n`;

    case 'quote':
      return `<blockquote class="ifrs-quote">${formatInlineText(block.text)}</blockquote>\n`;

    case 'hr':
      return `<hr class="ifrs-divider" />\n`;
  }
}

/**
 * Renders document blocks into complete IFRS formatted HTML for printing and preview,
 * paginated into individual A4 sheets with running headers and running footers.
 */
export function renderDocumentToHtml(blocks: DocumentBlock[], settings: DocumentSettings): string {
  const pages = paginateBlocks(blocks, settings);
  if (pages.length === 0) return '';

  let html = '';

  pages.forEach((pageBlocks, pageIdx) => {
    const isLast = pageIdx === pages.length - 1;
    const breakStyle = isLast ? 'page-break-after: auto; break-after: auto;' : 'page-break-after: always; break-after: page;';

    html += `<div class="a4-page" style="${breakStyle} min-height: 297mm; display: flex; flex-direction: column; padding: ${settings.marginMm}mm 20mm; box-sizing: border-box;">\n`;

    // 1. Running Header on each page
    if (settings.runningHeaderRight || settings.runningHeaderLeft) {
      html += `  <div class="running-header">\n`;
      html += `    <div class="running-header-right">${formatInlineText(settings.runningHeaderRight)}</div>\n`;
      html += `    <div class="running-header-left">${formatInlineText(settings.runningHeaderLeft)}</div>\n`;
      html += `  </div>\n`;
    }

    // 2. Page Content
    html += `  <div class="page-content" style="flex: 1 0 auto;">\n`;
    pageBlocks.forEach((block) => {
      html += '    ' + renderSingleBlock(block, settings);
    });
    html += `  </div>\n`;

    // 3. Running Footer on each page
    html += `  <div class="running-footer" style="margin-top: auto; padding-top: 3pt; border-top: 0.75pt solid #000; font-size: 9pt; text-align: center; color: #000; display: flex; justify-content: center; align-items: center;">\n`;
    html += `    <span>עמוד ${pageIdx + 1} מתוך ${pages.length}</span>\n`;
    html += `  </div>\n`;

    html += `</div>\n`;
  });

  return html;
}
