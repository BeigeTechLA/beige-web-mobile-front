
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