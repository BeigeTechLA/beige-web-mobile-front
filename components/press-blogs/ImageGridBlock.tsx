"use client";

import React, { useState, useEffect, useCallback } from "react";

export interface ImageGridBlockProps {
  children: React.ReactNode[];
}

export const ImageGridBlock: React.FC<ImageGridBlockProps> = ({ children }) => {
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);

  const itemCount = React.Children.count(children);

  // Dynamic grid column mapping
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    }
  };

  // Close preview on ESC key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setActiveImage(null);
    }
  }, []);

  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, handleKeyDown]);

  // Helper function to extract image source from various child nodes
  const extractImageInfo = (childNode: React.ReactNode): { src: string; alt: string } => {
    if (!React.isValidElement(childNode)) return { src: "", alt: "" };

    // Case 1: Direct <img> element
    if (childNode.type === "img") {
      const props = childNode.props as { src?: string; alt?: string };
      return { src: props.src || "", alt: props.alt || "" };
    }

    // Case 2: <a> or <div> wrapping an <img>
    const props = childNode.props as { href?: string; children?: React.ReactNode; src?: string; alt?: string };

    if (props.children) {
      let foundSrc = "";
      let foundAlt = "";

      React.Children.forEach(props.children, (nestedChild) => {
        if (React.isValidElement(nestedChild)) {
          const nestedProps = nestedChild.props as { src?: string; alt?: string };
          if (nestedChild.type === "img" || nestedProps.src) {
            foundSrc = nestedProps.src || "";
            foundAlt = nestedProps.alt || "";
          }
        }
      });

      if (foundSrc) return { src: foundSrc, alt: foundAlt };
    }

    // Case 3: <a> tag with href pointing to image URL
    if (props.href && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(props.href)) {
      return { src: props.href, alt: props.alt || "Grid Image" };
    }

    return { src: props.src || "", alt: props.alt || "" };
  };

  return (
    <>
      <div className={`my-4 grid ${getGridClass(itemCount)} gap-5 w-full lg:max-h-[600px] lg:h-[600px]`}>
        {React.Children.map(children, (child, index) => {
          const { src, alt } = extractImageInfo(child);

          return (
            <div
              key={`grid-item-${index}`}
              onClick={() => src && setActiveImage({ src, alt })}
              className={`relative w-full h-full min-h-0 min-w-0 overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02] [&_img]:w-full [&_img]:h-full [&_img]:object-cover ${src ? "cursor-pointer" : ""}`}
            >
              {child}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Preview Modal */}
      {activeImage && (
        <div
          className="h-full fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setActiveImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing modal
          >
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGridBlock;