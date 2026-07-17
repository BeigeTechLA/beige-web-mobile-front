"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  Camera,
  Globe,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddSkills from "@/src/components/cpSignup/addSkills";
import AddEquipments from "@/src/components/cpSignup/addEquipment";
import AddCertification from "@/src/components/cpSignup/AddCertification";
import FeaturedWork, { type FeaturedWorkItem } from "@/src/components/cpSignup/FeaturedWork";
import PortfolioLinksModal from "@/src/components/cpSignup/PortfolioLinksModal";
import SocialLinksModal from "@/src/components/cpSignup/SocialLinksModal";
import UploadResumePortfolio from "@/src/components/cpSignup/UploadResumePortfolio";
import CropProfileModal from "@/src/components/cpSignup/cropProfileModal";
import { editorSkills, photographerSkills, roleOptions, videographerSkills, SOCIAL_ICONS, PORTFOLIO_ICONS } from "@/app/data/staticData";
import { adminApi } from "@/lib/api";
import { compressImage } from "@/lib/utils";
import { toast } from "sonner";

interface EditProps {
  id: string;
  isDark?: boolean;
}

type LinkItem = { id: string; name: string; url: string; platform: string; crewFilesId?: string | number };

const S3_BASE_URL =
  process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

const ALL_SKILL_OPTIONS = [...videographerSkills, ...photographerSkills, ...editorSkills];

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const getCrewFilesId = (record: any, fallback?: string | number) =>
  record?.crew_files_id ??
  record?.crewFilesId ??
  record?.crew_member_file_id ??
  record?.crewMemberFileId ??
  record?.file_id ??
  record?.fileId ??
  record?.id ??
  fallback;

const getRecentWorkCrewFilesId = (record: any) =>
  record?.crew_files_id ??
  record?.crewFilesId ??
  record?.crew_member_file_id ??
  record?.crewMemberFileId ??
  record?.file_id ??
  record?.fileId;

const parseMaybeJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    let current: unknown = value.trim();
    if (!current) return fallback;

    for (let i = 0; i < 3; i += 1) {
      if (typeof current !== "string") break;
      const trimmed = current.trim();
      if (!trimmed) return fallback;
      try {
        current = JSON.parse(trimmed);
      } catch {
        return fallback;
      }
    }

    return current as T;
  }
  return fallback;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (value == null) return [];

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const direct = [obj.id, obj.value, obj.role_id, obj.roleId, obj.primary_role, obj.primaryRole]
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map((item) => String(item))
      .filter(Boolean);
    if (direct.length > 0) return direct;
  }

  const str = String(value).trim();
  return str ? [str] : [];
};

const mapSkillToOptionValue = (skill: any) => {
  const raw = typeof skill === "string" ? skill : skill?.name || skill?.label || skill?.skill_name || skill?.value || "";
  const normalized = normalizeText(String(raw));
  if (!normalized) return null;

  const exactMatch = ALL_SKILL_OPTIONS.find((option) => normalizeText(option.label) === normalized || normalizeText(option.value) === normalized);
  if (exactMatch) return exactMatch.value;

  const fuzzyMatch = ALL_SKILL_OPTIONS.find((option) => {
    const optionLabel = normalizeText(option.label);
    return optionLabel.includes(normalized) || normalized.includes(optionLabel);
  });

  return fuzzyMatch ? fuzzyMatch.value : String(raw);
};

const mapPrimaryRoles = (primaryRole: unknown, roleName?: string | null) => {
  const parsed = parseMaybeJson<unknown>(primaryRole, primaryRole);
  const valuesFromPrimary = toStringList(parsed);
  if (valuesFromPrimary.length > 0) return valuesFromPrimary;

  if (roleName) {
    const matched = roleOptions.find((role) => normalizeText(role.label) === normalizeText(roleName));
    if (matched) return [matched.value];
  }

  return [];
};

const inferRolesFromSkills = (skills: Array<string | number>, primaryRoles: string[] = []) => {
  const selected = new Set<string>(primaryRoles);
  const normalizedSkills = new Set(skills.map((skill) => String(skill)));

  const roleBuckets = [
    { role: "1", values: new Set(videographerSkills.map((skill) => skill.value)) },
    { role: "2", values: new Set(photographerSkills.map((skill) => skill.value)) },
    { role: "3", values: new Set(editorSkills.map((skill) => skill.value)) },
  ];

  roleBuckets.forEach(({ role, values }) => {
    const hasMatch = Array.from(normalizedSkills).some((skill) => values.has(skill));
    if (hasMatch) {
      selected.add(role);
    }
  });

  return Array.from(selected);
};

