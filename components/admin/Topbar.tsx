
"use client";
import React from "react";
import { Sun, Moon, Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from "../ui/button";

export default function Topbar({ pathname }: { pathname: string }) {
  const paths = pathname.split('/').filter(path => path).filter(path => path !== "admin");

  return (
    <header className="flex items-center justify-between p-4 lg:px-9 lg:py-6 border-b border-zinc-800 bg-[#0f0f0f]">
      {/* Left: Logo & Breadcrumbs */}
      <div className="flex items-center gap-6">
        <a href="https://book.beige.app" target="_blank" rel="noopener noreferrer" className="flex items-center shrink-0">
          <Image
            src="/images/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={158}
            height={32}
            className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
            priority
          />
        </a>
        <nav className="flex items-center gap-4 text-sm text-white/40">
          {paths.map((path, index) => {
            const isLast = index === paths.length - 1;
            return (
              <React.Fragment key={index}>
                <span
                  className={`capitalize ${isLast ? "text-white font-bold" : ""}`}
                >
                  {path.split("-").join(" ")}
                </span>
                {isLast && path === "messages" && (
                  <span className="ml-2 px-2 py-0.5 bg-[#202020] text-zinc-500 text-[10px] rounded-full border border-zinc-800">
                    04 Chats
                  </span>
                )}
                {
                  !isLast &&
                  <span className="mx-2">/</span>
                }
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {
          pathname.includes("messages") &&
          <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            Create Messages
          </Button>
        }
        {/* Dashboard elements */}
        {
          pathname.includes("dashboard") &&

          <>
            {/* Theme Toggle */}
            <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <Button className="p-1.5 rounded-full bg-[#E5D5B8] text-black">
                <Moon size={18} />
              </Button>
              <Button className="p-1.5 text-zinc-500">
                <Sun size={18} />
              </Button>
            </div>
            <div className="relative shrink-0 w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700">
              <Image
                width={48}
                height={48}
                className="object-contain"
                src={"/images/avatar.png"}
                alt={"User"}
              />
            </div>

            {/* Action Button */}
            <Button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Book a Shoot
            </Button>
          </>
        }

        {
          pathname.includes("file-manager") &&
          <>
            <Button
              className="bg-[#202020] text-white px-5 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#202020]/70 transition-opacity border border-white/20 flex gap-2"
            // onClick={() => openModal("UPLOAD")}
            >
              <Upload size={24} />
              Upload Files
            </Button>
            <Button
              className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            // onClick={() => openModal("CREATE_FOLDER")}
            >
              Create Folder
            </Button>
          </>
        }

      </div>
    </header>
  );
}