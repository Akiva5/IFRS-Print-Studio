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

    case 'toc': {
      let tocHtml = `<div class="ifrs-toc" style="margin: 14pt 0; padding: 6pt 0; border-top: 1pt solid #000; border-bottom: 1pt solid #000;">\n`;
      if (block.title) {
        tocHtml += `  <div style="font-weight: bold; font-size: 11.5pt; margin-bottom: 6pt; text-align: right;">${formatInlineText(block.title)}</div>\n`;
      }
      tocHtml += `  <div style="display: flex; flex-direction: column; gap: 3pt;">\n`;
      block.items.forEach((item) => {
        tocHtml += `    <div style="display: flex; align-items: baseline; justify-content: space-between; font-size: 11pt; line-height: 1.4;">\n`;
        tocHtml += `      <div style="display: flex; align-items: baseline; gap: 6pt;">\n`;
        if (item.number) {
          tocHtml += `        <span style="font-weight: bold; min-width: 18pt; text-align: right;">${formatInlineText(item.number)}</span>\n`;
        }
        tocHtml += `        <span>${formatInlineText(item.title)}</span>\n`;
        tocHtml += `      </div>\n`;
        if (item.page) {
          tocHtml += `      <span style="font-family: monospace;">${formatInlineText(item.page)}</span>\n`;
        }
        tocHtml += `    </div>\n`;
      });
      tocHtml += `  </div>\n`;
      tocHtml += `</div>\n`;
      return tocHtml;
    }

    case 'hanging_paragraph': {
      let out = '';
      if (settings.hangingIndent) {
        out += `<div class="hanging-grid">\n`;
        out += `  <div class="hanging-code">${formatInlineText(block.code)}</div>\n`;
        out += `  <div class="hanging-body">\n`;
        if (block.body) {
          out += `    <div>${formatInlineText(block.body)}</div>\n`;
        }
        if (block.subparagraphs && block.subparagraphs.length > 0) {
          out += `    <div class="subparagraphs-list" style="margin-top: 4pt; display: flex; flex-direction: column; gap: 3pt;">\n`;
          block.subparagraphs.forEach((sub) => {
            out += `      <div style="display: flex; align-items: baseline; gap: 6pt;">\n`;
            out += `        <span style="font-weight: bold; flex-shrink: 0;">${formatInlineText(sub.marker)}</span>\n`;
            out += `        <span style="text-align: justify; line-height: inherit;">${formatInlineText(sub.text)}</span>\n`;
            out += `      </div>\n`;
          });
          out += `    </div>\n`;
        }
        out += `  </div>\n`;
        out += `</div>\n`;
      } else {
        out += `<p class="standard-paragraph"><strong>${formatInlineText(block.code)}</strong> ${formatInlineText(block.body)}</p>\n`;
        if (block.subparagraphs && block.subparagraphs.length > 0) {
          block.subparagraphs.forEach((sub) => {
            out += `<p class="standard-paragraph" style="padding-right: 20pt;"><strong>${formatInlineText(sub.marker)}</strong> ${formatInlineText(sub.text)}</p>\n`;
          });
        }
      }
      return out;
    }

    case 'subparagraph': {
      return `<div class="subparagraph" style="display: flex; align-items: baseline; gap: 6pt; margin: 3pt 0 4pt 0; padding-right: 44pt; font-size: inherit; line-height: inherit;">\n  <span style="font-weight: bold; flex-shrink: 0;">${formatInlineText(block.marker)}</span>\n  <span style="text-align: justify;">${formatInlineText(block.text)}</span>\n</div>\n`;
    }

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
 * - Header: only standard name, aligned to outside edge (odd = left, even = right)
 * - Footer: page number only, aligned to outside edge (odd = left, even = right)
 */
export function renderDocumentToHtml(blocks: DocumentBlock[], settings: DocumentSettings): string {
  const pages = paginateBlocks(blocks, settings);
  if (pages.length === 0) return '';

  let html = '';
  const detectedStandard = (() => {
    const h1 = blocks.find((b) => b.type === 'h1');
    if (h1 && 'text' in h1) {
      const match = h1.text.match(/(?:תקן\s+דיווח\s+כספי\s+בינלאומי|תקן\s+חשבונאות\s+בינלאומי|IFRS|IAS)\s*(\d+)/i);
      if (match) {
        const num = match[1];
        const isIAS = /IAS|תקן\s+חשבונאות\s+בינלאומי/i.test(h1.text);
        const prefix = isIAS ? 'IAS' : 'IFRS';
        return `${prefix} ${num} IE`;
      }
    }
    return null;
  })();
  const headerText = detectedStandard || settings.runningHeaderRight || settings.runningHeaderLeft || '';

  pages.forEach((pageBlocks, pageIdx) => {
    const pageNumber = pageIdx + 1;
    const isOdd = pageNumber % 2 === 1;
    const alignOutside = isOdd ? 'left' : 'right';

    const isLast = pageIdx === pages.length - 1;
    const breakStyle = isLast ? 'page-break-after: auto; break-after: auto;' : 'page-break-after: always; break-after: page;';

    html += `<div class="a4-page" style="${breakStyle} width: 210mm; height: 296.5mm; margin: 0 !important; padding: ${settings.marginMm}mm 20mm; box-sizing: border-box; box-shadow: none; border: none; page-break-inside: avoid; break-inside: avoid; overflow: hidden; position: relative;">\n`;

    // 1. Running Header: only standard name, on outside edge
    if (headerText) {
      html += `  <div class="running-header" style="border-bottom: 0.75pt solid #000; padding-bottom: 3pt; margin-bottom: 14pt; font-size: 9.5pt; text-align: ${alignOutside}; font-weight: 500; color: #000;">\n`;
      html += `    ${formatInlineText(headerText)}\n`;
      html += `  </div>\n`;
    }

    // 2. Page Content
    html += `  <div class="page-content" style="box-sizing: border-box;">\n`;
    pageBlocks.forEach((block) => {
      html += '    ' + renderSingleBlock(block, settings);
    });
    html += `  </div>\n`;

    // 3. Running Footer: page number only, anchored on outside edge at bottom
    html += `  <div class="running-footer" style="position: absolute; bottom: ${settings.marginMm}mm; right: 20mm; left: 20mm; width: calc(100% - 40mm); padding-top: 3pt; border-top: 0.75pt solid #000; font-size: 9.5pt; text-align: ${alignOutside}; color: #000; box-sizing: border-box;">\n`;
    html += `    <span>${pageNumber}</span>\n`;
    html += `  </div>\n`;

    html += `</div>\n`;
  });

  return html;
}