export function CreativePartnerProfileEdit({ id, isDark = true }: EditProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<any[]>([]);
  const initialFeaturedWorkRef = useRef<FeaturedWorkItem[]>([]);
  const initialPortfolioLinksRef = useRef<LinkItem[]>([]);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    location: "",
    lat: "",
    lng: "",
    workingDistance: "",
    profileImage: null as Blob | null,
    profilePreview: "",
    yoe: "",
    hourlyRate: "",
    bio: "",
    availability: [] as string[],
    skills: [] as string[],
    equipments: [] as string[],
    equipmentNames: [] as string[],
    links: [] as LinkItem[],
    portfolioLinks: [] as LinkItem[],
    featuredWork: [] as FeaturedWorkItem[],
    certifications: [] as any[],
    crew_member_id: id,
  });

  const containerStyles = isDark ? "bg-[#101010] text-white" : "bg-[#F7F7F7] text-black";
  const fieldStyles = isDark
    ? "bg-[#101010] border-white/10 text-white placeholder:text-white/35"
    : "bg-white border-black/10 text-black placeholder:text-black/35";
  const mutedText = isDark ? "text-white/50" : "text-black/55";

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((current) => (current.includes(roleValue) ? current.filter((role) => role !== roleValue) : [...current, roleValue]));
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

  const getSkillOptionsByRole = () => {
    const listsToMerge: Array<Array<{ value: string; label: string; description?: string }>> = [];
    if (selectedRoles.includes("1")) listsToMerge.push(videographerSkills);
    if (selectedRoles.includes("2")) listsToMerge.push(photographerSkills);
    if (selectedRoles.includes("3")) listsToMerge.push(editorSkills);
    if (listsToMerge.length === 0) return [];
    return mergeUniqueSkills(...listsToMerge);
  };

  const handleProfileFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size allowed is 5MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      setIsCompressing(true);
      const compressedFile = await compressImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          file: compressedFile,
          preview: reader.result as string,
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
  };

  const handleProfileCropSave = async (croppedBlob: Blob, croppedPreview: string) => {
    try {
      setIsSavingPhoto(true);
      const response = await adminApi.updateCrewMemberProfilePhoto(id, croppedBlob);
      if (response?.success === false || response?.error) {
        throw new Error(response?.error || "Failed to update profile photo");
      }

      const updatedPayload = response?.data ?? response;
      const uploadedPath =
        updatedPayload?.file_path ||
        updatedPayload?.profile_photo?.file_path ||
        updatedPayload?.crew_member_files?.find((file: any) => file.file_type === "profile_photo")?.file_path;
      const uploadedPreview = uploadedPath ? `${S3_BASE_URL}${uploadedPath}` : croppedPreview;

      setData((prev) => ({ ...prev, profileImage: croppedBlob, profilePreview: uploadedPreview }));
      setCropModalOpen(false);
      setSelectedImage(null);
      toast.success("Profile photo updated successfully.");
    } catch (error: any) {
      console.error("Failed to update profile photo:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to update profile photo.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const removeLink = (type: "social" | "portfolio", linkId: string | number) => {
    setData((prev) => ({
      ...prev,
      [type === "social" ? "links" : "portfolioLinks"]: (prev[type === "social" ? "links" : "portfolioLinks"] || []).filter(
        (item: LinkItem) => item.id !== linkId
      ),
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        working_distance: data.workingDistance,
        primary_role: selectedRoles
          .map((role) => Number(role))
          .filter((role) => !Number.isNaN(role)),
        years_of_experience: data.yoe,
        hourly_rate: data.hourlyRate,
        bio: data.bio,
        skills: data.skills
          .map((skill) => Number(skill))
          .filter((skill) => !Number.isNaN(skill)),
        availability: data.availability,
        certifications: data.certifications.map((cert: any) => cert?.name || cert?.title || cert).filter(Boolean),
        social_media_links: data.links.reduce((acc: Record<string, string>, link: LinkItem) => {
          if (link?.platform && link?.url) {
            acc[String(link.platform)] = link.url;
          }
          return acc;
        }, {}),
        equipment_ownership: data.equipmentNames.length > 0 ? data.equipmentNames : data.equipments,
        is_draft: 0,
      };

      const response = await adminApi.updateCrewMemberProfile(id, payload);
      if (response?.success === false || response?.error) {
        throw new Error(response?.error || "Failed to update profile");
      }

      const updatedPayload = response?.data ?? response;
      if (updatedPayload && typeof updatedPayload === "object") {
        setData((prev) => ({
          ...prev,
          firstName: (updatedPayload as any).first_name ?? prev.firstName,
          lastName: (updatedPayload as any).last_name ?? prev.lastName,
          email: (updatedPayload as any).email ?? prev.email,
          phoneNumber: (updatedPayload as any).phone_number ?? prev.phoneNumber,
          location: (updatedPayload as any).location ?? prev.location,
          lat: (updatedPayload as any).latitude != null ? String((updatedPayload as any).latitude) : prev.lat,
          lng: (updatedPayload as any).longitude != null ? String((updatedPayload as any).longitude) : prev.lng,
          workingDistance: (updatedPayload as any).working_distance ?? prev.workingDistance,
          yoe: (updatedPayload as any).years_of_experience != null ? String((updatedPayload as any).years_of_experience) : prev.yoe,
          hourlyRate: (updatedPayload as any).hourly_rate != null ? String((updatedPayload as any).hourly_rate) : prev.hourlyRate,
          bio: (updatedPayload as any).bio ?? prev.bio,
          availability: Array.isArray((updatedPayload as any).availability)
            ? (updatedPayload as any).availability.map((item: any) => String(item))
            : prev.availability,
          equipmentNames: Array.isArray((updatedPayload as any).equipment_ownership)
            ? (updatedPayload as any).equipment_ownership.map((item: any) => String(item))
            : prev.equipmentNames,
          equipments: Array.isArray((updatedPayload as any).equipment_ownership)
            ? (updatedPayload as any).equipment_ownership.map((item: any) => String(item))
            : prev.equipments,
        }));
      }

      toast.success("Profile updated successfully.");
      router.push(`/admin/users/creative-partners/${id}`);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const mapUploadedFileItem = (file: any, fallbackItem: any) => ({
    id: String(getCrewFilesId(file, fallbackItem?.id) || crypto.randomUUID()),
    name: String(file?.title || file?.file_name || file?.file_path?.split?.("/").pop() || fallbackItem?.name || "File"),
    size: String(fallbackItem?.size || ""),
    url: file?.file_path ? `${S3_BASE_URL}${file.file_path}` : file?.url || fallbackItem?.url || "",
    file: fallbackItem?.file,
    crewFilesId: getCrewFilesId(file, fallbackItem?.crewFilesId),
  });

  const extractUploadedFiles = (response: any) => {
    const root = response?.data ?? response;
    if (!root || typeof root !== "object") return [];
    if (Array.isArray(root.data)) return root.data;
    if (Array.isArray(root.files)) return root.files;
    if (Array.isArray(root.crew_member_files)) return root.crew_member_files;
    if (root.data && typeof root.data === "object") {
      if (Array.isArray(root.data.files)) return root.data.files;
      if (Array.isArray(root.data.crew_member_files)) return root.data.crew_member_files;
      if (root.data.file_path || root.data.url) return [root.data];
    }
    if (root.file_path || root.url) return [root];
    return [];
  };

  const handleResumeUpload = async (processedResume: any, originalFile: File) => {
    const response = await adminApi.uploadCrewMemberProfileFiles(id, "resume", originalFile);
    if (response?.success === false || response?.error) {
      throw new Error(response?.error || "Failed to upload resume");
    }

    const uploadedFiles = extractUploadedFiles(response);
    if (uploadedFiles.length > 0) {
      return mapUploadedFileItem(uploadedFiles[0], processedResume);
    }

    return processedResume;
  };

  const deleteCrewFile = async (crewFilesId?: string | number, fileType?: string) => {
    if (!crewFilesId) return;
    const response = await adminApi.deleteCrewMemberProfileFile(id, crewFilesId, fileType ? { file_type: fileType } : {});
    if (response?.success === false || response?.error) {
      throw new Error(response?.error || "Failed to delete crew member file");
    }
  };

  const handleDeleteResume = async (resumeItem: any) => {
    await deleteCrewFile(resumeItem?.crewFilesId, "resume");
    setResume((prev: any) => {
      if (Array.isArray(prev)) {
        return prev.filter((item) => item?.id !== resumeItem?.id && item?.crewFilesId !== resumeItem?.crewFilesId);
      }
      if (prev?.id === resumeItem?.id || prev?.crewFilesId === resumeItem?.crewFilesId) return null;
      return prev;
    });
  };

  const handlePortfolioFileUpload = async (processedFiles: any[], originalFiles: File[]) => {
    if (processedFiles.length === 0) return processedFiles;

    const uploadedFiles = await Promise.all(
      processedFiles.map(async (processedFile, index) => {
        const originalFile = originalFiles[index] || originalFiles[0];
        const title = (processedFile?.name || originalFile?.name || `Portfolio ${index + 1}`).replace(/\.[^.]+$/, "");
        const response = await adminApi.uploadCrewMemberProfileFiles(id, "portfolio", originalFile || processedFile.file || processedFile, {
          title,
        });

        if (response?.success === false || response?.error) {
          throw new Error(response?.error || "Failed to upload portfolio file");
        }

        const uploaded = extractUploadedFiles(response);
        if (uploaded.length > 0) {
          return mapUploadedFileItem(uploaded[0], processedFile);
        }
        return processedFile;
      })
    );

    return uploadedFiles;
  };

  const handleDeletePortfolioFile = async (portfolioItem: any) => {
    await deleteCrewFile(portfolioItem?.crewFilesId, "portfolio");
    setPortfolioFiles((prev: any[]) => prev.filter((item) => item?.id !== portfolioItem?.id && item?.crewFilesId !== portfolioItem?.crewFilesId));
  };

  const handleCertificationUpload = async (processedCerts: any[], originalFiles: File[]) => {
    if (processedCerts.length === 0) return processedCerts;

    const title = originalFiles[0]?.name ? originalFiles[0].name.replace(/\.[^.]+$/, "") : "Certification";
    const response = await adminApi.uploadCrewMemberProfileFiles(
      id,
      "certifications",
      originalFiles,
      { title }
    );

    if (response?.success === false || response?.error) {
      throw new Error(response?.error || "Failed to upload certifications");
    }

    const uploadedFiles = extractUploadedFiles(response);
    if (uploadedFiles.length > 0) {
      return uploadedFiles.map((file: any, index: number) => mapUploadedFileItem(file, processedCerts[index] || processedCerts[0]));
    }

    return processedCerts;
  };

  const handleDeleteCertification = async (certItem: any) => {
    await deleteCrewFile(certItem?.crewFilesId, "certifications");
    setData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter(
        (item: any) => item?.id !== certItem?.id && item?.crewFilesId !== certItem?.crewFilesId
      ),
    }));
  };

  const handleFeaturedWorkChange = async (nextItems: FeaturedWorkItem[]) => {
    const previousItems = initialFeaturedWorkRef.current || [];
    setData((prev) => ({ ...prev, featuredWork: nextItems }));

    try {
      await Promise.all(
        nextItems.map(async (item) => {
          const previousItem = previousItems.find((prevItem) => String(prevItem.id) === String(item.id));
          const currentFiles = Array.isArray(item.files) ? item.files : [];
          const previousFiles = Array.isArray(previousItem?.files) ? previousItem.files : [];

          const currentCrewFileIds = new Set(
            currentFiles
              .map((file: any) => getRecentWorkCrewFilesId(file))
              .filter((crewFilesId): crewFilesId is string | number => Boolean(crewFilesId))
              .map((crewFilesId) => String(crewFilesId))
          );

          const removedFileIds = previousFiles
            .map((file: any) => getRecentWorkCrewFilesId(file))
            .filter((crewFilesId): crewFilesId is string | number => Boolean(crewFilesId))
            .filter((crewFilesId) => !currentCrewFileIds.has(String(crewFilesId)));

          if (removedFileIds.length > 0) {
            await Promise.all(removedFileIds.map((crewFilesId) => deleteCrewFile(crewFilesId, "recent_work")));
          }

          const hasFreshFiles = currentFiles.some((file: any) => file instanceof File || file?.file instanceof File);
          if (hasFreshFiles) {
            await uploadRecentWorkProject(item);
          }
        })
      );

      await refreshFeaturedWorkFromServer();
    } catch (error: any) {
      console.error("Failed to sync featured work:", error);
      setData((prev) => ({ ...prev, featuredWork: previousItems }));
      initialFeaturedWorkRef.current = previousItems;
      toast.error(error?.message || "Failed to save featured work.");
    }
  };

  const handleDeleteFeaturedWork = async (item: any) => {
    const currentProject =
      (initialFeaturedWorkRef.current || []).find((entry: any) => String(entry?.id) === String(item?.id)) ||
      (data.featuredWork || []).find((entry: any) => String(entry?.id) === String(item?.id)) ||
      item;

    const crewFilesIds = Array.from(
      new Set(
        [
          getRecentWorkCrewFilesId(currentProject),
          ...(Array.isArray(currentProject?.files) ? currentProject.files.map((file: any) => getRecentWorkCrewFilesId(file)) : []),
        ].filter(Boolean)
      )
    );

    if (crewFilesIds.length > 0) {
      await Promise.all(crewFilesIds.map((crewFilesId: string | number) => deleteCrewFile(crewFilesId, "recent_work")));
    }

    await refreshFeaturedWorkFromServer();
  };

  const mapPortfolioLinksFromFiles = (files: any[] = [], startIndex = 0): LinkItem[] => {
    return files.map((file: any, index: number) => {
      const uniqueIndex = startIndex + index;
      const platform = file.tag || "custom";
      const platformLabel = PORTFOLIO_ICONS.find((item) => item.id === platform)?.label || "Portfolio Link";
      const resolvedUrl = file.url || file.link || file.file_path || "";
      return {
        id: `${getCrewFilesId(file, file.file_path || resolvedUrl || uniqueIndex)}-${uniqueIndex}`,
        name: platformLabel,
        url: resolvedUrl,
        platform,
        crewFilesId: getCrewFilesId(file),
      };
    });
  };

  const mapRecentWorkFilesToProjects = (files: any[] = []): FeaturedWorkItem[] => {
    if (files.length === 0) return [];

    const groups = new Map<string, any[]>();
    files.forEach((file: any, index: number) => {
      const title = String(file.title || "").trim() || "Recent Work";
      const parsedTags = parseMaybeJson<unknown>(file.tag, file.tag);
      const tag = Array.isArray(parsedTags)
        ? parsedTags.map((tagItem) => String(tagItem).trim()).filter(Boolean).join("|")
        : String(parsedTags || "").trim();
      const key = `${title}__${tag || "default"}`;
      const bucket = groups.get(key) || [];
      bucket.push(file);
      groups.set(key, bucket);
    });

    return Array.from(groups.entries()).map(([key, groupFiles], index) => {
      const [titleFromKey] = key.split("__");
      const previews = groupFiles.map((file: any) => `${S3_BASE_URL}${file.file_path}`);
      const parsedTags = parseMaybeJson<unknown>(groupFiles[0]?.tag, groupFiles[0]?.tag);
      const normalizedTags = Array.isArray(parsedTags)
        ? parsedTags.map((tag) => String(tag).trim()).filter(Boolean)
        : typeof parsedTags === "string" && parsedTags.trim()
          ? parsedTags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [];
      return {
        id: String(getRecentWorkCrewFilesId(groupFiles[0]) || groupFiles[0]?.file_path || `${titleFromKey}-${index}`),
        title: groupFiles[0]?.title || titleFromKey || `Recent Work ${index + 1}`,
        tags: normalizedTags.length > 0 ? normalizedTags : ["Uploaded"],
        previews,
          files: groupFiles.map((file: any) => ({
          crewFilesId: getRecentWorkCrewFilesId(file),
          file_path: file.file_path,
          title: file.title,
          tag: file.tag,
        })),
      } as FeaturedWorkItem;
    });
  };

  const refreshPortfolioLinksFromServer = async () => {
    const response = await adminApi.getCrewMemberDetail(id);
    const payload = response?.data;
    const portfolioLinkFiles = payload?.crew_member_files?.filter((file: any) => file.file_type === "link") || [];
    const refreshedLinks: LinkItem[] = mapPortfolioLinksFromFiles(portfolioLinkFiles);
    setData((prev) => ({ ...prev, portfolioLinks: refreshedLinks }));
    initialPortfolioLinksRef.current = refreshedLinks;
    return refreshedLinks;
  };

  const refreshFeaturedWorkFromServer = async () => {
    const response = await adminApi.getCrewMemberDetail(id);
    const payload = response?.data;
    const recentWorkFiles = payload?.crew_member_files?.filter((file: any) => file.file_type === "recent_work") || [];
    const refreshedProjects = mapRecentWorkFilesToProjects(recentWorkFiles);
    setData((prev) => ({ ...prev, featuredWork: refreshedProjects }));
    initialFeaturedWorkRef.current = refreshedProjects;
    return refreshedProjects;
  };

  const uploadRecentWorkProject = async (item: FeaturedWorkItem) => {
    const filesToUpload = Array.isArray(item.files)
      ? item.files
          .map((file: any) => (file instanceof File ? file : file?.file))
          .filter((file: any): file is File => file instanceof File)
      : [];

    if (filesToUpload.length === 0) return item;

    const normalizedTags = Array.isArray(item.tags)
      ? item.tags.filter((tag) => typeof tag === "string" && tag.trim() !== "")
      : [];

    const response = await adminApi.uploadCrewMemberProfileFiles(id, "recent_work", filesToUpload, {
      title: item.title || "Recent Work",
      tag: JSON.stringify(normalizedTags),
    });

    if (response?.success === false || response?.error) {
      throw new Error(response?.error || "Failed to upload featured work");
    }
  };

  const handlePortfolioLinksChange = async (nextLinks: LinkItem[]) => {
    const previousLinks = initialPortfolioLinksRef.current || [];
    setData((prev) => ({ ...prev, portfolioLinks: nextLinks }));
    const previousById = new Map(previousLinks.map((link) => [String(link.id), link]));

    const addedLinks = nextLinks.filter((link) => !previousById.has(String(link.id)));
    const updatedLinks = nextLinks.filter((link) => {
      const previous = previousById.get(String(link.id));
      if (!previous) return false;
      return previous.url !== link.url || previous.name !== link.name || previous.platform !== link.platform;
    });

    try {
      if (addedLinks.length > 0) {
        const addResponse = await adminApi.addCrewMemberPortfolioLinks(
          id,
          addedLinks.map((link) => ({
            url: link.url,
            title: link.name,
            platform: link.platform,
          }))
        );
        if (addResponse?.success === false || addResponse?.error) {
          throw new Error(addResponse?.error || "Failed to add portfolio links");
        }

        const responseLinks: any[] = Array.isArray(addResponse?.data?.links)
          ? addResponse.data.links
          : Array.isArray(addResponse?.data?.portfolio_links)
            ? addResponse.data.portfolio_links
            : [];

        if (responseLinks.length > 0) {
          const mergedByKey = new Map<string, LinkItem>(
            nextLinks.map((link) => [
              `${normalizeText(link.url)}-${normalizeText(link.platform)}-${normalizeText(link.name)}`,
              link,
            ])
          );

          const normalizedAddedLinks = responseLinks.map((file: any, index: number) => {
            const fileCrewFilesId = getCrewFilesId(file);
            const fallbackLink = addedLinks[index] || addedLinks[0];
            const platform = file.tag || fallbackLink?.platform || "custom";
            const name = file.title || fallbackLink?.name || PORTFOLIO_ICONS.find((item) => item.id === platform)?.label || "Portfolio Link";
            const url = file.url || file.file_path || fallbackLink?.url || "";

            return {
              id: `${fileCrewFilesId || fallbackLink?.id || crypto.randomUUID()}-${index}`,
              name,
              url,
              platform,
              crewFilesId: fileCrewFilesId,
            } as LinkItem;
          });

          const normalizedByKey = new Map<string, LinkItem>(
            normalizedAddedLinks.map((link) => [
              `${normalizeText(link.url)}-${normalizeText(link.platform)}-${normalizeText(link.name)}`,
              link,
            ])
          );

          const nextWithCrewIds: LinkItem[] = nextLinks.map((link) => {
            const key = `${normalizeText(link.url)}-${normalizeText(link.platform)}-${normalizeText(link.name)}`;
            return normalizedByKey.get(key) || mergedByKey.get(key) || link;
          });

          setData((prev) => ({ ...prev, portfolioLinks: nextWithCrewIds }));
          initialPortfolioLinksRef.current = nextWithCrewIds;
        }
      }

      if (updatedLinks.length > 0) {
        await Promise.all(
          updatedLinks.map(async (link) => {
            const response = await adminApi.updateCrewMemberPortfolioLink(id, getCrewFilesId(link), {
              url: link.url,
              title: link.name,
              platform: link.platform,
            });
            if (response?.success === false || response?.error) {
              throw new Error(response?.error || "Failed to update portfolio link");
            }
          })
        );
      }

      await refreshPortfolioLinksFromServer();
    } catch (error: any) {
      console.error("Failed to sync portfolio links:", error);
      setData((prev) => ({ ...prev, portfolioLinks: previousLinks }));
      initialPortfolioLinksRef.current = previousLinks;
      toast.error(error?.message || "Failed to save portfolio links.");
    }
  };

  const handleDeletePortfolioLink = async (link: LinkItem) => {
    await deleteCrewFile(link.crewFilesId, "link");
    await refreshPortfolioLinksFromServer();
  };

  useEffect(() => {
    let active = true;

    const loadCrewMember = async () => {
      setIsInitialLoading(true);
      try {
        const response = await adminApi.getCrewMemberDetail(id);
        const payload = response?.data;
        if (!active || !payload) return;

        const profilePhoto = payload.crew_member_files?.find((file: any) => file.file_type === "profile_photo");
        const recentWorkFiles = payload.crew_member_files?.filter((file: any) => file.file_type === "recent_work") || [];
        const certificationFiles = payload.crew_member_files?.filter((file: any) => file.file_type === "certifications") || [];
        const resumeFile = payload.crew_member_files?.find((file: any) => file.file_type === "resume");
        const portfolioDocumentFiles = payload.crew_member_files?.filter((file: any) =>
          ["portfolio", "portfolio_case_studies", "portfolio_case_study", "case_study", "case_studies"].includes(file.file_type)
        ) || [];
        const portfolioLinkFiles = payload.crew_member_files?.filter((file: any) => file.file_type === "link") || [];

        const parsedSocialLinksRaw = parseMaybeJson<unknown>(payload.social_media_links, []);
        const parsedSocialLinks = Array.isArray(parsedSocialLinksRaw)
          ? parsedSocialLinksRaw
          : typeof parsedSocialLinksRaw === "object" && parsedSocialLinksRaw !== null
            ? Object.entries(parsedSocialLinksRaw as Record<string, unknown>).map(([platform, url], index) => ({
                id: `social-${index}`,
                platform,
                url,
              }))
            : [];
        const parsedEquipment = parseMaybeJson<any[]>(payload.equipment_ownership, []);
        const mappedSkills = Array.isArray(payload.skills)
          ? payload.skills.map((skill: any) => mapSkillToOptionValue(skill)).filter(Boolean)
          : [];

        const featuredGroups = mapRecentWorkFilesToProjects(recentWorkFiles);

        const certificationsPrefill = certificationFiles.map((file: any) => ({
          id: `${getCrewFilesId(file, file.file_path || `${file.crew_member_id || id}-${file.file_path}`)}`,
          name: file.title || file.file_path?.split("/").pop() || "Certification",
          size: "",
          url: `${S3_BASE_URL}${file.file_path}`,
          crewFilesId: getCrewFilesId(file),
        }));

        const resumePrefill = resumeFile
          ? {
              id: `${getCrewFilesId(resumeFile, resumeFile.file_path || `${resumeFile.crew_member_id || id}-${resumeFile.file_path}`)}`,
              name: resumeFile.title || resumeFile.file_path?.split("/").pop() || "Resume",
              size: "",
              url: `${S3_BASE_URL}${resumeFile.file_path}`,
              crewFilesId: getCrewFilesId(resumeFile),
            }
          : null;

        const portfolioPrefill = portfolioDocumentFiles.map((file: any, index: number) => ({
          id: `${getCrewFilesId(file, file.file_path || `${file.crew_member_id || id}-${file.file_path}-${index}`)}`,
          name: file.title || file.file_path?.split("/").pop() || `Portfolio ${index + 1}`,
          size: "",
          url: `${S3_BASE_URL}${file.file_path}`,
          crewFilesId: getCrewFilesId(file),
        }));
        const portfolioLinksPrefill: LinkItem[] = mapPortfolioLinksFromFiles(portfolioLinkFiles);

        setData((prev) => ({
          ...prev,
          firstName: payload.first_name || prev.firstName,
          lastName: payload.last_name || prev.lastName,
          email: payload.email || prev.email,
          phoneNumber: payload.phone_number || "",
          location: payload.location || "",
          lat: payload.latitude != null ? String(payload.latitude) : prev.lat,
          lng: payload.longitude != null ? String(payload.longitude) : prev.lng,
          workingDistance: payload.working_distance || "",
          profilePreview: profilePhoto ? `${S3_BASE_URL}${profilePhoto.file_path}` : prev.profilePreview,
          profileImage: profilePhoto ? (new Blob() as Blob) : prev.profileImage,
          yoe: payload.years_of_experience != null ? String(payload.years_of_experience) : prev.yoe,
          hourlyRate: payload.hourly_rate != null ? String(payload.hourly_rate) : prev.hourlyRate,
          bio: payload.bio || "",
          availability: Array.isArray(payload.availability) ? payload.availability.map((item: any) => String(item)) : prev.availability,
          skills: mappedSkills.length > 0 ? mappedSkills : prev.skills,
          equipments: parsedEquipment
            .map((item) => {
              if (typeof item === "string") return item;
              return item?.equipment_id || item?.id || item?.name || item?.equipment_name || "";
            })
            .filter(Boolean),
          equipmentNames: parsedEquipment
            .map((item) => {
              if (typeof item === "string") return item;
              return item?.equipment_name || item?.name || item?.equipment_id || item?.id || "";
            })
            .filter(Boolean),
          links: parsedSocialLinks.length
            ? parsedSocialLinks.map((link, index) => ({
                id: `social-${index}`,
                name: String((link as any).platform || "Social Link"),
                url: String((link as any).url || ""),
                platform: String((link as any).platform || "custom"),
              }))
            : prev.links,
          portfolioLinks: portfolioLinksPrefill.length ? portfolioLinksPrefill : prev.portfolioLinks,
          certifications: certificationsPrefill as any[],
          featuredWork: featuredGroups as any,
        }));

        setResume(resumePrefill);
        setPortfolioFiles(portfolioPrefill);
        initialFeaturedWorkRef.current = featuredGroups;
        initialPortfolioLinksRef.current = portfolioLinksPrefill;
        const primaryRoles = mapPrimaryRoles(payload.primary_role, payload.role?.role_name);
        setSelectedRoles(inferRolesFromSkills(mappedSkills, primaryRoles));
      } catch (error) {
        console.error("Failed to load crew member details:", error);
      } finally {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    };

    if (id) {
      loadCrewMember();
    } else {
      setIsInitialLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  if (isInitialLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${containerStyles}`}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#111111] px-8 py-10 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-[#E8D1AB]" />
          <div className="text-center">
            <p className="text-base font-semibold text-white">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${containerStyles}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfileFileSelect}
        className="hidden"
      />

      <AdminEditLayout
        title="Edit Creative Partner Profile"
        description="Update basic information, professional details, and portfolio assets in one page."
        onBack={() => router.push(`/admin/users/creative-partners/${id}`)}
        leftContent={
          <>
            <StepOne
              data={data}
              isDark={isDark}
              fieldStyles={fieldStyles}
              mutedText={mutedText}
              isCompressing={isCompressing}
              onUploadProfile={() => fileInputRef.current?.click()}
            />
            <StepTwo
              data={data}
              isDark={isDark}
              fieldStyles={fieldStyles}
              selectedRoles={selectedRoles}
              toggleRole={toggleRole}
              getSkillOptionsByRole={getSkillOptionsByRole}
              setData={setData}
            />
            <StepThree
              data={data}
              isDark={isDark}
              setData={setData}
              resume={resume}
              setResume={setResume}
              portfolioFiles={portfolioFiles}
              setPortfolioFiles={setPortfolioFiles}
              onCancel={() => router.push(`/admin/users/creative-partners/${id}`)}
              setSocialModalOpen={setSocialModalOpen}
              setPortfolioModalOpen={setPortfolioModalOpen}
              onRemoveSocialLink={(linkId) => removeLink("social", linkId)}
              onDeletePortfolioLink={handleDeletePortfolioLink}
              onSave={handleSaveProfile}
              isSaving={isSaving}
              onDeleteResume={handleDeleteResume}
              onDeletePortfolioFile={handleDeletePortfolioFile}
              onDeleteCertification={handleDeleteCertification}
              onChangeFeaturedWork={handleFeaturedWorkChange}
              onUploadResume={handleResumeUpload}
              onUploadPortfolioFiles={handlePortfolioFileUpload}
              onUploadCertification={handleCertificationUpload}
              onDeleteFeaturedWork={handleDeleteFeaturedWork}
            />
          </>
        }
      />

      <SocialLinksModal
        open={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        links={data.links}
        onChange={(links: LinkItem[]) => setData((prev) => ({ ...prev, links }))}
        isDark={isDark}
      />

      <PortfolioLinksModal
        open={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        links={data.portfolioLinks}
        onChange={handlePortfolioLinksChange}
        isDark={isDark}
      />

      {cropModalOpen && selectedImage && (
        <CropProfileModal
          image={selectedImage.preview}
          onClose={() => setCropModalOpen(false)}
          onSave={handleProfileCropSave}
          isSaving={isSavingPhoto}
        />
      )}
    </div>
  );
}

function AdminEditLayout({
  title,
  description,
  onBack,
  leftContent,
}: {
  title: string;
  description: string;
  onBack: () => void;
  leftContent: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
      <div className="rounded-[12px] border border-white/10 bg-black/10 px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-8">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-8 flex items-center justify-center transition-all group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 text-white/60 group-hover:text-[#FFF]" />
              <span className="text-white/60 group-hover:text-[#FFF] transition-colors text-sm">Back</span>
            </button>

            <div className="max-w-none">
              <h1 className="text-xl lg:text-3xl font-semibold text-white leading-tight">
                {title}
              </h1>
              <p className="text-white/50 mt-4 text-lg leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="w-full max-w-none">
            <div className="space-y-16">{leftContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepOne({
  data,
  isDark,
  fieldStyles,
  mutedText,
  isCompressing,
  onUploadProfile,
}: {
  data: any;
  isDark: boolean;
  fieldStyles: string;
  mutedText: string;
  isCompressing: boolean;
  onUploadProfile: () => void;
}) {
  const labelStyles = isDark ? "text-white/60" : "text-black/60";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Basic Information</h2>
        <p className={`text-sm ${mutedText}`}>Read through the partner basics before making edits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="First Name" value={data.firstName} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
        <Field label="Last Name" value={data.lastName} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
        <Field label="Email Address" value={data.email} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Phone Number" value={data.phoneNumber} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
        <Field label="Location" value={data.location} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
        <Field label="Shoot Radius" value={data.workingDistance} labelStyles={labelStyles} fieldStyles={fieldStyles} readOnly />
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <h3 className="text-base font-semibold text-white">Profile Picture *</h3>
        <p className="mb-5 text-xs text-white/40">Maximum file size allowed: 5MB</p>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onUploadProfile}
            className={`group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border transition ${
              data.profileImage ? "border-[#E8D1AB]" : "border-red-500/50"
            } bg-[#1A1A1A] hover:border-[#E8D1AB]/70`}
            aria-label="Edit profile picture"
          >
            {isCompressing ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#E8D1AB]" />
            ) : (
              <>
                {data.profilePreview ? (
                  <img src={data.profilePreview} alt="Profile" className="h-full w-full object-cover p-1" />
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">Preview</span>
                )}
                <span className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-black/0 text-[10px] font-medium uppercase tracking-[0.2em] text-transparent transition group-hover:bg-black/35 group-hover:text-white/90">
                  Edit
                </span>
              </>
            )}
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onUploadProfile}
              className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-[#E8D1AB]/30 bg-[#E8D1AB]/5 px-6 text-sm font-medium text-[#E8D1AB] transition hover:bg-[#E8D1AB]/10"
            >
              <Camera className="h-4 w-4" />
              Upload Profile Picture
            </button>
            <p className="text-xs text-white/35">Click the photo or button to update it.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTwo({
  data,
  setData,
  isDark,
  fieldStyles,
  selectedRoles,
  toggleRole,
  getSkillOptionsByRole,
}: {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  isDark: boolean;
  fieldStyles: string;
  selectedRoles: string[];
  toggleRole: (roleValue: string) => void;
  getSkillOptionsByRole: () => Array<{ value: string; label: string; description?: string }>;
}) {
  const labelStyles = isDark ? "text-white/60" : "text-black/60";
  const sectionBorder = isDark ? "border-white/20" : "border-black/15";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Professional Details</h2>
        <p className="text-sm text-white/50">Create your profile to get discovered by production teams.</p>
      </div>

      <div className={`rounded-[18px] border ${sectionBorder} bg-[#111111] p-5 lg:p-6`}>
        <div>
          <h3 className="text-base font-semibold text-white">Select Your Role *</h3>
          <p className="text-sm text-white/55">Select at least one role</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {roleOptions.map((role) => {
            const active = selectedRoles.includes(role.value);
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className={`min-h-[48px] rounded-full border px-5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                    : "border-white/15 bg-transparent text-white hover:border-white/35"
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OutlinedField
          label="Years of Experience *"
          labelStyles={labelStyles}
          fieldStyles={fieldStyles}
          value={data.yoe}
          onChange={(value) => setData((prev: any) => ({ ...prev, yoe: value }))}
          placeholder="e.g. 5"
        />
        <OutlinedField
          label="Hourly Desired Rates ($) *"
          labelStyles={labelStyles}
          fieldStyles={fieldStyles}
          value={data.hourlyRate}
          onChange={(value) => setData((prev: any) => ({ ...prev, hourlyRate: value }))}
          placeholder="0.00"
          prefix={<CircleDollarSign className="h-5 w-5 text-[#E8D1AB]" />}
        />
      </div>

      <div className={`rounded-[18px] border ${sectionBorder} bg-[#111111] p-5 lg:p-6`}>
        <div>
          <h3 className="text-base font-semibold text-white">Bio / About (Optional)</h3>
          <p className="text-sm text-white/55">Brief description of expertise...</p>
        </div>
        <Textarea
          className={`${fieldStyles} mt-4 min-h-[118px] rounded-[12px] border-white/15 p-4`}
          placeholder="Brief description of expertise..."
          value={data.bio}
          onChange={(e) => setData((prev: any) => ({ ...prev, bio: e.target.value }))}
        />
      </div>

      <div className={`rounded-[18px] border ${sectionBorder} bg-[#111111] p-5 lg:p-6`}>
        <div>
          <h3 className="text-base font-semibold text-white">Skills *</h3>
          <p className="text-sm text-white/55">Select at least one competency</p>
        </div>
        <div className="mt-4">
          <AddSkills
            options={getSkillOptionsByRole()}
            value={data.skills}
            onChange={(skills) => setData((prev: any) => ({ ...prev, skills }))}
            isDark={isDark}
          />
        </div>
      </div>

      <div className={`rounded-[18px] border ${sectionBorder} bg-[#111111] p-5 lg:p-6`}>
        <div>
          <h3 className="text-base font-semibold text-white">What Equipment Do You Own? *</h3>
          <p className="text-sm text-white/55">List the gear you own</p>
        </div>

        <div className="mt-4">
          <AddEquipments
            value={data.equipments}
            names={data.equipmentNames || []}
            onChange={(ids, names) =>
              setData((prev: any) => ({
                ...prev,
                equipments: ids,
                equipmentNames: names,
              }))
            }
          />
        </div>
      </div>

    </div>
  );
}

function StepThree({
  data,
  isDark,
  setData,
  resume,
  setResume,
  portfolioFiles,
  setPortfolioFiles,
  onCancel,
  setSocialModalOpen,
  setPortfolioModalOpen,
  onRemoveSocialLink,
  onDeletePortfolioLink,
  onSave,
  isSaving,
  onDeleteResume,
  onDeletePortfolioFile,
  onUploadResume,
  onUploadPortfolioFiles,
  onDeleteCertification,
  onUploadCertification,
  onChangeFeaturedWork,
  onDeleteFeaturedWork,
}: {
  data: any;
  isDark: boolean;
  setData: React.Dispatch<React.SetStateAction<any>>;
  resume: any;
  setResume: React.Dispatch<React.SetStateAction<any>>;
  portfolioFiles: any[];
  setPortfolioFiles: React.Dispatch<React.SetStateAction<any[]>>;
  onCancel: () => void;
  setSocialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPortfolioModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRemoveSocialLink: (linkId: string | number) => void;
  onDeletePortfolioLink: (item: LinkItem) => Promise<void>;
  onSave: () => void;
  isSaving: boolean;
  onDeleteResume: (item: any) => Promise<void>;
  onDeletePortfolioFile: (item: any) => Promise<void>;
  onUploadResume: (processedResume: any, originalFile: File) => Promise<any>;
  onUploadPortfolioFiles: (processedFiles: any[], originalFiles: File[]) => Promise<any[]>;
  onDeleteCertification: (item: any) => Promise<void>;
  onUploadCertification: (processedCerts: any[], originalFiles: File[]) => Promise<any[]>;
  onChangeFeaturedWork: (items: FeaturedWorkItem[]) => Promise<void>;
  onDeleteFeaturedWork: (item: any) => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Portfolio</h2>
        <p className="text-sm text-white/50">Complete your profile and connect with top studios and filmmakers.</p>
      </div>

      <div className="rounded-[18px] border border-white/20 bg-[#111111] p-5 lg:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Social & Professional Links *</h3>
            <p className="text-sm text-white/55">At least one link is required to proceed.</p>
          </div>
          <ActionTrigger onClick={() => setSocialModalOpen(true)} label="Add a link" />
        </div>
        <div className="flex flex-col gap-3">
          {data.links?.map((link: LinkItem) => (
            <LinkRow
              key={link.id}
              item={link}
              iconList={SOCIAL_ICONS}
              onRemove={() => onRemoveSocialLink(link.id)}
            />
          ))}
          {data.links?.length === 0 && <p className="text-xs text-white/45">No saved social links yet.</p>}
        </div>
      </div>

      <div className="rounded-[18px] border border-white/20 bg-[#111111] p-5 lg:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Portfolio Links (Optional)</h3>
            <p className="text-sm text-white/55">Add a portfolio link if you want to share external work.</p>
          </div>
          <ActionTrigger onClick={() => setPortfolioModalOpen(true)} label="Add a link" />
        </div>
        <div className="flex flex-col gap-3">
          {data.portfolioLinks?.map((link: LinkItem) => (
            <LinkRow
              key={link.id}
              item={link}
              iconList={PORTFOLIO_ICONS}
              onRemove={() => onDeletePortfolioLink(link)}
            />
          ))}
          {data.portfolioLinks?.length === 0 && <p className="text-xs text-white/45">No saved portfolio links yet.</p>}
        </div>
      </div>

      <FeaturedWork
        value={data.featuredWork}
        onChange={onChangeFeaturedWork}
        onDeleteItem={onDeleteFeaturedWork}
        darkTheme={isDark}
      />

      <AddCertification
        value={data.certifications}
        onChange={(items) => setData((prev: any) => ({ ...prev, certifications: items }))}
        bg="bg-[#111111]"
        onUploadFiles={onUploadCertification}
        onDeleteItem={onDeleteCertification}
      />

      <UploadResumePortfolio
        resume={resume}
        setResume={setResume}
        portfolio={portfolioFiles}
        setPortfolio={setPortfolioFiles}
        bgColour="bg-[#111111]"
        buttonBgColour="bg-white/5 hover:bg-white/10"
        onResumeUpload={onUploadResume}
        onPortfolioUpload={onUploadPortfolioFiles}
        onDeleteResume={onDeleteResume}
        onDeletePortfolio={onDeletePortfolioFile}
      />

      <div className="flex items-center gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-14 w-40 flex-none rounded-[12px] border-white/15 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/5 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="h-14 w-40 flex-none rounded-[12px] bg-[#E8D1AB] px-4 text-sm font-semibold text-black hover:bg-[#d9c39d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

function LinkRow({
  item,
  iconList,
  onRemove,
}: {
  item: LinkItem;
  iconList: Array<{ id: string; label: string; src?: string; icon?: React.ElementType }>;
  onRemove: () => void;
}) {
  const platform = iconList.find((entry) => entry.id === item.platform);

  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#1A1A1A]">
          {platform?.src ? (
            <img src={platform.src} alt={platform.label} className="h-5 w-5" />
          ) : platform?.icon ? (
            <platform.icon className="h-5 w-5 text-[#E8D1AB]" />
          ) : (
            <Globe className="h-5 w-5 text-[#E8D1AB]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{item.name}</p>
          <p className="truncate text-xs text-white/45">{item.url}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#101010] text-white/60 transition-colors hover:text-red-400"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  labelStyles,
  fieldStyles,
  readOnly = false,
}: {
  label: string;
  value: string;
  labelStyles: string;
  fieldStyles: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <Label className={labelStyles}>{label}</Label>
      <Input className={`${fieldStyles} mt-2 h-14 rounded-[12px] px-4`} value={value} readOnly={readOnly} />
    </div>
  );
}

function OutlinedField({
  label,
  value,
  onChange,
  placeholder,
  labelStyles,
  fieldStyles,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  labelStyles: string;
  fieldStyles: string;
  prefix?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/20 bg-[#111111] p-5 lg:p-6">
      <Label className={`text-sm font-semibold ${labelStyles}`}>{label}</Label>
      <div className="relative mt-3">
        {prefix && <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{prefix}</div>}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${fieldStyles} h-12 rounded-[8px] ${prefix ? "pl-12" : "pl-4"}`}
        />
      </div>
    </div>
  );
}

function ActionTrigger({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-sm font-medium text-[#E8D1AB] hover:text-[#d9c39d]">
      <div className="rounded-full border border-[#E8D1AB]/30 p-2">
        <Plus className="h-4 w-4" />
      </div>
      {label}
    </button>
  );
}
