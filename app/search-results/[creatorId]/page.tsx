"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Mock creator data
const mockCreator = {
  id: "ethan-cole",
  name: "Ethan Cole",
  role: "Photographer Specialist",
  rating: 4.5,
  reviews: 120,
  price: 450,
  available: true,
  about:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
  skills: ["Photography Event", "Photography", "Natural Light Photography"],
  equipment: ["Macbook Pro M1", "Adobe Creative Suite", "Body Vibrotic Pro+"],
  images: [
    "/images/influencer/natashaGraziano.png",
    "/images/influencer/pressaarmani.png",
    "/images/influencer/cedrictheentertainer.png",
    "/images/influencer/chiefKeef.png",
    "/images/influencer/seanKelly.png",
  ],
  portfolio: [
    "/images/projects/interior.png",
    "/images/projects/smiles.png",
    "/images/projects/creator.png",
    "/images/misc/equipment.png",
  ],
};

function CreatorProfileContent() {
  const [activeTab, setActiveTab] = useState("Portfolios");
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId");

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        {/* Back Button */}
        <Link
          href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
          className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Gallery */}
          <div className="w-full lg:w-[500px] shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 relative aspect-[4/3] rounded-[20px] overflow-hidden">
                <Image
                  src={mockCreator.images[0]}
                  alt={mockCreator.name}
                  fill
                  className="object-cover"
                />
              </div>
              {mockCreator.images.slice(1, 4).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-[16px] overflow-hidden"
                >
                  <Image src={img} alt="Portfolio" fill className="object-cover" />
                </div>
              ))}
              {/* Last image with overlay */}
              <div className="relative aspect-square rounded-[16px] overflow-hidden">
                <Image
                  src={mockCreator.images[4]}
                  alt="More"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">+12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1">
            {/* Header Info */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {mockCreator.name}
                  </h1>
                  {mockCreator.available && (
                    <span className="bg-[#4CAF50]/20 text-[#4CAF50] text-xs font-medium px-3 py-1 rounded-full border border-[#4CAF50]/30">
                      Available
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-lg mb-4">{mockCreator.role}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-[#1A1A1A] border border-white/10 px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 text-[#E8D1AB] fill-[#E8D1AB]" />
                    <span className="text-white font-medium">
                      {mockCreator.rating}
                    </span>
                    <span className="text-white/60 text-sm">
                      ({mockCreator.reviews})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => console.log("Heart clicked")}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Heart className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => console.log("Share clicked")}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Share className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">About Creator</h3>
              <p className="text-white/60 leading-relaxed text-base font-light">
                {mockCreator.about}
              </p>
            </div>

            {/* Skills */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {mockCreator.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-[8px] text-sm text-white/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-white mb-3">Equipment's</h3>
              <div className="flex flex-wrap gap-2">
                {mockCreator.equipment.map((item) => (
                  <span
                    key={item}
                    className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-[8px] text-sm text-white/60 flex items-center gap-2"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-white/60 text-sm mb-1 font-medium">
                  Starting Price
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/40 text-sm">for 1 hours</span>
                  <span className="text-3xl font-bold text-white">
                    ${mockCreator.price}
                  </span>
                </div>
              </div>
              <Link
                href={`/search-results/ethan-cole/payment${
                  shootId ? `?shootId=${shootId}` : ""
                }`}
                className="w-full md:w-auto"
              >
                <Button className="w-full h-[56px] px-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-lg font-medium rounded-[12px]">
                  Proceed to Payment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-20">
          <div className="flex border-b border-white/10 mb-8 w-full">
            {["Work History", "Portfolios", "FAQs", "Reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-8 py-4 text-base transition-colors relative ${
                  activeTab === tab
                    ? "text-[#E8D1AB] font-medium"
                    : "text-white/40 hover:text-white font-normal"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E8D1AB]" />
                )}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === "Portfolios" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCreator.portfolio.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-[16/10] rounded-[20px] overflow-hidden relative group"
                >
                  <Image
                    src={img}
                    alt={`Portfolio ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  {idx === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab !== "Portfolios" && (
            <div className="py-10 text-center text-white/40">
              Content for {activeTab} coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <CreatorProfileContent />
      </Suspense>
      <Footer />
    </main>
  );
}
