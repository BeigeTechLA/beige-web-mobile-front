import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, parseWordPressContent } from "../lib/posts";
import { Navbar } from "@/src/components/landing/Navbar";
import { Container } from "@/src/components/landing/ui/container";
import { Clock, Calendar } from "lucide-react";
import { BackButton } from "@/components/common/BackButton";
import { calculateReadTime, extractFirstImage, extractAndInjectHeadings } from "@/lib/utils/blogUtils";
import { CustomBlogRenderer } from "@/components/press-blogs/CustomBlogRender";
import { BlogTableOfContents } from "@/components/press-blogs/BlogTableOfContents";
import { Separator } from "@/src/components/landing/Separator";
import { Footer } from "@/src/components/landing/Footer";
import { RecommendedBlogs } from "@/components/press-blogs/RecommendedBlog";

interface Props {
  params: Promise<{ slug: string }>;
}

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

// Exported function serving Next.js SSG build and internal category filtering
export async function generateStaticParams(category?: string) {
  try {
    const posts = getAllPosts();
    if (!Array.isArray(posts)) return [];

    // Filter by category when called inside the page component
    if (category) {
      return posts.filter((post) => {
        const categoryName = post.category?.["title"] || post.category;
        return categoryName === category;
      });
    }

    // Default Next.js SSG behavior: map all slugs
    return posts.map((post) => ({
      slug: String(post.post_name),
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }
  
const categoryTitle = typeof post.category === "object" 
  ? post.category?.title 
  : post.category;

const moreContent = await generateStaticParams(categoryTitle);
  const formattedContent = parseWordPressContent(post["content:encoded"] || "");

  // Extract highest level headings and inject IDs into content
  const { contentWithIds, headings } = extractAndInjectHeadings(formattedContent);

  const readTime = calculateReadTime(formattedContent);
  const rawImage = extractFirstImage(post["content:encoded"] || "");
  const blogImage = rawImage.startsWith("/images/misc/")
    ? "/images/misc/BeigeLogoPlaceholder.png"
    : `${S3_PREFIX}${rawImage}`;

  const formattedDate = post.pubDate && !isNaN(Date.parse(post.pubDate))
    ? new Date(post.pubDate).toLocaleDateString("en-US", { dateStyle: "long" })
    : "";

  return (
    <main className="min-h-screen text-white py-10 lg:py-20 lg:py-35 relative overflow-hidden">
      <Navbar />

      <Container>
        <BackButton backLink="/press-blogs" />
        <div className="my-10 lg:mt-30 lg:mb-15 space-y-4 lg:space-y-8">
          <div className="flex items-center gap-4 mb-4 text-[#818181] text-sm lg:text-lg">
            <div className="flex gap-1 items-center">
              <Clock size={20} />
              <span className="ml-2">{readTime}</span>
            </div>
            {formattedDate && (
              <div className="flex gap-1 items-center">
                <Calendar size={20} />
                <span className="ml-2">{formattedDate}</span>
              </div>
            )}
            <div>By Beige Media</div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-30 items-start">
            <h1 className="w-full lg:w-2/3 text-xl lg:text-6xl font-bold">{post.title}</h1>

            <img
              src={blogImage}
              alt={post.title}
              className="w-full lg:w-1/3 h-auto object-cover rounded-2xl"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 mb-10 lg:mb-40">
          {headings.length > 0 && (
            <div className="w-full lg:w-1/4">
              <BlogTableOfContents headings={headings} />
            </div>
          )}

          {/* <div
            className="prose dark:prose-invert max-w-none w-full lg:w-3/4 font-yrsa"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          /> */}
          <div className={`w-full ${headings.length > 0 ? "lg:w-3/4" : ""}`}>
            <CustomBlogRenderer rawContent={contentWithIds} />
          </div>
        </div>

        <Separator />
        <RecommendedBlogs moreContent={moreContent} />

        <Footer />
      </Container>
    </main>
  );
}