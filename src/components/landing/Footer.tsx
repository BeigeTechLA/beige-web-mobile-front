"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Instagram, Linkedin, Youtube, Facebook, ArrowRight, PhoneCall, Mail } from "lucide-react";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "./Separator";

export const Footer = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLinkClick = (label: string, href: string) => {
    console.log(`Footer Navigation: ${label} clicked (href: ${href})`);
    if (href.startsWith("#")) {
      if (pathname !== "/") {
        router.push("/" + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      router.push(href);
    }
  };

  const handleStartProject = () => {
    console.log('Footer: Start Your Project clicked');
  };

  return (
    <footer className="pb-8 lg:pt-24 lg:pb-16">
      <Separator />
      <Container className="pt-12 lg:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-24">
          {/* Logo & CTA Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <a
              href="https://book.beige.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <div className="relative w-[140px] h-[36px] lg:w-[228px] lg:h-10">
                <Image
                  src="/images/logos/beige_logo_vb.png"
                  alt="Beige logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </a>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0">
            {/* Links Column 1 */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">Main Links</h4>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => handleLinkClick('Home', '/')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('About', '#about')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('Blogs', '#blogs')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Blogs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('Find Creative Work', '#find-work')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Find Creative Work
                  </button>
                </li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => handleLinkClick('Terms of Service', '/terms')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('Privacy Policy', '/privacy')}
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">Contact Us</h4>
              <ul className="space-y-4">
                <li className="text-white text-sm lg:text-lg font-medium flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 lg:w-6 lg:h-6 text-white fill-white" /> 323-826-7230
                </li>
                <li>
                  <a
                    href="mailto:info@beigecorporation.io"
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 lg:w-6 lg:h-6 text-white" /> info@beigecorporation.io
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </Container>

      {/* Bottom Section */}
      <div className="border-t border-b border-white/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center">
            <p className="text-white/40 text-sm lg:text-lg py-6">
              Copyright © 2025 Beige. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex lg:border-l border-white/50">
              {[Facebook, Linkedin, Youtube, Instagram].map(
                (Icon, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 flex items-center justify-center lg:border-r border-white/50  "
                  >
                    <Link href="/about" className="rounded-full p-2 bg-white hover:bg-white/80 transition-colors">
                      <Icon className="w-6 h-6 fill-black" />
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
