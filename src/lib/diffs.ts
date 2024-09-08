import { Chunk } from '@codemirror/merge';
import { countLinesSpanned } from './strings';

export function calculateLinesRemovedAndAdded(
  chunks: readonly Chunk[],
  textA: string,
  textB: string,
): {
  additions: number;
  removals: number;
} {
  return chunks.reduce(
    (accumulator, chunk) => {
      const removed = countLinesSpanned(textA, chunk.fromA, chunk.toA);
      const added = countLinesSpanned(textB, chunk.fromB, chunk.toB);
      return {
        additions: accumulator.additions + added,
        removals: accumulator.removals + removed,
      };
    },
    { additions: 0, removals: 0 },
  );
}
