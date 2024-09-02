/**
 * Returns the line number and text at the given position in the source multi-line string.
 * @param source The multi-line string to search.
 * @param index The position to search at.
 * @param options Optional configuration for the search.
 *
 * @returns The line number and text at the given position.
 */
export function findLine(
  source: string,
  index: number,
  { lineEnding = '\n' } = {}
): { number: number; lineText: string } {
  const lines = source.split(lineEnding);
  let cumulativeLength = 0;

  for (let i = 0; i < lines.length; i++) {
    cumulativeLength += lines[i].length + 1; // +1 accounts for the newline character
    if (index < cumulativeLength) {
      return { number: i + 1, lineText: lines[i] }; // line number is 1-based
    }
  }

  // If position is beyond the document length, return the last line
  return { number: lines.length, lineText: lines[lines.length - 1] };
}
