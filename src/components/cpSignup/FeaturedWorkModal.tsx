'use client';

import React, { useState, useRef, useEffect } from "react";
import { Tag, X, Upload, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/utils";
import { toast } from "sonner";

interface FeaturedWorkModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => void | Promise<void>;
  editItem?: any | null;
}

interface PreviewItem {
  id: string;
  src: string;
  fileId?: number;
  existing?: boolean;
}

interface StoredFileItem {
  file: File;
  signature: string;
}

const MAX_FILE_SIZE_MB = 30;
const MIN_PROJECT_IMAGES = 5;
const MAX_PROJECT_IMAGES = 10;

// NEW: Allowed types constants
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_EXT_TEXT = "png, jpg, jpeg, webp";

const createPreviewId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getFileSignature = (file: File) =>
  [file.name, file.size, file.lastModified, file.type].join("__");

const FeaturedWorkModal = ({ open, onClose, onAdd, editItem }: FeaturedWorkModalProps) => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [addTagsOpen, setAddTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);
  const [rawFiles, setRawFiles] = useState<StoredFileItem[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const inputClasses = "h-14 w-full rounded-[12px] border border-white/20 bg-[#1A1A1A] px-4 text-white placeholder:text-white/40 outline-none focus:border-[#E8D1AB] focus:ring-0 transition-all";
  const modalBg = "bg-[#101010] border border-white/10 shadow-2xl rounded-[20px]";

  useEffect(() => {
    if (open) {
      if (editItem) {
        setTitle(editItem.title || "");
        setTags(
          Array.isArray(editItem.tags)
            ? editItem.tags
            : String(editItem.tag || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
        );
        const previews = editItem.images
          ? editItem.images.map((image: any) => ({
              src: image.file_path?.startsWith("http")
                ? image.file_path
                : `${process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/"}${image.file_path}`,
              fileId: image.crew_files_id,
            }))
          : (editItem.previews || (editItem.image ? [editItem.image] : [])).map((src: string) => ({ src }));
        setImagePreviews(
          previews.map((preview: any) => ({
            id: createPreviewId(),
            src: preview.src,
            fileId: preview.fileId,
            existing: Boolean(preview.fileId),
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
      setRemovedFileIds([]);
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

      const newPreviews: PreviewItem[] = [];
      const newRawFiles: StoredFileItem[] = [];
      const existingSignatures = new Set(rawFiles.map((item) => item.signature));
      const batchSignatures = new Set<string>();
      let skippedDuplicateCount = 0;

      for (const file of files) {
        let processedFile = file;

        // Compress images
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
          // Note: if editing, some files might already be blobs/strings from previous upload, 
          // but handleFileChange is only for NEW files.
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

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (imagePreviews.length < MIN_PROJECT_IMAGES) {
      toast.error("Low Image Count", {
        description: `Please upload at least ${MIN_PROJECT_IMAGES} images for this project.`
      });
      return;
    }
    if (imagePreviews.length > MAX_PROJECT_IMAGES) {
      toast.error(`Maximum ${MAX_PROJECT_IMAGES} images allowed per project.`);
      return;
    }

    try {
      await onAdd({
        id: editItem ? editItem.id : Date.now(),
        title,
        tags,
        previews: imagePreviews.map((item) => item.src),
        fileIds: imagePreviews.map((item) => item.fileId).filter(Boolean),
        removedFileIds,
        files: rawFiles.map((item) => item.file),
      });

      onClose();
    } catch (error) {
      console.error("Failed to save featured work:", error);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className={`${modalBg} w-full md:w-[600px] lg:w-[738px] max-h-[90vh] flex flex-col overflow-hidden relative`}>

          <div className="flex items-center justify-between px-8 pt-6 pb-2">
            <div>
              <h3 className="text-xl font-bold text-white">{editItem ? "Edit Featured Work" : "Add Featured Work"}</h3>
              <p className="text-sm text-white/40">{editItem ? "Update your project details" : "Upload a project to showcase on your profile"}</p>
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
                  {MIN_PROJECT_IMAGES}-{MAX_PROJECT_IMAGES} images • Max {MAX_FILE_SIZE_MB}MB each
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
                    <div className="text-sm text-white/40 mt-1">Allowed: {ALLOWED_EXT_TEXT}. Add {MIN_PROJECT_IMAGES}-{MAX_PROJECT_IMAGES} images.</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative">
                  {/* Previews logic remains same */}
                  {imagePreviews.map((preview, index) => (
                    <div key={preview.id} className="relative rounded-[12px] overflow-hidden border border-white/20 aspect-square group">
                      <img src={preview.src} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setImagePreviews((prev) => {
                            const removed = prev[index];
                            if (removed?.fileId) {
                              setRemovedFileIds((ids) => [...ids, removed.fileId!]);
                            }
                            return prev.filter((_, i) => i !== index);
                          });
                          if (!preview.existing) {
                            const newFileIndex = imagePreviews
                              .slice(0, index)
                              .filter((item) => !item.existing).length;
                            setRawFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
                          }
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
              disabled={!title || imagePreviews.length < MIN_PROJECT_IMAGES || isCompressing}
              className="rounded-[12px] h-12 px-10 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] font-bold disabled:opacity-50"
            >
              {isCompressing ? "Processing..." : editItem ? "Save Changes" : "Add Project"}
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
