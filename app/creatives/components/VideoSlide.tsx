"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Play } from "lucide-react";

export type VideoItem = {
  url: string;
  thumbnail?: string;
};

function buildEmbedUrl(url: string, isPlaying: boolean): string | null {
  if (!isPlaying) return null;
  const getYouTubeId = (u: string) => {
    try {
      const urlObj = new URL(u);
      return urlObj.hostname.includes("youtu.be") ? urlObj.pathname.slice(1) : urlObj.searchParams.get("v");
    } catch { return null; }
  };
  const getVimeoId = (u: string) => {
    try {
      const urlObj = new URL(u);
      return urlObj.hostname.includes("vimeo.com") ? urlObj.pathname.split("/").filter(Boolean)[0] : null;
    } catch { return null; }
  };

  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0`;
  const vimeo = getVimeoId(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}?autoplay=1&badge=0&byline=0&portrait=0&title=0&dnt=1`;
  return null;
}

export default function StackedVideoScroll({ videos }: { videos: VideoItem[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Responsive scroll track: Mobile needs less "runway" than Desktop
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDevice('mobile');
      else if (width < 1024) setDevice('tablet');
      else setDevice('desktop');
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track height logic: 
  const getTrackHeight = () => {
    if (device === 'mobile') return `40vh`;
    if (device === 'tablet') return `60vh`;

    return `${videos.length * 180}vh`; // Increased for better desktop gaps
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: getTrackHeight() }}
    >
      <div className={`sticky top-0 w-full flex flex-col items-center justify-center overflow-hidden px-5 ${device === 'desktop' ? 'h-screen' : 'h-[40vh] md:h-[60vh]'
        }`}>

        {/* Title: High Z-index ensures videos slide UNDER it on laptops */}
        <div className="z-[100] w-full text-center mb-6 md:mb-10">
          <h2 className="text-center text-lg md:text-[56px] font-medium text-gradient-white">
            Video Portfolio
          </h2>
        </div>

        {/* Video Stage: We control the aspect ratio and max-width strictly */}
        <div className="relative w-full aspect-video max-w-[1200px] z-10">
          {videos.map((video, index) => (
            <VideoCard
              key={index}
              video={video}
              index={index}
              total={videos.length}
              progress={scrollYProgress}
              device={device}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video, index, total, progress, device }: {
  video: VideoItem; index: number; total: number; progress: any; device: string
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Timing: Desktop stays at 0.1 for long gaps, mobile is 0.15 for snappier entry
  const firstSegmentEnd = device === 'desktop' ? 0.1 : 0.15;
  const remainingSpace = 1 - firstSegmentEnd;
  const otherSegments = remainingSpace / (total - 1);

  const startAnim = index === 0 ? 0 : firstSegmentEnd + (index - 1) * otherSegments;
  const endAnim = firstSegmentEnd + index * otherSegments;

  // Offset: 200vh ensures a huge gap between videos as they arrive
  const yValue = useTransform(
    progress,
    [startAnim - 0.15, startAnim],
    index === 0 ? ["0%", "0%"] : ["200vh", "0%"]
  );

  const y = useSpring(yValue, {
    stiffness: device === 'desktop' ? 70 : 50,
    damping: 25
  });

  const scale = useTransform(progress, [startAnim, endAnim], [1, 0.94]);
  const embedUrl = useMemo(() => buildEmbedUrl(video.url, isPlaying), [video.url, isPlaying]);

  return (
    <motion.div
      style={{
        y,
        scale: index === total - 1 ? 1 : scale,
        zIndex: index + 10
      }}
      className="absolute inset-0 w-full h-full"
    >
      <div className="relative w-full h-full rounded-[24px] md:rounded-[32px] overflow-hidden border border-[#FFFFFF5C]">
        {isPlaying ? (
          <iframe src={embedUrl!} className="absolute inset-0 w-full h-full border-0" allow="autoplay; fullscreen" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center group">
            {video.thumbnail ? (
              <img src={video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black" />
            )}
            {/* <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" /> */}
            <button
              onClick={() => setIsPlaying(true)}
              className="z-20 w-14 h-14 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <Play className="text-black fill-black ml-1 w-6 h-6 md:w-10 md:h-10" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}