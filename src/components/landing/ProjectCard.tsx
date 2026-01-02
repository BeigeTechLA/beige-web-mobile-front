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

export default function ProjectCard({
  project,
  i,
}: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);

  const videoSrc = hovered
    ? `${project.video}?autoplay=1&muted=1&loop=1&playsinline=1`
    : `${project.video}?muted=1&playsinline=1`;

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
          src={videoSrc}
          allow="autoplay; picture-in-picture"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-[#010101]/40 to-transparent opacity-90 pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
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