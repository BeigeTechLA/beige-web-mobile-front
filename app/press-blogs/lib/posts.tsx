import postsData from "../data/blog.json"
import { BlogData, BlogPost } from "./types";

const data = postsData as unknown as BlogData;

/**
 * Get all posts filtered by post_type === "post"
 */
export function getAllPosts(): BlogPost[] {
  // Access items directly from root item array
  const rawItems = data?.item;

  if (!rawItems) return [];

  // Normalize single object or array to an array
  const itemsList = Array.isArray(rawItems) ? rawItems : [rawItems];

  // Filter only items where post_type is "post"
  return itemsList.filter((item) => item.post_type === "post");
}

/**
 * Get a single post by slug (post_name)
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((post) => String(post.post_name) === String(slug));
}

/**
 * Helper to format WordPress embeds [embed]URL[/embed] to <iframe> elements
 */
export function parseWordPressContent(content: string): string {
  if (!content) return "";

  // Convert [embed]https://www.youtube.com/embed/XYZ[/embed] to iframe
  return content.replace(
    /\[embed\](https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/)([^\[\s&]+))[^\[]*\[\/embed\]/g,
    (_, __, videoId) =>
      `<div class="aspect-video w-full my-6"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full rounded-lg" allowfullscreen frameborder="0"></iframe></div>`
  );
}