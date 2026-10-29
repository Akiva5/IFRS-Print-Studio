import { DocumentBlock, DocumentSettings } from '../types';

/**
 * Estimates the printed height of a block in millimeters (mm).
 * Based on 11.5pt font, line-height 1.48, and standard A4 content column width (170mm).
 */
export function estimateBlockHeightMm(block: DocumentBlock): number {
  switch (block.type) {
    case 'h1': {
      // Title with top and bottom 1.5pt black rules, padding and margins
      const lines = Math.max(1, Math.ceil(block.text.length / 42));
      return 16 + lines * 7.5;
    }

    case 'h2': {
      const lines = Math.max(1, Math.ceil(block.text.length / 45));
      return 10 + lines * 6.5;
    }

    case 'h3': {
      const lines = Math.max(1, Math.ceil(block.text.length / 50));
      return 8 + lines * 6.0;
    }

    case 'toc': {
      let height = 14;
      block.items.forEach((item) => {
        const lines = Math.max(1, Math.ceil(item.title.length / 45));
        height += lines * 5.5 + 2.5;
      });
      return height;
    }

    case 'subparagraph': {
      const charCount = block.text.length + block.marker.length;
      const lines = Math.max(1, Math.ceil(charCount / 54));
      return lines * 6.2 + 3.5;
    }

    case 'hanging_paragraph': {
      let height = 0;
      if (block.body) {
        const charCount = block.body.length;
        const lines = Math.max(1, Math.ceil(charCount / 62));
        height += lines * 6.2 + 3.5;
      }
      if (block.subparagraphs && block.subparagraphs.length > 0) {
        block.subparagraphs.forEach((sub) => {
          const charCount = sub.text.length + sub.marker.length;
          const lines = Math.max(1, Math.ceil(charCount / 54));
          height += lines * 6.2 + 3.0;
        });
      }
      return Math.max(height + 3.5, 10.0);
    }

    case 'paragraph': {
      const charCount = block.text.length;
      const lines = Math.max(1, Math.ceil(charCount / 68));
      return lines * 6.2 + 4.0;
    }

    case 'footnote': {
      const charCount = block.text.length + block.marker.length;
      const lines = Math.max(1, Math.ceil(charCount / 85));
      return lines * 4.8 + 3.0;
    }

    case 'quote': {
      const lines = Math.max(1, Math.ceil(block.text.length / 70));
      return lines * 6.2 + 6.0;
    }

    case 'hr':
      return 8.0;

    case 'table': {
      const table = block.table;
      let height = 12; // thead
      table.rows.forEach((row) => {
        if (row.isUnitRow) {
          height += 7.5;
        } else if (row.isSubheader) {
          height += 9.0;
        } else {
          const maxCellLen = Math.max(...row.cells.map((c) => c.text.length), 0);
          const cellLines = Math.max(1, Math.ceil(maxCellLen / 30));
          height += cellLines * 7.5;
        }
      });
      height += 8.0; // table margin
      return height;
    }
  }
}

/**
 * Paginates document blocks into separate A4 pages.
 * Fills each page up to its genuine printable capacity (~236mm net content)
 * without premature breaks or orphaned section headings.
 */
export function paginateBlocks(
  blocks: DocumentBlock[],
  settings?: DocumentSettings
): DocumentBlock[][] {
  if (blocks.length === 0) return [];

  // Net printable height: A4 total 297mm - 2*18mm margins - ~20mm header/footer overhead
  // Leaves 241mm max capacity. We budget 236mm to ensure comfortable 1:1 single-page fit.
  const marginMm = settings?.marginMm ?? 18;
  const MAX_PAGE_CONTENT_MM = Math.max(180, 272 - (marginMm * 2));

  const pages: DocumentBlock[][] = [];
  let currentPage: DocumentBlock[] = [];
  let currentHeightMm = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = estimateBlockHeightMm(block);

    // If adding this block exceeds page capacity, start a new page
    if (currentPage.length > 0 && currentHeightMm + blockHeight > MAX_PAGE_CONTENT_MM) {
      // Prevent orphan headings: if the last element on current page is an h1, h2, or h3,
      // move it to the beginning of the new page
      const lastBlock = currentPage[currentPage.length - 1];
      if (lastBlock && (lastBlock.type === 'h1' || lastBlock.type === 'h2' || lastBlock.type === 'h3')) {
        currentPage.pop();
        pages.push(currentPage);
        currentPage = [lastBlock, block];
        currentHeightMm = estimateBlockHeightMm(lastBlock) + blockHeight;
      } else {
        pages.push(currentPage);
        currentPage = [block];
        currentHeightMm = blockHeight;
      }
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
