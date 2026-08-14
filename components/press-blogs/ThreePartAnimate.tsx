"use client";

import React, { useState } from "react";

export interface ThreePartAnimateItem {
  title: string;
  link: string;
  bgImage: string;
}

export interface ThreePartAnimateProps {
  items: ThreePartAnimateItem[];
}

export const ThreePartAnimate: React.FC<ThreePartAnimateProps> = ({ items }) => {
  // Default to second item active as shown in the checked radio tag
  const [activeIndex, setActiveIndex] = useState<number>(1);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full my-8 flex flex-col md:flex-row gap-4 h-[450px] md:h-[520px] transition-all duration-500 ease-in-out">
      {items.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <div
            key={index}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ease-in-out bg-cover bg-center ${isActive
                ? "flex-[3.5] md:flex-[3]"
                : "flex-[1] md:flex-[1] brightness-75 hover:brightness-90"
              }`}
            style={{
              backgroundImage: `url('${item.bgImage}')`,
            }}
          >
            {/* Dark overlay gradient for contrast */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${isActive ? "opacity-90" : "opacity-40"
                }`}
            />

            {/* Card Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center z-10">
              <h3
                className={`text-white font-['Instrument_Sans'] font-medium transition-all duration-300 text-shadow ${isActive
                    ? "text-lg md:text-2xl mb-4 translate-y-0 opacity-100"
                    : "text-xs md:text-sm line-clamp-2 md:line-clamp-3 mb-0 translate-y-2 opacity-80"
                  }`}
              >
                {item.title}
              </h3>

              {/* Action Button - Fades and expands when card becomes active */}
              {item.link && (
                <div
                  className={`overflow-hidden transition-all duration-300 ${isActive
                      ? "max-h-16 opacity-100 translate-y-0 mt-2"
                      : "max-h-0 opacity-0 translate-y-4"
                    }`}
                >
                  <a
                    href={item.link}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block px-5 py-2.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-900 text-white text-xs md:text-sm font-['Instrument_Sans'] border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105"
                  >
                    See Details
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ThreePartAnimate;