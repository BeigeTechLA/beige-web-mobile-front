"use client";

import Lottie from "lottie-react";
import yellowAnimation from "@/public/animations/Yellow.json";

const yellowDotAnimation = {
  ...yellowAnimation,
  layers: yellowAnimation.layers.filter((layer) => layer.nm !== "Exclamation Mark"),
};

export function EditorNextActionIcon({ className }: { className: string }) {
  return <Lottie 
    animationData={yellowDotAnimation} 
    loop 
    autoplay 
    className={className} 
    style={{ filter: "hue-rotate(-18deg) saturate(1.25)" }} />;
}
