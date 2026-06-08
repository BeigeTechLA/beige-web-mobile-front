"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Check, ArrowRight, RotateCcw, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { affiliateApi, getProject } from "@/lib/api";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const shootTypeOptions = [
  "Private Event (Birthday Parties, Family Reunions, Baby Showers, VIP Events)",
  "Corporate Event (Conferences, Trade Shows, Company Retreats, Training, Ceremonies)",
  "Lifestyle Event (Social Gatherings, Concerts, Performances, Sports, Fashion Shows)",
  "Commercial Shoot (Product Photography, Social Media Content, Promotional Video)",
  "Portraiture (Portrait Photography, Family/Lifestyle, Fashion, Creative Projects)",
  "Special Projects (Documentaries, Short Films)",
  "Entertainment (Music Video, Podcast, Dance Performance)",
  "Other:",
];

const locationSpecOptions = ["Indoors", "Outdoors", "Both"];

// const darkFieldClass =
//   "bg-transparent text-white placeholder:text-white/35 caret-[#E8D1AB] border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all";

// const darkTextareaClass = `${darkFieldClass} min-h-[40px] resize-none`;

const darkFieldClass = (isDark: boolean = true) =>
  isDark
    ? "bg-transparent text-white placeholder:text-white/35 caret-[#E8D1AB] border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#E8D1AB] transition-all"
    : "bg-white text-zinc-900 placeholder:text-zinc-400 caret-[#BFA780] border border-zinc-200 rounded-lg px-3 focus-visible:ring-2 focus-visible:ring-[#BFA780]/20 focus-visible:border-[#BFA780] transition-all";

const darkTextareaClass = (isDark: boolean = true) => `${darkFieldClass(isDark)} min-h-[40px] resize-none`;

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const mapShootTypes = (value: unknown): { shootTypes: string[]; otherShootType: string } => {
  const rawTypes = toArray(value);
  const normalizedInput = String(value || "").toLowerCase();

  if (!normalizedInput) {
    return { shootTypes: [], otherShootType: "" };
  }

  const fallbackMap: Array<{ match: string[]; label: string }> = [
    { match: ["private", "birthday", "family", "baby shower", "vip"], label: shootTypeOptions[0] },
    { match: ["corporate", "conference", "trade show", "retreat", "training", "ceremony"], label: shootTypeOptions[1] },
    { match: ["lifestyle", "concert", "performance", "sport", "fashion"], label: shootTypeOptions[2] },
    { match: ["commercial", "product", "promotional", "social media"], label: shootTypeOptions[3] },
    { match: ["portrait", "family/lifestyle", "fashion", "creative"], label: shootTypeOptions[4] },
    { match: ["documentary", "short film", "special"], label: shootTypeOptions[5] },
    { match: ["music video", "podcast", "dance", "entertainment"], label: shootTypeOptions[6] },
  ];

  const finalShootTypes: string[] = [];
  const unmatchedTypes: string[] = [];

  rawTypes.forEach(type => {
    const normalizedType = type.toLowerCase().trim();

    // 1. Check for exact match in options
    const exactMatch = shootTypeOptions.find(opt => opt === type);
    if (exactMatch) {
      finalShootTypes.push(exactMatch);
      return;
    }

    // 2. Check for keyword match in fallback map
    const keywordMatch = fallbackMap.find(m =>
      m.match.some(keyword => normalizedType.includes(keyword))
    );
    if (keywordMatch) {
      if (!finalShootTypes.includes(keywordMatch.label)) {
        finalShootTypes.push(keywordMatch.label);
      }
      return;
    }

    // 3. Otherwise it's unmatched
    unmatchedTypes.push(type);
  });

  if (unmatchedTypes.length > 0) {
    if (!finalShootTypes.includes("Other:")) {
      finalShootTypes.push("Other:");
    }
    return {
      shootTypes: finalShootTypes,
      otherShootType: unmatchedTypes.join(", "),
    };
  }

  return {
    shootTypes: finalShootTypes,
    otherShootType: "",
  };
};

const normalizeProjectPayload = (raw: any) => {
  const root =
    raw?.data?.data ||
    raw?.data ||
    raw ||
    {};

  const project =
    root?.project ||
    root?.data?.project ||
    root;

  const projectForm =
    root?.project_form ||
    root?.projectForm ||
    root?.form_data ||
    root?.formData ||
    root?.submission ||
    root?.project_submission ||
    project?.project_form ||
    project?.projectForm ||
    project?.form_data ||
    project?.formData ||
    project?.submission ||
    project?.project_submission ||
    {};

  return { root, project, projectForm };
};

