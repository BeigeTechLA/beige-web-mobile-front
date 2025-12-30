'use client';

import React, { useState, useEffect } from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import FeaturedWorkModal from "./FeaturedWorkModal";

const FeaturedWork = ({ value = [], onChange }) => {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    setItems(Array.isArray(value) ? value : []);
  }, [value]);

  const handleAdd = (item) => {
    const next = [...items, item];
    setItems(next);
    onChange && onChange(next);
  };

  const handleRemove = (id) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    onChange && onChange(next);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-white">Featured Work</h4>
          <p className="text-sm text-white/50">Showcase your best projects or reels</p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors"
            onClick={() => setOpenModal(true)}
          >
            <div className="p-1.5 rounded-full border border-[#E8D1AB]/30 group-hover:bg-[#E8D1AB]/10">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add more</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div 
          onClick={() => setOpenModal(true)}
          className="h-32 border border-dashed border-white/20 rounded-[12px] flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/40 cursor-pointer transition-all group"
        >
          <div className="p-3 rounded-full bg-[#1A1A1A] border border-white/10 mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-[#E8D1AB]" />
          </div>
          <span className="text-sm text-white/40 font-medium group-hover:text-white/60">
            Upload your work, videos or images
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((it) => (
            <div 
              key={it.id} 
              className="relative group bg-[#1A1A1A] rounded-[12px] overflow-hidden border border-white/10 hover:border-[#E8D1AB]/40 transition-all"
            >
              {/* Background image container */}
              <div
                className="relative w-full h-48 lg:h-56 bg-[#262626] bg-cover bg-center"
                style={{
                  backgroundImage: it.image ? `url(${it.image})` : "none",
                }}
              >
                {!it.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-white/10" />
                    </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(it.id)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-red-500 text-white rounded-full p-2 z-20 transition-colors backdrop-blur-sm"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>

                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
              </div>

              {/* Content section */}
              <div className="absolute bottom-0 left-0 w-full p-4 z-30">
                <h5 className="text-base font-bold text-white mb-2">
                  {it.title}
                </h5>

                <div className="flex gap-2 flex-wrap">
                  {it.tags?.map((t) => (
                    <span
                      key={t}
                      className="bg-[#E8D1AB] text-black px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note: Ensure FeaturedWorkModal is also themed dark */}
      <FeaturedWorkModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default FeaturedWork;