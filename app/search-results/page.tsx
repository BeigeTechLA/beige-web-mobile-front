"use client";

import React, { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "@/src/components/landing/Separator";

import NewCreatorsSection from "./components/NewCreatorsSection";
import SimilarCreatorsSection from "./components/SimilarCreatorsSection";
import HeroSection from "./components/HeroSection";
import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";
import type { Creator } from "@/lib/types";

// Type for frontend creator display
interface DisplayCreator {
  id: string;
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
  matchScore?: number; // New: skill match score
  matchingSkills?: string[]; // New: which skills matched
}

// Transform backend creator to frontend structure
const transformCreator = (c: Creator, isTopMatch: boolean = false): DisplayCreator => ({
  id: String(c.crew_member_id),
  name: c.name,
  role: c.role_name || "Creative Professional",
  price: c.hourly_rate ? `From $${c.hourly_rate}/Hr` : "Contact for pricing",
  rating: c.rating || 0,
  reviews: c.total_reviews || 0,
  image: c.profile_image || '/images/influencer/default.png',
  isTopMatch,
  matchScore: c.matchScore, // Pass through match score
  matchingSkills: c.matchingSkills, // Pass through matching skills
});

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId") || undefined;

  // Extract search parameters (supports both legacy and new params)
  const budget = searchParams.get("budget") ? Number(searchParams.get("budget")) : undefined;
  const min_budget = searchParams.get("min_budget") ? Number(searchParams.get("min_budget")) : undefined;
  const max_budget = searchParams.get("max_budget") ? Number(searchParams.get("max_budget")) : undefined;
  const location = searchParams.get("location") || undefined;
  const maxDistance = searchParams.get("maxDistance") ? Number(searchParams.get("maxDistance")) : undefined;
  const skills = searchParams.get("skills") || undefined;
  const content_type = searchParams.get("content_type") ? Number(searchParams.get("content_type")) : undefined;
  const content_types = searchParams.get("content_types") || undefined;

  // Fetch creators from backend API with all new parameters
  const { data, isLoading, error } = useSearchCreatorsQuery({
    // Budget filters (new: min/max range support)
    budget,
    min_budget,
    max_budget,

    // Location filters (new: maxDistance for proximity search)
    location,
    maxDistance,

    // Skills filter (new: triggers skill-based scoring)
    skills,

    // Role filters (new: multiple roles support)
    content_type,
    content_types,

    // Pagination
    page: 1,
    limit: 20,
  });

  // Transform and split creators into sections
  const { matchedCreators, additionalCreators, newCreators } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return {
        matchedCreators: [],
        additionalCreators: [],
        newCreators: [],
      };
    }

    const allCreators = data.data;

    // Note: Backend already sorts by matchScore (if skills provided) then rating
    // So we can trust the order from the API

    // First 5 as top matches (already best matches due to backend sorting)
    const matched = allCreators.slice(0, 5).map((c, idx) => transformCreator(c, idx === 0));

    // Split remaining creators between additional and new
    const remaining = allCreators.slice(5);
    const midpoint = Math.ceil(remaining.length / 2);

    const additional = remaining.slice(0, midpoint).map(c => transformCreator(c));
    const newOnes = remaining.slice(midpoint).map(c => transformCreator(c));

    return {
      matchedCreators: matched,
      additionalCreators: additional,
      newCreators: newOnes,
    };
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Finding the perfect creators for you...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">Unable to load creators at this time.</p>
          <p className="text-gray-400">Please try again later or adjust your search criteria.</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (matchedCreators.length === 0) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-white text-lg mb-4">No creators found matching your criteria.</p>
          <p className="text-gray-400">Try adjusting your budget, location, or content type filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-32 pb-20">
      {/* Main Section: Header + Main Grid */}
      <HeroSection matchedCreators={matchedCreators} shootId={shootId} />
      <Separator />

      {/* Section: We Think You'll Love These */}
      {additionalCreators.length > 0 && (
        <SimilarCreatorsSection
          additionalCreators={additionalCreators}
          shootId={shootId}
        />
      )}

      {/* Section: New Creators */}
      {newCreators.length > 0 && (
        <NewCreatorsSection
          newCreators={newCreators}
          shootId={shootId}
        />
      )}

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
      <Suspense fallback={
        <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Finding the perfect creators for you...</p>
          </div>
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
      <Footer />
    </main>
  );
}
