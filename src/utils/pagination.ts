import { DocumentBlock } from '../types';

export interface PageData {
  pageNumber: number;
  blocks: DocumentBlock[];
}

/**
 * Estimates the pixel height of a document block at 96 DPI A4 scale (11.5pt font).
 */
export function estimateBlockHeight(block: DocumentBlock): number {
  switch (block.type) {
    case 'h1':
      // Framed title with top and bottom borders and margins
      return 115;

    case 'h2':
      return 55;

    case 'h3':
      return 45;

    case 'hanging_paragraph': {
      // Estimate lines based on text length in Hebrew: ~75 chars per line in justified David 11.5pt
      const charCount = (block.code?.length || 0) + (block.body?.length || 0);
      const estimatedLines = Math.max(1, Math.ceil(charCount / 75));
      return estimatedLines * 24 + 18; // line height + bottom margin
    }

    case 'paragraph': {
      const charCount = block.text?.length || 0;
      const estimatedLines = Math.max(1, Math.ceil(charCount / 85));
      return estimatedLines * 24 + 18;
    }

    case 'table': {
      // Header row: ~36px
      let tableHeight = 40;
      // Each row in table: ~28px
      tableHeight += (block.table.rows?.length || 0) * 28;
      // Margin: ~25px
      return tableHeight + 25;
    }

    case 'footnote':
      return 26;

    case 'quote': {
      const charCount = block.text?.length || 0;
      const estimatedLines = Math.max(1, Math.ceil(charCount / 75));
      return estimatedLines * 24 + 20;
    }

    case 'hr':
      return 25;

    default:
      return 30;
  }
}

/**
 * Paginates document blocks into distinct A4 pages.
 * Available height per A4 page with 18mm margins minus running header (~40px) and footer (~40px)
 * is approximately 920px (at 96 DPI standard scale, where 297mm = 1122.5px).
 */
export function paginateBlocks(
  blocks: DocumentBlock[],
  maxPageHeight: number = 900
): PageData[] {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  const pages: PageData[] = [];
  let currentPageBlocks: DocumentBlock[] = [];
  let currentHeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Manual page break via hr '---'
    if (block.type === 'hr') {
      if (currentPageBlocks.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          blocks: currentPageBlocks,
        });
        currentPageBlocks = [];
        currentHeight = 0;
      }
      continue;
    }

    const blockHeight = estimateBlockHeight(block);

    // If block doesn't fit on current page and current page already has content, break to next page
    if (currentHeight + blockHeight > maxPageHeight && currentPageBlocks.length > 0) {
      pages.push({
        pageNumber: pages.length + 1,
        blocks: currentPageBlocks,
      });
      currentPageBlocks = [block];
      currentHeight = blockHeight;
    } else {
      currentPageBlocks.push(block);
      currentHeight += blockHeight;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      blocks: currentPageBlocks,
    });
  }

  return pages;
}
