import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateBlocks, estimateBlockHeight } from './pagination';
import { DocumentBlock } from '../types';

test('estimateBlockHeight returns reasonable heights for elements', () => {
  const h1Block: DocumentBlock = { type: 'h1', text: 'IFRS 8', id: '1' };
  assert.ok(estimateBlockHeight(h1Block) >= 100);

  const paraBlock: DocumentBlock = { type: 'paragraph', text: 'פסקה קצרה' };
  assert.ok(estimateBlockHeight(paraBlock) > 20);
});

test('paginateBlocks splits blocks into multiple pages when exceeding budget', () => {
  const blocks: DocumentBlock[] = [
    { type: 'h1', text: 'כותרת ראשית', id: '1' },
    { type: 'paragraph', text: 'פסקה ארוכה '.repeat(50) },
    { type: 'paragraph', text: 'פסקה שנייה '.repeat(50) },
    { type: 'paragraph', text: 'פסקה שלישית '.repeat(50) },
  ];

  const pages = paginateBlocks(blocks, 500);
  assert.ok(pages.length >= 2, `Expected at least 2 pages, got ${pages.length}`);
  assert.equal(pages[0].pageNumber, 1);
  assert.equal(pages[1].pageNumber, 2);
});

test('paginateBlocks respects manual page breaks (hr)', () => {
  const blocks: DocumentBlock[] = [
    { type: 'h1', text: 'עמוד ראשון', id: '1' },
    { type: 'hr' },
    { type: 'h2', text: 'עמוד שני', id: '2' },
  ];

  const pages = paginateBlocks(blocks, 1500);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].blocks[0].type, 'h1');
  assert.equal(pages[1].blocks[0].type, 'h2');
});
