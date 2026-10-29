import { DocumentSettings } from '../types';

/**
 * Generates a sterile, isolated print HTML document and opens it in a dedicated popup window
 * to deliver pixel-perfect, 1:1 A4 printing with zero browser margin conflicts or phantom pages.
 */
export function printViaPopup(contentHtml: string, settings: DocumentSettings, title: string = 'IFRS Print Studio'): boolean {
  try {
    const printWindow = window.open('', '_blank', 'width=900,height=1000,menubar=no,toolbar=no,location=no,status=no');

    if (!printWindow) {
      return false; // Popup blocked
    }

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    /* 1. Complete reset of page margins to prevent browser default margins */
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* 2. Sterile body and root elements - absolutely no app styles or dark backgrounds */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      direction: rtl;
      text-align: right;
      font-family: 'David Libre', 'David', 'Times New Roman', serif;
      font-size: ${settings.fontSizePt}pt;
      line-height: ${settings.lineHeight};
    }

    /* 3. Safe A4 Page Container: exactly 210mm x 296.5mm to eliminate pixel-rounding spillovers */
    .a4-page {
      width: 210mm !important;
      height: 296.5mm !important; /* 0.5mm deduction prevents browser DPI rounding from triggering a phantom blank page */
      margin: 0 !important;
      padding: 18mm 20mm !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
      break-after: page !important;
      position: relative !important;
      overflow: hidden !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* 4. Disable page break on the final page */
    .a4-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    /* 5. Absolutely anchored running footer */
    .running-footer {
      position: absolute !important;
      bottom: 18mm !important;
      left: 20mm !important;
      right: 20mm !important;
      padding-top: 3pt !important;
      border-top: 0.75pt solid #000000 !important;
      font-size: 9.5pt !important;
      color: #000000 !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
    }

    .page-content {
      width: 100%;
      box-sizing: border-box;
    }

    /* Running Header */
    .running-header {
      border-bottom: 0.75pt solid #000000;
      padding-bottom: 3pt;
      margin-bottom: 14pt;
      font-size: 9.5pt;
      font-weight: 500;
      color: #000000;
      box-sizing: border-box;
    }

    /* Standard h1 framed title */
    .standard-title {
      border-top: 1.5pt solid #000000;
      border-bottom: 1.5pt solid #000000;
      font-size: 15.5pt;
      font-weight: bold;
      line-height: 1.3;
      padding: 6pt 0;
      margin: 14pt 0 16pt 0;
      page-break-after: avoid;
      break-after: avoid;
      text-align: right;
    }

    .section-h2 {
      font-size: 13pt;
      font-weight: bold;
      margin: 16pt 0 6pt 0;
      page-break-after: avoid;
      break-after: avoid;
      text-align: right;
    }

    .section-h3 {
      font-size: 11.5pt;
      font-weight: bold;
      margin: 12pt 0 4pt 0;
      page-break-after: avoid;
      break-after: avoid;
      text-align: right;
    }

    /* Table of Contents */
    .ifrs-toc {
      margin: 14pt 0;
      padding: 6pt 0;
      border-top: 1pt solid #000000;
      border-bottom: 1pt solid #000000;
    }

    /* Hanging Paragraph Grid */
    .hanging-grid {
      display: grid;
      grid-template-columns: 44pt 1fr;
      gap: 4pt;
      margin-bottom: 7.5pt;
      text-align: justify;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .hanging-code {
      font-weight: bold;
      text-align: right;
      white-space: nowrap;
    }

    .hanging-body {
      text-align: justify;
    }

    /* Subparagraph */
    .subparagraph {
      display: flex;
      align-items: baseline;
      gap: 6pt;
      margin: 3pt 0 4pt 0;
      padding-right: 44pt;
      font-size: inherit;
      line-height: inherit;
    }

    /* Standard Paragraph */
    .standard-paragraph {
      text-align: justify;
      margin-bottom: 7.5pt;
    }

    /* Table Footnotes */
    .table-footnote {
      font-size: 9.5pt;
      line-height: 1.35;
      margin: 3.5pt 0;
      text-align: justify;
      display: flex;
      gap: 6pt;
    }

    .footnote-marker {
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Accounting Tables */
    table.ifrs-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0 8pt 0;
      page-break-inside: auto;
      break-inside: auto;
      font-size: 10pt;
    }

    table.ifrs-table thead {
      display: table-header-group;
    }

    table.ifrs-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table.ifrs-table.table-accounting thead th {
      border-top: 1.2pt solid #000000;
      border-bottom: 0.75pt solid #000000;
      padding: 4.5pt 6pt;
      font-weight: bold;
      text-align: center;
    }

    table.ifrs-table.table-accounting thead th:first-child {
      text-align: right;
    }

    table.ifrs-table.table-accounting td {
      padding: 3.5pt 6pt;
      vertical-align: middle;
    }

    table.ifrs-table tr.unit-row td {
      border-bottom: 0.75pt solid #000000;
      padding-top: 2pt;
      padding-bottom: 3.5pt;
      font-size: 9.5pt;
      text-align: center;
    }

    table.ifrs-table tr.subheader-row td:first-child {
      font-weight: bold;
      text-align: right;
      padding-top: 8pt;
      padding-bottom: 2pt;
    }

    table.ifrs-table tr.summary-row td {
      border-top: 0.75pt solid #000000 !important;
      border-bottom: 3px double #000000 !important;
      font-weight: bold !important;
      padding-top: 4pt;
      padding-bottom: 4pt;
    }

    table.ifrs-table.table-decision {
      border: 0.5pt solid #000000;
    }

    table.ifrs-table.table-decision th,
    table.ifrs-table.table-decision td {
      border: 0.5pt solid #000000;
      padding: 5pt 7pt;
    }

    table.ifrs-table.table-decision thead th {
      background-color: #f2f2f2 !important;
      font-weight: bold;
      text-align: center;
    }

    table.ifrs-table.table-decision thead th:first-child {
      text-align: right;
    }

    .num-cell {
      direction: ltr !important;
      display: inline-block;
      font-variant-numeric: tabular-nums;
      unicode-bidi: embed;
    }

    .align-center {
      text-align: center !important;
    }

    .align-right {
      text-align: right !important;
    }

    .align-left {
      text-align: left !important;
    }

    .ifrs-quote {
      border-right: 2pt solid #000000;
      padding-right: 10pt;
      margin: 10pt 0;
      font-style: normal;
    }

    hr.ifrs-divider {
      border: none;
      border-top: 0.5pt solid #000000;
      margin: 14pt 0;
    }
  </style>
</head>
<body>
  ${contentHtml}

  <script>
    window.addEventListener('load', () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 250);
        });
      } else {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 300);
      }
    });
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return true;
  } catch (err) {
    console.error('Popup print failed:', err);
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
