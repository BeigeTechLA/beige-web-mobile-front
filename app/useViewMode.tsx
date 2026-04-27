import { useEffect, useState } from "react";

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("viewMode") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  return { viewMode, setViewMode };
};