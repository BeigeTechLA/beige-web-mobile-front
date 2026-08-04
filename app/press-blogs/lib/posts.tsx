import postsData from "../data/blog.json"
import { BlogData,BlogPost } from "./types";

const data = postsData as unknown as BlogData;

// Get all posts (filtered by wp:post_type === "post")
export function getAllPosts(): BlogPost[] {
  const rawItems = data?.rss?.channel?.item;

  if (!rawItems) return [];

  // Normalize single object or array to an array
  const itemsList = Array.isArray(rawItems) ? rawItems : [rawItems];

  // Filter only items with wp:post_type === "post"
  return itemsList.filter((item) => item["wp:post_type"] === "post");
}

// Get single post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((post) => String(post["wp:post_name"]) === String(slug));
}

// Helper to format WordPress embeds [embed]URL[/embed] to <iframe> elements
export function parseWordPressContent(content: string): string {
  if (!content) return "";

  // Convert [embed]https://www.youtube.com/embed/XYZ[/embed] to iframe
  return content.replace(
    /\[embed\](https:\/\/www\.youtube\.com\/embed\/[^\[]+)\[\/embed\]/g,
    (_, src) =>
      `<div class="aspect-video w-full my-6"><iframe src="${src}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>`
  );
}