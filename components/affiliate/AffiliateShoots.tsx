"use client";

import React from "react";
import { AffiliateShootsTable } from "./AffiliateShootsTable";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateShootsProps {
    onShootClick: (shootId: string) => void;
}

export const AffiliateShoots: React.FC<AffiliateShootsProps> = ({ onShootClick }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#111111] p-6 rounded-2xl border border-[#222222]">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#E5D5B8] rounded-full" />
                    <h2 className="text-2xl font-bold text-white leading-none">Overall Shoots</h2>
                </div>
                <Button variant="outline" className="bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#2C2C2C] rounded-lg h-10 px-4 gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
            </div>

            <AffiliateShootsTable onShootClick={onShootClick} />
        </div>
    );
};
