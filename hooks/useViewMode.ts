import { useState, useEffect } from "react";

export type ViewMode = "grid" | "list" | "board";

export const useViewMode = (key: string = "file-manager-view-mode", initialMode: ViewMode = "grid") => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(key) as ViewMode;
    if (savedMode && (savedMode === "grid" || savedMode === "list" || savedMode === "board")) {
      setViewMode(savedMode);
    }
    setIsInitialized(true);
  }, [key]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(key, viewMode);
    }
  }, [viewMode, key, isInitialized]);

  return [viewMode, setViewMode] as const;
};
