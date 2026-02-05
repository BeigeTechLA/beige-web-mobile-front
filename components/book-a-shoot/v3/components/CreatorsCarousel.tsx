import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';
import { ArrowDownLeft, ArrowUpRight, Star, Check, Plus, X } from 'lucide-react';
import type { Creator } from "@/lib/types";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import { Button } from '@/components/ui/button';

const S3_BASE_URL =
  "https://beigexmemehouse.s3.eu-north-1.amazonaws.com/beige/";


// Fallback images for creators without profile photos
const FALLBACK_IMAGES = [
  "/images/crew/CREW(1).png",
  "/images/crew/CREW(2).png",
  "/images/crew/CREW(3).png",
  "/images/crew/CREW(4).png",
  "/images/crew/CREW(5).png",
  "/images/crew/CREW(6).png",
  "/images/crew/CREW(7).png",
  "/images/crew/CREW(8).png",
];

// Get fallback image for creator
const getCreatorImage = (creator: Creator, index: number) => {
  const photo = creator.profile_photo;

  if (photo && typeof photo === "string") {
    // already a full URL
    if (photo.startsWith("http")) {
      return photo;
    }

    // filename → build S3 URL
    return `${S3_BASE_URL}${photo}`;
  }

  // fallback image
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
};


const CreatorCarousel = ({
  creators,
  selectedIds,
  toggleSelection
}: {
  creators: Creator[],
  selectedIds: (string | number)[],
  toggleSelection: (id: number) => void;
}) => {
  return (
    <div className="relative lg:max-w-4xl xl:max-w-5xl 2xl:max-w-[1500px] mx-auto z-10">
      {/* NAVIGATION BUTTONS */}
      <button className="creator-next-btn absolute left-5 lg:-left-[100px] -top-5 lg:top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
        <ArrowDownLeft className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
      </button>

      {/* RIGHT NAV */}
      <button className="creator-prev-btn absolute right-5 lg:-right-[100px] -top-5 lg:top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
        <ArrowUpRight className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
      </button>
      <div className='relative overflow-hidden'>
        <Swiper
          modules={[EffectCoverflow, Navigation]}
          effect="coverflow"
          centeredSlides
          grabCursor
          initialSlide={Math.floor(creators.length / 2)}
          slidesPerView={3}
          spaceBetween={30}
          loop={creators.length < 5}
          allowTouchMove={true}
          allowSlideNext={true}
          allowSlidePrev={true}
          slideToClickedSlide={true}
          /* --- SAFARI FIXES START --- */
          // touchStartPreventDefault={false}  // Allows touch start to reach the button
          // touchMoveStopPropagation={true}   // Prevents drag from eating the click
          // simulateTouch={true}              // Better event simulation for mobile
          preventClicks={false}             // Ensure clicks aren't intercepted
          preventClicksPropagation={false}  // Allow event to bubble to your button
          /* --- SAFARI FIXES END --- */
          coverflowEffect={{
            rotate: 15,
            stretch: 0,
            depth: 150,
            modifier: 1.6,
            slideShadows: false,
          }}
          breakpoints={{
            0: { slidesPerView: 1.5, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 30 },
          }}
          navigation={{
            prevEl: ".creator-prev-btn",
            nextEl: ".creator-next-btn",
          }}
          className="w-full creator-swiper !py-10 lg:!py-5"
        >
          {creators.map((creator, index) => {
            const creatorId = creator.crew_member_id;
            const isSelected = selectedIds.includes(creatorId);
            const rating = creator.rating || 0;
            const imageUrl = getCreatorImage(creator, index);

            return (
              <SwiperSlide key={creatorId}
                className="!flex justify-center">
                <div className="w-[280px] lg:w-[474px] h-[330px] lg:h-[567px]">
                  <div className={`relative w-[280px] !h-[330px] lg:w-[474px] lg:!h-[567px] rounded-lg lg:rounded-[20px] overflow-hidden bg-[#0B0B0B] border transition-all border-white/40`}>
                    {/* Image Area */}
                    <div className="relative w-full h-[200px] lg:h-[407px] overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={creator.name}
                        fill
                        className="object-cover object-top transition-transform duration-700 hover:scale-105"
                      />
                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 lg:top-4 lg:left-4 z-10">
                          <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-md px-2 py-1 lg:px-3 lg:py-2 rounded-full">
                            <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                            <span className="text-xs lg:text-sm text-white font-medium">In Crew</span>
                          </div>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 right-2 lg:top-4 lg:right-3 flex items-center justify-end gap-2 px-2">
                        {creator.matchScore && (
                          <div className="bg-green-500/20 backdrop-blur-md px-2 py-1 lg:px-3 lg:py-2 rounded-full border border-green-400/40">
                            <span className="text-xs lg:text-sm text-green-300 font-medium">
                              {creator.matchScore} skills matched
                            </span>
                          </div>
                        )}

                        {/* <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 lg:px-4 lg:py-2 rounded-full border border-white/10">
                          <Star className="w-3 h-3 lg:w-[18px] lg:h-[18px] text-[#E8D1AB] fill-[#E4CC17]" />
                          <span className="text-white text-sm lg:text-lg font-medium">
                            {rating.toFixed(1)} ({creator.total_reviews || 0})
                          </span>
                        </div> */}
                      </div>
                    </div>

                    {/* Info Footer */}
                    <div className="p-3 lg:p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white text-base lg:text-xl font-medium">{creator.name}</h3>
                          <p className="text-white/60 text-xs lg:text-base">{creator.role_name || 'Creator'}</p>
                        </div>
                        <p className="bg-[#EDF7EE] text-[#4CAF50] text-xs lg:text-base px-2 py-1 lg:px-3.5 lg:py-2 rounded-full border border-[#4CAF50]">
                          Available
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent Swiper from intercepting this as a drag/slide
                            e.preventDefault();
                            toggleSelection(creatorId);
                          }}
                          className={`flex-1 py-2 lg:py-4 rounded-lg text-sm lg:text-base font-medium flex items-center justify-center transition-colors ${isSelected ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-[#E8D1AB] text-black"
                            }`}
                        >
                          {isSelected ? <><X size={16} className="mr-1" /> Remove</> : <><Plus size={16} className="mr-1" /> Add</>}
                        </button>
                        {/* <Link
                          href={`/creatives/${creatorId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-center flex-1 border border-white/30 text-white py-2 lg:py-4 rounded-lg text-sm lg:text-base font-medium transition-all hover:bg-white/10"
                        >
                          View Profile
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default CreatorCarousel;