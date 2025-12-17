"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "@/src/components/landing/Separator";

import NewCreatorsSection from "./components/NewCreatorsSection";
import SimilarCreatorsSection from "./components/SimilarCreatorsSection";
import HeroSection from "./components/HeroSection";

// Mock creator data
const mockCreators = [
  {
    id: "ethan-cole",
    name: "Ethan Cole",
    role: "Photographer Specialist",
    price: "From $450/Hr",
    rating: 4.5,
    reviews: 120,
    image: "/images/influencer/pressaarmani.png",
    isTopMatch: true,
  },
  {
    id: "angela-kia",
    name: "Angela Kia",
    role: "Videography Specialist",
    price: "From $120/Hr",
    rating: 4.0,
    image: "/images/influencer/natashaGraziano.png",
    reviews: 120,
  },
  {
    id: "lucas-bennett",
    name: "Lucas Bennett",
    role: "Photographer Specialist",
    price: "From $300/Hr",
    rating: 4.2,
    reviews: 101,
    image: "/images/influencer/cedrictheentertainer.png",
  },
  {
    id: "josh-bennett",
    name: "Josh Bennett",
    role: "Photographer Specialist",
    price: "From $200/Hr",
    rating: 4.0,
    reviews: 191,
    image: "/images/influencer/Sharukh.png",
  },
  {
    id: "lia-cole",
    name: "Lia Cole",
    role: "Photographer Specialist",
    price: "From $230/Hr",
    rating: 4.1,
    reviews: 141,
    image: "/images/influencer/pressaarmani.png",
  },
];

const additionalCreators = [
  {
    id: "creator-1",
    name: "Sarah Mitchell",
    role: "Visual Artist",
    price: "From $200/Hr",
    rating: 4.8,
    reviews: 45,
    image: "/images/influencer/chiefKeef.png",
  },
  {
    id: "creator-2",
    name: "Michael Chen",
    role: "Visual Artist",
    price: "From $200/Hr",
    rating: 4.8,
    reviews: 45,
    image: "/images/influencer/seanKelly.png",
  },
  {
    id: "creator-3",
    name: "Emily Rodriguez",
    role: "Visual Artist",
    price: "From $200/Hr",
    rating: 4.8,
    reviews: 45,
    image: "/images/influencer/CaseyVeggies.png",
  },
  {
    id: "creator-4",
    name: "David Park",
    role: "Visual Artist",
    price: "From $200/Hr",
    rating: 4.8,
    reviews: 45,
    image: "/images/influencer/Sharukh.png",
  },
];

const newCreators = [
  {
    id: "new-talent-1",
    name: "Isabella Torres",
    role: "Creative Director",
    price: "From $150/Hr",
    rating: 5.0,
    reviews: 12,
    image: "/images/influencer/kingkarlx@2x.png",
  },
  {
    id: "new-talent-2",
    name: "Alex Kim",
    role: "Creative Director",
    price: "From $150/Hr",
    rating: 5.0,
    reviews: 12,
    image: "/images/influencer/natashaGraziano.png",
  },
  {
    id: "new-talent-3",
    name: "Jordan Lee",
    role: "Creative Director",
    price: "From $150/Hr",
    rating: 5.0,
    reviews: 12,
    image: "/images/influencer/pressaarmani.png",
  },
  {
    id: "new-talent-4",
    name: "Taylor Morgan",
    role: "Creative Director",
    price: "From $150/Hr",
    rating: 5.0,
    reviews: 12,
    image: "/images/influencer/cedrictheentertainer.png",
  },
];


function SearchResultsContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId") || undefined;

  return (
    <div className="pt-32 pb-20">
      {/* Main Section: Header + Main Grid */}
      <HeroSection matchedCreators={mockCreators} shootId={shootId} />
      <Separator />

      {/* Section: We Think You'll Love These */}
      <SimilarCreatorsSection
        additionalCreators={additionalCreators}
        shootId={shootId}
      />

      {/* Section: New Creators */}
      <NewCreatorsSection
        newCreators={newCreators}
        shootId={shootId}
      />

      {/* Fix the footer styling before implementing this */}
      {/* <div className="my-24">
        <Separator />
      </div> */}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <SearchResultsContent />
      </Suspense>
      <Footer />
    </main>
  );
}
