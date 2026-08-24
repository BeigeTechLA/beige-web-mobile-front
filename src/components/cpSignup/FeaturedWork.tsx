'use client';

import React, { useState, useEffect } from "react";
import { Plus, X, Image as ImageIcon, Pencil } from "lucide-react";
import FeaturedWorkModal from "./FeaturedWorkModal";
import { toast } from "sonner";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

// Swiper Styles
import 'swiper/css';
import 'swiper/css/pagination'

export type FeaturedWorkItem = {
  id?: string | number;
  title: string;
  tags?: string[];
  image?: string;
  previews?: string[];
  fileIds?: Array<string | number>;
  removedFileIds?: Array<string | number>;
  files?: Array<
    File | {
      crewFilesId?: string | number;
      file_path?: string;
      title?: string;
      tag?: string;
      file?: File;
    }
  >;
};

type FeaturedWorkProps = {
  value?: FeaturedWorkItem[];
  onChange?: (items: FeaturedWorkItem[]) => void | Promise<void>;
  darkTheme?: boolean;
  onDeleteItem?: (item: FeaturedWorkItem) => Promise<void> | void;
  onUploadFiles?: (files: File[]) => Promise<Array<Record<string, unknown>>>;
};

const MAX_PROJECTS = 5;

const FeaturedWork = ({ value = [], onChange, onDeleteItem, onUploadFiles, darkTheme = true }: FeaturedWorkProps) => {
  const [items, setItems] = useState<FeaturedWorkItem[]>(Array.isArray(value) ? value : []);
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedWorkItem | null>(null);

  useEffect(() => {
    setItems(Array.isArray(value) ? value : []);
  }, [value]);

  const handleOpenModal = () => {
    if (items.length >= MAX_PROJECTS) {
      toast.error(`You have reached the limit of ${MAX_PROJECTS} projects.`);
      return;
    }
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleEdit = (item: FeaturedWorkItem) => {
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleAddOrUpdate = async (item: FeaturedWorkItem) => {
    const shouldReplace = editingItem && String(editingItem.id) === String(item.id);
    const next = shouldReplace
      ? items.map((it) => (String(it.id) === String(item.id) ? item : it))
      : [...items, item];
    setItems(next);
    if (onChange) {
      await onChange(next);
    }
    setEditingItem(null);
  };

  const handleRemove = (id?: string | number) => {
    if (id === undefined || id === null) return;
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    onChange && onChange(next);
  };

  const handleDelete = async (item: FeaturedWorkItem) => {
    try {
      await onDeleteItem?.(item);
      handleRemove(item.id);
      toast.info("Featured work removed");
    } catch (error) {
      console.error("Failed to remove featured work:", error);
      toast.error("Failed to remove featured work.");
    }
  };

  return (
    <div className="w-full">
      <style jsx global>{`
        .featured-swiper .swiper-pagination-bullets {
          bottom: 40px !important;
          display: flex;
          justify-content: center;
          gap: 6px;
          z-index: 50 !important;
        }

        .featured-swiper .swiper-pagination-bullet {
          width: 28px;
          height: 3px;
          border-radius: 2px;
          background: #ffffff;
          opacity: 1;
          margin: 0 !important;
          transition: all 0.3s ease;
        }

        .featured-swiper .swiper-pagination-bullet-active {
          background: #E8D1AB;
          width: 40px;
        }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-white">Showcase Your Work *</h4>
          <p className="text-sm text-white/50">
            Add up to {MAX_PROJECTS} projects. Each project must have at least 5 images.
          </p>
          <p className="text-sm text-white/50 mt-1">
            Upload Images of your best work (png, jpg, jpeg, webp - Min 5)
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors"
            onClick={handleOpenModal}
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
          onClick={handleOpenModal}
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
          {items.map((it) => {
            const images = it.previews?.length ? it.previews : it.image ? [it.image] : [];
            return (
              <div
                key={it.id}
                className="relative group bg-[#1A1A1A] rounded-[12px] overflow-hidden border border-white/10 hover:border-[#E8D1AB]/40 transition"
              >
                {/* Swiper */}
                <div className="relative w-full h-48 lg:h-56 bg-[#262626] flex overflow-hidden">
                  {images.length > 0 ? (
                    <Swiper
                      modules={[Pagination]}
                      pagination={{
                        clickable: true,
                      }}
                      className="featured-swiper w-full h-full relative z-20"
                    >
                      {images.map((src, idx) => (
                        <SwiperSlide key={idx}>
                          <img
                            src={src}
                            alt={`${it.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-white/10" />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className={`absolute top-4 right-4 flex gap-3 z-50 transition-opacity ${openModal ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(it);
                      }}
                      className="bg-black/60 hover:bg-[#E8D1AB] hover:text-black text-white rounded-full p-2.5 transition-colors backdrop-blur-sm shadow-lg"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(it);
                      }}
                      className="bg-black/60 hover:bg-red-500 text-white rounded-full p-2.5 transition-colors backdrop-blur-sm shadow-lg"
                      aria-label="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Content section */}
                <div className="absolute bottom-0 left-0 w-full p-2.5 z-30 pointer-events-none">
                  <h5 className="text-base font-bold text-white mb-2 pointer-events-none">
                    {it.title}
                  </h5>

                  <div className="flex gap-2 flex-wrap pointer-events-none">
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
            );
          })}
        </div>
      )}

      <FeaturedWorkModal
        open={openModal}
        editItem={editingItem as any}
        onClose={() => {
          setOpenModal(false);
          setEditingItem(null);
        }}
        onAdd={handleAddOrUpdate as any}
        isDark={darkTheme}
        onUploadFiles={onUploadFiles}
      />
    </div>
  );
};

export default FeaturedWork;
