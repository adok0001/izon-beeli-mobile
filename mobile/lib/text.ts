/**
 * Split a block of prose into readable paragraphs: honour explicit blank-line
 * breaks, otherwise group into ~2 sentences each. Used by the cultural reader
 * and the lesson culture-note reader so long text doesn't render as one wall.
 */
export function toParagraphs(text: string): string[] {
  const explicit = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text];
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) paras.push(sentences.slice(i, i + 2).join(" "));
  return paras;
}