const parseContactInfoFromDescription = (description: unknown) => {
  const text = String(description || "");
  if (!text.trim()) {
    return "";
  }

  const nameMatch = text.match(/Contact Name:\s*(.+)/i);
  const phoneMatch = text.match(/Phone:\s*([+\d\s()-]+)/i);

  const name = nameMatch?.[1]?.trim() || "";
  const phone = phoneMatch?.[1]?.trim() || "";

  if (name && phone) {
    return `${name} - ${phone}`;
  }

  return name || phone || "";
};

const parseBriefOverview = (project: any, projectForm: any, root: any) => {
  // 1. Check for explicit brief_overview in any source
  const explicitOverview =
    projectForm?.brief_overview ??
    project?.brief_overview ??
    root?.brief_overview ??
    projectForm?.project_notes ??
    project?.project_notes ??
    root?.project_notes ??
    projectForm?.event_notes ??
    project?.event_notes ??
    root?.event_notes ??
    projectForm?.order_description ??
    project?.order_description ??
    root?.order_description ??
    projectForm?.event_description ??
    project?.event_description ??
    root?.event_description ??
    projectForm?.project_description ??
    project?.project_description ??
    root?.project_description;

  // If it's a string (even an empty one), we return it
  if (typeof explicitOverview === "string") {
    return explicitOverview.trim();
  }

  // 2. Fallback to description if available
  const description = String(project?.description || root?.description || "");
  if (description.trim()) {
    const cleanedDescription = description
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !/^contact name:/i.test(line) &&
          !/^phone:/i.test(line) &&
          !/^matching method:/i.test(line)
      )
      .join(" ");

    if (cleanedDescription.trim()) {
      return cleanedDescription.trim();
    }
  }

  // 3. Last resort fallback to project name
  return String(project?.project_name || root?.project_name || "").trim();
};

interface FormData {
  // Step 2 fields
  email: string;
  onsiteContact: string;
  shootTypes: string[];
  otherShootType: string;
  projectOverview: string;
  numPeople: string;
  agenda: string;
  // Step 3 fields
  address: string;
  locationSpec: string[];
  scoutingRefs: string;
  shotList: string;
  visualRefs: string;
  specificInstructions: string;
  dressCode: string;
  additionalInfo: string;
  // Step 4 fields
  postProductionIdeas?: string;
  preferredSongs?: string;
  // Step 5 fields
  wantsToLearnMore?: boolean;
  rating?: number;
}

const initialFormData: FormData = {
  email: "",
  onsiteContact: "",
  shootTypes: [],
  otherShootType: "",
  projectOverview: "",
  numPeople: "",
  agenda: "",
  address: "",
  locationSpec: [],
  scoutingRefs: "",
  shotList: "",
  visualRefs: "",
  specificInstructions: "",
  dressCode: "",
  additionalInfo: "",
  postProductionIdeas: "",
  preferredSongs: "",
  wantsToLearnMore: true,
  rating: 5,
};

const timeZones = [
  "Central Time",
  "Pacific Time",
  "Eastern Time",
  "Mountain Time",
  "Hawaii Time",
  "Other:",
];

interface AffiliateShootDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  pendingProjects?: any[];
  hideAffiliateStep?: boolean;
  redirectTo?: string;
  isDark?: boolean;
  onSubmitSuccess?: (payload?: any) => void;
}

