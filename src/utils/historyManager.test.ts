import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from './historyManager';

test('createHistory initializes history with present value', () => {
  const h = createHistory('initial');
  assert.equal(h.present, 'initial');
  assert.equal(h.past.length, 0);
  assert.equal(h.future.length, 0);
});

test('pushHistory adds previous present to past and updates present', () => {
  let h = createHistory('v1');
  h = pushHistory(h, 'v2');
  assert.equal(h.present, 'v2');
  assert.deepEqual(h.past, ['v1']);
  assert.equal(h.future.length, 0);

  h = pushHistory(h, 'v3');
  assert.equal(h.present, 'v3');
  assert.deepEqual(h.past, ['v1', 'v2']);
});

test('undoHistory steps backwards and moves present to future', () => {
  let h = createHistory('v1');
  h = pushHistory(h, 'v2');
  h = pushHistory(h, 'v3');

  h = undoHistory(h);
  assert.equal(h.present, 'v2');
  assert.deepEqual(h.past, ['v1']);
  assert.deepEqual(h.future, ['v3']);

  h = undoHistory(h);
  assert.equal(h.present, 'v1');
  assert.deepEqual(h.past, []);
  assert.deepEqual(h.future, ['v2', 'v3']);

  // Undoing when past is empty does nothing
  h = undoHistory(h);
  assert.equal(h.present, 'v1');
});

test('redoHistory steps forwards and restores future', () => {
  let h = createHistory('v1');
  h = pushHistory(h, 'v2');
  h = pushHistory(h, 'v3');

  h = undoHistory(h); // at v2
  h = undoHistory(h); // at v1

  h = redoHistory(h);
  assert.equal(h.present, 'v2');
  assert.deepEqual(h.past, ['v1']);
  assert.deepEqual(h.future, ['v3']);

  h = redoHistory(h);
  assert.equal(h.present, 'v3');
  assert.deepEqual(h.past, ['v1', 'v2']);
  assert.deepEqual(h.future, []);

  // Redoing when future is empty does nothing
  h = redoHistory(h);
  assert.equal(h.present, 'v3');
});
