"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export const useResolvedTheme = () => {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = resolvedTheme ?? theme;
  const isDark = !mounted || activeTheme === "dark";

  return {
    isDark,
    mounted,
    theme: activeTheme,
  };
};
