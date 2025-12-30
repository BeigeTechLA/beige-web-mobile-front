"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Minus, Plus } from "lucide-react";

export default function CropProfileModal({ image, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedPixels(pixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const img = new Image();
      img.src = image;
      img.setAttribute("crossOrigin", "anonymous");
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = croppedPixels.width;
      canvas.height = croppedPixels.height;

      ctx.beginPath();
      ctx.arc(
        croppedPixels.width / 2,
        croppedPixels.height / 2,
        croppedPixels.width / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();

      ctx.drawImage(
        img,
        croppedPixels.x,
        croppedPixels.y,
        croppedPixels.width,
        croppedPixels.height,
        0,
        0,
        croppedPixels.width,
        croppedPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        onSave(blob, previewUrl);
      }, "image/png");
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-[24px] border border-white/20 bg-[#101010] p-8 shadow-2xl">
        <h3 className="text-xl font-semibold text-white">Crop Your Profile</h3>
        <p className="text-sm text-white/40 mt-2">
          Adjust your photo to fit the circle.
        </p>

        {/* Cropper Container */}
        <div className="mt-8 flex justify-center">
          <div className="relative h-[300px] w-full rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/10">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="cover" // Fixes the "thin strip" issue
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="mt-8 flex items-center gap-4 px-2">
          <Minus className="text-white/40" size={18} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 rounded-lg bg-white/10 accent-[#E8D1AB] cursor-pointer appearance-none"
          />
          <Plus className="text-white/40" size={18} />
        </div>

        {/* Style for Custom Slider Thumb */}
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: #E8D1AB;
            cursor: pointer;
            border: 2px solid #101010;
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: #E8D1AB;
            cursor: pointer;
            border: 2px solid #101010;
          }
        `}</style>

        {/* Footer Actions */}
        <div className="mt-10 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-[12px] border border-white/20 bg-transparent text-white text-base font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={createCroppedImage}
            className="flex-1 h-14 rounded-[12px] bg-[#E8D1AB] text-black text-base font-semibold hover:bg-[#DCD1BE] transition-all"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}