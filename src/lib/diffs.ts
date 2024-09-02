import { Chunk } from '@codemirror/merge';
import { findLineIndex } from './strings';

export function countAffectedLinesFromChunk(
  content: string,
  chunk: Chunk,
  document: 'A' | 'B',
  options?: { lineEnding: string }
): number {
  const { lineEnding = '\n' } = options ?? {};

  let additions = 0;
  for (const change of chunk.changes) {
    const startLine = findLineIndex(content, change[`from${document}`], {
      lineEnding,
    });
    const endLine = findLineIndex(content, change[`to${document}`], {
      lineEnding,
    });

    additions += endLine - startLine + 1;
  }
  return additions;
}

export function countAffectedLines(
  content: string,
  chunks: readonly Chunk[],
  document: 'A' | 'B',
  options?: { lineEnding: string }
): number {
  return chunks.reduce(
    (total, chunk) =>
      total + countAffectedLinesFromChunk(content, chunk, document, options),
    0
  );
}
