export function countLinesSpanned(
  text: string,
  from: number,
  to: number
): number {
  return text.slice(from, to).split('\n').length - 1;
}
