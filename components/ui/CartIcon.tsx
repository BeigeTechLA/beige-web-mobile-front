"use client";

import { useSelector } from "react-redux";
import { Users } from "lucide-react";
import { selectCrewSize, selectTotalCrewAssigned } from "@/lib/redux/features/booking/bookingSlice";

interface CartIconProps {
  className?: string;
}

export const CartIcon = ({ className = "" }: CartIconProps) => {
  const crewSize = useSelector(selectCrewSize);
  const totalAssigned = useSelector(selectTotalCrewAssigned);
  
  // Show the higher of crewSize or totalAssigned (for dynamic display)
  const displayCount = Math.max(crewSize, totalAssigned);
  
  if (displayCount <= 0) return null;
  
  return (
    <div className={`relative ${className}`}>
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 flex items-center justify-center hover:bg-[#E8D1AB]/20 transition-all cursor-pointer">
        <Users className="w-5 h-5 lg:w-6 lg:h-6 text-[#E8D1AB]" />
      </div>
      
      {/* Badge */}
      <div className="absolute -top-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-[#E8D1AB] flex items-center justify-center">
        <span className="text-black text-xs lg:text-sm font-bold">
          {displayCount > 9 ? "9+" : displayCount}
        </span>
      </div>
    </div>
  );
};

export default CartIcon;

