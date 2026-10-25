import { ParsedTable, TableCell, TableRow, TableType } from '../types';

/**
 * Checks if a string represents a numeric accounting value:
 * e.g., "1,234", "(4,500)", "–", "-", "0", "15%", "12.5", "10%", "(120,000)"
 */
export function isAccountingNumeric(val: string): boolean {
  const trimmed = val.replace(/\*\*/g, '').trim();
  if (!trimmed) return false;
  if (trimmed === '–' || trimmed === '-' || trimmed === '—' || trimmed === '0') return true;
  // Match e.g. 1,000 or (1,000) or 50% or (45.2%)
  const numPattern = /^\(?\s*-?\s*[\d,]+(\.\d+)?%?\s*\)?$/;
  return numPattern.test(trimmed);
}

/**
 * Determines whether a table is a decision/flowchart table or an accounting/standard table.
 */
export function detectTableType(headerTexts: string[]): TableType {
  const combined = headerTexts.join(' ');
  if (
    combined.includes('שלב ובדיקה') ||
    combined.includes('אם כן') ||
    combined.includes('אם לא') ||
    combined.includes('קריטריון כמותי') ||
    combined.includes('תרשים זרימה')
  ) {
    return 'decision';
  }
  return 'accounting';
}

/**
 * Checks if a row is a Currency / Unit Row (י"מ):
 * E.g., first cell is empty or whitespace, and all other non-empty cells contain "י"מ" or monetary unit.
 */
export function isCurrencyUnitRow(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const first = cells[0].trim();
  if (first !== '') return false;

  const rest = cells.slice(1);
  const nonEmptyRest = rest.filter((c) => c.trim().length > 0);
  if (nonEmptyRest.length === 0) return false;

  const isUnits = nonEmptyRest.every((c) => {
    const clean = c.replace(/[\*\"״\']/g, '').trim();
    return (
      clean === 'ימ' ||
      clean === 'י"מ' ||
      clean === 'שח' ||
      clean === 'ש"ח' ||
      clean.includes('אלפי') ||
      clean.includes('מיליוני') ||
      clean.includes('$') ||
      clean.includes('USD') ||
      clean.includes('EUR')
    );
  });

  return isUnits;
}

/**
 * Checks if a row is an in-table section subheader:
 * Only the first cell has text, and all other cells are empty.
 */
export function isSectionSubheaderRow(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const first = cells[0].trim();
  if (!first) return false;

  const rest = cells.slice(1);
  return rest.every((c) => c.trim() === '' || c.trim() === '–');
}

/**
 * Checks if a row is an Accounting Summary / Total Row:
 * Starts with "סך הכול", "סה"כ", "הכנסות הישות", "נכסי הישות", "התחייבויות הישות", "הכנסה לפני",
 * or has bold markers `**סך...**`
 */
export function isSummaryTotalRow(cells: string[], isLastRow: boolean): boolean {
  if (cells.length === 0) return false;
  const firstClean = cells[0].replace(/\*\*/g, '').trim();

  const summaryKeywords = [
    'סך הכול',
    'סך הכל',
    'סה"כ',
    'סה״כ',
    'הכנסות הישות',
    'נכסי הישות',
    'התחייבויות הישות',
    'הכנסה לפני',
    'רווח כולל',
    'סך נכסים',
    'סך התחייבויות',
    'עודף (גירעון)',
    'רווח (הפסד)',
  ];

  const matchesKeyword = summaryKeywords.some((keyword) => firstClean.startsWith(keyword));
  if (matchesKeyword) return true;

  // Or if it's the last row and first cell is bold
  if (isLastRow && cells[0].trim().startsWith('**') && cells[0].trim().endsWith('**')) {
    return true;
  }

  return false;
}

/**
 * Parses raw markdown table lines into a structured ParsedTable object.
 */
export function parseMarkdownTable(lines: string[]): ParsedTable | null {
  if (lines.length < 2) return null;

  const splitRow = (line: string): string[] => {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
    return trimmed.split('|').map((c) => c.trim());
  };

  const rawHeaders = splitRow(lines[0]);
  let separatorIdx = 1;

  // Check if second line is separator like |:---|:---:|---:|
  const isSeparator = /^\|?(\s*:?-+:?\s*\|?)+$/.test(lines[1].trim());
  if (!isSeparator) {
    return null;
  }

  const alignments = splitRow(lines[1]).map((s): 'right' | 'center' | 'left' => {
    const t = s.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'left';
    return 'right';
  });

  const tableType = detectTableType(rawHeaders);

  const headerCells: TableCell[] = rawHeaders.map((text, idx) => ({
    text,
    isNumeric: isAccountingNumeric(text),
    align: idx === 0 ? 'right' : alignments[idx] || 'center',
    isBold: true,
  }));

  const dataRows: TableRow[] = [];
  const rawDataLines = lines.slice(separatorIdx + 1);

  rawDataLines.forEach((line, rIdx) => {
    if (!line.trim() || !line.includes('|')) return;
    const rawCells = splitRow(line);

    const isLast = rIdx === rawDataLines.length - 1;
    const isUnit = isCurrencyUnitRow(rawCells);
    const isSub = isSectionSubheaderRow(rawCells);
    const isSummary = isSummaryTotalRow(rawCells, isLast);

    const cells: TableCell[] = rawCells.map((rawCellText, cIdx) => {
      const isNum = isAccountingNumeric(rawCellText);
      const isBold = rawCellText.startsWith('**') && rawCellText.endsWith('**');

      let defaultAlign: 'right' | 'center' | 'left' = 'right';
      if (cIdx === 0) {
        defaultAlign = 'right';
      } else if (isNum || isUnit) {
        defaultAlign = 'center';
      } else {
        defaultAlign = alignments[cIdx] || 'center';
      }

      return {
        text: rawCellText,
        isNumeric: isNum,
        align: defaultAlign,
        isBold,
      };
    });

    dataRows.push({
      cells,
      rawText: line,
      isUnitRow: isUnit,
      isSubheader: isSub,
      isSummaryRow: isSummary,
    });
  });

  return {
    headers: headerCells,
    alignments,
    rows: dataRows,
    type: tableType,
  };
}
