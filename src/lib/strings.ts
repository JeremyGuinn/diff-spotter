export function countLinesSpanned(
  text: string,
  from: number,
  to: number
): number {
  return text.slice(from, to).split('\n').length - 1;
}

export function cleanMultilineString(inputString: string): string {
  return inputString
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export function strToNumber(value: number | string): number {
  if (typeof value === 'string' && !isNaN(Number(value) - parseFloat(value))) {
    return Number(value);
  }
  if (typeof value !== 'number') {
    throw new Error(`${value} is not a number`);
  }
  return value;
}
