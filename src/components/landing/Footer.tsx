"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  Music2,
  Twitter,
  ArrowRight,
  PhoneCall,
  Mail,
} from "lucide-react";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "./Separator";

const FOOTER_LINKS = [
  {
    name: "Media",
    link: "https://beigemedia.ai/"
  }, {
    name: "Weddings",
    link: "https://weddings.beigemedia.ai/"
  }, {
    name: "Fleet",
    link: "https://fleet.beigemedia.ai/"
  }, {
    name: "Studios",
    link: "https://studios.beigemedia.ai/"
  }, {
    name: "Creators",
    link: "https://creators.beigemedia.ai/"
  }, {
    name: "Blog",
    link: "https://blog.beigemedia.ai/"
  },
]
// [Facebook, Linkedin, Youtube, Instagram]

const SOCIAL_PLATFORMS = [
  { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/beigemedia" },
  { name: "Linkedin", icon: Linkedin, href: "https://www.linkedin.com/company/beigemedia" },
  // { name: "Youtube", icon: Youtube, href: "https://www.youtube.com/@beigemedia" },
  { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/beige.ai/" },
  // { name: "Twitter", icon: Twitter, href: "https://www.twitter.com/beigemedia" },
  { name: "Tiktok", icon: Music2, href: "https://www.tiktok.com/@beigemedia" },
];

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
    console.log("Footer: Start Your Project clicked");
    router.push("/book-a-shoot");
  };

  const handleInvestor = () => {
    router.push("/investors");
  };

  return (
    <footer className="pb-8 lg:pt-24 lg:pb-16">
      <Separator />
      <Container className="pt-12 lg:pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-12 lg:mb-24">
          {/* Logo & CTA Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Link
              href="/"
              className="relative flex items-center w-fit"
            >
              <Image
                src="https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/assets/logos/beige_logo_vb.png"
                alt="BEIGE"
                width={158}
                height={32}
                className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
                priority
              />
              <span className="absolute right-4 md:right-5 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
                Beta
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
              </span>
            </Link>
            {/* <div className="mt-8"> */}
            <Button
              onClick={handleStartProject}
              className="bg-transparent border border-white/20 hover:bg-white/5 text-white h-[56px] px-6 rounded-lg flex items-center gap-3 w-fit transition-all group"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Start Your Project with Beige
              <ArrowRight
                size={16}
                className="text-white/50 group-hover:translate-x-1 transition-transform"
              />
            </Button>
            {/* </div> */}

            <Button
              onClick={handleInvestor}
              className="bg-[#ECE1CE] text-black hover:bg-[#dcb98a] h-[48px] px-6 rounded-lg text-lg font-medium w-fit"
            >
              Become a Investor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-0">
            {/* Links Column 1 */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">
                Main Links
              </h4>
              <ul className="space-y-2 xl:space-y-4">
                {
                  FOOTER_LINKS.map(footerItem => {
                    return (
                      <li key={`footer_link_${footerItem.name.split(" ").join("_")}`}>
                        <Link
                          href={footerItem.link}
                          target="_blank" rel="noopener noreferrer"
                          className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium capitalize"
                        >
                          {footerItem.name}
                        </Link>
                      </li>
                    )
                  })
                }
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">
                Legal
              </h4>
              <ul className="space-y-2 lg:space-y-4 pointer-events-none">
                <li>
                  <button
                    // onClick={() =>
                    //   handleLinkClick("Terms of Service", "/terms")
                    // }
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    // onClick={() =>
                    //   handleLinkClick("Privacy Policy", "/privacy")
                    // }
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-[#E8D1AB] text-xs lg:text-base uppercase tracking-widest mb-4 lg:mb-8">
                Contact Us
              </h4>
              <ul className="space-y-2 lg:space-y-4">
                <li className="text-white text-sm lg:text-lg font-medium flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 lg:w-6 lg:h-6 text-white fill-white" />{" "}
                  323-826-7230
                </li>
                <li>
                  <a
                    href="mailto:info@beigecorporation.io"
                    className="text-white text-sm lg:text-lg hover:text-[#ECE1CE] transition-colors font-medium flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 lg:w-6 lg:h-6 text-white" />{" "}
                    info@beigecorporation.io
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
              Copyright © 2026 Beige. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex lg:border-l border-white/50">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div
                    key={platform.name}
                    className="w-16 h-16 flex items-center justify-center lg:border-r border-white/50"
                  >
                    <Link
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit our ${platform.name} page`}
                      className="rounded-full p-2 bg-white hover:bg-white/80 transition-colors flex items-center justify-center"
                    >
                      <Icon className="w-6 h-6 text-black" strokeWidth={1.5} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
