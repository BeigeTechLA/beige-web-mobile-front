'use client';

import React, { useState, useRef, useEffect } from "react";
import { Tag, X, Upload, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/utils";
import { toast } from "sonner";

interface FeaturedWorkModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_PROJECT_MB = 50;

// NEW: Allowed types constants
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_EXT_TEXT = "png, jpg, jpeg, webp";

const FeaturedWorkModal = ({ open, onClose, onAdd }: FeaturedWorkModalProps) => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [addTagsOpen, setAddTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const inputClasses = "h-14 w-full rounded-[12px] border border-white/20 bg-[#1A1A1A] px-4 text-white placeholder:text-white/40 outline-none focus:border-[#E8D1AB] focus:ring-0 transition-all";
  const modalBg = "bg-[#101010] border border-white/10 shadow-2xl rounded-[20px]";

  useEffect(() => {
    if (!open) {
      setTitle("");
      setTags([]);
      setTagInput("");
      setImagePreviews([]);
      setRawFiles([]);
      setAddTagsOpen(false);
    }
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // 1. Validation: File Type Check
    const invalidFiles = files.filter(f => !ALLOWED_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error("Invalid File Type", {
        description: `Only ${ALLOWED_EXT_TEXT} files are allowed.`
      });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // 2. Validation: Size checks
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    try {
      setIsCompressing(true);

      const newPreviews: string[] = [];
      const newRawFiles: File[] = [];

      for (const file of files) {
        let processedFile = file;

        // Compress images
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(processedFile); 
        });

        newPreviews.push(base64);
        newRawFiles.push(processedFile);
      }

      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setRawFiles((prev) => [...prev, ...newRawFiles]);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred while processing files.");
    } finally {
      setIsCompressing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (rawFiles.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    onAdd({
      id: Date.now(),
      title,
      tags,
      previews: imagePreviews, 
      files: rawFiles,        
    });

    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className={`${modalBg} w-full md:w-[600px] lg:w-[738px] max-h-[90vh] flex flex-col overflow-hidden relative`}>

          <div className="flex items-center justify-between px-8 pt-6 pb-2">
            <div>
              <h3 className="text-xl font-bold text-white">Add Featured Work</h3>
              <p className="text-sm text-white/40">Upload a project to showcase on your profile</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="px-8 py-6 overflow-auto flex-1 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60 ml-1">Project Title</label>
              <input placeholder="e.g. Cinematic Commercial Reel 2024" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-white/60">Thumbnail / Media</label>
                <span className="text-[10px] text-white/30 tracking-widest uppercase">
                    {ALLOWED_EXT_TEXT} only • Max {MAX_FILE_SIZE_MB}MB
                </span>
              </div>

              {imagePreviews.length === 0 ? (
                <div
                  className={`border-2 border-dashed border-white/10 rounded-[12px] h-56 flex flex-col items-center justify-center bg-white/5 transition-all group ${isCompressing ? "opacity-50 cursor-wait" : "hover:bg-white/10 hover:border-[#E8D1AB]/40 cursor-pointer"}`}
                  onClick={() => !isCompressing && fileRef.current?.click()}
                >
                  <div className="p-4 rounded-full bg-[#1A1A1A] border border-white/10 mb-4 group-hover:scale-110 transition-transform">
                    {isCompressing ? <Loader2 className="w-8 h-8 text-[#E8D1AB] animate-spin" /> : <Upload className="w-8 h-8 text-[#E8D1AB]" />}
                  </div>
                  <div className="text-center px-6">
                    <div className="font-bold text-white text-lg">{isCompressing ? "Optimizing Files..." : "Upload Project Media"}</div>
                    <div className="text-sm text-white/40 mt-1">Allowed: {ALLOWED_EXT_TEXT}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative">
                  {/* Previews logic remains same */}
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative rounded-[12px] overflow-hidden border border-white/20 aspect-square group">
                      <img src={src} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setImagePreviews((prev) => prev.filter((_, i) => i !== index));
                          setRawFiles((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => !isCompressing && fileRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center justify-center border border-dashed border-white/20 rounded-[12px] aspect-square hover:bg-white/5 transition disabled:opacity-50"
                  >
                    <Plus className="text-white/60" />
                  </button>
                </div>
              )}

              {/* Updated accept attribute */}
              <input 
                ref={fileRef} 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".png,.jpg,.jpeg,.webp" 
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="px-4 py-1.5 bg-[#E8D1AB]/10 border border-[#E8D1AB]/30 rounded-full flex items-center gap-2 text-sm text-[#E8D1AB]">
                  #{t}
                  <button onClick={() => removeTag(t)} className="hover:text-white"><X size={14} /></button>
                </span>
              ))}
              <button onClick={() => setAddTagsOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm">
                <Tag className="w-4 h-4" /> Add Tags
              </button>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-white/10 flex justify-end gap-4 bg-[#161616]">
            <Button variant="ghost" onClick={onClose} className="rounded-[12px] h-12 px-8 text-white hover:bg-white/5">Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={!title || imagePreviews.length === 0 || isCompressing}
              className="rounded-[12px] h-12 px-10 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] font-bold disabled:opacity-50"
            >
              {isCompressing ? "Processing..." : "Add Project"}
            </Button>
          </div>

          {addTagsOpen && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-[20px]" onClick={() => setAddTagsOpen(false)} />
              <div className="relative bg-[#1A1A1A] w-full max-w-[400px] border border-white/20 rounded-[16px] p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-1">Add Tags</h2>
                <p className="text-sm text-white/40 mb-4">Help people find your work</p>
                <input
                  autoFocus
                  placeholder="Type tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = tagInput.trim();
                      if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
                      setTagInput("");
                    }
                  }}
                  className={inputClasses}
                />
                <div className="flex flex-wrap gap-2 mt-4 max-h-32 overflow-auto py-2">
                  {tags.map((t) => (
                    <div key={t} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-xs text-white/80">
                      {t} <X size={12} className="cursor-pointer" onClick={() => removeTag(t)} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setAddTagsOpen(false)} className="text-white hover:bg-white/5 h-10">Done</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FeaturedWorkModal;