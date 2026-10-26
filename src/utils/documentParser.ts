import { DocumentBlock, ParsedTable, SubparagraphItem, TocItem } from '../types';
import { parseMarkdownTable } from './tableDetector';

/**
 * Parses a Table of Contents (תוכן עניינים) either from a single unformatted string
 * or from consecutive numbered lines.
 */
function tryParseToc(
  currentLine: string,
  lines: string[],
  startIndex: number
): { block: DocumentBlock; nextIndex: number } | null {
  const isTocHeader = /^#*\s*תוכן\s+(?:העניינים|עניינים)\s*:?/i.test(currentLine);
  if (!isTocHeader) return null;

  // Case A: The single line itself contains the items concatenated (e.g., "תוכן עניינים 1 שירותי בנייה 2 מרכז מסחרי...")
  const contentAfterHeader = currentLine.replace(/^#*\s*תוכן\s+(?:העניינים|עניינים)\s*:?\s*/i, '').trim();

  const itemRegex = /(?:^|\s+)(\d+|(?:דוגמה|סעיף)\s+\d+)\s+([^\d\n]+?)(?=\s+\d+|\s+(?:דוגמה|סעיף)\s+\d+|$)/g;
  const items: TocItem[] = [];

  if (contentAfterHeader) {
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(contentAfterHeader)) !== null) {
      const num = match[1].trim();
      const title = match[2].trim();
      if (title) {
        items.push({ number: num, title });
      }
    }
  }

  // If items were found in the header line itself
  if (items.length >= 2) {
    return {
      block: { type: 'toc', title: 'תוכן עניינים', items },
      nextIndex: startIndex + 1,
    };
  }

  // Case B: Subsequent lines contain the items:
  // e.g.
  // תוכן עניינים
  // 1 שירותי בנייה
  // 2 מרכז מסחרי...
  let idx = startIndex + 1;
  const lineItemRegex = /^(\d+|\([א-ת\d]+\)|(?:דוגמה|סעיף)\s+\d+)\.?\s+(.+)$/;

  while (idx < lines.length) {
    const nextLine = lines[idx].trim();
    if (!nextLine) {
      // Empty line - check if more items follow, otherwise finish TOC
      idx++;
      if (idx < lines.length && lineItemRegex.test(lines[idx].trim())) {
        continue;
      }
      break;
    }

    const m = nextLine.match(lineItemRegex);
    if (m) {
      items.push({ number: m[1].trim(), title: m[2].trim() });
      idx++;
    } else {
      break;
    }
  }

  if (items.length >= 1) {
    return {
      block: { type: 'toc', title: 'תוכן עניינים', items },
      nextIndex: idx,
    };
  }

  return null;
}

/**
 * Parses markdown into IFRS Document Blocks:
 * Handles:
 * - h1 (with official top/bottom borders)
 * - h2, h3
 * - Table of Contents (תוכן עניינים)
 * - Hanging paragraphs (**IG1**, **IE1**, **BC1**, etc.) with sub-paragraphs: (א), (ב), (ג)...
 * - Sub-paragraphs keeping official 11.5pt body formatting
 * - Tables (accounting and decision)
 * - Table Footnotes (only immediately following tables)
 * - Quotes & Horizontal rules
 * - Standard paragraphs
 */
