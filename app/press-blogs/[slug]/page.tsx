import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, parseWordPressContent } from "../lib/posts";


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts
    .filter((post) => post["wp:post_name"] !== undefined && post["wp:post_name"] !== null)
    .map((post) => ({
      slug: String(post["wp:post_name"]), // Convert number or string safely
    }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params; // Next.js 15 requires awaiting params
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedContent = parseWordPressContent(post["content:encoded"]);

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <time dateTime={post.pubDate}>
            {new Date(post.pubDate).toLocaleDateString("en-US", {
              dateStyle: "long",
            })}
          </time>
        </div>
      </header>

      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </main>
  );
}