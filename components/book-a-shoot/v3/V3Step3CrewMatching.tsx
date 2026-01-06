"use client";

import React from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";
import { Check } from "lucide-react";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const V3Step3CrewMatching: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {

  const handleSelectOption = (method: 'ai_matchmaker' | 'manual') => {
    updateData({ matchingMethod: method });
    // In current flow design, both options eventually lead to matching or displaying crew
    // For now we just select it
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Crew Size & Matching</h2>
        <p className="text-white/60">Let our AI find the perfect crew for your needs.</p>
      </div>

      {/* Recommended Crew Size Banner */}
      <div className="bg-[#E8D1AB] rounded-[16px] p-6 flex items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center shrink-0">
             <span className="text-2xl">ℹ️</span>
        </div>
        <div className="text-black">
            <h3 className="font-bold text-lg mb-1">Recommended Crew Size for Your Project</h3>
            <p className="text-sm opacity-80">Based on your shoot type ({data.shootType}) and location.</p>
        </div>
      </div>
      
      {/* Example Recommendation Card (Static for V3 MVP) */}
      <div className="bg-[#171717] rounded-[20px] overflow-hidden border border-white/10">
         <div className="p-4 flex gap-4 items-center">
             <div className="w-[100px] h-[70px] bg-gray-800 rounded-lg relative overflow-hidden">
                 <Image src="/images/projects/Corporate.png" alt="Shoot" fill className="object-cover" />
             </div>
             <div>
                 <h4 className="text-white font-bold">Corporate Event (Video)</h4>
                 <div className="flex gap-2 text-sm text-white/60 mt-1">
                     <span>Videographer x1</span>
                     <span>•</span>
                     <span>$275.00/hr</span>
                 </div>
             </div>
         </div>
      </div>

      {/* Matching Method Selection */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">How would you like to proceed?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Matchmaker */}
            <div 
                onClick={() => handleSelectOption('ai_matchmaker')}
                className={`cursor-pointer rounded-[20px] p-8 border-2 transition-all relative overflow-hidden ${
                    data.matchingMethod === 'ai_matchmaker' 
                    ? "bg-[#101010] border-[#E8D1AB]" 
                    : "bg-[#171717] border-transparent hover:border-white/20"
                }`}
            >
                 {data.matchingMethod === 'ai_matchmaker' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black">
                        <Check size={14} strokeWidth={3} />
                    </div>
                )}
                
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8D1AB] to-[#C8B18B] flex items-center justify-center mb-6">
                    <span className="text-2xl text-black">✨</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">AI Matchmaker</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                    Our AI analyzes your project requirements and budget to find the perfect creative partners instantly.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                        <Check size={12} className="text-[#E8D1AB]" />
                        <span>Optimized matches based on budget</span>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-white/80">
                        <Check size={12} className="text-[#E8D1AB]" />
                        <span>AI-driven portfolio analysis</span>
                    </div>
                </div>
            </div>

            {/* Browse Manually (Disabled or secondary) */}
            <div 
                onClick={() => handleSelectOption('manual')}
                className={`cursor-pointer rounded-[20px] p-8 border-2 transition-all relative overflow-hidden opacity-60 ${
                    data.matchingMethod === 'manual' 
                    ? "bg-[#101010] border-[#E8D1AB]" 
                    : "bg-[#171717] border-transparent hover:border-white/20"
                }`}
            >
                 {data.matchingMethod === 'manual' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black">
                        <Check size={14} strokeWidth={3} />
                    </div>
                )}
                
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <span className="text-2xl">🔍</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Browse Manually</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                    Search through our catalog of creative professionals and hand-pick your team.
                </p>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-white/10">
        <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
        >
            Back
        </Button>
        <Button
            onClick={onNext}
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] min-w-[140px] h-12 text-lg rounded-xl"
        >
            Continue
        </Button>
      </div>

    </div>
  );
};
