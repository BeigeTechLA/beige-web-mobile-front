// lib/parseContent.ts

export interface ParsedBlogPost {
  leadImage: {
    src: string;
    srcset?: string;
    sizes?: string;
  } | null;
  blockquote: string | null;
  mainHtml: string;
}

export function extractPostData(rawHtml: string): ParsedBlogPost {
  if (typeof window === "undefined" || !rawHtml) {
    return { leadImage: null, blockquote: null, mainHtml: rawHtml || "" };
  }

  // Parse raw string into a DOM element structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // 1. Extract the top standalone <img> (Lead Cover Image)
  let leadImage: ParsedBlogPost["leadImage"] = null;
  const topImg = doc.querySelector("img");

  if (topImg && !topImg.closest("figure")) {
    leadImage = {
      src: topImg.getAttribute("src") || "",
      srcset: topImg.getAttribute("srcset") || undefined,
      sizes: topImg.getAttribute("sizes") || undefined,
    };
    // Remove the lead image from the body DOM so it doesn't duplicate
    topImg.remove();
  }

  // 2. Extract <blockquote> content
  let blockquote: string | null = null;
  const blockquoteEl = doc.querySelector("blockquote");
  if (blockquoteEl) {
    blockquote = blockquoteEl.innerHTML.trim();
    blockquoteEl.remove();
  }

  // 3. Get remaining body HTML inside <article> (or fallback to body)
  const articleEl = doc.querySelector("article");
  const mainHtml = articleEl ? articleEl.innerHTML : doc.body.innerHTML;

  return {
    leadImage,
    blockquote,
    mainHtml,
  };
}