import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from './documentParser';
import { paginateBlocks } from './paginator';
import { SAMPLE_IFRS8_MARKDOWN } from './sampleData';

test('paginateBlocks fills A4 pages up to 245mm capacity and paginates IFRS 8 sample to 3-4 pages', () => {
  const blocks = parseDocument(SAMPLE_IFRS8_MARKDOWN);
  const pages = paginateBlocks(blocks);

  // Must be between 3 and 4 pages, definitely not 8!
  assert.ok(pages.length >= 3 && pages.length <= 4, `Expected 3 to 4 pages, got ${pages.length}`);

  // Page 1 should contain h1, IG1, IG2, IG3, and the main segment information table
  assert.equal(pages[0][0].type, 'h1');
  const page1HasTable = pages[0].some((b) => b.type === 'table');
  assert.equal(page1HasTable, true, 'Page 1 must contain the segment information table without premature break');
});
