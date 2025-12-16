import Link from "next/link";
import Image from "next/image";
import { Plus, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
}: CreatorCardProps) => {
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
          src={image}
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

          {/* Rating */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 relative">
            <Star className="w-[18px] h-[18px] text-[#E8D1AB] fill-[#E4CC17]" />
            <span className="text-white text-lg font-medium">
              {rating} ({reviews})
            </span>
          </div>
        </div>
      </div>

      {/* INFO PANEL */}
      <motion.div
        variants={infoVariants}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="
          absolute
          bottom-0
          left-0
          w-full
          h-[220px]
          bg-[#0B0B0B]
          border-t border-white/10
          px-7
          py-5
          flex flex-col gap-4
          pointer-events-auto
        "
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
            <h3 className="text-white text-2xl font-medium">{name}</h3>
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
              View Profile
            </Button>
          </Link>

          <div>
            <span className="text-[#E8D1AB] text-xl font-medium">{price}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreatorCard;
