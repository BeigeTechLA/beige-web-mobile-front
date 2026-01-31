'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Globe, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import AddCertification from "./AddCertification";
import FeaturedWork from "./FeaturedWork";
import SocialLinksModal from "./SocialLinksModal";
import UploadResumePortfolio from "./UploadResumePortfolio";
import { SOCIAL_ICONS } from "@/app/data/staticData";
import { useRegisterCreatorStep3Mutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";

export default function Step3Form({ data, setData, nextStep, prevStep }) {
  const [registerStep3, { isLoading }] = useRegisterCreatorStep3Mutation();

  const [featuredWork, setFeaturedWork] = useState(data.featuredWork || []);
  const [links, setLinks] = useState(data.links || []);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [resume, setResume] = useState(data.resume || null);
  const [portfolio, setPortfolio] = useState(data.portfolio || null);

  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      featuredWork,
      links,
      resume,
      portfolio,
    }));
  }, [featuredWork, links, resume, portfolio, setData]);

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
      if (!data.crew_member_id) {
        toast.error("Session Error", { description: "Crew ID missing." });
        return;
      }

      const formData = new FormData();
      formData.append("crew_member_id", String(data.crew_member_id));

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
      featuredWork.forEach((item) => {
        if (item.files && Array.isArray(item.files)) {
          item.files.forEach((file) => {
            if (file instanceof File) {
              formData.append("recent_work", file);
            }
          });
        }
      });

      const workMetadata = featuredWork.map(item => ({
        title: item.title,
        tags: item.tags || []
      }));
      formData.append("work_details", JSON.stringify(workMetadata));

      const socialLinksPayload = {};
      links.forEach((l) => {
        if (l.platform && l.url) socialLinksPayload[l.platform] = l.url;
      });
      formData.append("social_media_links", JSON.stringify(socialLinksPayload));

      // API CALL
      await registerStep3(formData).unwrap();

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
            className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-14 lg:h-[76px] rounded-[12px] text-lg font-semibold transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              "Create Profile"
            )}
          </Button>
        </div>
      </form>

      <SocialLinksModal
        open={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        links={links}
        onChange={setLinks}
      />
    </div>
  );
}

const SocMedLink = ({ socmedItem, deleteLink }) => {
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