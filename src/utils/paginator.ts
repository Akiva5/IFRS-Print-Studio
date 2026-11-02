import { DocumentBlock, DocumentSettings } from '../types';
import { isInternalHeading } from './htmlRenderer';

/**
 * Checks if a block is any type of heading (h1, h2, h3, or internal heading paragraph).
 */
export function isHeadingBlock(block: DocumentBlock): boolean {
  if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
    return true;
  }
  if (block.type === 'paragraph' && isInternalHeading(block.text)) {
    return true;
  }
  return false;
}

/**
 * Estimates the printed height of a block in millimeters (mm).
 * Calibrated for David Libre 11.5pt font, line-height 1.48, and standard A4 content column width (170mm).
 */
export function estimateBlockHeightMm(block: DocumentBlock): number {
  switch (block.type) {
    case 'h1': {
      const lines = Math.max(1, Math.ceil(block.text.length / 50));
      return 14 + lines * 7.0;
    }

    case 'h2': {
      const lines = Math.max(1, Math.ceil(block.text.length / 55));
      return 9 + lines * 6.0;
    }

    case 'h3': {
      const lines = Math.max(1, Math.ceil(block.text.length / 60));
      return 7 + lines * 5.5;
    }

    case 'toc': {
      let height = 12;
      block.items.forEach((item) => {
        const lines = Math.max(1, Math.ceil(item.title.length / 55));
        height += lines * 5.0 + 2.0;
      });
      return height;
    }

    case 'subparagraph': {
      const charCount = block.text.length + block.marker.length;
      const lines = Math.max(1, Math.ceil(charCount / 70));
      return lines * 5.8 + 2.5;
    }

    case 'hanging_paragraph': {
      let height = 0;
      if (block.body) {
        const charCount = block.body.length;
        const lines = Math.max(1, Math.ceil(charCount / 75));
        height += lines * 5.8 + 2.5;
      }
      if (block.subparagraphs && block.subparagraphs.length > 0) {
        block.subparagraphs.forEach((sub) => {
          const charCount = sub.text.length + sub.marker.length;
          const lines = Math.max(1, Math.ceil(charCount / 70));
          height += lines * 5.8 + 2.0;
        });
      }
      return Math.max(height, 8.0);
    }

    case 'paragraph': {
      // Internal headings like "ניתוח", "וריאציה 1", "הסכם בעלי מניות"
      if (isInternalHeading(block.text)) {
        return 8.5;
      }
      const charCount = block.text.length;
      const lines = Math.max(1, Math.ceil(charCount / 78));
      return lines * 5.8 + 2.5;
    }

    case 'footnote': {
      const charCount = block.text.length + block.marker.length;
      const lines = Math.max(1, Math.ceil(charCount / 85));
      return lines * 4.8 + 2.5;
    }

    case 'quote': {
      const lines = Math.max(1, Math.ceil(block.text.length / 75));
      return lines * 5.8 + 5.0;
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
          height += 8.0;
        } else {
          const maxCellLen = Math.max(...row.cells.map((c) => c.text.length), 0);
          const cellLines = Math.max(1, Math.ceil(maxCellLen / 35));
          height += cellLines * 6.5;
        }
      });
      height += 6.0; // table margin
      return height;
    }
  }
}

/**
 * Paginates document blocks into separate A4 pages.
 * Fills each page up to its genuine printable capacity without premature breaks,
 * prevents orphan headings by pushing headings to the next page if remaining space < 30mm,
 * and maintains natural paragraph continuity across page boundaries.
 */
export function paginateBlocks(
  blocks: DocumentBlock[],
  settings?: DocumentSettings
): DocumentBlock[][] {
  if (blocks.length === 0) return [];

  // Net printable height: A4 total 296.5mm - 2*18mm margins - ~14mm header overhead = ~246mm
  const marginMm = settings?.marginMm ?? 18;
  const MAX_PAGE_CONTENT_MM = Math.max(180, 276 - (marginMm * 2)); // ~240mm comfortable budget
  const MAX_PAGE_CAPACITY_MM = Math.max(195, 284 - (marginMm * 2)); // ~248mm physical limit

  const pages: DocumentBlock[][] = [];
  let currentPage: DocumentBlock[] = [];
  let currentHeightMm = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = estimateBlockHeightMm(block);
    const isHeading = isHeadingBlock(block);
    const remainingSpaceMm = MAX_PAGE_CONTENT_MM - currentHeightMm;

    // Rule 1: If current element is a heading (h1, h2, h3, .internal-heading) and remaining space < 30mm,
    // automatically push it to the next page to prevent orphan headings at the bottom
    if (currentPage.length > 0 && isHeading && remainingSpaceMm < 30) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeightMm = blockHeight;
      continue;
    }

    // Manual page break (hr)
    if (block.type === 'hr') {
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeightMm = 0;
      }
      continue;
    }

    // Check if adding this block exceeds page capacity
    if (currentPage.length > 0 && currentHeightMm + blockHeight > MAX_PAGE_CONTENT_MM) {
      // If block is a heading, it must move to next page
      if (isHeading) {
        pages.push(currentPage);
        currentPage = [block];
        currentHeightMm = blockHeight;
        continue;
      }

      // Rule 2: Continuity for paragraphs - do not force an entire paragraph to jump
      // if there is enough space (>= 18mm) and it still fits within the physical page boundary (up to 248mm)
      if (remainingSpaceMm >= 18 && currentHeightMm + blockHeight <= MAX_PAGE_CAPACITY_MM) {
        currentPage.push(block);
        currentHeightMm += blockHeight;
        continue;
      }

      // Rule 3: For hanging paragraphs with multiple subparagraphs (like IE4 with (א), (ב), (ג)...),
      // if there is enough room to start (>= 18mm), split subparagraphs cleanly across the boundary
      if (
        block.type === 'hanging_paragraph' &&
        block.subparagraphs &&
        block.subparagraphs.length > 1 &&
        remainingSpaceMm >= 18
      ) {
        const bodyH = block.body ? Math.max(1, Math.ceil(block.body.length / 75)) * 5.8 + 2.5 : 8.0;
        let runningH = bodyH;
        const page1Subs: typeof block.subparagraphs = [];
        const page2Subs: typeof block.subparagraphs = [];

        for (const sub of block.subparagraphs) {
          const subH = Math.max(1, Math.ceil((sub.text.length + sub.marker.length) / 70)) * 5.8 + 2.0;
          if (runningH + subH <= remainingSpaceMm || page1Subs.length === 0) {
            page1Subs.push(sub);
            runningH += subH;
          } else {
            page2Subs.push(sub);
          }
        }

        if (page1Subs.length > 0 && page2Subs.length > 0) {
          currentPage.push({
            ...block,
            subparagraphs: page1Subs,
          });
          pages.push(currentPage);
          const continuationBlock: DocumentBlock = {
            type: 'hanging_paragraph',
            code: `${block.code} (המשך)`,
            body: '',
            subparagraphs: page2Subs,
          };
          currentPage = [continuationBlock];
          currentHeightMm = estimateBlockHeightMm(continuationBlock);
          continue;
        }
      }

      // Standard page break:
      // Prevent orphan heading as the last element on the current page
      const lastBlock = currentPage[currentPage.length - 1];
      if (lastBlock && isHeadingBlock(lastBlock)) {
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
