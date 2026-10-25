export interface DocumentSettings {
  runningHeaderRight: string;
  runningHeaderLeft: string;
  hangingIndent: boolean;
  fontSizePt: number;
  lineHeight: number;
  marginMm: number;
  showPageGuides: boolean;
  paperSize: 'A4' | 'Letter';
}

export type TableType = 'accounting' | 'decision' | 'standard';

export interface TableCell {
  text: string;
  isNumeric: boolean;
  align?: 'right' | 'center' | 'left';
  isBold?: boolean;
}

export interface TableRow {
  cells: TableCell[];
  isHeader?: boolean;
  isUnitRow?: boolean;
  isSubheader?: boolean;
  isSummaryRow?: boolean;
  rawText: string;
}

export interface ParsedTable {
  headers: TableCell[];
  alignments: ('right' | 'center' | 'left')[];
  rows: TableRow[];
  type: TableType;
  caption?: string;
}

export type DocumentBlock =
  | { type: 'h1'; text: string; id: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | { type: 'hanging_paragraph'; code: string; body: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; table: ParsedTable }
  | { type: 'footnote'; marker: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' };
