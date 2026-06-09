import React from 'react';
import { Star } from 'lucide-react';

interface StudioBookingSidebarProps {
  price?: number;
  rating?: string;
  reviews?: number;
  propertyType?: string;
  minimumHours?: number;
  operatingHours?: string;
}

const StudioBookingSidebar = ({
  price = 150,
  rating = "5.0",
  reviews = 0,
  propertyType = "Studio",
  minimumHours = 2,
  operatingHours = "Available by booking",
}: StudioBookingSidebarProps) => {
  const studioDetails = [
    { label: 'Bills', value: 'Included', highlight: false },
    { label: 'Minimum booking', value: `${minimumHours} hours`, highlight: true },
    { label: 'Property type', value: propertyType, highlight: false },
    { label: 'Furnishing', value: 'Included', highlight: false },
    { label: 'Availability', value: operatingHours, highlight: false },
  ];

  return (
    <div className="w-full bg-[#171717] border-[0.5px] border-[#E8D1AB] rounded-[20px] px-9 py-12">
      {/* Pricing Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-baseline gap-1 text-[#E8D1AB]">
          <span className="text-xl lg:text-3xl font-medium">${price.toLocaleString()}</span>
          <span className="text-lg lg:text-2xl">/ Hour</span>
        </div>
        <div className="flex items-center gap-1.5 pt-2 text-white font-medium">
          <Star size={18} className="text-white" />
          <span className="">{rating}</span>
          <span className="text-[#6B7280] mx-1">•</span>
          <button className="underline underline-offset-4 hover:text-[#E8D1AB] transition-colors">
            {reviews} reviews
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 mb-8 my-12" />

      {/* Details List */}
      <div className="space-y-4">
        {studioDetails.map((detail, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-[#9A9898] text-lg lg:text-xl">{detail.label}</span>
            <span className={`text-lg lg:text-xl ${detail.highlight ? 'text-[#067450]' : 'text-[#9A9898]'}`}>
              {detail.value}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 my-6" />

      {/* Availability Section */}
      <div className="flex justify-between items-center mb-10 text-xl lg:text-2xl font-medium text-[#9A9898]">
        <span className="">Available</span>
        <span className="">{operatingHours}</span>
      </div>

      {/* Action Button */}
      <button className="w-full bg-[#E8D1AB] text-black py-6 rounded-lg font-medium lg:text-lg hover:bg-[#d9c19a] transition-all">
        Add this Studio
      </button>
    </div>
  );
};

export default StudioBookingSidebar;
