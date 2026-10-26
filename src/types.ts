export interface DocumentSettings {
  runningHeaderRight: string;
  runningHeaderLeft: string;
  runningFooterRight?: string;
  runningFooterLeft?: string;
  showPageNumbers?: boolean;
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

export interface TocItem {
  number?: string;
  title: string;
  page?: string;
}

export interface SubparagraphItem {
  marker: string; // e.g. '(א)', '(ב)', '(1)'
  text: string;
}

export type DocumentBlock =
  | { type: 'h1'; text: string; id: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | {
      type: 'hanging_paragraph';
      code: string;
      body: string;
      subparagraphs?: SubparagraphItem[];
    }
  | { type: 'subparagraph'; marker: string; text: string }
  | { type: 'toc'; title?: string; items: TocItem[] }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; table: ParsedTable }
  | { type: 'footnote'; marker: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' };
