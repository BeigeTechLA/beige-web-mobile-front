"use client";

import React, { useState, useRef, useEffect } from "react";
import { Container } from "../../../components/ui/container";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SlidingHeading } from "./SlidingHeading";

const INFLUENCERS = [
  {
    name: "Natasha Graziano",
    followers: "13.7M",
    reach: "11M Reach in 24 Hours",
    bio: "Global mindset coach and motivational influencer.",
    image: "/images/influencer/natashaGraziano.png",
  },
  {
    name: "Pressa Armani",
    followers: "439K",
    reach: "128k Reach in 48 Hours",
    bio: "Fashion and lifestyle content creator.",
    image: "/images/influencer/pressaarmani.png",
  },
  {
    name: "Cedric The Entertainer",
    followers: "3.3M",
    reach: "128M Reach in 24 Hours",
    bio: "Iconic comedian and Hollywood entertainer.",
    image: "/images/influencer/cedrictheentertainer.png",
  },
  {
    name: "Sean Kelly",
    followers: "3,637",
    reach: "512k Reach in 48 Hours",
    bio: "Digital creator and brand builder.",
    image: "/images/influencer/seanKelly.png",
  },
  {
    name: "kingkarlx",
    followers: "1.1M",
    reach: "512k Reach in 48 Hours",
    bio: "Viral creator with high-engagement content.",
    image: "/images/influencer/kingkarlx@2x.png",
  },
  {
    name: "Chief Keef",
    followers: "9.9M",
    reach: "512k Reach in 48 Hours",
    bio: "Influential rap artist and drill music pioneer.",
    image: "/images/influencer/chiefKeef.png",
  },
  {
    name: "Sharukh",
    followers: "575K",
    reach: "512k Reach in 48 Hours",
    bio: "Relatable creator with strong youth appeal.",
    image: "/images/influencer/Sharukh.png",
  },
  {
    name: "Casey Veggies",
    followers: "189K",
    reach: "512k Reach in 48 Hours",
    bio: "Hip-hop artist and culture entrepreneur.",
    image: "/images/influencer/CaseyVeggies.png",
  },
];

export const Influencers = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const isHoveringDesktop = useRef(false);
  const scrollAccumulator = useRef(0);
  const SCROLL_THRESHOLD = 120;
  const scrollDirection = useRef<"up" | "down">("down");

  const [index, setIndex] = useState(0);
  const [desktopHeight, setDesktopHeight] = useState(0);

  useEffect(() => {
    if (desktopRef.current) {
      setDesktopHeight(desktopRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!isHoveringDesktop.current) return;

      const direction = e.deltaY > 0 ? "down" : "up";
      scrollDirection.current = direction;

      if (
        (index === 0 && direction === "up") ||
        (index === INFLUENCERS.length - 1 && direction === "down")
      ) {
        return;
      }

      e.preventDefault();
      scrollAccumulator.current += e.deltaY;

      if (Math.abs(scrollAccumulator.current) > SCROLL_THRESHOLD) {
        setIndex((prev) =>
          Math.min(
            Math.max(prev + (direction === "down" ? 1 : -1), 0),
            INFLUENCERS.length - 1
          )
        );
        scrollAccumulator.current = 0;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [index]);

  const current = INFLUENCERS[index];
  const isLeft = index % 2 === 1;

  const INFO_OFFSET = 120;
  const infoVariants = {
    enter: (direction: "up" | "down") => ({
      y: direction === "down" ? INFO_OFFSET : -INFO_OFFSET,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: "up" | "down") => ({
      y: direction === "down" ? -INFO_OFFSET : INFO_OFFSET,
      opacity: 0,
    }),
  };

  return (
    <section ref={sectionRef} className="py-10 lg:py-32">
      <Container>
        {/* HEADER */}
        <div className="text-center mb-6 lg:mb-20">
          <div className="inline-flex items-center border-b border-t border-white/60 w-fit px-10 py-2 mb-5 md:mb-6">
            <p className="text-xs md:text-base text-white">Top Creators</p>
          </div>
          <SlidingHeading />
          <p className="text-xs lg:text-base text-white/50 max-w-[640px] mx-auto">
            Beige Media makes it easy for brands to create any video they need
            with a single, trusted partner.
          </p>
        </div>

        {/* MOBILE VIEW: STACKED CARD IMPLEMENTATION */}
        <div className="flex flex-col lg:hidden">
          {INFLUENCERS.map((item, i) => (
            <div
              key={i}
              className="sticky top-24 flex flex-col gap-7 bg-black pb-10 border-t border-white/10 rounded-t-[20px]"
              style={{ zIndex: i + 1 }}
            >
              {/* Mobile: Image */}
              <div className="w-full rounded-[10px] overflow-hidden border border-white/10 bg-black">
                <div className="relative w-full h-[350px]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Mobile: Info */}
              <div className="px-2 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Image
                    src="/svg/Insta.svg"
                    alt="Instagram"
                    width={30}
                    height={30}
                  />
                  <h3 className="text-[22px] text-white">{item.name}</h3>
                </div>

                <div className="flex items-center justify-center gap-2 text-[#ECE1CE] mb-4">
                  <TrendingUp size={20} />
                  <span className="text-base font-light">{item.reach}</span>
                </div>

                <p className="text-white/50 text-sm mb-8">{item.bio}</p>

                <div className="inline-flex items-center px-6 py-3 bg-[#ECE1CE] rounded-lg">
                  <span className="text-black text-[22px] font-bold mr-2">
                    {item.followers}
                  </span>
                  <span className="text-black/70">Followers</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW */}
        <div
          ref={desktopRef}
          className="relative hidden lg:flex items-center justify-center overflow-hidden min-h-[600px]"
          onMouseEnter={() => (isHoveringDesktop.current = true)}
          onMouseLeave={() => {
            isHoveringDesktop.current = false;
            scrollAccumulator.current = 0;
          }}
        >
          {/* IMAGE */}
          <div className="relative z-20 w-[420px] h-[380px] 2xl:w-[480px] 2xl:h-[520px] rounded-[24px] overflow-hidden border border-white/10 bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={current.image}
                  alt={current.name}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* INFO */}
          <AnimatePresence mode="wait" custom={scrollDirection.current}>
            <motion.div
              key={current.name}
              custom={scrollDirection.current}
              variants={infoVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                y: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.35 },
              }}
              className={`absolute max-w-[420px] ${isLeft ? "left-0" : "right-0"
                }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/svg/Insta.svg"
                  alt="Instagram"
                  width={40}
                  height={40}
                />
                <h3 className="text-2xl xl:text-4xl text-white">
                  {current.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[#ECE1CE] mb-4">
                <TrendingUp size={20} />
                <span className="text-lg xl:text-2xl font-light">
                  {current.reach}
                </span>
              </div>

              <p className="text-white/50 text-lg xl:text-xl mb-6">
                {current.bio}
              </p>

              <div className="inline-flex items-center px-6 py-3 bg-[#ECE1CE] rounded-lg">
                <span className="text-black text-xl font-bold mr-2">
                  {current.followers}
                </span>
                <span className="text-black/70">Followers</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
};