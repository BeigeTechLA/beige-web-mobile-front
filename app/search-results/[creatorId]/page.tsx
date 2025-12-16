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
import CreatorGallery from "./components/CreatorGallery";
import { Separator } from "./components/Separator";

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
    "/images/influencer/kingkarlx@2x.png",
    '/images/influencer/Sharukh.png'
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
      <div className="container mx-auto px-4 md:px-0">
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
          <div className="w-1/2">
            <CreatorGallery mockCreator={mockCreator} />
          </div>

          {/* Right: Info */}
          <div className="flex-1 w-1/2 flex flex-col gap-[30px]">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-medium text-white">
                  {mockCreator.name}
                </h1>
                <p className="text-[#E8D1AB] text-[22px]">{mockCreator.role}</p>
              </div>
              {mockCreator.available && (
                <p className="bg-[#EDF7EE] text-[#4CAF50] text-xl px-5 py-3 rounded-full border border-[#4CAF50] leading-[20px]">
                  Available
                </p>
              )}
            </div>
            <Separator />

            {/* About */}
            <div className="flex flex-col gap-3.5">
              <h3 className="text-xl font-bold text-white">About Creator</h3>
              <p className="text-white/60 leading-relaxed text-lg font-normal">
                {mockCreator.about}
              </p>
            </div>
            <Separator />


            {/* Skills */}
            <div className="flex flex-col gap-3.5">
              <h3 className="text-xl font-bold text-white">Skills</h3>
              <div className="flex flex-wrap gap-2.5">
                {mockCreator.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <Separator />

            {/* Equipment */}
            <div className="flex flex-col gap-3.5">
              <h3 className="text-xl font-bold text-white">Equipment's</h3>
              <div className="flex flex-wrap gap-2.5">
                {mockCreator.equipment.map((item) => (
                  <span
                    key={item}
                    className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-[#171717] rounded-[20px] p-7 flex flex-col gap-7 mt-2.5">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <p className="text-white text-2xl font-semibold">
                    Starting Price
                  </p>
                  <span className="text-white text-sm">for 1 hour</span>
                </div>

                <span className="text-3xl font-bold text-white">
                  ${mockCreator.price}
                </span>
              </div>
              <Link
                href={`/search-results/ethan-cole/payment${shootId ? `?shootId=${shootId}` : ""
                  }`}
                className="w-full md:w-auto"
              >
                <Button className="w-full h-[71px] px-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-2xl font-medium rounded-[12px]">
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
                className={`flex-1 md:flex-none px-8 py-4 text-base transition-colors relative ${activeTab === tab
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
