"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useNewsletter } from "@/lib/hooks/useNewsletter";

export const NewsletterSubscribe = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { subscribe, loading, error, successMessage } = useNewsletter();
  const [showSuccess, setShowSuccess] = useState(false);

  const bgImage = "/images/misc/NewsletterBg.png";

  // Watch for changes in successMessage and set a 15-second timer
  useEffect(() => {
    if (successMessage) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 15000);

      // Cleanup timeout on unmount or when successMessage changes
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSuccess = await subscribe(email);
    if (isSuccess) {
      setEmail("");
    }
  };

  const socialLinks = [
    { id: "facebook", label: "Facebook", src: "/images/socmed/fbWhite.svg", href: "#" },
    { id: "instagram", label: "Instagram", src: "/images/socmed/instagramWhite.svg", href: "#" },
    { id: "linkedin", label: "LinkedIn", src: "/images/socmed/Linkedin.svg", href: "#" },
    { id: "youtube", label: "Youtube", src: "/images/socmed/Youtube.svg", href: "#" },
    { id: "pinterest", label: "Pinterest", src: "/images/socmed/Pinterest.svg", href: "#" },
  ];

  return (
    <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <div className="relative w-full overflow-hidden min-h-[420px] lg:min-h-[700px] flex items-center border border-white/5 shadow-2xl">

        {/* Background UI Asset */}
        <Image
          src={bgImage}
          alt="Newsletter UI Background"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none brightness-[0.7] lg:brightness-100"
        />

        {/* Overlay mask to ensure readable input metrics on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/80 lg:to-transparent pointer-events-none" />

        {/* Interactive Layout Form Container */}
        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 lg:px-20 py-12">

          {/* Left Blank column to let the visual UI app mock layout breathe */}
          <div className="hidden lg:block" />

          {/* Right Action Stack */}
          <div className="flex flex-col justify-center max-w-xl lg:ml-auto w-full">
            <h2 className="text-sm lg:text-6xl font-medium tracking-tight leading-[1.15] text-white mb-9">
              Subscribe to our<br />Newsletter
            </h2>

            <form onSubmit={handleSubmit} className="w-full mb-6">
              <div className="relative flex items-center border-b border-white pb-3 transition-focus group focus-within:border-white">
                <input
                  type="email"
                  placeholder="Your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-sm lg:text-3xl text-white placeholder-[#BFBFBF] outline-none w-full pr-20 py-1 font-light tracking-wide"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-0 text-sm lg:text-3xl font-medium text-[#E8D1AB] hover:text-[#dcb98a] transition-colors px-1"
                >
                  Submit
                </button>
              </div>
            </form>

            {/* Social Navigation Anchors */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <a
                  key={`social_news_${index}`}
                  href={social.href}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <Image
                    src={social.src}
                    alt={social.label}
                    width={45}
                    height={45}
                  />
                </a>
              ))}
            </div>

            {showSuccess && (
              <p className="text-[#E8D1AB] text-sm lg:text-lg font-medium italic mt-4">
                Subscription successful! Thank you for subscribing.
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};