export const AffiliateShootDetailsForm = ({
  isOpen,
  onClose,
  projectId: initialProjectId,
  pendingProjects = [],
  hideAffiliateStep = false,
  redirectTo,
  isDark: isDarkProp,
  onSubmitSuccess
}: AffiliateShootDetailsFormProps) => {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId || pendingProjects[0]?.project_id);
  const [referralCode, setReferralCode] = useState<string>("");
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const isDark =
    typeof isDarkProp === "boolean"
      ? isDarkProp
      : mounted && (resolvedTheme === "dark" || theme === "dark");

  const totalSteps = hideAffiliateStep ? 4 : 5;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset scroll position to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  useEffect(() => {
    const fetchReferralCode = async () => {
      const token = Cookies.get("revure_token");
      if (token) {
        try {
          const affiliateInfo = await affiliateApi.getMyAffiliate(token);
          if (affiliateInfo) {
            setReferralCode(affiliateInfo.referral_code);
          }
        } catch (error) {
          console.error("Failed to fetch referral code:", error);
        }
      }
    };
    fetchReferralCode();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedProjectId(initialProjectId || pendingProjects[0]?.project_id);
  }, [initialProjectId, isOpen, pendingProjects]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!selectedProjectId || !isOpen) {
        return;
      }

      try {
        setIsProjectLoading(true);

        let payload: any = null;
        let normalized: any = { root: {}, project: {}, projectForm: {} };

        try {
          let projectPayload: any = null;
          let bookingPayload: any = null;

          // 1. Fetch from project endpoint (if token exists)
          if (!hideAffiliateStep) {
            const token = Cookies.get("revure_token");
            if (token) {
              projectPayload = await affiliateApi.getProjectDetails(token, selectedProjectId);
            }
          }

          // 2. Fetch from booking details endpoint (requested by user)
          bookingPayload = await affiliateApi.getBookingDetailsGuest(Number(selectedProjectId));

          // 3. Combine payloads
          // Prioritize project details if they exist, but use booking details as base/fallback
          const normalizedProject = normalizeProjectPayload(projectPayload);
          const normalizedBooking = normalizeProjectPayload(bookingPayload);

          // If project payload is empty but booking payload has data, use booking payload
          if (!projectPayload || !projectPayload.data) {
            payload = bookingPayload;
          } else {
            payload = projectPayload;
          }

          // Store both in normalization context if needed, but for now we merge them in setFormData
          const { root: bRoot, project: bProject, projectForm: bForm } = normalizedBooking;
          const { root: pRoot, project: pProject, projectForm: pForm } = normalizedProject;

          const mergedRoot = { ...bRoot, ...pRoot };
          const mergedProject = { ...bProject, ...pProject };
          const mergedForm = { ...bForm, ...pForm };

          normalized = { root: mergedRoot, project: mergedProject, projectForm: mergedForm };
        } catch (error) {
          console.error("Project details fetch failed:", error);
        }

        const hasUsefulData =
          Object.keys(normalized.projectForm || {}).length > 0 ||
          Boolean(
            normalized.project?.onsite_contact_info ||
            normalized.project?.brief_overview ||
            normalized.project?.shot_list ||
            normalized.project?.visual_references ||
            normalized.project?.creative_dress_code ||
            normalized.project?.event_location?.address ||
            normalized.project?.location_address
          );

        if (!hasUsefulData) {
          const adminPayload = await getProject(Number(selectedProjectId));
          const normalizedAdmin = normalizeProjectPayload(adminPayload);

          // Merge admin data if it has something useful
          normalized = {
            root: { ...normalized.root, ...normalizedAdmin.root },
            project: { ...normalized.project, ...normalizedAdmin.project },
            projectForm: { ...normalized.projectForm, ...normalizedAdmin.projectForm }
          };
        }

        const { root, project, projectForm } = normalized;

        const projectTypesSource =
          projectForm?.project_types ||
          project?.project_types ||
          root?.project_types ||
          project?.shoot_type ||
          project?.event_type_labels ||
          project?.event_type ||
          project?.project_name ||
          root?.shoot_type ||
          "";

        const mappedShootTypes = mapShootTypes(projectTypesSource);
        const parsedContactInfo = parseContactInfoFromDescription(project?.description);

        // Construct onsite contact string from guest fields if available
        let onsiteContactFromGuest = "";
        if (project?.contact_name || project?.contact_phone) {
          onsiteContactFromGuest = [project.contact_name, project.contact_phone]
            .filter(Boolean)
            .join(" - ");
        }

        const parsedBriefOverview = parseBriefOverview(project, projectForm, root);

        setFormData({
          email:
            project?.guest_email ||
            root?.guest_email ||
            projectForm?.email ||
            "",
          onsiteContact:
            onsiteContactFromGuest ||
            projectForm?.onsite_contact_info ||
            project?.onsite_contact_info ||
            root?.onsite_contact_info ||
            projectForm?.contact_name ||
            project?.contact_name ||
            root?.contact_name ||
            parsedContactInfo ||
            "",
          shootTypes: mappedShootTypes.shootTypes,
          otherShootType:
            projectForm?.project_type_other ||
            project?.project_type_other ||
            root?.project_type_other ||
            mappedShootTypes.otherShootType,
          projectOverview:
            parsedBriefOverview,
          numPeople:
            String(
              projectForm?.num_people_attending ??
              project?.num_people_attending ??
              root?.num_people_attending ??
              ""
            ),
          agenda:
            projectForm?.event_agenda ||
            project?.event_agenda ||
            root?.event_agenda ||
            "",
          address:
            (typeof project?.location === 'string' ? project.location : project?.location?.address) ||
            projectForm?.location_address ||
            project?.location_address ||
            root?.location_address ||
            project?.event_location?.address ||
            project?.event_location ||
            root?.event_location?.address ||
            root?.event_location ||
            (typeof root?.location === 'string' ? root.location : root?.location?.address) ||
            "",
          locationSpec:
            toArray(
              projectForm?.location_specification ||
              project?.location_specification ||
              root?.location_specification
            ).filter((item) => locationSpecOptions.includes(item)),
          scoutingRefs:
            projectForm?.location_scouting_refs ||
            project?.location_scouting_refs ||
            project?.reference_links ||
            root?.location_scouting_refs ||
            root?.reference_links ||
            "",
          shotList:
            projectForm?.shot_list ||
            project?.shot_list ||
            root?.shot_list ||
            project?.shotlist ||
            project?.shots ||
            project?.short_list ||
            root?.short_list ||
            project?.notes ||
            root?.notes ||
            project?.special_requests ||
            root?.special_requests ||
            project?.special_instructions ||
            root?.special_instructions ||
            "",
          visualRefs:
            projectForm?.visual_references ||
            project?.visual_references ||
            root?.visual_references ||
            "",
          specificInstructions:
            projectForm?.specific_instructions ||
            project?.specific_instructions ||
            project?.special_instructions ||
            root?.specific_instructions ||
            root?.special_instructions ||
            "",
          dressCode:
            projectForm?.creative_dress_code ||
            project?.creative_dress_code ||
            root?.creative_dress_code ||
            "",
          additionalInfo:
            projectForm?.additional_info ||
            project?.additional_info ||
            root?.additional_info ||
            "",
          postProductionIdeas:
            projectForm?.post_production_ideas ||
            project?.post_production_ideas ||
            root?.post_production_ideas ||
            "",
          preferredSongs:
            projectForm?.preferred_songs ||
            project?.preferred_songs ||
            root?.preferred_songs ||
            "",
          wantsToLearnMore:
            projectForm?.wants_to_learn_more ??
            project?.wants_to_learn_more ??
            root?.wants_to_learn_more ??
            true,
          rating:
            Number(
              projectForm?.form_user_friendliness_rating ??
              project?.form_user_friendliness_rating ??
              root?.form_user_friendliness_rating ??
              5
            ) || 5,
        });
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        toast.error("Failed to load project details");
      } finally {
        setIsProjectLoading(false);
      }
    };

    fetchProjectDetails();
  }, [isOpen, selectedProjectId]);

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        project_id: selectedProjectId,
        onsite_contact_info: formData.onsiteContact || "N/A",
        project_types: formData.shootTypes || [],
        project_type_other: formData.otherShootType || "",
        brief_overview: formData.projectOverview || "",
        num_people_attending: formData.numPeople || "0",
        event_agenda: formData.agenda || "TBD",
        location_address: formData.address || "",
        location_specification: formData.locationSpec || [],
        location_scouting_refs: formData.scoutingRefs || "",
        shot_list: formData.shotList || "TBD",
        visual_references: formData.visualRefs || "TBD",
        specific_instructions: formData.specificInstructions || "",
        creative_dress_code: formData.dressCode || "None",
        post_production_ideas: formData.postProductionIdeas || "",
        preferred_songs: formData.preferredSongs || "",
        additional_info: formData.additionalInfo || "",
        wants_to_learn_more: formData.wantsToLearnMore ? 1 : 0,
        form_user_friendliness_rating: formData.rating ?? 5,
        user_id: "", // Ensure user_id is not null
      };

      let response;
      if (hideAffiliateStep) {
        // Guest submission - no token required
        response = await affiliateApi.submitProjectFormGuest(payload);
      } else {
        // Regular submission - requires auth
        const token = Cookies.get("revure_token");
        if (!token) {
          toast.error("Authentication token missing. Please log in again.");
          setIsSubmitting(false);
          return;
        }
        response = await affiliateApi.submitProjectForm(token, payload);
      }

      if (response.success) {
        toast.success(response.message || "Project form submitted successfully!");
        if (typeof onSubmitSuccess === "function") {
          onSubmitSuccess(response?.data || null);
        }
        handleClose();
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        toast.error(response.message || "Failed to submit project form");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("An error occurred while submitting the form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedProjectId) {
        toast.error("Please select a project");
        return;
      }
    }
    if (step === 2) {
      if (
        !formData.onsiteContact ||
        (formData.shootTypes || []).length === 0 ||
        !formData.projectOverview ||
        !formData.numPeople ||
        !formData.agenda
      ) {
        toast.error("Please fill in all required fields (Step 2)");
        return;
      }
    }
    if (step === 3) {
      if (
        !formData.address ||
        (formData.locationSpec || []).length === 0 ||
        !formData.shotList ||
        !formData.visualRefs ||
        !formData.dressCode
      ) {
        toast.error("Please fill in all required fields (Step 3)");
        return;
      }
    }
    if (step === 4) {
      if (hideAffiliateStep) {
        handleSubmit();
        return;
      }
    }
    if (step === 5) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    onClose();
    // Delay resetting to allow exit animation
    setTimeout(() => {
      setStep(1);
      setFormData(initialFormData);
      setSelectedProjectId(initialProjectId || pendingProjects[0]?.project_id);
    }, 300);
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setStep(1);
    setSelectedProjectId(initialProjectId || pendingProjects[0]?.project_id);
    toast.info("Form cleared");
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300 [&>button]:hidden ${isDark
        ? "bg-[#0A0A0A] border-white/10 shadow-[0_0_50px_rgba(232,209,171,0.1)]"
        : "bg-white border-zinc-200 shadow-xl"
        }`}>

        {/* Header */}
        <DialogHeader className={`p-6 lg:p-8 border-b flex flex-row items-center justify-between space-y-0 shrink-0 ${isDark ? "border-white/5 bg-gradient-to-r from-white/5 to-transparent" : "border-zinc-100 bg-zinc-50/50"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB]/20" : "bg-[#BFA780]/10 border-[#BFA780]/20"
              }`}>
              <Sparkles className={"text-[#E8D1AB]"} size={20} />
            </div>
            <div>
              <DialogTitle className={`text-xl font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
                Project Details
              </DialogTitle>
              <p className={`text-xs uppercase tracking-widest font-semibold mt-0.5 ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 px-3">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${s === step
                    ? (isDark ? "w-8 bg-[#E8D1AB]" : "w-8 bg-[#BFA780]")
                    : s < step
                      ? (isDark ? "w-4 bg-[#E8D1AB]/40" : "w-4 bg-[#BFA780]/40")
                      : (isDark ? "w-4 bg-white/10" : "w-4 bg-zinc-200")
                    }`}
                />
              ))}
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full transition-all ${isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"}`}
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 lg:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <h1 className={`text-2xl lg:text-3xl font-bold tracking-tight leading-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                    Welcome Aboard! <br />
                    <span className="text-[#E8D1AB]">Tell Us About Your Project</span>
                  </h1>
                  <div className={`space-y-3 text-sm leading-relaxed max-w-md ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                    <p>Thank you for choosing Beige. We are thrilled to kickstart the planning of your project.</p>
                    <p className={`border-l-2 pl-4 py-1 italic ${isDark ? "border-[#E8D1AB]/30" : "border-[#BFA780]/30"}`}>
                      Please take a few moments to complete this form so we can prepare your shoot flawlessly.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {isProjectLoading && (
                    <div className={`flex items-center gap-3 rounded-2xl border transition-colors duration-300 px-5 py-4 text-sm ${isDark
                      ? "border-[#E8D1AB]/20 bg-[#E8D1AB]/5 text-[#E8D1AB]"
                      : "border-[#E8D1AB]/80 bg-[#E8D1AB]/80 text-black"
                      }`}>
                      <Loader2 className={`h-4 w-4 animate-spin `} />
                      Loading project details...
                    </div>
                  )}

                  {/* Project Selection Dropdown */}
                  {pendingProjects.length > 0 && (
                    <div className="space-y-3">
                      <Label className={`text-xs font-bold uppercase tracking-[0.2em] ml-1 ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                        Select Project <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedProjectId?.toString()}
                        onValueChange={(value) => setSelectedProjectId(Number(value))}
                      >
                        <SelectTrigger className={`w-full h-14 text-lg rounded-2xl px-6 transition-all ${isDark ? "bg-[#111] border-white/5 text-white hover:bg-[#151515]" : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                          }`}>
                          <SelectValue placeholder="Select a project..." />
                        </SelectTrigger>
                        <SelectContent className={isDark ? "bg-[#0A0A0A] border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"}>
                          {pendingProjects.map((project) => (
                            <SelectItem
                              key={project.project_id}
                              value={project.project_id.toString()}
                              className="focus:bg-[#E8D1AB] focus:text-black cursor-pointer"
                            >
                              {project.project_name} (Project ID: {project.project_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form Step 2 Example with Inputs */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 lg:p-10 space-y-10"
              >
                {/* Section Header */}
                <div className="rounded-2xl overflow-hidden border border-[#E8D1AB]/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <div className="bg-[#E8D1AB] p-5">
                    <h3 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2">
                      YOUR PROJECT
                    </h3>
                  </div>
                  <div className={`p-6 backdrop-blur-md space-y-3 ${isDark ? "bg-[#111]/80" : "bg-zinc-50/80"}`}>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-white/80" : "text-zinc-600"}`}>
                      In this section we kindly request that you share <span className={`${isDark ? "text-white" : "text-black"} font-bold`}>all the important details</span> with our production team, to truly <span className={`${isDark ? "text-white" : "text-black"} font-bold`}>understand your vision</span> and deliver the desired results you're hoping for.
                    </p>
                  </div>
                </div>

                {/* Onsite Contact */}
                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-4">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Your email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        className={`${darkFieldClass(isDark)} h-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Onsite Point of Contact (Name and Phone Number) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Your answer"
                        value={formData.onsiteContact}
                        onChange={(e) => updateFormData("onsiteContact", e.target.value)}
                        className={`${darkFieldClass(isDark)} h-10`}
                      />
                    </div>
                  </div>
                </div>

                {/* About Project - Shoot Types */}
                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      About Your Project <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>What type of shoot or event is your project about?</p>
                  </div>
                  <div className="space-y-4">
                    {shootTypeOptions.map((option) => (
                      <div key={option} className="flex items-center gap-3">
                        <Checkbox
                          id={option}
                          checked={(formData.shootTypes || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const currentTypes = formData.shootTypes || [];
                            const newTypes = checked
                              ? [...currentTypes, option]
                              : currentTypes.filter((t) => t !== option);
                            updateFormData("shootTypes", newTypes);
                          }}
                          className={`w-5 h-5 ${isDark ? "border-white/20 data-[state=checked]:text-black" : "border-zinc-300"} data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB]`}
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <Label htmlFor={option} className={`text-sm cursor-pointer whitespace-nowrap ${isDark ? "text-white/80" : "text-zinc-700"}`}>
                            {option}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditional "Other" Description Field */}
                {(formData.shootTypes || []).includes("Other:") && (
                  <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                    <div className="space-y-1">
                      <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                        About Your Project
                      </Label>
                      <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                        If you selected the option "Other", please describe your shoot or event.
                      </p>
                    </div>
                    <Textarea
                      placeholder="Your answer"
                      value={formData.otherShootType}
                      onChange={(e) => updateFormData("otherShootType", e.target.value)}
                      className={`${darkTextareaClass(isDark)} resize-y`}
                    />
                  </div>
                )}

                {/* Brief Overview */}
                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Brief Overview <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      We invite you to give us an overview about your project by sharing how is it going to be and any other logistical details.
                      <br />
                      <span className="italic opacity-80 mt-1 block font-normal">Ex. "My birthday is going to take place at the Nobu restaurant LA from 5pm to 9pm.."</span>
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.projectOverview}
                    onChange={(e) => updateFormData("projectOverview", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                    Number of People Attending/Participating <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Your answer"
                    value={formData.numPeople}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      updateFormData("numPeople", val);
                    }}
                    className={`${darkFieldClass(isDark)} h-10`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Agenda of the Event <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      Let us know of the program flow of the event to better understand your expectations and align with them.
                      <br />
                      Example:
                      <br />
                      6 pm: Entrance
                      <br />
                      7 pm: Dance
                      <br />
                      8 pm: Dinner
                      <br />
                      <br />
                      If you do not have any yet, please write 'TBD'
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.agenda}
                    onChange={(e) => updateFormData("agenda", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 lg:p-10 space-y-10"
              >
                {/* Location Section */}
                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Location <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If you know where your event/shoot is going to take place, please share the <span className="font-bold">exact address</span>.
                      <br />
                      If it's more than one location, please share the addresses in <span className="font-bold">chronological order</span>.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                    Location Specification <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-4">
                    {locationSpecOptions.map((opt) => (
                      <div key={opt} className="flex items-center gap-3">
                        <Checkbox
                          id={opt}
                          checked={(formData.locationSpec || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const currentSpecs = formData.locationSpec || [];
                            const newSpecs = checked
                              ? [...currentSpecs, opt]
                              : currentSpecs.filter((t) => t !== opt);
                            updateFormData("locationSpec", newSpecs);
                          }}
                          className={`w-5 h-5 ${isDark ? "border-white/20 data-[state=checked]:text-black" : "border-zinc-300"} data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB]`}
                        />
                        <Label htmlFor={opt} className={`text-sm cursor-pointer ${isDark ? "text-white/80" : "text-zinc-700"}`}>{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Location Scouting
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If you selected the option of "Location Scouting", please provide any references of what you're looking for.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.scoutingRefs}
                    onChange={(e) => updateFormData("scoutingRefs", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                {/* Shoot Specs */}
                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Shot List <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-start justify-between gap-4">
                      <p className={`text-sm flex-1 ${isDark ? "text-white/70" : "text-zinc-700"}`}>
                        If you have a shot list in mind (or an idea of the shots that <span className="italic">must</span> be taken), please share it below.
                        <br />
                        Example:
                        <br />
                        Close shots of the product
                        <br />
                        Wide angle shots of the venue and so on
                        <br />
                        <br />
                        If you do not have any yet, please write 'TBD'
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E8D1AB]/20 text-[#E8D1AB] hover:bg-[#E8D1AB]/10 h-8 gap-2 shrink-0"
                        onClick={() => toast.info("AI Generation feature coming soon!")}
                      >
                        <Sparkles size={14} />
                        Generate with AI
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.shotList}
                    onChange={(e) => updateFormData("shotList", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Visual References <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If you have video or photo samples that you'd like to recreate, please share a link for our team to view.
                      <br />
                      here: <a href="https://vimeo.com/beigemedia" target="_blank" rel="noopener noreferrer" className="text-[#E8D1AB] underline">https://vimeo.com/beigemedia</a>.
                      <br />
                      If you do not have any yet, please write 'TBD'
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.visualRefs}
                    onChange={(e) => updateFormData("visualRefs", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Specific Instructions
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      Please let us know if you have any specific instructions (or requirements) for our creative partner on the day of the shoot e.g. specific video or photo gear, add-on services, check-in procedures
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.specificInstructions}
                    onChange={(e) => updateFormData("specificInstructions", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Any Specific Dress Code for your Creative Partner <span className="text-red-500">*</span>
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If there isn't any, Please write 'None'. If this is the case, please note your creative partner will show up Casual / Semi - Professional
                    </p>
                  </div>
                  <Input
                    placeholder="Your answer"
                    value={formData.dressCode}
                    onChange={(e) => updateFormData("dressCode", e.target.value)}
                    className={`${darkFieldClass(isDark)} h-10`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Additional Information
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If you have a particular request or any information you'd like us to know about, please share it here
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.additionalInfo}
                    onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 px-6 lg:p-8"
              >
                <div className={`rounded-xl overflow-hidden border transition-colors ${isDark ? "border-[#673ab7]/30" : "border-zinc-200 shadow-sm"}`}>
                  <div className="bg-[#E8D1AB] p-4 text-center">
                    <h3 className="text-black font-bold uppercase tracking-wider text-sm">POST PRODUCTION</h3>
                  </div>
                  <div className={`p-6 lg:p-8 text-center ${isDark ? "bg-[#111]" : "bg-zinc-50/50"}`}>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      If you have a vision for your edited video (or photos), this is the space for you to share!
                    </p>
                  </div>
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Share here your creative ideas for Post Production with us!
                    </Label>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.postProductionIdeas}
                    onChange={(e) => updateFormData("postProductionIdeas", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>

                <div className={`p-6 lg:p-8 rounded-2xl border space-y-6 ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="space-y-1">
                    <Label className={`text-base font-medium block ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Songs
                    </Label>
                    <p className={`text-sm ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                      Are there particular songs or audio clips you'd like to include in your edited video?
                    </p>
                  </div>
                  <Textarea
                    placeholder="Your answer"
                    value={formData.preferredSongs}
                    onChange={(e) => updateFormData("preferredSongs", e.target.value)}
                    className={`${darkTextareaClass(isDark)} resize-y`}
                  />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 lg:p-10 space-y-10"
              >
                {/* Intro Affiliate Program Section */}
                <div className="p-8 lg:p-10 rounded-3xl bg-[#E8D1AB]/5 border border-[#E8D1AB]/20 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={120} className="text-[#E8D1AB]" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h4 className="text-[#E8D1AB] font-bold uppercase tracking-widest text-sm">Affiliate Program</h4>
                    <h3 className={`text-2xl lg:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                      Invite friends and earn rewards with Beige.
                    </h3>
                    <p className={`text-lg leading-relaxed max-w-2xl ${isDark ? "text-white/80" : "text-zinc-600"}`}>
                      Share your referral code and get <span className="text-[#E8D1AB] font-bold">10% of the booking value</span> when they complete a booking. They’ll also receive <span className="text-[#E8D1AB] font-bold">10% off</span> their booking, so both of you benefit.
                    </p>
                    <p className={`${isDark ? "text-white/60" : "text-black/60"} text-sm`}>
                      Your referral code is available in your dashboard once you create an account and log in.
                    </p>
                  </div>

                  {showReferralCode ? (
                    <div className={`p-6 rounded-2xl border flex items-center justify-between gap-4 animate-in fade-in zoom-in duration-300 ${isDark ? "bg-white/5 border-[#E8D1AB]/30" : "bg-[#FFF8EC] border-[#E8D1AB]/40"}`}>
                      <div className="space-y-1">
                        <p className="text-xs text-[#E8D1AB] uppercase tracking-widest font-bold">Your Unique Code</p>
                        <p className={`text-3xl font-black tracking-widest leading-none ${isDark ? "text-white" : "text-zinc-900"}`}>{referralCode || "GETTING CODE..."}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-[#E8D1AB]/20 text-[#E8D1AB] hover:bg-[#E8D1AB]/10 h-12 rounded-xl"
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          toast.success("Referral code copied to clipboard!");
                        }}
                      >
                        Copy Code
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="h-14 px-8 bg-[#E8D1AB] hover:bg-[#d4bc94] text-black font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#E8D1AB]/10 flex items-center gap-3 text-lg relative z-10"
                      onClick={() => setShowReferralCode(true)}
                    >
                      Get Your Referral Code
                      <ArrowRight size={20} />
                    </Button>
                  )}
                </div>

                {/* Rights Section */}
                <div className={`p-8 lg:p-10 rounded-3xl space-y-8 ${isDark ? "bg-[#111]/50 border border-white/5" : "bg-zinc-50 border border-zinc-200"}`}>
                  <div className="space-y-2">
                    <h4 className={`text-xl font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-zinc-900"}`}>RIGHTS</h4>
                    <div className="h-1 w-20 bg-[#E8D1AB] rounded-full" />
                  </div>

                  <div className={`space-y-6 text-sm leading-relaxed ${isDark ? "text-white/70" : "text-zinc-500"}`}>
                    <p>
                      BEIGE shall own and retain all right, title, and interest in and to all deliverables, including all copyrights and other intellectual property rights.
                    </p>
                    <p>
                      Client is granted a non-exclusive, worldwide, royalty-free license to use the deliverables for private use, including social media, website, and portfolio use.
                    </p>
                    <div className={`pt-4 p-4 rounded-xl border italic ${isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-zinc-100/50 border-zinc-200 text-zinc-500"}`}>
                      "Private use refers to non-commercial use by an individual or organization, where the deliverables are not used for direct or indirect financial gain or commercial promotion."
                    </div>
                    <p className={`font-medium ${isDark ? "text-white/90" : "text-zinc-900"}`}>
                      For commercial-use rights, please contact our team at: <span className="text-[#E8D1AB] selection:bg-[#E8D1AB] selection:text-black">contact@beigetech.io</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`p-6 lg:p-8 border-t flex items-center justify-between gap-4 transition-colors ${isDark ? "bg-[#111]/50 border-white/5" : "bg-zinc-50 border-zinc-100"
          }`}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className={`h-10 rounded-lg px-6 ${isDark ? "border-white/10 text-white hover:bg-white/5" : "border-zinc-200 text-zinc-700"}`}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`h-10 rounded-lg px-6 transition-all min-w-[100px] font-medium ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-600 text-white hover:bg-zinc-800"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                (step === 5 || (step === 4 && hideAffiliateStep)) ? "Submit" : "Next"
              )}
            </Button>
          </div>

          <button
            onClick={handleClear}
            className="text-[#E8D1AB] hover:underline transition-all text-sm font-medium"
          >
            Clear form
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
