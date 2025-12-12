"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// Mock creator data
const mockCreators = [
  {
    id: "ethan-cole",
    name: "Ethan Cole",
    role: "Photographer Specialist",
    price: "From $450/Hr",
    rating: 4.5,
    reviews: 120,
    image: "/images/influencer/natashaGraziano.png",
    isTopMatch: true,
  },
  {
    id: "angela-kia",
    name: "Angela Kia",
    role: "Videography Specialist",
    price: "From $120/Hr",
    rating: 4.0,
    reviews: 120,
    image: "/images/influencer/pressaarmani.png",
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

const CreatorCard = ({
  name,
  role,
  price,
  rating,
  reviews,
  image,
  isTopMatch = false,
  shootId,
  creatorId,
}: {
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
  shootId?: string;
  creatorId: string;
}) => (
  <div
    className={`relative group overflow-hidden rounded-[20px] ${
      isTopMatch
        ? "col-span-1 md:col-span-2 lg:col-span-1 lg:row-span-2 h-full"
        : "h-[400px]"
    }`}
  >
    <Image
      src={image}
      alt={name}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

    {/* Top Badge */}
    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
      <Star className="w-3 h-3 text-[#E8D1AB] fill-[#E8D1AB]" />
      <span className="text-white text-xs font-medium">
        {rating} ({reviews})
      </span>
    </div>

    {isTopMatch && (
      <div className="absolute top-4 left-4 bg-[#E8D1AB] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
        Top Match
      </div>
    )}

    {/* Content */}
    <div className="absolute bottom-0 left-0 w-full p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white text-xl font-medium">{name}</h3>
            <span className="bg-[#4CAF50]/20 text-[#4CAF50] text-[10px] px-2 py-0.5 rounded-full border border-[#4CAF50]/30">
              Available
            </span>
          </div>
          <p className="text-white/60 text-sm">{role}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex flex-col">
          <span className="text-white/40 text-xs">Starting at</span>
          <span className="text-[#E8D1AB] font-medium">{price}</span>
        </div>
        <Link
          href={`/search-results/${creatorId}${
            shootId ? `?shootId=${shootId}` : ""
          }`}
        >
          <Button className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black h-9 px-4 rounded-lg text-sm font-medium">
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId") || undefined;

  return (
    <div className="pt-32 pb-20">
      {/* Header Section */}
      <div className="text-center pt-8 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4">
            Here is Your Top Matched <br />
            <span className="text-white">Creative Producer</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Here are matches based on your preferences. Select the best fit for
            your project.
          </p>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {/* Top Match - Ethan Cole */}
          <div className="lg:col-start-2">
            <CreatorCard {...mockCreators[0]} shootId={shootId} creatorId={mockCreators[0].id} />
          </div>

          {/* Other Matches */}
          <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
            <CreatorCard {...mockCreators[1]} shootId={shootId} creatorId={mockCreators[1].id} />
          </div>
          <div className="flex flex-col gap-6 lg:col-start-3 lg:row-start-1">
            <CreatorCard {...mockCreators[2]} shootId={shootId} creatorId={mockCreators[2].id} />
          </div>
        </div>

        {/* Section: We Think You'll Love These */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-medium">We Think You'll Love These</h3>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalCreators.map((creator) => (
              <CreatorCard key={creator.id} {...creator} shootId={shootId} creatorId={creator.id} />
            ))}
          </div>
        </div>

        {/* Section: New Creators */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-medium">New Creators on Beige</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newCreators.map((creator) => (
              <CreatorCard key={creator.id} {...creator} shootId={shootId} creatorId={creator.id} />
            ))}
          </div>
        </div>
      </div>
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
