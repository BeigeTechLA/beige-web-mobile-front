"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Loader2, // Import Loader icon
} from "lucide-react";
import { distanceOptions } from "@/app/data/staticData";
import Link from "next/link";
import { useRegisterCreatorStep1Mutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner"; // Assuming you use sonner or similar for notifications
import { compressImage } from "@/lib/utils";

interface SelectedImageState {
  file: File;
  preview: string;
}

export default function Step1Form({ data, setData, nextStep, prevStep }) {
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null); const [cropModalOpen, setCropModalOpen] = useState(false);

  // 1. Initialize the API Hook
  const [registerStep1, { isLoading }] = useRegisterCreatorStep1Mutation();

  const inputClasses = "h-14 lg:h-[82px] w-full rounded-[12px] border border-white/20 p-4 text-white outline-none focus:border-[#E8D1AB] focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#101010] text-sm lg:text-base";
  const labelClasses = "absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          file: compressedFile,
          preview: reader.result as string
        });
        setCropModalOpen(true);
      };

      reader.readAsDataURL(compressedFile);
    }
  };

  const handleCropSave = (croppedBlob: Blob, croppedPreview: string) => {
    setData({ ...data, profileImage: croppedBlob, profilePreview: croppedPreview });
    setCropModalOpen(false);
  };

  // 2. Handle Submit Logic
  // ... inside Step1Form component ...

  const handleNext = async () => {
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("first_name", data.firstName);
      formData.append("last_name", data.lastName);
      formData.append("email", data.email);
      formData.append("password", data.password);

      if (data.location) {
        formData.append("location", typeof data.location === 'object' ? JSON.stringify(data.location) : data.location);
      }
      if (data.workingDistance) {
        formData.append("working_distance", data.workingDistance);
      }
      if (data.profileImage) {
        formData.append("profile_photo", data.profileImage, "profile-picture.jpg");
      }

      // 1. Call the API
      const response = await registerStep1(formData).unwrap();

      // 2. SAVE the IDs into the shared state
      setData({
        ...data,
        crew_member_id: response.crew_member_id, // Save this!
        user_id: response.user_id
      });

      toast.success("Step 1 completed!");

      // 3. Proceed
      nextStep();
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    }
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
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="w-full">
          <LocationPickerSignup
            value={data.location}
            onChange={(v) => setData({ ...data, location: v })}
            placeholder="Add Your Location"
          />
        </div>

        {/* Working Distance */}
        <div className="relative">
          <Label className={labelClasses}>Travel Radius</Label>
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
          <h2 className="text-base font-semibold text-white">Profile Picture</h2>
          <p className="text-sm text-white/40 mb-5">Add photo to build connection and trust</p>

          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full border border-[#E8D1AB]/30 bg-[#1A1A1A] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={data.profilePreview || "/images/loginsignup/profile_temp.png"}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
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
            disabled={isLoading}
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/20 bg-[#101010] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <Button
            type="button"
            onClick={handleNext} // Call the new handler
            disabled={isLoading}
            className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-14 lg:h-[76px] rounded-[12px] text-lg font-semibold transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" /> Saving...
              </span>
            ) : (
              "Next Step"
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-white/30 pt-4">
          <div className="h-[1px] flex-grow bg-white/5"></div>
          <span>Already have an account?</span>
          <Link href="/login" className="text-[#E8D1AB] hover:underline">Log in</Link>
          <div className="h-[1px] flex-grow bg-white/5"></div>
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