"use client";

import { useMemo, useState } from "react";
import { X, Camera, Loader2, Check, CircleDollarSign, Plus, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  distanceOptions,
  editorSkills,
  photographerSkills,
  roleOptions,
  videographerSkills,
} from "@/app/data/staticData";
import { sanitizePhoneInput } from "@/lib/utils/phone";
import { compressImage } from "@/lib/utils";
import { pushToDataLayer } from "@/lib/gtm";
import {
  useRegisterCreatorStep1Mutation,
  useRegisterCreatorStep2Mutation,
  useRegisterCreatorStep3Mutation,
} from "@/lib/redux/features/auth/authApi";
import { LocationPickerSignup } from "./LocationPickerSignup";
import AddSkills from "./addSkills";
import AddEquipments from "./addEquipment";
import FeaturedWork, { type FeaturedWorkItem } from "./FeaturedWork";
import SocialLinksModal from "./SocialLinksModal";
import { SOCIAL_ICONS } from "@/app/data/staticData";

type LocationValue = {
  address?: string;
  lat?: number;
  lng?: number;
} | string | null;

type GoogleOnboardingData = {
  user_id: number;
  crew_member_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
};

type GoogleCreatorOnboardingModalProps = {
  open: boolean;
  initialData: GoogleOnboardingData | null;
  onClose: () => void;
  onComplete: (data: Record<string, unknown>) => void;
};

type SocialLinkItem = {
  id: string | number;
  platform: string;
  url: string;
  name: string;
};

type ApiError = {
  data?: {
    message?: string;
  };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError?.data?.message || apiError?.message || fallback;
};

const mergeUniqueSkills = (...lists: Array<Array<{ value: string; label: string; description?: string }>>) => {
  const map = new Map<string, { value: string; label: string; description?: string }>();
  lists.flat().forEach((skill) => {
    if (skill && !map.has(skill.value)) {
      map.set(skill.value, skill);
    }
  });
  return Array.from(map.values());
};

export function GoogleCreatorOnboardingModal({
  open,
  initialData,
  onClose,
  onComplete,
}: GoogleCreatorOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [location, setLocation] = useState<LocationValue>(null);
  const [workingDistance, setWorkingDistance] = useState("");
  const [profileImage, setProfileImage] = useState<File | Blob | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [yoe, setYoe] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<Array<string | number>>([]);
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [links, setLinks] = useState<SocialLinkItem[]>([]);
  const [featuredWork, setFeaturedWork] = useState<FeaturedWorkItem[]>([]);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [registerStep1, step1State] = useRegisterCreatorStep1Mutation();
  const [registerStep2, step2State] = useRegisterCreatorStep2Mutation();
  const [registerStep3, step3State] = useRegisterCreatorStep3Mutation();

  const isSubmitting = step1State.isLoading || step2State.isLoading || step3State.isLoading || isProcessingImage;

  const skillOptions = useMemo(() => {
    const listsToMerge = [];
    if (roles.includes("1")) listsToMerge.push(videographerSkills);
    if (roles.includes("2")) listsToMerge.push(photographerSkills);
    if (roles.includes("3")) listsToMerge.push(editorSkills);
    return listsToMerge.length ? mergeUniqueSkills(...listsToMerge) : [];
  }, [roles]);

  if (!open || !initialData) {
    return null;
  }

  const toggleRole = (roleValue: string) => {
    setRoles((currentRoles) =>
      currentRoles.includes(roleValue)
        ? currentRoles.filter((role) => role !== roleValue)
        : [...currentRoles, roleValue]
    );
  };

  const handleProfileImage = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size allowed is 5MB.");
      return;
    }

    try {
      setIsProcessingImage(true);
      const compressed = await compressImage(file);
      setProfileImage(compressed);
      setProfilePreview(URL.createObjectURL(compressed));
    } catch {
      toast.error("Failed to process image.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const submitBasics = async () => {
    if (!phoneNumber || !location || !workingDistance || !profileImage) {
      toast.error("Please complete the required onboarding details.");
      return;
    }

    const locationAddress =
      typeof location === "object" && location !== null ? location.address : location;
    const locationLat =
      typeof location === "object" && location !== null ? location.lat : null;
    const locationLng =
      typeof location === "object" && location !== null ? location.lng : null;

    const formData = new FormData();
    formData.append("crew_member_id", String(initialData.crew_member_id));
    formData.append("user_id", String(initialData.user_id));
    formData.append("first_name", initialData.firstName);
    formData.append("last_name", initialData.lastName);
    formData.append("email", initialData.email);
    formData.append("phone_number", phoneNumber);
    formData.append("location", locationAddress || "");
    formData.append("working_distance", workingDistance);
    formData.append("profile_photo", profileImage, "profile-picture.jpg");
    if (typeof locationLat === "number") formData.append("lat", String(locationLat));
    if (typeof locationLng === "number") formData.append("lng", String(locationLng));

    try {
      await registerStep1(formData).unwrap();
      setStep(2);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save onboarding details."));
    }
  };

  const submitProfessional = async () => {
    if (!roles.length || !yoe || !hourlyRate || !skills.length || !equipments.length) {
      toast.error("Please complete your role, rate, skills, and equipment.");
      return;
    }

    try {
      await registerStep2({
        crew_member_id: initialData.crew_member_id,
        primary_role: roles.map(Number),
        years_of_experience: yoe,
        hourly_rate: Number(hourlyRate),
        bio,
        skills,
        equipment_ownership: equipments.map(String),
      }).unwrap();
      setStep(3);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save professional details."));
    }
  };

  const submitPortfolio = async () => {
    if (!links.length) {
      toast.error("Please add at least one social or professional link.");
      return;
    }

    if (!featuredWork.length) {
      toast.error("Please add at least one featured work project.");
      return;
    }

    const formData = new FormData();
    formData.append("crew_member_id", String(initialData.crew_member_id));

    const recentWorkFiles: File[] = [];
    const workMetadata = featuredWork.map((item) => {
      const fileIndexes: number[] = [];
      const normalizedTags = Array.isArray(item.tags)
        ? item.tags.filter((tag) => typeof tag === "string" && tag.trim() !== "")
        : [];

      if (Array.isArray(item.files)) {
        item.files.forEach((fileItem) => {
          const file = fileItem instanceof File ? fileItem : fileItem?.file;
          if (file instanceof File) {
            fileIndexes.push(recentWorkFiles.length);
            recentWorkFiles.push(file);
          }
        });
      }

      return {
        title: item.title,
        fileIndexes,
        ...(normalizedTags.length > 0 ? { tag: normalizedTags.join(",") } : {}),
      };
    });

    recentWorkFiles.forEach((file) => {
      formData.append("recent_work", file);
    });

    formData.append("featured_work", JSON.stringify(workMetadata));

    const socialLinksPayload: Record<string, string> = {};
    links.forEach((link) => {
      if (link.platform && link.url) {
        socialLinksPayload[link.platform] = link.url;
      }
    });
    formData.append("social_media_links", JSON.stringify(socialLinksPayload));

    try {
      await registerStep3(formData).unwrap();
      pushToDataLayer("sign_up", {
        method: "google",
        user_id: initialData.crew_member_id,
        user_type: "Creative Partner",
        page_name: "Creative Partner Google Onboarding",
        location_in_website: "creative_partner_google_onboarding_modal",
        duration_on_page: performance.now() / 1000,
        email: initialData.email,
        phone: phoneNumber,
      });
      toast.success("Application submitted.");
      onComplete({
        ...initialData,
        phoneNumber,
        location,
        workingDistance,
        profileImage,
        profilePreview,
        roles,
        yoe,
        hourlyRate,
        bio,
        skills,
        equipments,
        equipmentNames,
        links,
        featuredWork,
        googleSignup: true,
        authProvider: "google",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to submit application."));
    }
  };

  const progressLabel = step === 1 ? "Basics" : step === 2 ? "Professional" : "Portfolio";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-white/15 bg-[#101010] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8D1AB]">
              Google signup
            </p>
            <h2 className="text-xl font-semibold">Complete your creator application</h2>
            <p className="text-sm text-white/50">{progressLabel} · Step {step} of 3</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:text-white"
            aria-label="Close onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 pt-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${item <= step ? "bg-[#E8D1AB]" : "bg-white/10"}`}
            />
          ))}
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
                <p className="font-medium">{initialData.firstName} {initialData.lastName}</p>
                <p className="text-sm text-white/50">{initialData.email}</p>
              </div>

              <div className="relative">
                <Label className="mb-2 block text-sm text-white/60">Phone number *</Label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(sanitizePhoneInput(event.target.value))}
                  placeholder="+1 (555) 000-0000"
                  className="h-12 border-white/20 bg-[#151515] text-white"
                />
              </div>

              <LocationPickerSignup
                value={location}
                onChange={setLocation}
                placeholder="Search your location"
              />

              <div>
                <Label className="mb-2 block text-sm text-white/60">Shoot radius *</Label>
                <Select value={workingDistance} onValueChange={setWorkingDistance}>
                  <SelectTrigger className="h-12 border-white/20 bg-[#151515] text-white">
                    <SelectValue placeholder="Select travel radius" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-[#1A1A1A] border-white/20 text-white z-[110]">
                    {distanceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
                <Label className="mb-3 block text-sm text-white/60">Profile picture *</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-5 w-5 text-[#E8D1AB]" />
                    )}
                  </div>
                  <label className="inline-flex h-11 cursor-pointer items-center rounded-[10px] border border-[#E8D1AB]/30 px-4 text-sm font-medium text-[#E8D1AB] transition hover:bg-[#E8D1AB]/10">
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleProfileImage(event.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-3 block text-sm text-white/60">Your role *</Label>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((option) => {
                    const selected = roles.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleRole(option.value)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                          selected
                            ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                            : "border-white/15 text-white hover:border-white/40"
                        }`}
                      >
                        {selected && <Check className="h-4 w-4" />}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm text-white/60">Years of experience *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={yoe}
                    onChange={(event) => setYoe(event.target.value)}
                    placeholder="e.g. 5"
                    className="h-12 border-white/20 bg-[#151515] text-white"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-sm text-white/60">Desired hourly rate *</Label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#E8D1AB]" />
                    <Input
                      type="number"
                      min="0"
                      value={hourlyRate}
                      onChange={(event) => setHourlyRate(event.target.value)}
                      placeholder="0.00"
                      className="h-12 border-white/20 bg-[#151515] pl-10 text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm text-white/60">Skills *</Label>
                <AddSkills options={skillOptions} value={skills} onChange={setSkills} />
              </div>

              <div>
                <Label className="mb-2 block text-sm text-white/60">Equipment *</Label>
                <AddEquipments
                  value={equipments}
                  names={equipmentNames}
                  onChange={(ids: Array<string | number>, names: string[]) => {
                    setEquipments(ids);
                    setEquipmentNames(names);
                  }}
                />
              </div>

              <div>
                <Label className="mb-2 block text-sm text-white/60">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Tell us what you shoot best..."
                  className="min-h-28 border-white/20 bg-[#151515] text-white"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Social & Professional Links *
                    </h3>
                    <p className="text-sm text-white/50">
                      Add links that showcase your work, recognition, personality and more.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSocialModalOpen(true)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8D1AB]/30 px-4 py-2 text-sm font-medium text-[#E8D1AB] transition hover:bg-[#E8D1AB]/10"
                  >
                    <Plus className="h-4 w-4" />
                    {links.length ? "Manage" : "Add link"}
                  </button>
                </div>

                {links.length ? (
                  <div className="space-y-3">
                    {links.map((link) => {
                      const platform = SOCIAL_ICONS.find((item) => item.id === link.platform);
                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between rounded-[12px] border border-white/10 bg-[#151515] px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {platform?.src ? (
                              <img src={platform.src} alt="" className="h-5 w-5" />
                            ) : platform?.icon ? (
                              <platform.icon className="h-5 w-5 text-[#E8D1AB]" />
                            ) : (
                              <Globe className="h-5 w-5 text-[#E8D1AB]" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{link.name}</p>
                              <p className="truncate text-xs text-white/40">{link.url}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}
                            className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                            aria-label="Remove link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-white/40">At least one link is required to proceed.</p>
                )}
              </div>

              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
                <FeaturedWork
                  value={featuredWork}
                  onChange={setFeaturedWork}
                  darkTheme
                />
              </div>

              <SocialLinksModal
                open={socialModalOpen}
                onClose={() => setSocialModalOpen(false)}
                links={links}
                onChange={setLinks}
                isDark
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => step === 1 ? onClose() : setStep((current) => current - 1)}
            disabled={isSubmitting}
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            type="button"
            onClick={step === 1 ? submitBasics : step === 2 ? submitProfessional : submitPortfolio}
            disabled={isSubmitting}
            className="bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : step === 3 ? "Submit application" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
