export function findLineIndex(
  multiLineString: string,
  absoluteIndex: number,
  options?: { lineEnding: string }
): number {
  const { lineEnding = '\n' } = options ?? {};
  const lines = multiLineString.split(lineEnding);
  let cumulativeLength = 0;

  for (let i = 0; i < lines.length; i++) {
    cumulativeLength += lines[i].length + lineEnding.length;
    if (cumulativeLength > absoluteIndex) {
      return i;
    }
  }

  return -1;
}
