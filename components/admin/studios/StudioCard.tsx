import React, { useState } from 'react';
import { Eye, SquarePen } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Separator } from '@/app/search-results/[creatorId]/components/Separator';

interface StudioData {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  hourlyRate: number;
  overtimeRate: number;
  minBooking: number;
  bufferTiming: number;
  images: string[];
  supportedTypes: string[];
  isBeta?: boolean;
}

interface StudioCardProps {
  studio: StudioData;
  isDark: boolean;
}

const StudioCard = ({ studio, isDark }: StudioCardProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  // Theme-based classes
  const theme = {
    card: isDark ? 'bg-[#101010] text-white border-[#3D3D3D]' : 'bg-white text-zinc-900 border-zinc-200',
    textMuted: isDark ? 'text-[#AAA7A7]' : 'text-zinc-400',
    textLabel: isDark ? 'text-white' : 'text-zinc-500',
    border: isDark ? 'border-[#3D3D3D]' : 'border-zinc-200',
    tag: isDark ? 'bg-[#171717] text-[#8C8C8C] border-[#F5EBDA33]' : 'bg-zinc-100 text-zinc-600 border-zinc-200',
    btnSecondary: isDark ? 'border-[#F5EBDA33] hover:border-[#E8D1AB]' : 'border-zinc-200 hover:bg-zinc-50',
  };

  return (
    <div className={`p-6 rounded-2xl border font-sans transition-colors duration-300 ${theme.card}`}>
      <div className="flex flex-col md:flex-row gap-6">

        {/* Image Section with Carousel */}
        <div className="w-full md:w-[360px] overflow-hidden h-full">
          {/* Main Display Image */}
          <Swiper
            spaceBetween={10}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            modules={[FreeMode, Navigation, Thumbs]}
            className="rounded-lg aspect-[4/3] mb-3 lg:w-[347px] lg:h-[248px]"
          >
            {studio.images.map((img, idx) => (
              <SwiperSlide key={`main-${idx}`}>
                <img src={img} alt={studio.name} className="w-full h-full object-cover" />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Thumbnails Carousel (3 visible at a time) */}
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={3}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Navigation, Thumbs]}
            className="thumbs-swiper"
          >
            {studio.images.map((img, idx) => (
              <SwiperSlide key={`thumb-${idx}`} className="cursor-pointer opacity-40 [&.swiper-slide-thumb-active]:opacity-100 transition-opacity">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent [.swiper-slide-thumb-active_&]:border-[#e2d1b1]">
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between gap-3 lg:gap-5">
          <span className="bg-[#D4FFE4] text-[#16A34A] px-9 py-3 rounded-full text-sm lg:text-base font-medium w-fit">
            {studio.status}
          </span>

          <div className="flex justify-between items-start">
            <h2 className="text-lg lg:text-2xl ">{studio.name}</h2>
            <div className="text-lg lg:text-2xl font-semibold text-[#E8D1AB]">
              ${studio.hourlyRate}/Hour
            </div>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className={`flex gap-4 lg:gap-7 items-center text-xs lg:text-sm`}>
            <div>
              <p className={`${theme.textMuted}`}>Overtime Rate:</p>
              <p className="">${studio.overtimeRate}/hr</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="18" viewBox="0 0 1 18" fill="none">
              <path d="M0.5 0V17.5" stroke="#E0E0E0" />
            </svg>
            <div className={``}>
              <p className={`${theme.textMuted}`}>Minimum Booking:</p>
              <p className="">{studio.minBooking} Hrs</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="18" viewBox="0 0 1 18" fill="none">
              <path d="M0.5 0V17.5" stroke="#E0E0E0" />
            </svg>
            <div className="">
              <p className={`${theme.textMuted}`}>Buffer Time:</p>
              <p className="">{studio.bufferTiming} Min</p>
            </div>
          </div>


          <Separator />

          <div className="">
            <p className={`${theme.textLabel} text-xs font-medium mb-3`}>Supported Shoot Types</p>
            <div className="flex flex-wrap gap-2">
              {studio.supportedTypes.map((type) => (
                <span key={type} className={`px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium border ${theme.tag}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center mt-auto">
            <button className={`flex items-center gap-2 p-3.5 rounded-lg text-sm font-medium border transition-colors text-[#E8D1AB] ${theme.btnSecondary}`}>
              Preview Studio
              <Eye size={16} />
            </button>
            <button className="flex items-center gap-2 bg-[#E8D1AB] text-[#101010] p-3.5 rounded-lg text-sm font-semibold hover:bg-[#e2d1b1] transition-transform">
              Edit
              <SquarePen size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioCard;