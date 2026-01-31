"use client";
import React from "react";
import { Sun, Moon, Upload, Search, ChevronDown, SlidersHorizontal, Download } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function SalesTopbar({ pathname }: { pathname: string }) {
    const router = useRouter();
    const paths = pathname.split('/').filter(path => path).filter(path => path !== "sales");
    const isShootsPage = pathname.includes("shoots");

    return (
        <header className="flex items-center justify-between p-4 lg:px-9 lg:py-6 border-b border-zinc-800 bg-[#0f0f0f] gap-4">
            {/* Left: Logo & Breadcrumbs/Title */}
            <div className="flex items-center gap-6 shrink-0">
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

                {isShootsPage ? (
                    <div className="flex items-center gap-3">
                        <h1 className="text-white font-semibold text-lg">Sales Shoots Management</h1>
                        {/* <span className="bg-[#202020] text-[#9CA3AF] text-xs px-2.5 py-1 rounded-full border border-zinc-800">
                            10 Shoots
                        </span> */}
                    </div>
                ) : (
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
                )}
            </div>

            {/* Center: Search Bar (Only for Shoots) */}
            {isShootsPage && (
                <div className="flex-1 max-w-xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <Input
                            placeholder="Search shoots, Clients, or IDs..."
                            className="bg-[#1A1A1A] border-zinc-800 pl-10 text-white placeholder:text-zinc-500 rounded-lg h-10 w-full focus-visible:ring-offset-0 focus-visible:ring-zinc-700"
                        />
                    </div>
                </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-3 shrink-0">
                {isShootsPage && (
                    <>
                        {/* Status Dropdown */}
                        <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
                            All Status
                            <ChevronDown size={16} className="opacity-50" />
                        </Button>

                        {/* Filters */}
                        <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
                            <SlidersHorizontal size={16} />
                            Filters
                        </Button>

                        {/* Export */}
                        <Button variant="outline" className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 hover:bg-[#252525] hover:text-white h-10 px-4 gap-2 font-normal">
                            <Download size={16} />
                            Export
                        </Button>

                        {/* Book a Shoot */}
                        <Button
                            onClick={() => router.push("/book-a-shoot")}
                            className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-10 px-5 font-semibold"
                        >
                            Book a Shoot
                        </Button>
                    </>
                )}

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
                        {/* <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800">
                            <Button className="p-1.5 rounded-full bg-[#E5D5B8] text-black">
                                <Moon size={18} />
                            </Button>
                            <Button className="p-1.5 text-zinc-500">
                                <Sun size={18} />
                            </Button>
                        </div> */}
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
                        <Button
                            onClick={() => router.push("/book-a-shoot")}
                            className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            Book a Shoot
                        </Button>
                    </>
                }

                {
                    pathname.includes("file-manager") &&
                    <>
                        <Button
                            className="bg-[#202020] text-white px-5 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#202020]/70 transition-opacity border border-white/20 flex gap-2"
                        >
                            <Upload size={24} />
                            Upload Files
                        </Button>
                        <Button
                            className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            Create Folder
                        </Button>
                    </>
                }

            </div>
        </header>
    );
}
