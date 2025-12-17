import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchedCreatorCardProps {
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
  shootId?: string;
  creatorId: string;
  isActive?: boolean;
}

const MatchedCreatorCard = ({
  name,
  role,
  price,
  rating,
  reviews,
  image,
  isTopMatch = false,
  shootId,
  creatorId,
}: MatchedCreatorCardProps) => {
  return (
    <div
      className={`relative group overflow-hidden rounded-[20px] h-[250px] lg:w-[474px] lg:h-[567px] border border-white/40`}>
      <div className="relative w-full h-[170px] lg:h-[407px] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" /> */}

        <div className="absolute top-4 right-3 flex items-center justify-end w-full px-2">
          {/* Rating */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 relative">
            <Star className="w-[18px] h-[18px] text-[#E8D1AB] fill-[#E4CC17]" />
            <span className="text-white text-lg font-medium">
              {rating} ({reviews})
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="w-full bg-[#0B0B0B] p-6 flex flex-col gap-4 pointer-events-auto"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-xl font-medium">{name}</h3>
              <p className="text-white/60 text-base">{role}</p>
            </div>
            <p className="bg-[#EDF7EE] text-[#4CAF50] text-base px-3.5 py-2 rounded-full border border-[#4CAF50]">
              Available
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/search-results/${creatorId}${shootId ? `?shootId=${shootId}` : ""
                }`}
            >
              <Button className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black px-6 py-4 rounded-lg text-base font-medium">
                Book Now
              </Button>
            </Link>

            <div>
              <span className="text-[#E8D1AB] text-xl font-bold">{price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchedCreatorCard;
