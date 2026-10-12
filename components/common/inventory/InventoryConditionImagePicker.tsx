'use client';

import React, { useEffect, useState } from 'react';
import { Plus, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { useInventoryStyle } from './InventoryUI';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_IMAGES = 8;

export default function InventoryConditionImagePicker({
  files,
  onChange,
  disabled = false,
  label,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label: string;
}) {
  const s = useInventoryStyle();
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (selection: FileList | null) => {
    const selected = Array.from(selection || []);
    if (!selected.length) return;
    if (selected.some(file => !ACCEPTED_TYPES.includes(file.type))) {
      toast.error('Choose JPG, PNG, WebP, or GIF images.');
      return;
    }
    if (selected.some(file => file.size > MAX_FILE_SIZE)) {
      toast.error('Each condition image must be 25MB or smaller.');
      return;
    }
    if (files.length + selected.length > MAX_IMAGES) {
      toast.error('You can add up to 8 condition images.');
      return;
    }
    onChange([...files, ...selected]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className={`text-xs ${s.muted}`}>{files.length}/8 photos · Max 25MB each</span>
      </div>
      {files.length === 0 ? (
        <label className={`flex h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${s.isDark ? 'border-white/15 bg-white/[0.03] hover:border-[#BFA780]/60 hover:bg-white/[0.06]' : 'border-black/15 bg-black/[0.02] hover:border-[#BFA780] hover:bg-black/[0.04]'}`}>
          <UploadCloud className="mb-2 h-7 w-7 text-[#BFA780]" />
          <span className="text-sm font-semibold">Add condition photos</span>
          <span className={`mt-1 text-xs ${s.muted}`}>JPG, PNG, WebP, or GIF · 1–8 images</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={disabled} className="hidden" onChange={event => { addFiles(event.currentTarget.files); event.currentTarget.value = ''; }} />
        </label>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className={`group relative aspect-square overflow-hidden rounded-xl border ${s.isDark ? 'border-white/10' : 'border-black/10'}`}>
              {previews[index] && <img src={previews[index]} alt={`${label} ${index + 1}`} className="h-full w-full object-cover" />}
              <button type="button" disabled={disabled} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-100 transition hover:bg-black disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Remove condition image"><X size={14} /></button>
            </div>
          ))}
          {files.length < MAX_IMAGES && (
            <label className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${s.isDark ? 'border-white/15 hover:border-[#BFA780]/60 hover:bg-white/[0.04]' : 'border-black/15 hover:border-[#BFA780] hover:bg-black/[0.03]'}`}>
              <Plus className="mb-1 h-6 w-6 text-[#BFA780]" /><span className={`text-xs ${s.muted}`}>Add more</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={disabled} className="hidden" onChange={event => { addFiles(event.currentTarget.files); event.currentTarget.value = ''; }} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
