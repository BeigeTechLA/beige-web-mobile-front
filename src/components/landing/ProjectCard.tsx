"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface Project {
  title: string;
  description?: string;
  video: string;
}

interface ProjectCardProps {
  project: Project;
  i: number;
}

export default function ProjectCard({ project, i }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);

  const vimeoHoverSrc = (id: string, play: boolean) =>
    `https://player.vimeo.com/video/${id}?autoplay=${play ? 1 : 0}&muted=0&loop=1&controls=${play ? 1 : 0}&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-pointer"
    >
      <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-white/20 transition-all duration-500 h-[300px] lg:h-[500px]">
        <iframe
          src={vimeoHoverSrc(project.video, hovered)}
          allow="autoplay; fullscreen; picture-in-picture"
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-auto"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/50 z-20 pointer-events-none" />

        {/* OVERLAY: Lowered z-index to 0 so it sits BEHIND the iframe controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-[#010101]/40 to-transparent opacity-90 pointer-events-none z-0" />

        {/* TEXT CONTENT: Kept at higher z-index but ensured pointer-events-none */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 z-20 pointer-events-none">
          <h3 className="text-base lg:text-3xl font-bold text-white mb-1.5 md:mb-3">
            {project.title}
          </h3>
          <p className="text-white/60 text-xs lg:text-base leading-relaxed line-clamp-4 group-hover:text-white/80 transition-colors duration-300">
            {project.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}