import { DocumentBlock, DocumentSettings } from '../types';

/**
 * Estimates the printed height of a block in millimeters (mm).
 * Based on 11.5pt font, line-height 1.48, and standard A4 content column width (170mm).
 */
export function estimateBlockHeightMm(block: DocumentBlock): number {
  switch (block.type) {
    case 'h1':
      // Title with top and bottom 1.5pt black rules, padding and margins
      return 24;

    case 'h2':
      return 15;

    case 'h3':
      return 11;

    case 'hanging_paragraph': {
      // 44pt (approx 16mm) for code + gap, leaving ~152mm for body.
      // ~75 Hebrew characters per line.
      const charCount = block.body.length;
      const lines = Math.max(1, Math.ceil(charCount / 75));
      return lines * 5.8 + 3.0;
    }

    case 'paragraph': {
      const charCount = block.text.length;
      const lines = Math.max(1, Math.ceil(charCount / 85));
      return lines * 5.8 + 3.0;
    }

    case 'footnote': {
      const charCount = block.text.length + block.marker.length;
      const lines = Math.max(1, Math.ceil(charCount / 95));
      return lines * 4.4 + 2.5;
    }

    case 'quote': {
      const lines = Math.max(1, Math.ceil(block.text.length / 80));
      return lines * 5.8 + 4.0;
    }

    case 'hr':
      return 6.0;

    case 'table': {
      const table = block.table;
      let height = 10; // thead
      table.rows.forEach((row) => {
        if (row.isUnitRow) {
          height += 6.5;
        } else if (row.isSubheader) {
          height += 7.5;
        } else {
          const maxCellLen = Math.max(...row.cells.map((c) => c.text.length), 0);
          const cellLines = Math.max(1, Math.ceil(maxCellLen / 36));
          height += cellLines * 6.5;
        }
      });
      height += 7.0; // table margin
      return height;
    }
  }
}

/**
 * Paginates document blocks into separate A4 pages.
 * Fills each page up to its genuine printable capacity (~245mm net content)
 * without premature page breaks at headings.
 */
export function paginateBlocks(
  blocks: DocumentBlock[],
  settings?: DocumentSettings
): DocumentBlock[][] {
  if (blocks.length === 0) return [];

  // Net printable height: A4 total 297mm - 18mm top margin - 18mm bottom margin - header/footer overhead (~16mm)
  const MAX_PAGE_CONTENT_MM = 245;

  const pages: DocumentBlock[][] = [];
  let currentPage: DocumentBlock[] = [];
  let currentHeightMm = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = estimateBlockHeightMm(block);

    // If adding this block exceeds page capacity, start a new page
    // (Ensure at least 1 block per page)
    if (currentPage.length > 0 && currentHeightMm + blockHeight > MAX_PAGE_CONTENT_MM) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeightMm = blockHeight;
    } else {
      currentPage.push(block);
      currentHeightMm += blockHeight;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}
