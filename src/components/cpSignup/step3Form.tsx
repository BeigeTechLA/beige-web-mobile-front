'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Globe, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import AddCertification from "./AddCertification";
import FeaturedWork from "./FeaturedWork";
import SocialLinksModal from "./SocialLinksModal";
import UploadResumePortfolio from "./UploadResumePortfolio";
import PortfolioLinksModal from "./PortfolioLinksModal";
import { SOCIAL_ICONS, PORTFOLIO_ICONS } from "@/app/data/staticData";
import {
  useRegisterCreatorStep1Mutation,
  useRegisterCreatorStep2Mutation,
  useRegisterCreatorStep3Mutation,
} from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";
import { pushToDataLayer } from "@/lib/gtm";

export default function Step3Form({ data, setData, nextStep, prevStep }: { data: any, setData: any, nextStep: () => void, prevStep: () => void }) {
  const [registerStep1, { isLoading: isStep1Loading }] = useRegisterCreatorStep1Mutation();
  const [registerStep2, { isLoading: isStep2Loading }] = useRegisterCreatorStep2Mutation();
  const [registerStep3, { isLoading: isStep3Loading }] = useRegisterCreatorStep3Mutation();
  const isLoading = isStep1Loading || isStep2Loading || isStep3Loading;

  const [featuredWork, setFeaturedWork] = useState(data.featuredWork || []);
  const [links, setLinks] = useState(data.links || []);
  const [portfolioLinks, setPortfolioLinks] = useState(data.portfolioLinks || []);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [resume, setResume] = useState(data.resume || null);
  const [portfolio, setPortfolio] = useState(data.portfolio || null);

  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      featuredWork,
      links,
      portfolioLinks,
      resume,
      portfolio,
    }));
  }, [featuredWork, links, portfolioLinks, resume, portfolio, setData]);

  const handleSubmit = async () => {
    if (!links || links.length === 0) {
      toast.error("Required Field", {
        description: "Please add at least one Social or Professional Link."
      });
      return;
    }
    if (!featuredWork || featuredWork.length === 0) {
      toast.error("Required Field", {
        description: "Please add at least one item to your Featured Work."
      });
      return;
    }


    if (!links || links.length === 0) {
      toast.error("Required Field", {
        description: "Please add at least one social link."
      });
      return;
    }

    try {
      const step1FormData = new FormData();
      step1FormData.append("first_name", data.firstName);
      step1FormData.append("last_name", data.lastName);
      step1FormData.append("email", data.email);
      step1FormData.append("phone_number", data.phoneNumber);
      step1FormData.append("password", data.password);

      const locationAddress =
        typeof data.location === "object" && data.location !== null
          ? data.location.address
          : data.location;
      const locationLat =
        typeof data.location === "object" && data.location !== null
          ? data.location.lat
          : null;
      const locationLng =
        typeof data.location === "object" && data.location !== null
          ? data.location.lng
          : null;

      step1FormData.append("location", locationAddress || "");
      if (typeof locationLat === "number") {
        step1FormData.append("lat", locationLat.toString());
      }
      if (typeof locationLng === "number") {
        step1FormData.append("lng", locationLng.toString());
      }
      step1FormData.append("working_distance", data.workingDistance);
      step1FormData.append("profile_photo", data.profileImage, "profile-picture.jpg");

      const step1Response = await registerStep1(step1FormData).unwrap();
      const crewMemberId = step1Response.crew_member_id;

      await registerStep2({
        crew_member_id: crewMemberId,
        primary_role: data.roles,
        years_of_experience: Number(data.yoe),
        hourly_rate: Number(data.hourlyRate),
        bio: data.bio || "",
        skills: (data.skills || []).map((s) => typeof s === "string" ? s : s.label || s.value),
        equipment_ownership: data.equipments || [],
      }).unwrap();

      const formData = new FormData();
      formData.append("crew_member_id", String(crewMemberId));

      // Optional: Resume
      const resumeFile = resume instanceof File ? resume : resume?.file;
      if (resumeFile instanceof File) formData.append("resume", resumeFile);

      if (Array.isArray(portfolio)) {
        portfolio.forEach((p) => {
          const file = p instanceof File ? p : p?.file;
          if (file instanceof File) {
            formData.append("portfolio", file);
          }
        });
      }

      // Optional: Certifications
      (data.certifications || []).forEach((item) => {
        const file = item instanceof File ? item : item?.file;
        if (file instanceof File) formData.append("certifications", file);
      });

      // Required: Featured Work
      const recentWorkFiles: File[] = [];
      const workMetadata = featuredWork.map((item: any) => {
        const fileIndexes: number[] = [];
        const normalizedTags = Array.isArray(item.tags)
          ? item.tags.filter((tag: string) => typeof tag === "string" && tag.trim() !== "")
          : (typeof item.tags === "string" && item.tags.trim() !== "" ? [item.tags] : []);

        if (Array.isArray(item.files)) {
          item.files.forEach((file: File) => {
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

      const socialLinksPayload: any = {};
      links.forEach((l: any) => {
        if (l.platform && l.url) socialLinksPayload[l.platform] = l.url;
      });
      formData.append("social_media_links", JSON.stringify(socialLinksPayload));

      const portfolioLinksPayload = portfolioLinks.map((l: any) => ({
        url: l.url,
        platform: l.platform
      }));
      formData.append("portfolio_links", JSON.stringify(portfolioLinksPayload));

      // API CALL
      await registerStep3(formData).unwrap();

      setData((prev) => ({
        ...prev,
        crew_member_id: crewMemberId,
        user_id: step1Response?.user_id,
      }));

      pushToDataLayer("sign_up_step1_submit", {
        cp_id: crewMemberId,
        user_type: "Creative Partner",
        page_name: "Creative Partner Signup Page: Step 1",
        location_in_website: "creative_partner_signup_step1",
        duration_on_page: performance.now() / 1000,
        email: data.email,
        phone: data.phoneNumber || null,
        cp_signup_form: {
          first_name: data.firstName,
          last_name: data.lastName,
          location: locationAddress,
          shoot_radius: data.workingDistance,
          profile_picture: data.profileImage ? true : false,
        },
      });

      pushToDataLayer("sign_up_step2_submit", {
        cp_id: crewMemberId,
        user_type: "Creative Partner",
        page_name: "Creative Partner Signup Page: Step 2",
        location_in_website: "creative_partner_signup_step2",
        duration_on_page: performance.now() / 1000,
        email: data.email,
        phone: data.phoneNumber || null,
        cp_signup_form: {
          primary_role: data.roles,
          years_of_experience: Number(data.yoe),
          hourly_rate: Number(data.hourlyRate),
          bio: data.bio || "",
          skills: (data.skills || []).map((s) => typeof s === "string" ? s : s.label || s.value),
          equipment_ownership: data.equipments || [],
        },
      });

      // --- GA4 SIGNUP TRACKING ---
      // pushToDataLayer("sign_up_step3_submit", {
      //   cp_id: data.crew_member_id,
      //   user_type: "Creative Partner",
      //   page_name: "Creative Partner Signup Page: Step 3",
      //   location_in_website: "creative_partner_signup_step3",
      //   duration_on_page: performance.now() / 1000,
      //   email: data.email,
      //   phone: data.phone || null,
      //   cp_signup_form: {
      //     social_professional_link: JSON.stringify(socialLinksPayload),
      //     work_upload: JSON.stringify(workMetadata),
      //     certifications: data?.certifications.length > 0 ? true : false,
      //     documents: (resumeFile || Array.isArray(portfolio)) ? true : false
      //   }
      // });

      pushToDataLayer("sign_up", {
        method: "email", // Official standard parameter
        user_id: crewMemberId,
        user_type: "Creative Partner",
        page_name: "Creative Partner Signup Page: Step 3",
        location_in_website: "creative_partner_signup_step3",
        duration_on_page: performance.now() / 1000,
        email: data.email,
        phone: data.phoneNumber || null,
        // cp_signup_form: {
        //   social_professional_link: JSON.stringify(socialLinksPayload),
        //   work_upload: JSON.stringify(workMetadata),
        //   certifications: data?.certifications.length > 0 ? true : false,
        //   documents: (resumeFile || Array.isArray(portfolio)) ? true : false
        // }
      });
      // ---------------------------


      toast.success("Profile Created Successfully!");
      nextStep();
    } catch (err: any) {
      console.error("Step 3 API Error:", err);
      toast.error("Failed to upload work", { description: err?.data?.message || "Internal Server Error" });
    }
  };

  const deleteLink = (id) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const deletePortfolioLink = (id) => {
    setPortfolioLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-8 bg-[#101010] text-white pt-4 lg:p-2 relative z-10">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>

        {/* Social Links (Optional) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">
              Social & Professional Links <span className="text-500">*</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <SocMedLink key={link.id} socmedItem={link} deleteLink={deleteLink} />
            ))}

            <button
              type="button"
              className="flex gap-3 items-center text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors mt-2 group"
              onClick={() => setSocialModalOpen(true)}
            >
              <div className="p-2 rounded-full border border-[#E8D1AB]/30 group-hover:bg-[#E8D1AB]/10">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Add {links.length > 0 ? "another" : "a"} link</span>
            </button>
            {/* Added a small helper text */}
            {links.length === 0 && (
              <p className="text-xs mt-1">At least one link is required to proceed.</p>
            )}
          </div>
        </div>

        {/* Portfolio Links (Optional) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">
              Portfolio Links (Optional)
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {portfolioLinks.map((link) => (
              <PortfolioLinkItem key={link.id} item={link} deleteLink={deletePortfolioLink} />
            ))}

            <button
              type="button"
              className="flex gap-3 items-center text-[#E8D1AB] hover:text-[#DCD1BE] transition-colors mt-2 group"
              onClick={() => setPortfolioModalOpen(true)}
            >
              <div className="p-2 rounded-full border border-[#E8D1AB]/30 group-hover:bg-[#E8D1AB]/10">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Add {portfolioLinks.length > 0 ? "another" : "a"} link</span>
            </button>
          </div>
        </div>

        {/* Featured Work (REQUIRED) */}
        <div className={sectionClasses}>
          <FeaturedWork
            value={featuredWork}
            onChange={setFeaturedWork}
            darkTheme={true}
          />
        </div>

        {/* Certifications (Optional) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Certifications (Optional)</h2>
          </div>
          <AddCertification
            value={data.certifications}
            onChange={(v) =>
              setData((prev) => ({ ...prev, certifications: v }))
            }
            bg="bg-[#101010]"
          />
        </div>

        {/* Resume & Portfolio (Optional) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Documents (Optional)</h2>
          </div>
          <UploadResumePortfolio
            resume={resume}
            setResume={setResume}
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            bgColour="bg-[#101010]"
            buttonBgColour="bg-white/5 hover:bg-white/10"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={isLoading}
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/30 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-4 lg:px-10 h-14 lg:h-[76px] flex-1 flex items-center justify-center rounded-[12px] bg-[#E8D1AB] hover:bg-[#DCD1BE] transition-all disabled:opacity-50 text-black`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 ">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              "Create Profile"
            )}
          </Button>
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

      <SocialLinksModal
        open={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        links={links}
        onChange={setLinks}
      />

      <PortfolioLinksModal
        open={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        links={portfolioLinks}
        onChange={setPortfolioLinks}
      />
    </div>
  );
}

const PortfolioLinkItem = ({ item, deleteLink }: { item: any, deleteLink: (id: any) => void }) => {
  const platform = PORTFOLIO_ICONS.find((p) => p.id === item.platform);
  return (
    <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] hover:border-white/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10">
          {platform?.icon ? (
            <platform.icon className="w-5 h-5 text-[#E8D1AB]" />
          ) : (
            <Globe className="w-5 h-5 text-[#E8D1AB]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">{item.name}</span>
          <span className="text-white/40 text-xs truncate max-w-[200px] lg:max-w-xs">{item.url}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteLink(item.id)}
        className="p-2 rounded-lg hover:bg-red-500/10 group transition-colors"
      >
        <Trash2 size={18} className="text-white/40 group-hover:text-red-500" />
      </button>
    </div>
  );
};

const SocMedLink = ({ socmedItem, deleteLink }: { socmedItem: any, deleteLink: (id: any) => void }) => {
  const platform = SOCIAL_ICONS.find((p) => p.id === socmedItem.platform);
  return (
    <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] hover:border-white/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10">
          {platform?.src ? (
            <img src={platform.src} alt="" className="w-5 h-5" />
          ) : platform?.icon ? (
            <platform.icon className="w-5 h-5 text-[#E8D1AB]" />
          ) : (
            <Globe className="w-5 h-5 text-[#E8D1AB]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">{socmedItem.name}</span>
          <span className="text-white/40 text-xs truncate max-w-[200px] lg:max-w-xs">{socmedItem.url}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteLink(socmedItem.id)}
        className="p-2 rounded-lg hover:bg-red-500/10 group transition-colors"
      >
        <Trash2 size={18} className="text-white/40 group-hover:text-red-500" />
      </button>
    </div>
  );
};
