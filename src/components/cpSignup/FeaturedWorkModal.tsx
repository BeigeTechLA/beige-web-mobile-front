'use client';

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Tag, X, Upload, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/utils";
import { toast } from "sonner";

interface FeaturedWorkItem {
  id?: string | number;
  title?: string;
  tags?: string[];
  image?: string;
  previews?: string[];
  files?: File[];
}

interface FeaturedWorkModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: FeaturedWorkItem) => void;
  editItem?: FeaturedWorkItem | null;
  isDark: boolean;
}

interface PreviewItem {
  id: string;
  src: string;
}

interface StoredFileItem {
  file: File;
  signature: string;
}

const MAX_FILE_SIZE_MB = 30;
const MIN_PROJECT_IMAGES = 5;
const MAX_PROJECT_IMAGES = 20;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_EXT_TEXT = "png, jpg, jpeg, webp";

const createPreviewId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getFileSignature = (file: File) =>
  [file.name, file.size, file.lastModified, file.type].join("__");

const FeaturedWorkModal = ({ open, onClose, onAdd, editItem, isDark }: FeaturedWorkModalProps) => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [addTagsOpen, setAddTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);
  const [rawFiles, setRawFiles] = useState<StoredFileItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Dynamic conditional class rules based on themes
  const inputClasses = `h-14 w-full rounded-[12px] border px-4 outline-none focus:ring-0 transition-all ${isDark
      ? "border-white/20 bg-[#1A1A1A] text-white placeholder:text-white/40 focus:border-[#E8D1AB]"
      : "border-black/10 bg-neutral-50 text-black placeholder:text-black/40 focus:border-[#cbb38b]"
    }`;

  const modalBg = `shadow-2xl rounded-[20px] border ${isDark ? "bg-[#101010] border-white/10" : "bg-white border-black/5"}`;

  useEffect(() => {
    if (open) {
      if (editItem) {
        setTitle(editItem.title || "");
        setTags(editItem.tags || []);
        const previews = editItem.previews || (editItem.image ? [editItem.image] : []);
        setImagePreviews(
          previews.map((src: string) => ({
            id: createPreviewId(),
            src,
          }))
        );
        setRawFiles(
          (editItem.files || []).map((file: File) => ({
            file,
            signature: getFileSignature(file),
          }))
        );
      } else {
        setTitle("");
        setTags([]);
        setTagInput("");
        setImagePreviews([]);
        setRawFiles([]);
      }
      setAddTagsOpen(false);
    }
  }, [open, editItem]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (imagePreviews.length + files.length > MAX_PROJECT_IMAGES) {
      toast.error(`Maximum ${MAX_PROJECT_IMAGES} images allowed per project.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const invalidFiles = files.filter(f => !ALLOWED_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error("Invalid File Type", {
        description: `Only ${ALLOWED_EXT_TEXT} files are allowed.`
      });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    try {
      setIsCompressing(true);

      const newPreviews: PreviewItem[] = [];
      const newRawFiles: StoredFileItem[] = [];
      const existingSignatures = new Set(rawFiles.map((item) => item.signature));
      const batchSignatures = new Set<string>();
      let skippedDuplicateCount = 0;

      for (const file of files) {
        let processedFile = file;

        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }

        const signature = getFileSignature(processedFile);
        if (existingSignatures.has(signature) || batchSignatures.has(signature)) {
          skippedDuplicateCount += 1;
          continue;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(processedFile);
        });

        newPreviews.push({
          id: createPreviewId(),
          src: base64,
        });
        newRawFiles.push({
          file: processedFile,
          signature,
        });
        batchSignatures.add(signature);
      }

      if (newPreviews.length > 0) {
        setImagePreviews((prev) => [...prev, ...newPreviews]);
        setRawFiles((prev) => [...prev, ...newRawFiles]);
      }

      if (skippedDuplicateCount > 0) {
        toast.error("Duplicate image skipped", {
          description: `${skippedDuplicateCount} image(s) already added.`
        });
      }

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
    if (imagePreviews.length < 5) {
      toast.error("Low Image Count", {
        description: "Please upload at least 5 images for this project."
      });
      return;
    }

    onAdd({
      id: editItem ? editItem.id : Date.now(),
      title,
      tags,
      previews: imagePreviews.map((item) => item.src),
      files: rawFiles.map((item) => item.file),
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
              <h3 className={`text-lg lg:text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                {editItem ? "Edit Featured Work" : "Add Featured Work"}
              </h3>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                {editItem ? "Update your project details" : "Upload a project to showcase on your profile"}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-black/60 hover:text-black"}`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-8 py-6 overflow-auto flex-1 space-y-6">
            <div className="space-y-2">
              <label className={`text-sm font-medium ml-1 ${isDark ? "text-white/60" : "text-black/60"}`}>Project Title</label>
              <input placeholder="e.g. Cinematic Commercial Reel 2024" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/60" : "text-black/60"}`}>Thumbnail / Media</label>
                <span className={`text-[10px] lg:text-xs tracking-widest uppercase ${isDark ? "text-white/30" : "text-black/40"}`}>
                  {MIN_PROJECT_IMAGES}-{MAX_PROJECT_IMAGES} images &bull; Max {MAX_FILE_SIZE_MB}MB each
                </span>
              </div>

              {imagePreviews.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-xl h-56 flex flex-col items-center justify-center transition-all group ${isCompressing
                      ? "opacity-50 cursor-wait"
                      : isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#E8D1AB]/40 cursor-pointer"
                        : "border-black/10 bg-black/5 hover:bg-black/10 hover:border-[#E8D1AB]/60 cursor-pointer"
                    }`}
                  onClick={() => !isCompressing && fileRef.current?.click()}
                >
                  <div className={`p-4 rounded-full border mb-4 group-hover:scale-110 transition-transform ${isDark ? "bg-[#1A1A1A] border-white/10" : "bg-white border-black/10"
                    }`}>
                    {isCompressing ? <Loader2 className="w-8 h-8 text-[#E8D1AB] animate-spin" /> : <Upload className="w-8 h-8 text-[#E8D1AB]" />}
                  </div>
                  <div className="text-center px-6">
                    <div className={`font-bold text-lg ${isDark ? "text-white" : "text-black"}`}>
                      {isCompressing ? "Optimizing Files..." : "Upload Project Media"}
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                      Allowed: {ALLOWED_EXT_TEXT}. Add {MIN_PROJECT_IMAGES}-{MAX_PROJECT_IMAGES} images.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview.id} className={`relative rounded-xl overflow-hidden border aspect-square group ${isDark ? "border-white/20" : "border-black/10"
                      }`}>
                      <Image
                        src={preview.src}
                        alt="Preview element"
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
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
                    className={`flex items-center justify-center border border-dashed rounded-xl aspect-square transition disabled:opacity-50 ${isDark ? "border-white/20 hover:bg-white/5" : "border-black/20 hover:bg-black/5"
                      }`}
                  >
                    <Plus className={isDark ? "text-white/60" : "text-black/60"} />
                  </button>
                </div>
              )}

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
                <span
                  key={t}
                  className={`px-4 py-1.5 border rounded-full flex items-center gap-2 text-sm ${isDark
                      ? "bg-[#E8D1AB]/10 border-[#E8D1AB]/30 text-[#E8D1AB]"
                      : "bg-[#E8D1AB]/15 border-[#cbb38b]/40 text-[#cbb38b]"
                    }`}
                >
                  #{t}
                  <button onClick={() => removeTag(t)} className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-black"}`}>
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setAddTagsOpen(true)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-sm ${isDark
                    ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                    : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"
                  }`}
              >
                <Tag className="w-4 h-4" /> Add Tags
              </button>
            </div>
          </div>

          <div className={`px-8 py-6 border-t flex justify-end gap-4 ${isDark ? "border-white/10 bg-[#161616]" : "border-black/5 bg-neutral-50"}`}>
            <Button
              variant="ghost"
              onClick={onClose}
              className={`rounded-xl h-12 px-8 ${isDark ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"}`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!title || imagePreviews.length < MIN_PROJECT_IMAGES || isCompressing}
              className={`rounded-xl h-12 px-10 font-bold disabled:opacity-50 text-black ${isDark ? "bg-[#E8D1AB] hover:bg-[#DCD1BE]" : "bg-[#cbb38b] hover:bg-[#bfa57c]"}`}
            >
              {isCompressing ? "Processing..." : editItem ? "Save Changes" : "Add Project"}
            </Button>
          </div>

          {addTagsOpen && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-[20px]" onClick={() => setAddTagsOpen(false)} />
              <div className={`relative w-full max-w-[400px] border rounded-[16px] p-6 shadow-2xl ${isDark ? "bg-[#1A1A1A] border-white/20" : "bg-white border-black/10"}`}>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Add Tags</h2>
                <p className={`text-sm mb-4 ${isDark ? "text-white/40" : "text-black/40"}`}>Help people find your work</p>
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
                    <div
                      key={t}
                      className={`px-3 py-1 border rounded-full flex items-center gap-2 text-xs ${isDark ? "bg-white/5 border-white/10 text-white/80" : "bg-black/5 border-black/10 text-black/80"}`}
                    >
                      {t} <X size={12} className="cursor-pointer" onClick={() => removeTag(t)} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setAddTagsOpen(false)}
                    className={`h-10 ${isDark ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"}`}
                  >
                    Done
                  </Button>
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
