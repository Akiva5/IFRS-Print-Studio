/**
 * History Manager for Undo / Redo functionality
 */
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initialPresent: T): HistoryState<T> {
  return {
    past: [],
    present: initialPresent,
    future: [],
  };
}

export function pushHistory<T>(
  history: HistoryState<T>,
  newPresent: T,
  maxHistory = 50
): HistoryState<T> {
  // If the new present is identical to current present, no-op
  if (history.present === newPresent) {
    return history;
  }

  const newPast = [...history.past, history.present];
  if (newPast.length > maxHistory) {
    newPast.shift();
  }

  return {
    past: newPast,
    present: newPresent,
    future: [], // Clear future on new branch
  };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) {
    return history;
  }

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history;
  }

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}
