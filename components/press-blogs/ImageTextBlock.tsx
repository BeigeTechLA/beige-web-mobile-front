"use client";

import React from "react";

export interface ImageTextBlockData {
  title: React.ReactNode;
  description: React.ReactNode;
  imageSrc: string;
  imageAlt?: string;
  caption?: React.ReactNode;
  imageFirst?: boolean;
}

export const ImageTextBlock: React.FC<ImageTextBlockData> = ({
  title,
  description,
  imageSrc,
  imageAlt = "",
  caption,
  imageFirst = false,
}) => {
  const textContent = (
    <div className="flex flex-col justify-center space-y-4 w-full">
      {title && <div className="text-white font-['Instrument_Sans']">{title}</div>}
      {description && (
        <div className="font-['Yrsa'] text-white text-sm lg:text-2xl">
          {description}
        </div>
      )}
    </div>
  );

  const imageContent = (
    <div className="flex flex-col items-center w-full">
      {imageSrc && (
        <div className="w-full overflow-hidden rounded-2xl shadow-sm border border-white/10">
          <img
            src={`${imageSrc}`}
            alt={imageAlt}
            className="w-full h-auto object-cover block"
          />
        </div>
      )}
      {caption && (
        <div className="mt-3 text-center text-xs lg:text-sm font-semibold text-white/70 font-['Instrument_Sans'] tracking-wide">
          {caption}
        </div>
      )}
    </div>
  );

  return (
    <div className="my-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
      {imageFirst ? (
        <>
          {imageContent}
          {textContent}
        </>
      ) : (
        <>
          {textContent}
          {imageContent}
        </>
      )}
    </div>
  );
};

export default ImageTextBlock;