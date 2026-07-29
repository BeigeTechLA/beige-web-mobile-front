import { Separator } from "@/src/components/landing/Separator";
import { PortfolioHero } from "@/src/components/portfolio/PortfolioHero";
import { DisplayGrid } from "@/src/components/portfolio/DisplayGrid";

interface PageProps {
  params: {
    slug?: string[]; // slug[0] is category, slug[1] is subcat
  };
}

export default function VideoPortfolioPage({ params }: PageProps) {
  const { slug = [] } = params;

  // Destructure for clarity
  const category = slug[0]; // e.g., "corporate" or "lifestyle"
  const subCategory = slug[1]; // e.g., "automotive" or undefined

  return (
    <main className="min-h-screen text-white font-sans">
      <PortfolioHero type={"video"} category={subCategory || category} />
      <Separator />
      <DisplayGrid type={"video"} category={subCategory || category} />
    </main>
  );
}