import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
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
}: {
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
  shootId?: string;
  creatorId: string;
}) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
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

        {/* Rating */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <Star className="w-3 h-3 text-[#E8D1AB] fill-[#E8D1AB]" />
          <span className="text-white text-xs font-medium">
            {rating} ({reviews})
          </span>
        </div>

        {isTopMatch && (
          <div className="absolute top-4 left-4 bg-[#E8D1AB] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Top Match
          </div>
        )}
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
          p-6
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white text-xl font-medium">{name}</h3>
              <span className="bg-[#4CAF50]/20 text-[#4CAF50] text-[10px] px-2 py-0.5 rounded-full border border-[#4CAF50]/30">
                Available
              </span>
            </div>
            <p className="text-white/60 text-sm">{role}</p>
          </div>

          <button className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10">
            +
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div>
            <span className="block text-white/40 text-xs">Starting at</span>
            <span className="text-[#E8D1AB] font-medium">{price}</span>
          </div>

          <Link
            href={`/search-results/${creatorId}${
              shootId ? `?shootId=${shootId}` : ""
            }`}
          >
            <Button className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black h-9 px-4 rounded-lg text-sm font-medium">
              View Profile
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreatorCard;
