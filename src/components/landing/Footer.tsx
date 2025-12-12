"use client";

import React from "react";
import { Instagram, Linkedin, Twitter, Facebook, ArrowRight } from "lucide-react";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";

export const Footer = () => {
  const handleLinkClick = (label: string, href: string) => {
    console.log(`Footer Navigation: ${label} clicked (href: ${href})`);
  };

  const handleStartProject = () => {
    console.log('Footer: Start Your Project clicked');
  };

  return (
    <footer className="border-t border-white/10 pt-24 pb-12">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-24">
          {/* Logo & CTA Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <button
              onClick={() => handleLinkClick('Logo', '/')}
              className="inline-block"
            >
              <div className="relative w-[140px] h-[36px]">
                <Image
                  src="/images/logos/beige_logo_vb.png"
                  alt="Beige logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </button>

            <div className="mt-8">
              <Button
                onClick={handleStartProject}
                className="bg-transparent border border-white/20 hover:bg-white/5 text-white h-[56px] px-6 rounded-full flex items-center gap-3 w-fit transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Start Your Project with Beige
                <ArrowRight size={16} className="text-white/50 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-white/40 text-xs uppercase tracking-widest mb-8">Main Links</h4>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handleLinkClick('Home', '/')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('About', '#about')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('Blogs', '#blogs')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  Blogs
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('Find Creative Work', '#find-work')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  Find Creative Work
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-white/40 text-xs uppercase tracking-widest mb-8">Legal</h4>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handleLinkClick('Terms of Service', '/terms')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('Privacy Policy', '/privacy')}
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-white/40 text-xs uppercase tracking-widest mb-8">Contact Us</h4>
            <ul className="space-y-4">
              <li className="text-white font-medium flex items-center gap-2">
                <span className="text-white/60">📞</span> 323-826-7230
              </li>
              <li>
                <a
                  href="mailto:info@beigecorporation.io"
                  className="text-white hover:text-[#ECE1CE] transition-colors font-medium flex items-center gap-2"
                >
                  <span className="text-white/60">✉️</span> info@beigecorporation.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm mb-4 md:mb-0">
            Copyright © 2025 Beige. All rights reserved.
          </p>

          <div className="flex gap-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); console.log('Social: Facebook clicked'); }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); console.log('Social: LinkedIn clicked'); }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              <Linkedin size={18} />
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); console.log('Social: Twitter clicked'); }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              <Twitter size={18} />
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); console.log('Social: Instagram clicked'); }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
