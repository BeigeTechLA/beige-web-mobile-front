"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizePhoneInput } from "@/lib/utils/phone";
import { LocationPickerSignup } from "./LocationPickerSignup";
import CropProfileModal from "./cropProfileModal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Camera,
  Loader2,
} from "lucide-react";
import { distanceOptions } from "@/app/data/staticData";
import Link from "next/link";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils";

interface SelectedImageState {
  file: File;
  preview: string;
}

export default function Step1Form({ data, setData, nextStep, prevStep }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const inputClasses = "h-14 lg:h-[82px] w-full rounded-[12px] border border-white/20 p-4 text-white outline-none focus:border-[#E8D1AB] focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#101010] text-sm lg:text-base";
  const labelClasses = "absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // --- FILE SIZE VALIDATION (5MB) ---
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File is too large. Maximum size allowed is 5MB.");
        // Reset the input so the user can try again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      // ----------------------------------

      try {
        setIsCompressing(true);
        const compressedFile = await compressImage(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage({
            file: compressedFile,
            preview: reader.result as string
          });
          setCropModalOpen(true);
          setIsCompressing(false);
        };

        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Compression failed:", error);
        setIsCompressing(false);
        toast.error("Failed to process image.");
      }
    }
  };

  const handleCropSave = (croppedBlob: Blob, croppedPreview: string) => {
    setData({ ...data, profileImage: croppedBlob, profilePreview: croppedPreview });
    setCropModalOpen(false);
  };

  const handleNext = async () => {
    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.phoneNumber ||
      !data.password ||
      !data.location ||
      !data.workingDistance ||
      !data.profileImage
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    nextStep();
  };

  return (
    <div className="space-y-8 bg-[#101010] text-white pt-4 lg:p-2 relative z-10">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Label className={labelClasses}>First Name *</Label>
            <Input
              required
              placeholder="John"
              value={data.firstName}
              onChange={(e) => setData({ ...data, firstName: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="relative">
            <Label className={labelClasses}>Last Name *</Label>
            <Input
              required
              placeholder="Doe"
              value={data.lastName}
              onChange={(e) => setData({ ...data, lastName: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Email */}
        <div className="relative">
          <Label className={labelClasses}>Email Address *</Label>
          <Input
            required
            type="email"
            placeholder="name@example.com"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className={inputClasses}
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Label className={labelClasses}>Phone Number *</Label>
          <Input
            required
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={data.phoneNumber || ""}
            onChange={(e) => setData({ ...data, phoneNumber: sanitizePhoneInput(e.target.value) })}
            className={inputClasses}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Label className={labelClasses}>Password *</Label>
          <div className="relative">
            <Input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="w-full">
          <LocationPickerSignup
            value={data.location}
            onChange={(v) => setData({ ...data, location: v })}
            placeholder="Search Your Location"
          />
        </div>

        {/* Working Distance */}
        <div className="relative">
          <Label className={labelClasses}>Shoot Radius *</Label>
          <Select
            value={data.workingDistance}
            onValueChange={(v) => setData({ ...data, workingDistance: v })}
          >
            <SelectTrigger className={`${inputClasses} text-left flex items-center border-white/20`}>
              <SelectValue placeholder="Select travel radius" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
              {distanceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="focus:bg-[#E8D1AB] focus:text-black">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profile Picture Section */}
        <div className="rounded-[12px] border border-white/20 bg-[#101010] p-6 mt-4">
          <h2 className="text-base font-semibold text-white">Profile Picture *</h2>
          {/* ADDED SUBTEXT FOR MAX 5MB */}
          <p className="text-xs text-white/40 mb-5">Maximum file size allowed: 5MB</p>

          <div className="flex items-center gap-5">
            <div className={`h-20 w-20 rounded-full ${data.profileImage ? 'border-[#E8D1AB]' : 'border-red-500/50'} bg-[#1A1A1A] flex items-center justify-center overflow-hidden flex-shrink-0`}>
              {isCompressing ? (
                <Loader2 className="animate-spin h-6 w-6 text-[#E8D1AB]" />
              ) : (
                <img
                  src={data.profilePreview || "/images/loginsignup/Group.png"}
                  alt="Profile"
                  className="h-full w-full object-contain p-1"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 h-12 px-6 rounded-[12px] border border-[#E8D1AB]/30 bg-[#E8D1AB]/5 text-sm font-medium text-[#E8D1AB] transition hover:bg-[#E8D1AB]/10"
            >
              <Camera className="h-4 w-4" />
              Upload Profile Picture
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={prevStep}
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/20 bg-[#101010] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className={`px-4 lg:px-10 h-14 lg:h-[76px] flex-1 flex items-center justify-center rounded-[12px] bg-[#E8D1AB] hover:bg-[#DCD1BE] transition-all disabled:opacity-50`}
          >
            <span className="lg:text-[20px] font-medium text-black">Next</span>
          </button>
        </div>

        <div className="flex items-center justify-center mt-4 text-[#DDD] font-bold gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M0 0.25C9.89091 0.25 151.455 0.25 221 0.25" stroke="url(#paint0_linear_1780_5629)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5629" x1="0" y1="0.75" x2="221" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
          <div className="shrink-0 gap-1 flex">
            <span>Already have an account?</span> <Link className="font-normal" href="/login">Log in</Link>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M221 0.25C211.109 0.25 69.5455 0.25 6.19888e-06 0.25" stroke="url(#paint0_linear_1780_5630)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5630" x1="221" y1="0.75" x2="0" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </form>

      {cropModalOpen && selectedImage && (
        <CropProfileModal
          image={selectedImage.preview}
          onClose={() => setCropModalOpen(false)}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
