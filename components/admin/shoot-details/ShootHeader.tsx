"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, SlidersHorizontal, Pencil, CheckCircle2, Circle, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ShootHeader({ activeTab = "Overview" }: { activeTab?: string }) {
    const router = useRouter();

    return (
        <div>
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-[#2C2C2C] border-none text-red-400 hover:bg-[#3D3D3D] hover:text-red-300 rounded-lg h-10 px-4 gap-2">
                        <CircleX className="w-4 h-4" /> Cancel Shoot
                    </Button>
                    <Button variant="outline" className="bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#2C2C2C] rounded-lg h-10 px-4 gap-2">
                        <SlidersHorizontal className="w-4 h-4" /> Filters
                    </Button>
                    <Button className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium">
                        Edit Shoot
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-[#111111] rounded-2xl p-6 border border-[#222222] mb-6">
                <div className="flex gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[#D6E4FF] flex items-center justify-center text-[#1E40AF] text-2xl font-bold">
                        LG
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-white">Lana Guzman (Videography)</h1>
                            <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                                Pending
                            </span>
                        </div>
                        <p className="text-[#888888] text-sm leading-relaxed max-w-3xl">
                            Description : Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>

                        <div className="w-full h-px bg-[#222222] my-6" />

                        <div className="flex flex-wrap gap-y-4 gap-x-12 text-base text-[#AAAAAA]">
                            <div className="flex gap-2">
                                <span>Shoot Date :</span>
                                <span className="text-white font-medium">Jan 16, 2026</span>
                            </div>
                            <div className="w-px h-5 bg-[#333333]" />
                            <div className="flex gap-2">
                                <span>Time :</span>
                                <span className="text-white font-medium">11:30 PM - N/A Hours (11 Hours Duration)</span>
                            </div>
                            <div className="w-px h-5 bg-[#333333]" />
                            <div className="flex gap-2">
                                <span>Total Value :</span>
                                <span className="text-white font-medium">$14,400</span>
                            </div>
                            <div className="w-px h-5 bg-[#333333]" />
                            <div className="flex gap-2">
                                <span>Payment Status :</span>
                                <span className="text-[#22C55E] font-medium">Paid</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-y-4 gap-x-12 text-base text-[#AAAAAA] mt-4">
                            <div className="flex gap-2">
                                <span>Folder Link :</span>
                                <a href="#" className="text-[#E5D5B8] underline underline-offset-4 decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8] transition-all">
                                    http://fjiejpfkmdfjief
                                    {(activeTab === "Pre_Production" || activeTab === "Post_Production") && (
                                        <span className="text-white"> / {activeTab.replace("_", " ")}</span>
                                    )}
                                </a>
                            </div>
                            <div className="w-px h-5 bg-[#333333]" />
                            <div className="flex gap-2">
                                <span>Shoot Files :</span>
                                <span className="text-white font-medium">200 Image & 50 Videos</span>
                            </div>
                        </div>

                        <div className="mt-4 text-base text-[#AAAAAA] flex gap-2">
                            <span>Location :</span>
                            <span className="text-white font-medium">1234 Mockingbird Lane Sample City, CA 90000 United States</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
