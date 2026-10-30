const namedEntities: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const allowedAgreementTags = new Set([
  "A", "B", "BR", "DIV", "EM", "I", "LI", "OL", "P", "SPAN", "STRONG", "U", "UL",
]);

export function agreementContentToSafeHtml(content: string): string {
  const source = /<\/?[a-z][\s\S]*>/i.test(content)
    ? content
    : content
      ? content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
      : "";
  if (typeof document === "undefined") {
    const withoutDangerousBlocks = source.replace(/<(script|style|iframe|object|embed|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
    return withoutDangerousBlocks.replace(/<\s*(\/?)\s*([a-z0-9]+)\b([^>]*)>/gi, (_match, closing: string, name: string, attributes: string) => {
      const tag = name.toUpperCase();
      if (!allowedAgreementTags.has(tag)) return "";
      if (closing) return `</${name.toLowerCase()}>`;
      if (tag === "SPAN") {
        const styleMatch = /style\s*=\s*(["'])(.*?)\1/i.exec(attributes)?.[2] || "";
        const styles = [
          /font-weight\s*:\s*(?:bold|[6-9]00)/i.test(styleMatch) ? "font-weight:bold" : "",
          /font-style\s*:\s*italic/i.test(styleMatch) ? "font-style:italic" : "",
        ].filter(Boolean);
        return `<span${styles.length ? ` style="${styles.join(";")}"` : ""}>`;
      }
      if (tag !== "A") return `<${name.toLowerCase()}>`;
      const hrefMatch = /href\s*=\s*(["'])(.*?)\1/i.exec(attributes);
      const href = hrefMatch?.[2];
      if (!href || !/^https?:\/\//i.test(href)) return "<a>";
      const safeHref = href.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
    });
  }

  const container = document.createElement("div");
  container.innerHTML = source;

  Array.from(container.querySelectorAll<HTMLElement>("*")).forEach((element) => {
      if (!container.contains(element)) return;
      const tag = element.tagName.toUpperCase();
      if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG"].includes(tag)) {
        element.remove();
        return;
      }
      if (!allowedAgreementTags.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }

      const href = tag === "A" ? element.getAttribute("href") : null;
      const spanStyles = tag === "SPAN" ? {
        bold: /^(?:bold|[6-9]00)$/i.test(element.style.fontWeight),
        italic: element.style.fontStyle === "italic",
      } : null;
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
      if (spanStyles?.bold || spanStyles?.italic) {
        const styles = [
          spanStyles.bold ? "font-weight:bold" : "",
          spanStyles.italic ? "font-style:italic" : "",
        ].filter(Boolean);
        element.setAttribute("style", styles.join(";"));
      }
      if (href && /^https?:\/\//i.test(href)) {
        element.setAttribute("href", href);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    });

  return container.innerHTML;
}

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
