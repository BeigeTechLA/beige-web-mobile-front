import React from "react";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator } from "@/src/components/landing/Separator";
import { Hero } from "@/components/press-blogs/Hero";
import { PressCoverage } from "@/components/press-blogs/PressCoverage";
import { NewsletterSubscribe } from "@/components/press-blogs/NewsletterSubscribe";
import { Blogs } from "@/components/press-blogs/Blogs";


export default function PressBlogPage() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black px-5 pt-15 lg:p-0 lg:pt-20">
      <Navbar />

      <Hero />

      <Separator />
      <PressCoverage />

      <Separator />
<NewsletterSubscribe />

      <Separator />
      <Blogs />

      <Footer />
    </main>
  );
}