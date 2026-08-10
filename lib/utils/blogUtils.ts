
export function calculateReadTime(content: string, wpm: number = 200): string {
  if (!content) return "1 min read";

  // 1. Strip out HTML tags to count actual text words only
  const plainText = content.replace(/<[^>]+>/g, "").trim();

  // 2. Count words separated by whitespace
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // 3. Calculate minutes and round up
  const minutes = Math.ceil(wordCount / wpm);

  if (minutes < 1) {
    return "< 1 min read";
  }

  return `${minutes} min read`;
}

// Helper function to extract a clean text description from HTML content
export const extractPlainText = (htmlContent: string, maxLength = 220): string => {
  if (!htmlContent) return "";
  const plainText = htmlContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength
    ? `${plainText.substring(0, maxLength)}...`
    : plainText;
};

// Helper function to extract the first image URL from content if thumbnail is missing
export const extractFirstImage = (htmlContent: string): string => {
  if (!htmlContent) return "/images/misc/placeholder.png";
  const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "/images/misc/placeholder.png";
};

export interface BlogHeading {
  id: string;
  text: string;
}

export function extractAndInjectHeadings(htmlContent: string): {
  contentWithIds: string;
  headings: BlogHeading[];
} {
  if (!htmlContent) return { contentWithIds: "", headings: [] };

  // Determine highest order heading present in content
  let targetTag = "";
  if (/<h1\b[^>]*>/i.test(htmlContent)) {
    targetTag = "h1";
  } else if (/<h2\b[^>]*>/i.test(htmlContent)) {
    targetTag = "h2";
  } else if (/<h3\b[^>]*>/i.test(htmlContent)) {
    targetTag = "h3";
  } else {
    return { contentWithIds: htmlContent, headings: [] };
  }

  const headings: BlogHeading[] = [];

  // 2. Extract target headings
  const regex = new RegExp(`<${targetTag}\\b([^>]*)>([\\s\\S]*?)</${targetTag}>`, "gi");

  const contentWithIds = htmlContent.replace(regex, (match, existingAttrs, innerContent) => {
    // Strip HTML tags and collapse whitespace
    const cleanText = innerContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    if (!cleanText) return match;

    // Check for existing ID
    const existingIdMatch = existingAttrs.match(/id=["']([^"']+)["']/i);
    let id = "";

    if (existingIdMatch && existingIdMatch[1]) {
      id = existingIdMatch[1];
    } else {
      // Generate URL-safe slug
      id = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      existingAttrs = `${existingAttrs} id="${id}"`;
    }

    headings.push({ id, text: cleanText });

    return `<${targetTag}${existingAttrs}>${innerContent}</${targetTag}>`;
  });

  return { contentWithIds, headings };
}