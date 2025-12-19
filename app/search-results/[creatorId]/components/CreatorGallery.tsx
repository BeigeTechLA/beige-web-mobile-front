"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";

// temporary set. to be removed once data is available
const tempImages = [
  "/images/crew/CREW(9).png",
  "/images/crew/CREW70.png",
  "/images/crew/CREW71.png",
  "/images/crew/CREW72.png",
  "/images/crew/CREW74.png",
]

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
  const galleryImages = mockCreator.images.length === 0 ? tempImages : mockCreator.images
  const [activeImage, setActiveImage] = useState<string>(
    galleryImages[0]
  );

  return (
    <div className="flex flex-col lg:flex-row w-full gap-5 max-h-[880px]">
      {/* SIDE / THUMBNAILS */}
      <div
        className="
          order-2
          flex gap-4
          overflow-x-auto no-scrollbar
          w-full
          lg:order-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden
          lg:w-1/4
          pr-1
        "
      >
        {galleryImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImage(img)}
            className={`
              relative shrink-0
              w-[120px] h-[120px]
              lg:w-full lg:h-[205px] lg:max-w-[225px]
              rounded-[20px] overflow-hidden transition
              ${activeImage === img ? "" : "opacity-70 hover:opacity-100"}
            `}
          >
            <Image
              src={img}
              alt={`Thumbnail ${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* MAIN IMAGE */}
      <div
        className="
          order-1
          relative rounded-[20px] overflow-hidden
          aspect-[4/5]
          w-full
          lg:order-2 lg:w-3/4 xl:w-[604px]
        "
      >
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
  );
}
