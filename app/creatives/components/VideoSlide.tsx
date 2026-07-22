"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Play } from "lucide-react";

export type VideoItem = {
  url: string;
  thumbnail?: string;
};

// Helper functions to extract IDs for Embeds and Thumbnails
const getYouTubeId = (u: string) => {
  try {
    const urlObj = new URL(u);
    if (urlObj.hostname.includes("youtu.be")) return urlObj.pathname.slice(1);
    return urlObj.searchParams.get("v");
  } catch {
    // Fallback for non-standard URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = u.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};

const getVimeoId = (u: string) => {
  try {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = u.match(regExp);
    return match ? match[1] : null;
  } catch { return null; }
};

function buildEmbedUrl(url: string, isPlaying: boolean): string | null {
  if (!isPlaying) return null;
  
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`;
  
  const vimeo = getVimeoId(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}?autoplay=1&badge=0&byline=0&portrait=0&title=0&dnt=1`;
  
  return null;
}

export default function StackedVideoScroll({ videos }: { videos: VideoItem[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

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

  const getTrackHeight = () => {
    if (device === 'mobile') return `120vh`; // More runway for mobile
    if (device === 'tablet') return `150vh`;
    return `${videos.length * 180}vh`; 
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: getTrackHeight() }}
    >
      <div className={`sticky top-0 w-full flex flex-col items-center justify-center overflow-hidden px-5 ${device === 'desktop' ? 'h-screen' : 'h-[60vh] md:h-[70vh]'
        }`}>

        <div className="z-[100] w-full text-center mb-6 md:mb-10">
          <h2 className="text-center text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            Video Portfolio
          </h2>
        </div>

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

  // Auto-generate Thumbnail if not provided by API
  const displayThumbnail = useMemo(() => {
    if (video.thumbnail) return video.thumbnail;
    
    // Auto-fetch YouTube Thumbnail
    const ytId = getYouTubeId(video.url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    
    // For Vimeo, we can't get it via URL alone without API, 
    // but we return null to trigger the fallback gradient
    return null;
  }, [video.url, video.thumbnail]);

  const firstSegmentEnd = device === 'desktop' ? 0.1 : 0.15;
  const remainingSpace = 1 - firstSegmentEnd;
  const otherSegments = remainingSpace / (total - 1 || 1);

  const startAnim = index === 0 ? 0 : firstSegmentEnd + (index - 1) * otherSegments;
  const endAnim = firstSegmentEnd + index * otherSegments;

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
      <div className="relative w-full h-full rounded-[24px] md:rounded-[32px] overflow-hidden border border-[#FFFFFF5C] bg-black">
        {isPlaying ? (
          <iframe 
            src={embedUrl!} 
            className="absolute inset-0 w-full h-full border-0" 
            allow="autoplay; fullscreen" 
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(true)}>
            {displayThumbnail ? (
              <img 
                src={displayThumbnail} 
                alt="Video Thumbnail" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
              />
            ) : (
              // Fallback if no thumbnail is found (especially for Vimeo)
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
            )}
            
            {/* Overlay to make the Play button pop */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

            <button
              className="z-20 w-14 h-14 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110 active:scale-95"
            >
              <Play className="text-black fill-black ml-1 w-6 h-6 md:w-10 md:h-10" />
            </button>
            
            {/* Optional: Video Link Hint */}
            <div className="absolute bottom-6 left-6 text-white/40 text-xs font-mono group-hover:text-white/80 transition-colors">
              {video.url.includes('youtube') ? 'YOUTUBE' : video.url.includes('vimeo') ? 'VIMEO' : 'VIDEO'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}