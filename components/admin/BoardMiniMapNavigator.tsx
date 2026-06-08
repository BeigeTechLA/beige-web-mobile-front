"use client";

import React, { useEffect, useRef, useState } from "react";

type BoardMiniMapNavigatorProps = {
  boardRef: React.RefObject<HTMLDivElement | null>;
  segmentCount: number;
  isDark: boolean;
  visible?: boolean;
  syncKey?: string | number;
  width?: number;
};

const MINI_MAP_INSET = 6;
const MIN_LENS_WIDTH = 32;

export default function BoardMiniMapNavigator({
  boardRef,
  segmentCount,
  isDark,
  visible = true,
  syncKey,
  width = 200,
}: BoardMiniMapNavigatorProps) {
  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const [lensWidth, setLensWidth] = useState(48);
  const [lensLeft, setLensLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef(0);

  const syncMiniMapWithBoard = () => {
    const container = boardRef.current;
    if (!container) return;

    const viewportWidth = container.clientWidth;
    const boardWidth = container.scrollWidth;
    const maxBoardScroll = Math.max(boardWidth - viewportWidth, 0);
    const miniMapTrackWidth = width - MINI_MAP_INSET * 2;
    const nextLensWidth = Math.min(
      miniMapTrackWidth,
      Math.max((viewportWidth / Math.max(boardWidth, 1)) * miniMapTrackWidth, MIN_LENS_WIDTH)
    );
    const maxLensTravel = Math.max(miniMapTrackWidth - nextLensWidth, 0);
    const nextLensLeft =
      maxBoardScroll === 0 ? 0 : (container.scrollLeft / maxBoardScroll) * maxLensTravel;

    setLensWidth(nextLensWidth);
    setLensLeft(nextLensLeft);
  };

  const scrollBoardFromLens = (nextLensLeft: number) => {
    const container = boardRef.current;
    if (!container) return;

    const viewportWidth = container.clientWidth;
    const boardWidth = container.scrollWidth;
    const maxBoardScroll = Math.max(boardWidth - viewportWidth, 0);
    const miniMapTrackWidth = width - MINI_MAP_INSET * 2;
    const maxLensTravel = Math.max(miniMapTrackWidth - lensWidth, 0);
    const clampedLensLeft = Math.min(Math.max(nextLensLeft, 0), maxLensTravel);
    const scrollRatio = maxLensTravel === 0 ? 0 : clampedLensLeft / maxLensTravel;

    container.scrollLeft = scrollRatio * maxBoardScroll;
    setLensLeft(clampedLensLeft);
  };

  useEffect(() => {
    if (!visible) return;

    syncMiniMapWithBoard();
    const container = boardRef.current;
    if (!container) return;

    const handleBoardScroll = () => syncMiniMapWithBoard();

    container.addEventListener("scroll", handleBoardScroll, { passive: true });
    window.addEventListener("resize", syncMiniMapWithBoard);

    return () => {
      container.removeEventListener("scroll", handleBoardScroll);
      window.removeEventListener("resize", syncMiniMapWithBoard);
    };
  }, [boardRef, visible, syncKey, width]);

  useEffect(() => {
    if (!isDragging || !visible) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!miniMapRef.current) return;

      const rect = miniMapRef.current.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const nextLensLeft = pointerX - MINI_MAP_INSET - dragOffsetRef.current;

      scrollBoardFromLens(nextLensLeft);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, visible, lensWidth, width]);

  if (!visible || segmentCount <= 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20">
      <div
        ref={miniMapRef}
        onMouseDown={(event) => {
          if (!miniMapRef.current) return;

          const rect = miniMapRef.current.getBoundingClientRect();
          const target = event.target as HTMLElement;
          const clickedLens = target.dataset.role === "mini-map-lens";
          const pointerX = event.clientX - rect.left - MINI_MAP_INSET;

          if (clickedLens) {
            dragOffsetRef.current = pointerX - lensLeft;
          } else {
            dragOffsetRef.current = lensWidth / 2;
            scrollBoardFromLens(pointerX - dragOffsetRef.current);
          }

          setIsDragging(true);
        }}
        className={`pointer-events-auto relative h-14 overflow-hidden rounded-2xl border p-1.5 shadow-lg backdrop-blur-sm cursor-pointer ${isDark ? "border-white/10 bg-[#151515F2] shadow-black/40" : "border-[#D9D9D9] bg-[#FFFFFFF2] shadow-black/10"}`}
        style={{ width: `${width}px` }}
      >
        <div className="flex h-full gap-1 rounded-xl">
          {Array.from({ length: segmentCount }, (_, index) => (
            <div
              key={`mini-segment-${index}`}
              className={`h-full flex-1 rounded-md ${isDark ? "bg-white/8" : "bg-[#F0F0F0]"}`}
            />
          ))}
        </div>
        <div
          data-role="mini-map-lens"
          className={`absolute top-1.5 bottom-1.5 rounded-lg border-2 bg-transparent ${isDark ? "border-[#E8D1AB] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "border-[#2563EB] shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"}`}
          style={{
            left: `${MINI_MAP_INSET}px`,
            width: `${lensWidth}px`,
            transform: `translateX(${lensLeft}px)`,
          }}
        />
      </div>
    </div>
  );
}
