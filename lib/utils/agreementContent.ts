const namedEntities: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

export function agreementContentPreview(content: string): string {
  return content
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div|li|h[1-6]|section)\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== "#") return namedEntities[code.toLowerCase()] ?? " ";
      const value = code[1]?.toLowerCase() === "x"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      try {
        return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
      } catch {
        return " ";
      }
    })
    .replace(/\s+/g, " ")
    .trim();
}
