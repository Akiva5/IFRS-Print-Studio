import { DocumentSettings } from '../types';

/**
 * Generates the clean print HTML document and opens it in a dedicated popup window
 * to bypass iframe sandbox restrictions and deliver pixel-perfect A4 printing.
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
    @page {
      size: ${settings.paperSize === 'Letter' ? 'letter portrait' : 'A4 portrait'};
      margin: ${settings.marginMm}mm 20mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      direction: rtl;
      text-align: right;
      font-family: 'David Libre', 'David', 'Times New Roman', serif;
      font-size: ${settings.fontSizePt}pt;
      line-height: ${settings.lineHeight};
    }

    .print-container {
      width: 100%;
      margin: 0 auto;
    }

    .print-page {
      width: 100%;
      box-sizing: border-box;
      padding: ${settings.marginMm}mm 20mm;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }

    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .page-content {
      flex: 1;
    }

    /* Running Header */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 0.75pt solid #000000;
      padding-bottom: 3pt;
      margin-bottom: 14pt;
      font-size: 9pt;
      color: #000000;
    }

    .running-header-right {
      font-weight: 500;
    }

    .running-header-left {
      font-weight: 400;
      direction: ltr;
    }

    /* Running Footer */
    .running-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 0.75pt solid #000000;
      padding-top: 3pt;
      margin-top: 14pt;
      font-size: 8.5pt;
      color: #000000;
    }

    .running-footer-center {
      font-weight: bold;
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

    /* Accounting Table Header */
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

    /* Unit Row (י"מ) */
    table.ifrs-table tr.unit-row td {
      border-bottom: 0.75pt solid #000000;
      padding-top: 2pt;
      padding-bottom: 3.5pt;
      font-size: 9.5pt;
      text-align: center;
    }

    /* Section Subheader */
    table.ifrs-table tr.subheader-row td:first-child {
      font-weight: bold;
      text-align: right;
      padding-top: 8pt;
      padding-bottom: 2pt;
    }

    /* Accounting Summary / Total Row */
    table.ifrs-table tr.summary-row td {
      border-top: 0.75pt solid #000000 !important;
      border-bottom: 3px double #000000 !important;
      font-weight: bold !important;
      padding-top: 4pt;
      padding-bottom: 4pt;
    }

    /* Decision Table (Full Grid) */
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

    /* Numeric cells */
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

    /* Blockquote */
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

    @media screen {
      body {
        background: #f1f5f9;
        padding: 20px;
      }
      .print-container {
        background: #ffffff;
        max-width: 210mm;
        min-height: 297mm;
        padding: ${settings.marginMm}mm 20mm;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${contentHtml}
  </div>

  <script>
    window.addEventListener('load', () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 300);
        });
      } else {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 500);
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
