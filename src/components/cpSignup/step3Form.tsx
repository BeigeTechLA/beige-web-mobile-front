'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Globe, Trash2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import AddCertification from "./AddCertification";
import FeaturedWork from "./FeaturedWork";
import SocialLinksModal from "./SocialLinksModal";
import UploadResumePortfolio from "./UploadResumePortfolio";
import { SOCIAL_ICONS } from "@/app/data/staticData";
import toast from "react-hot-toast";

export default function Step3Form({ data, setData, nextStep, prevStep }) {
  const [featuredWork, setFeaturedWork] = useState(data.featuredWork || []);
  const [links, setLinks] = useState(data.links || []);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [resume, setResume] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  // --- ADDED THIS FUNCTION ---
  const handleSubmit = () => {
    // You can add API calls here later.
    // For now, it just moves to the next step (Step 4)
    nextStep();
  };

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      featuredWork,
      links,
      resume,
      portfolio,
    }));
  }, [featuredWork, links, resume, portfolio, setData]);

  const deleteLink = (id) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-8 bg-[#101010] text-white p-2">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>
        
        {/* Social Links Section */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Social & Professional Links</h2>
            <p className="text-sm text-white/50">Add links to your IMDb, LinkedIn, or Instagram</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <SocMedLink
                key={link.id}
                socmedItem={link}
                deleteLink={deleteLink}
              />
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
          </div>
        </div>

        {/* Featured Work Section */}
        <div className={sectionClasses}>
            <FeaturedWork 
                value={featuredWork} 
                onChange={setFeaturedWork} 
                darkTheme={true} 
            />
        </div>

        {/* Certifications Section */}
        <div className={sectionClasses}>
          <AddCertification
            value={data.certifications}
            onChange={(v) =>
              setData((prev) => ({ ...prev, certifications: v }))
            }
            bg="bg-[#101010]"
          />
        </div>

        {/* Resume & Portfolio Section */}
        <div className={sectionClasses}>
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
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/30 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <Button
            type="button"
            onClick={handleSubmit} // --- FIXED: Un-commented and linked to handleSubmit ---
            disabled={loading}
            className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-14 lg:h-[76px] rounded-[12px] text-lg font-semibold transition-all"
          >
            {loading ? "Submitting..." : "Create Profile"}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-white/40 pt-4 pb-10">
          <div className="h-[1px] flex-grow bg-white/10"></div>
          <span>Already have an account?</span>
          <Link href="/loginCrew" className="text-[#E8D1AB] hover:underline">
            Log in
          </Link>
          <div className="h-[1px] flex-grow bg-white/10"></div>
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
            <span className="text-white text-sm font-medium">
            {socmedItem.name}
            </span>
            <span className="text-white/40 text-xs truncate max-w-[200px] lg:max-w-xs">
                {socmedItem.url}
            </span>
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