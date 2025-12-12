"use client";

import React, { useState, useRef, useEffect } from "react";
import { Container } from "@/src/components/landing/ui/container";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

const INFLUENCERS = [
  {
    name: "Natasha Graziano",
    followers: "13.7M",
    reach: "11M Reach in 24 Hours",
    image: "/images/influencer/natashaGraziano.png",
  },
  {
    name: "Pressa Armani",
    followers: "439K",
    reach: "128k Reach in 48 Hours",
    image: "/images/influencer/pressaarmani.png",
  },
  {
    name: "Cedric The Entertainer",
    followers: "3.3M",
    reach: "128M Reach in 24 Hours",
    image: "/images/influencer/cedrictheentertainer.png",
  },
  {
    name: "Sean Kelly",
    followers: "3637",
    reach: "512k Reach in 48 Hours",
    image: "/images/influencer/seanKelly.png",
  },
  {
    name: "kingkarlx",
    followers: "1.1M",
    reach: "512k Reach in 48 Hours",
    image: "/images/influencer/kingkarlx@2x.png",
  },
  {
    name: "chief Keef",
    followers: "9.9M",
    reach: "512k Reach in 48 Hours",
    image: "/images/influencer/chiefKeef.png",
  },
  {
    name: "Sharukh",
    followers: "575K",
    reach: "512k Reach in 48 Hours",
    image: "/images/influencer/Sharukh.png",
  },
  {
    name: "Casey Veggies",
    followers: "189K",
    reach: "512k Reach in 48 Hours",
    image: "/images/influencer/CaseyVeggies.png",
  },
];

export const Influencers = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lockScroll, setLockScroll] = useState(false);

  // Scroll progress for entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const total = INFLUENCERS.length;
  const segment = 1 / total;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const idx = Math.floor(v / segment);

      if (idx !== index && idx < total) {
        setIndex(idx);
      }

      // Lock scroll when inside range
      if (v > 0 && v < 1) {
        if (!lockScroll) {
          setLockScroll(true);
          document.body.style.overflow = "hidden";
        }
      } else {
        if (lockScroll) {
          setLockScroll(false);
          document.body.style.overflow = "";
        }
      }
    });

    return () => {
      document.body.style.overflow = "";
      unsub();
    };
  }, [scrollYProgress, index, lockScroll, segment, total]);

  // Current influencer
  const current = INFLUENCERS[index];

  // Smooth vertical movement
  const y = useTransform(
    scrollYProgress,
    [index * segment, index * segment + segment],
    [50, -50]
  );

  const opacity = useTransform(
    scrollYProgress,
    [
      index * segment,
      index * segment + segment * 0.2,
      index * segment + segment * 0.8,
      index * segment + segment,
    ],
    [0, 1, 1, 0]
  );

  // ALTERNATE LEFT/RIGHT
  const isLeft = index % 2 === 1;

  return (
    <section ref={containerRef} className="py-20 lg:py-32 overflow-hidden">
      <Container>

        {/* HEADER */}
        <div className="text-center mb-12 lg:mb-20">
          <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
            <p className="text-base text-white">Top Influentials</p>
          </div>

          <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-6">
            Partnered with the World's Top Influentials
          </h2>

          <p className="text-sm lg:text-base text-white/50 leading-[28px] font-light max-w-[640px] mx-auto">
            Beige Media makes it easy for brands to create any video they need with a single, trusted partner.
          </p>
        </div>

        {/* MOBILE VIEW */}
        <div className="flex flex-col gap-10 lg:hidden">
          {INFLUENCERS.map((item, i) => (
            <div key={i} className="w-full rounded-[20px] overflow-hidden border border-white/10 bg-black">
              <div className="relative w-full h-[360px]">
                <Image src={item.image} alt={item.name} fill className="object-cover" priority />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Image src="/svg/Insta.svg" alt="Instagram" width={34} height={34} />
                  <h3 className="text-xl text-white">{item.name}</h3>
                </div>

                <div className="flex items-center gap-2 text-[#ECE1CE] mb-4">
                  <TrendingUp size={18} />
                  <span className="text-sm font-light">{item.reach}</span>
                </div>

                <p className="text-white/50 text-sm leading-[22px] mb-6">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                </p>

                <div className="inline-flex items-center px-5 py-3 bg-[#ECE1CE] rounded-lg">
                  <span className="text-black text-lg font-bold mr-2">{item.followers}</span>
                  <span className="text-black/70 text-sm self-end">Followers</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW */}
        <div className="relative items-center justify-center hidden lg:flex">

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
                <Image src={current.image} alt={current.name} fill className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* INFO - LEFT OR RIGHT */}
          <motion.div
            style={{ y, opacity }}
            className={`absolute max-w-[420px] ${isLeft ? "left-0" : "right-0"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Image src={"/svg/Insta.svg"} alt="Instagram Icon" width={40} height={40} />
              <h3 className="text-2xl xl:text-4xl text-white">{current.name}</h3>
            </div>

            <div className="flex items-center gap-2 text-[#ECE1CE] mb-4">
              <TrendingUp size={20} />
              <span className="font-light text-lg xl:text-2xl">{current.reach}</span>
            </div>

            <p className="text-white/50 text-lg xl:text-xl font-light leading-relaxed mb-6">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>

            <div className="inline-flex items-center px-6 py-3 bg-[#ECE1CE] rounded-lg">
              <span className="text-black text-xl font-bold mr-2">{current.followers}</span>
              <span className="text-black/70 text-base self-end">Followers</span>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
