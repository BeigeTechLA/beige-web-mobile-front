"use client";

import React, { useState } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Star, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock creators data (replace with API data later)
const MOCK_CREATORS = [
    {
        id: 1,
        name: "Ethan Cole",
        role: "Photographer Specialist",
        image: "/images/crew/CREW(1).png",
        rating: 4.9,
        reviews: 120,
        price: 275
    },
     {
        id: 2,
        name: "Sarah Jenkins",
        role: "Videographer",
        image: "/images/crew/CREW(2).png",
        rating: 5.0,
        reviews: 85,
        price: 350
    },
     {
        id: 3,
        name: "Marcus Ray",
        role: "Director",
        image: "/images/crew/CREW(3).png",
        rating: 4.8,
        reviews: 210,
        price: 450
    },
     {
        id: 4,
        name: "Elena Rodriguez",
        role: "Editor",
        image: "/images/crew/CREW(4).png",
        rating: 4.9,
        reviews: 95,
        price: 150
    }
];

export const V3SelectDreamTeam: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  // Use local state for selection if not in data yet
  const [selectedIds, setSelectedIds] = useState<number[]>(data.selectedCrewIds || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
        const newIds = prev.includes(id) 
            ? prev.filter(p => p !== id)
            : [...prev, id];
        
        // Sync with parent data
        updateData({ selectedCrewIds: newIds });
        return newIds;
    });
  };

  const nextSlide = () => {
    if (currentIndex < MOCK_CREATORS.length - 1) {
        setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
  };

  // Center card is current index. We show 3 cards (left peek, center, right peek).
  const visibleCreators = MOCK_CREATORS; 

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Select Your Dream Team</h2>
        <p className="text-white/60">Select from our best professionals</p>
      </div>

      {/* Carousel */}
      <div className="relative h-[450px] flex items-center justify-center perspective-1000">
         
         {/* Left Button */}
         <button 
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="absolute left-0 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/50 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md"
         >
            <ChevronLeft size={24} />
         </button>

         {/* Right Button */}
         <button 
             onClick={nextSlide}
             disabled={currentIndex === MOCK_CREATORS.length - 1}
             className="absolute right-0 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/50 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md"
         >
            <ChevronRight size={24} />
         </button>

         {/* Cards Container */}
         <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
             <AnimatePresence initial={false}>
                {MOCK_CREATORS.map((creator, index) => {
                    const offset = index - currentIndex;
                    const isCenter = offset === 0;
                    const isVisible = Math.abs(offset) <= 1; // Show center and immediate neighbors
                    
                    // Simple stack logic
                    if (!isVisible) return null;

                    return (
                        <motion.div
                            key={creator.id}
                            className={`absolute w-[280px] md:w-[320px] rounded-[24px] overflow-hidden bg-[#101010] border border-white/10 shadow-2xl transition-all duration-500 cursor-pointer`}
                            initial={{ scale: 0.8, opacity: 0, x: offset * 350 }}
                            animate={{ 
                                scale: isCenter ? 1 : 0.85, 
                                opacity: isCenter ? 1 : 0.5,
                                x: offset * (typeof window !== 'undefined' && window.innerWidth < 768 ? 290 : 360), // Responsive spacing
                                zIndex: isCenter ? 10 : 5,
                                rotateY: offset * 5
                            }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={() => {
                                if (!isCenter) setCurrentIndex(index);
                            }}
                        >
                            {/* Image Area */}
                            <div className="relative h-[320px] w-full">
                                <Image 
                                    src={creator.image} 
                                    alt={creator.name} 
                                    fill 
                                    className="object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                
                                {/* Status Tags */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                        Top Match
                                    </div>
                                    <div className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                                        <Star size={12} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                                        {creator.rating}
                                    </div>
                                </div>
                                
                                {/* Info Overlay */}
                                <div className="absolute bottom-0 left-0 w-full p-6">
                                     <h3 className="text-2xl font-bold text-white mb-1">{creator.name}</h3>
                                     <p className="text-white/70 text-sm mb-4">{creator.role}</p>
                                     
                                     <div className="flex gap-3">
                                         {selectedIds.includes(creator.id) ? (
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(creator.id); }}
                                                className="flex-1 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                             >
                                                Remove
                                             </button>
                                         ) : (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(creator.id); }}
                                                className="flex-1 h-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                             >
                                                <Plus size={16} /> Add to Crew
                                             </button>
                                         )}
                                         
                                         <button className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-sm font-medium">
                                             View Profile
                                         </button>
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
             </AnimatePresence>
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
            Continue with {selectedIds.length} Members
        </Button>
      </div>

    </div>
  );
};
