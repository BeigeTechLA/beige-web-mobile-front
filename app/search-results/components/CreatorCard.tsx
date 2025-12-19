import Link from "next/link";
import Image from "next/image";
import { Plus, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// DummyImage List: To be removed later
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
  "/images/crew/CREW(10).png"
]

const INFO_HEIGHT = 220;

const cardVariants = {
  rest: { height: 364 },
  hover: { height: 364 + INFO_HEIGHT },
};

const infoVariants = {
  rest: {
    y: INFO_HEIGHT,
    opacity: 0,
  },
  hover: {
    y: 0,
    opacity: 1,
  },
};

interface CreatorCardProps {
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
  matchScore?: number; // New: skill match score
  matchingSkills?: string[]; // New: which skills matched
}

const CreatorCard = ({
  name,
  role,
  price,
  rating,
  reviews,
  image,
  isTopMatch = false,
  shootId,
  creatorId,
  isActive = false,
  matchScore,
  matchingSkills,
}: CreatorCardProps) => {
  // Temporary code until images are avilable
  const isInvalidImage =
    !image ||
    image.trim().length === 0 ||
    image === "/images/influencer/default.png";

  const fallbackImage = isInvalidImage
    ? crewImages[parseInt(creatorId) % 10]
    : image;

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      animate={isActive ? "hover" : "rest"}
      whileHover="hover"
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="
        relative
        overflow-hidden
        rounded-[20px]
        bg-black
        w-full
      "
    >
      {/* IMAGE */}
      <div className="relative w-full h-[364px] overflow-hidden">
        <Image
          src={fallbackImage}
          alt={name}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-4 flex items-center justify-between w-full px-2">
          <div className="w-[90px] h-[21px]">
            <Image
              src="/images/logos/beige_logo_vb.png"
              alt={"Beige logo"}
              width={90}
              height={21}
              priority
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Match Score Badge (if skill scoring is active) */}
            {matchScore !== undefined && matchScore > 0 && (
              <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md px-2 py-1 lg:px-3 lg:py-2 rounded-full border border-green-400/40 relative">
                <span className="text-xs lg:text-sm text-green-300 font-medium">
                  {matchScore} skill{matchScore !== 1 ? 's' : ''} matched
                </span>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 lg:px-4 lg:py-2 rounded-full border border-white/10 relative">
              <Star className="w-3 h-3 lg:w-[18px] lg:h-[18px] text-[#E8D1AB] fill-[#E4CC17]" />
              <span className="text-white text-sm lg:text-lg font-medium">
                {rating} ({reviews})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INFO PANEL */}
      <motion.div
        variants={infoVariants}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className=" absolute bottom-0 left-0 w-full h-[220px] bg-[#0B0B0B] border-t border-white/10 p-3 lg:px-7 lg:py-5 flex flex-col gap-4 pointer-events-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2.5">
            <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20">
              <ThumbsUp className="text-white w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20">
              <ThumbsDown className="text-white w-5 h-5" />
            </button>
          </div>
          <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20">
            <Plus className="text-white w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-base lg:text-xl font-medium">{name}</h3>
            <p className="text-white/60 text-xs lg:text-base">{role}</p>
          </div>
          <p className="bg-[#EDF7EE] text-[#4CAF50] text-xs lg:text-base px-2 py-1 lg:px-3.5 lg:py-2 rounded-full border border-[#4CAF50]">
            Available
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/search-results/${creatorId}${shootId ? `?shootId=${shootId}` : ""
              }`}
            onClick={(e) => {
              // Prevent Swiper from interfering with navigation
              e.stopPropagation();
            }}
          >
            <Button
              className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black px-3 py-2 lg:px-6 lg:py-4 rounded-lg text-sm lg:text-base rounded-lg font-medium"
              onClick={(e) => {
                // Ensure click event reaches the Link
                e.stopPropagation();
              }}
            >
              View Profile
            </Button>
          </Link>

          <div>
            <span className="text-[#E8D1AB] text-base lg:text-xl font-bold">{price}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreatorCard;