export function parseDocument(markdown: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  // Regex to detect hanging paragraph prefix:
  // e.g. **IG1**, **IE1**, **BC12**, **AG3**, **IN2**, **B4**, **15**, or IG1., IE1.
  const hangingRegex =
    /^(\*\*(?:IG|IE|BC|AG|IN|B|A)?\d+[A-Za-z]?\*\*|(?:IG|IE|BC|AG|IN|B|A)\d+[A-Za-z]?\.?|\*\*\d+[A-Za-z]?\*\*)\s*(.*)$/i;

  // Regex for sub-clause markers: (א), (ב), (ג), (*), (**), (1), etc.
  const subclauseRegex = /^(\((?:[א-תa-zA-Z]|\*+|\d+)\))\s+(.*)$/;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Table of Contents (תוכן עניינים)
    const tocResult = tryParseToc(line, lines, i);
    if (tocResult) {
      blocks.push(tocResult.block);
      i = tocResult.nextIndex;
      continue;
    }

    // Markdown Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const parsedTable = parseMarkdownTable(tableLines);
      if (parsedTable) {
        blocks.push({ type: 'table', table: parsedTable });
        continue;
      }
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        type: 'h1',
        text: line.replace(/^#\s+/, '').trim(),
        id: `h1-${blocks.length}`,
      });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({
        type: 'h2',
        text: line.replace(/^##\s+/, '').trim(),
        id: `h2-${blocks.length}`,
      });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({
        type: 'h3',
        text: line.replace(/^###\s+/, '').trim(),
        id: `h3-${blocks.length}`,
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteLines.join(' '),
      });
      continue;
    }

    // Sub-clause or Footnote detection
    const subclauseMatch = line.match(subclauseRegex);
    if (subclauseMatch) {
      const prevBlock = blocks[blocks.length - 1];
      const isDirectlyUnderTable = prevBlock && (prevBlock.type === 'table' || prevBlock.type === 'footnote');

      if (isDirectlyUnderTable) {
        // Table Footnote (e.g. "(א) הכנסות בין-מגזריות מתומחרות...")
        blocks.push({
          type: 'footnote',
          marker: subclauseMatch[1],
          text: subclauseMatch[2],
        });
      } else {
        // Standard Sub-clause (תת סעיף) keeping 11.5pt body styling
        blocks.push({
          type: 'subparagraph',
          marker: subclauseMatch[1],
          text: subclauseMatch[2],
        });
      }
      i++;
      continue;
    }

    // Hanging paragraph code (e.g. "**IE4** ההסדר החוזי בין אי ל-בי קובע בנוסף כי:")
    const hangingMatch = line.match(hangingRegex);
    if (hangingMatch) {
      const code = hangingMatch[1].replace(/\*\*/g, '').trim();
      let body = hangingMatch[2] || '';
      const subparagraphs: SubparagraphItem[] = [];

      i++;
      // Collect continuation lines and any sub-clauses belonging to this hanging paragraph
      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextLine = nextRaw.trim();

        if (nextLine === '') {
          // Lookahead: if the next non-empty line is a sub-clause (א), keep collecting
          let lookaheadIdx = i + 1;
          while (lookaheadIdx < lines.length && lines[lookaheadIdx].trim() === '') {
            lookaheadIdx++;
          }
          if (lookaheadIdx < lines.length && subclauseRegex.test(lines[lookaheadIdx].trim())) {
            i = lookaheadIdx;
            continue;
          }
          break;
        }

        // Stop if next line is a header, table, or another hanging paragraph
        if (
          nextLine.startsWith('#') ||
          (nextLine.startsWith('|') && nextLine.endsWith('|')) ||
          hangingRegex.test(nextLine)
        ) {
          break;
        }

        // Check if next line is a sub-paragraph like "(א) הזכויות לכל הנכסים..."
        const subM = nextLine.match(subclauseRegex);
        if (subM) {
          subparagraphs.push({
            marker: subM[1],
            text: subM[2],
          });
          i++;
          continue;
        }

        // Otherwise continuation of text
        if (subparagraphs.length > 0) {
          // Continuation of the last sub-clause
          subparagraphs[subparagraphs.length - 1].text += ' ' + nextLine;
        } else {
          body += (body ? ' ' : '') + nextLine;
        }
        i++;
      }

      blocks.push({
        type: 'hanging_paragraph',
        code,
        body: body.trim(),
        subparagraphs: subparagraphs.length > 0 ? subparagraphs : undefined,
      });
      continue;
    }

    // Standard paragraph: accumulate until empty line
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '') {
      const nextLine = lines[i].trim();
      if (
        nextLine.startsWith('#') ||
        (nextLine.startsWith('|') && nextLine.endsWith('|')) ||
        subclauseRegex.test(nextLine) ||
        hangingRegex.test(nextLine)
      ) {
        break;
      }
      paraLines.push(nextLine);
      i++;
    }

    blocks.push({
      type: 'paragraph',
      text: paraLines.join(' '),
    });
  }

  return blocks;
}
