import { DocumentBlock, ParsedTable } from '../types';
import { parseMarkdownTable } from './tableDetector';

/**
 * Parses markdown into IFRS Document Blocks:
 * Handles:
 * - h1 (with official top/bottom borders)
 * - h2, h3
 * - Hanging paragraphs (**IG1**, **IE1**, **BC1**, etc.)
 * - Tables (accounting and decision)
 * - Table Footnotes: (א), (ב), (ג)...
 * - Quotes
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

  // Regex for footnotes: (א), (ב), (ג), (*), (**), (1), etc.
  const footnoteRegex = /^(\((?:[א-ת]|\*+|\d+)\))\s*(.*)$/;

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

    // Table Footnote (e.g. "(א) הכנסות בין-מגזריות...")
    const footnoteMatch = line.match(footnoteRegex);
    if (footnoteMatch) {
      blocks.push({
        type: 'footnote',
        marker: footnoteMatch[1],
        text: footnoteMatch[2],
      });
      i++;
      continue;
    }

    // Hanging paragraph code (e.g. "**IG1** הנחיות אלו מלוות...")
    const hangingMatch = line.match(hangingRegex);
    if (hangingMatch) {
      let code = hangingMatch[1].replace(/\*\*/g, '').trim();
      let body = hangingMatch[2] || '';

      // Collect any continuation lines until blank line or new block
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        const nextLine = lines[i].trim();
        // Stop if next line is a header, table, footnote or another hanging paragraph
        if (
          nextLine.startsWith('#') ||
          (nextLine.startsWith('|') && nextLine.endsWith('|')) ||
          footnoteRegex.test(nextLine) ||
          hangingRegex.test(nextLine)
        ) {
          break;
        }
        body += ' ' + nextLine;
        i++;
      }

      blocks.push({
        type: 'hanging_paragraph',
        code,
        body: body.trim(),
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
        footnoteRegex.test(nextLine) ||
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
