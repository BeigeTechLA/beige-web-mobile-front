"use client";

export const Separator = () => {
  return (
    <div className="w-full h-[2px] md:h-px">
      <svg
        viewBox="0 0 1600 1"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="separator-gradient"
            x1="0"
            y1="0.5"
            x2="1600"
            y2="0.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.02" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.4" />
            <stop offset="1" stopColor="white" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect
          width="1600"
          height="1"
          fill="url(#separator-gradient)"
        />
      </svg>
    </div>
  );
};
