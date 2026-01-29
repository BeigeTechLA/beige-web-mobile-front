import { Separator } from "@/src/components/landing/Separator";
import { DisplayGrid } from "@/src/components/portfolio/DisplayGrid";
import { PortfolioHero } from "@/src/components/portfolio/PortfolioHero";

interface PageProps {
  params: {
    slug?: string[]; // slug[0] is category, slug[1] is subcat
  };
}

export default function PhotoPortfolioPage({ params }: PageProps) {
  const { slug = [] } = params;

  // Destructure for clarity
  const category = slug[0]; 
  const subCategory = slug[1];

  return (
    <main className="min-h-screen text-white font-sans">
      <PortfolioHero type={"photo"} category={subCategory || category} />
      <Separator />
      <DisplayGrid category={subCategory || category} />
    </main>
  );
}