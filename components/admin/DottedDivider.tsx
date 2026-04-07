"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const DottedDivider = ({ className = "" }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <div
      className={`h-[1px] w-full my-4 lg:my-9 transition-colors duration-300 ${className}`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(to right, #3f3f46 50%, transparent 50%)`
          : `linear-gradient(to right, #D1D1D1 50%, transparent 50%)`,
        backgroundSize: "30px 1px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
};

export default DottedDivider;