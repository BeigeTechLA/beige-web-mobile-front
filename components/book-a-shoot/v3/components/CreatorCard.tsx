"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ThumbsDown, ThumbsUp } from "lucide-react";
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
  "/images/crew/CREW(10).png",
];

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
  role_name: string;
  rating: number;
  total_reviews: number;
  profile_image: string;
  hourlyRate?: number;
  crew_member_id: number;
  isActive?: boolean;
  index: number;
  isExpanded: boolean; // Controlled by parent
  onHover: () => void; // Triggered on mouseEnter
  onLeave: () => void; // Triggered on mouseLeave
}

const CreatorCard = ({
  name,
  role_name,
  rating,
  total_reviews,
  profile_image,
  hourlyRate = 0,
  crew_member_id,
  isActive = false,
  index,
  isExpanded,
  onHover,
  onLeave,
}: CreatorCardProps) => {
  const isInvalidImage =
    !profile_image ||
    profile_image.trim().length === 0 ||
    profile_image === "/images/influencer/default.png";

  const fallbackImage = isInvalidImage
    ? crewImages[Number(crew_member_id) % 10]
    : profile_image;

  const currentVariant = isExpanded ? "hover" : "rest";

  const InfoContent = () => (
    <div className="rounded-b-[20px] lg:rounded-none flex flex-col gap-2 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2.5">
          <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20">
            <ThumbsUp className="text-white w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20">
            <ThumbsDown className="text-white w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-base lg:text-xl font-medium">
            {name}
          </h3>
          <p className="text-white/60 text-xs lg:text-base">{role_name}</p>
        </div>
        <p className="bg-[#EDF7EE] text-[#4CAF50] text-xs lg:text-base px-2 py-1 lg:px-3.5 lg:py-2 rounded-full border border-[#4CAF50]">
          Available
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/creatives/${crew_member_id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            className="border-white/30 hover:border-white/50 text-white hover:text-white hover:bg-white/10 px-3 py-2 lg:px-6 lg:py-4 rounded-lg text-sm lg:text-base font-medium"
          >
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div onMouseEnter={onHover} onMouseLeave={onLeave}>
      <CardWrapper animateVariant={currentVariant}>
        {/* IMAGE */}
        <div className="relative w-full h-[240px] md:h-[364px] overflow-hidden rounded-t-[20px]">
          <Image
            src={fallbackImage}
            alt={name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-4 flex items-center justify-between w-full px-2">
            <div className="w-[90px] h-[21px]">
              <Image
                src="https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/assets/logos/beige_logo_vb.png"
                alt={"Beige logo"}
                width={90}
                height={21}
                priority
              />
            </div>

            <div className="flex items-center gap-2 rounded-full">
              {/* Rating */}
              {/* <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 lg:px-4 lg:py-2 rounded-full border border-white/10 relative">
                <Star className="w-3 h-3 lg:w-[18px] lg:h-[18px] text-[#E8D1AB] fill-[#E4CC17]" />
                <span className="text-white text-sm lg:text-lg font-medium">
                  {rating} ({total_reviews})
                </span>
              </div> */}
            </div>
          </div>
        </div>

        {/* MOBILE – ALWAYS VISIBLE */}
        <div className="md:hidden w-full bg-[#171717] border-t border-white/10 p-3 flex flex-col gap-4">
          <InfoContent />
        </div>

        {/* DESKTOP – HOVER ANIMATED (UNCHANGED) */}
        <motion.div
          variants={infoVariants}
          animate={currentVariant}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="hidden md:flex absolute bottom-0 left-0 w-full h-[220px] bg-[#171717] border-t border-white/10 p-3 lg:px-7 lg:py-5 flex-col gap-4"
        >
          <InfoContent />
        </motion.div>
      </CardWrapper>
    </div>
  );
};

const CardWrapper = ({ children, animateVariant }: { children: React.ReactNode; animateVariant: string }) => {
  return (
    <>
      {/* MOBILE – NO MOTION */}
      <div
        className={`md:hidden relative rounded-[20px] bg-[#171717] w-full h-[440px] overflow-hidden`}
      >
        {children}
      </div>

      {/* DESKTOP */}
      <motion.div
        variants={cardVariants}
        animate={animateVariant}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className={`hidden md:block relative rounded-[20px] overflow-hidden bg-[#171717] w-full `}
      >
        {children}
      </motion.div>
    </>
  );
};


export default CreatorCard;
