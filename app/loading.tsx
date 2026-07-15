"use client"; // This fixes the 'styled-jsx' error

import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col bg-[#09090b] overflow-hidden">
      {/* 1. TOP PROGRESS BAR (Like YouTube/GitHub) */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] overflow-hidden bg-blue-900/20">
        <div className="h-full bg-blue-500 w-1/3 animate-progress shadow-[0_0_10px_#3b82f6]"></div>
      </div>

      {/* 2. HEADER SKELETON */}
      <div className="h-16 w-full border-b border-[#1f1f23] flex items-center justify-between px-8 bg-[#09090b]">
        <div className="h-5 w-32 bg-[#1f1f23] rounded-md animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-8 w-8 rounded-full bg-[#1f1f23] animate-pulse"></div>
          <div className="h-8 w-24 bg-[#1f1f23] rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 3. SIDEBAR SKELETON */}
        <div className="w-64 border-r border-[#1f1f23] p-6 space-y-6 hidden md:block">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-[#1f1f23] animate-pulse"></div>
              <div className="h-4 w-28 rounded bg-[#1f1f23] animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* 4. MAIN CONTENT AREA SKELETON */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
          {/* Page Title Section */}
          <div className="space-y-3">
            <div className="h-9 w-64 bg-[#1f1f23] rounded-lg animate-pulse"></div>
            <div className="h-4 w-96 bg-[#1f1f23]/40 rounded-lg animate-pulse"></div>
          </div>

          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl border border-[#1f1f23] bg-[#0c0c0e] p-5 relative overflow-hidden">
                <div className="h-4 w-24 bg-[#1f1f23] rounded mb-4"></div>
                <div className="h-8 w-16 bg-[#1f1f23] rounded"></div>
                {/* Shimmer overlay */}
                <div className="shimmer-effect"></div>
              </div>
            ))}
          </div>

          {/* Large Content Block / Table */}
          <div className="rounded-xl border border-[#1f1f23] bg-[#0c0c0e] overflow-hidden">
            <div className="p-4 border-b border-[#1f1f23] bg-[#121214]/50">
              <div className="h-4 w-40 bg-[#1f1f23] rounded"></div>
            </div>
            <div className="p-6 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1f1f23]/30 last:border-0">
                  <div className="flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-lg bg-[#1f1f23] animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-[#1f1f23] rounded"></div>
                      <div className="h-3 w-32 bg-[#1f1f23]/40 rounded"></div>
                    </div>
                  </div>
                  <div className="h-9 w-24 bg-[#1f1f23] rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .shimmer-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
          transform: translateX(-100%);
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes progress {
          0% { transform: translateX(-100%); width: 10%; }
          50% { width: 40%; }
          100% { transform: translateX(400%); width: 10%; }
        }
      `}</style>
    </div>
  );
}
