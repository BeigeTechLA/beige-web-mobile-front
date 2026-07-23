"use client";

export const Separator = ({ width = "w-full" }: { width?: string }) => {
  return (
    <div className={`h-[2px] md:h-px ${width}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 703 1"
        fill="none"
        className="w-full h-full"
      >
        <path d="M0.25 0.25L702.25 0.250061" stroke="url(#paint0_linear_263_7244)" strokeOpacity="0.68" strokeWidth="0.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="paint0_linear_263_7244" x1="0.25" y1="0.75" x2="702.25" y2="0.750061" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E9E9E9" />
            <stop offset="1" stopColor="#E9E9E9" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};