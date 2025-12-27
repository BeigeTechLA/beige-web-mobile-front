"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Users, X, Check, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  selectCrewSize,
  selectSelectedCreators,
  selectSelectedCreatorsCount,
  selectIsCrewComplete,
  removeCreator,
} from "@/lib/redux/features/booking/bookingSlice";

// Fallback images for creators without profile images
const crewImages = [
  "/images/crew/CREW(1).png",
  "/images/crew/CREW(2).png",
  "/images/crew/CREW(3).png",
  "/images/crew/CREW(4).png",
  "/images/crew/CREW(5).png",
  "/images/crew/CREW(7).png",
  "/images/crew/CREW(6).png",
  "/images/crew/CREW(8).png",
  "/images/crew/CREW(9).png",
  "/images/crew/CREW(10).png",
];

interface CartIconProps {
  className?: string;
}

export const CartIcon = ({ className = "" }: CartIconProps) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId") || searchParams.get("booking_id");
  
  const crewSize = useSelector(selectCrewSize);
  const selectedCreators = useSelector(selectSelectedCreators);
  const selectedCount = useSelector(selectSelectedCreatorsCount);
  const isCrewComplete = useSelector(selectIsCrewComplete);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (crewSize <= 0) return null;

  const handleRemove = (creatorId: string) => {
    dispatch(removeCreator(creatorId));
  };

  const getFallbackImage = (creatorId: string) => {
    return crewImages[parseInt(creatorId) % 10];
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          isCrewComplete
            ? "bg-green-500/20 border border-green-400/50 hover:bg-green-500/30"
            : "bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 hover:bg-[#E8D1AB]/20"
        }`}
      >
        <Users className={`w-5 h-5 lg:w-6 lg:h-6 ${isCrewComplete ? "text-green-400" : "text-[#E8D1AB]"}`} />
      </button>

      {/* Badge showing X/Y */}
      <div
        className={`absolute -top-1 -right-1 min-w-5 h-5 lg:min-w-6 lg:h-6 px-1 rounded-full flex items-center justify-center ${
          isCrewComplete ? "bg-green-500" : "bg-[#E8D1AB]"
        }`}
      >
        <span className="text-black text-[10px] lg:text-xs font-bold whitespace-nowrap">
          {selectedCount}/{crewSize}
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Your Crew</h3>
              <p className="text-white/50 text-sm">
                {selectedCount} of {crewSize} selected
              </p>
            </div>
            {isCrewComplete && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Complete
              </div>
            )}
          </div>

          {/* Selected Creators List */}
          <div className="max-h-64 overflow-y-auto">
            {selectedCreators.length === 0 ? (
              <div className="px-4 py-6 text-center text-white/40">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No creators selected yet</p>
                <p className="text-sm mt-1">Click &quot;Add to Crew&quot; on creator cards</p>
              </div>
            ) : (
              selectedCreators.map((creator) => {
                const imageUrl =
                  !creator.image ||
                  creator.image === "/images/influencer/default.png"
                    ? getFallbackImage(creator.id)
                    : creator.image;

                return (
                  <div
                    key={creator.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={creator.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {creator.name}
                      </p>
                      <p className="text-white/50 text-xs truncate">{creator.role}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(creator.id)}
                      className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer - Proceed to Payment */}
          {selectedCreators.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 bg-[#151515]">
              {isCrewComplete ? (
                <Link
                  href={`/search-results/payment${shootId ? `?shootId=${shootId}` : ""}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium py-3 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Proceed to Payment
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="text-center text-white/50 text-sm py-2">
                  Select {crewSize - selectedCount} more creator
                  {crewSize - selectedCount !== 1 ? "s" : ""} to proceed
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartIcon;
