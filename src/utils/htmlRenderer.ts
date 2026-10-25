import { DocumentBlock, DocumentSettings, ParsedTable, TableRow } from '../types';

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

/**
 * Renders document blocks into complete IFRS formatted HTML for printing and preview.
 */
export function renderDocumentToHtml(blocks: DocumentBlock[], settings: DocumentSettings): string {
  let html = '';

  // 1. Running Header
  if (settings.runningHeaderRight || settings.runningHeaderLeft) {
    html += `<div class="running-header">\n`;
    html += `  <div class="running-header-right">${formatInlineText(settings.runningHeaderRight)}</div>\n`;
    html += `  <div class="running-header-left">${formatInlineText(settings.runningHeaderLeft)}</div>\n`;
    html += `</div>\n`;
  }

  // 2. Blocks
  blocks.forEach((block) => {
    switch (block.type) {
      case 'h1':
        html += `<h1 class="standard-title" id="${block.id}">${formatInlineText(block.text)}</h1>\n`;
        break;

      case 'h2':
        html += `<h2 class="section-h2" id="${block.id}">${formatInlineText(block.text)}</h2>\n`;
        break;

      case 'h3':
        html += `<h3 class="section-h3" id="${block.id}">${formatInlineText(block.text)}</h3>\n`;
        break;

      case 'hanging_paragraph':
        if (settings.hangingIndent) {
          html += `<div class="hanging-grid">\n`;
          html += `  <div class="hanging-code">${formatInlineText(block.code)}</div>\n`;
          html += `  <div class="hanging-body">${formatInlineText(block.body)}</div>\n`;
          html += `</div>\n`;
        } else {
          html += `<p class="standard-paragraph"><strong>${formatInlineText(block.code)}</strong> ${formatInlineText(block.body)}</p>\n`;
        }
        break;

      case 'paragraph':
        html += `<p class="standard-paragraph">${formatInlineText(block.text)}</p>\n`;
        break;

      case 'table':
        html += renderTableToHtml(block.table);
        break;

      case 'footnote':
        html += `<div class="table-footnote">\n`;
        html += `  <span class="footnote-marker">${formatInlineText(block.marker)}</span>\n`;
        html += `  <span class="footnote-text">${formatInlineText(block.text)}</span>\n`;
        html += `</div>\n`;
        break;

      case 'quote':
        html += `<blockquote class="ifrs-quote">${formatInlineText(block.text)}</blockquote>\n`;
        break;

      case 'hr':
        html += `<hr class="ifrs-divider" />\n`;
        break;
    }
  });

  return html;
}
