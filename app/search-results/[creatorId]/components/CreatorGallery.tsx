"use client";

import { useState } from "react";
import Image from "next/image";

interface Creator {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  price: number;
  available: boolean;
  about: string;
  skills: string[];
  equipment: string[];
  images: string[];
  portfolio: string[];
}

interface CreatorGalleryProps {
  mockCreator: Creator;
}

export default function CreatorGallery({
  mockCreator,
}: CreatorGalleryProps) {
  const [activeImage, setActiveImage] = useState<string>(
    mockCreator.images[0]
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row w-full gap-5 max-h-[880px]">
        {/* SIDE IMAGES */}
        <div
          className="order-2 lg:order-1 flex lg:flex-col gap-5 overflow-x-auto lg:overflow-y-auto no-scrollbar pr-1 w-1/4"
        >
          {mockCreator.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(img)}
              className={`relative shrink-0 w-[140px] h-[140px] lg:max-w-[225px] lg:w-full lg:h-[205px] rounded-[20px] overflow-hidden transition
                ${activeImage === img ? "" : "opacity-70 hover:opacity-100"}
              `}
            >
              <Image
                src={img}
                alt="Thumbnail"
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* MAIN IMAGE */}
        <div className="order-1 lg:order-2 relative rounded-[20px] overflow-hidden aspect-[4/5] w-3/4 xl:w-[604px]">
          {/* lg:h-[520px] */}
          <Image
            src={activeImage}
            alt={mockCreator.name}
            fill
            className="object-cover"
            priority
          />

          {/* Rating badge */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 text-white text-sm">
            ⭐ 4.5 <span className="opacity-70">(120)</span>
          </div>
        </div>
      </div>
    </>
  );
}
