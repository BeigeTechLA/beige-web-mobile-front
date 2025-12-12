"use client";

import React from "react";
import Image from "next/image";

export const Separator = () => {
  return (
    <div className="relative w-full h-[1px]">
      <Image
        src="/svg/Line.svg"
        alt="Line separator"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
};
