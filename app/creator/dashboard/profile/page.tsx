"use client";

import React, { useState, useRef } from "react";
import { 
  MapPin, 
  Linkedin, 
  Globe, 
  Edit3, 
  Image as ImageIcon, 
  Play, 
  Plus,
  X,
  Eye,
  FileText,
  Trash2,
  CheckCircle
} from "lucide-react";

import FeaturedWorkModal from "@/src/components/cpSignup/FeaturedWorkModal";
import SocialLinksModal from "@/src/components/cpSignup/SocialLinksModal";
import PersonalInfoForm from "@/src/components/cpSignup/PersonalInfoForm";
import ProfessionalInfoForm from "@/src/components/cpSignup/ProfessionalInfoForm";
import SkillsForm from "@/src/components/cpSignup/SkillsForm";

// --- REUSABLE SUB-COMPONENTS ---
const StatBox = ({ value, sublabel }: { value: string, sublabel: string }) => (
  <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-r-0 px-4 py-2">
    <p className="text-lg font-bold text-white">{value}</p>
    <p className="text-[10px] text-white/40 uppercase tracking-widest">{sublabel}</p>
  </div>
);

const SocialButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
  >
    <Icon size={16} className="text-[#E8D1AB]" />
    <span className="text-xs font-medium text-white/80">{label}</span>
  </button>
);

const InfoField = ({ label, value, placeholder }: { label: string, value?: string, placeholder?: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm ${value ? 'text-white/80 font-medium' : 'text-white/20 italic'}`}>
      {value || placeholder}
    </p>
  </div>
);

const getSkillLabel = (id: string) => {
    const skillOptions = [
        { value: "1", label: "Video Commercial" }, { value: "2", label: "Video Event" },
        { value: "3", label: "Video Music" }, { value: "4", label: "Video Lifestyle" },
        { value: "5", label: "Photo Portrait" }, { value: "6", label: "Photo Product" },
        { value: "7", label: "Photo Event" }, { value: "8", label: "Photo Lifestyle" },
        { value: "9", label: "Audio Engineer" }, { value: "10", label: "Creative Director" },
        { value: "11", label: "Livestream Director" }, { value: "12", label: "Livestream Audio" },
        { value: "13", label: "Director" }, { value: "14", label: "Video Weddings" },
        { value: "15", label: "Photo Weddings" }, { value: "16", label: "Portrait Photo" },
        { value: "17", label: "Cinematographer" },
    ];
    return skillOptions.find(opt => opt.value === id)?.label || id;
};

const SectionHeader = ({ title, onEdit, isEditing }: { title: string, onEdit?: () => void, isEditing?: boolean }) => (
  <div className="flex items-center justify-between mb-8">
    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
    <button 
      onClick={onEdit}
      className={`p-2 rounded-full transition-all duration-200 ${
        isEditing 
        ? "bg-[#E8D1AB] text-black" 
        : "hover:bg-white/5 text-white/40 hover:text-white"
      }`}
    >
      {isEditing ? <X size={18} /> : <Edit3 size={18} />}
    </button>
  </div>
);

const TabEmptyState = ({ title, description, buttonText, footerText, onClick }: any) => (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] h-[500px] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-full border-r border-white/[0.03] last:border-r-0 bg-white/[0.01]" />
          ))}
      </div>
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h2>
          <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-md">{description}</p>
          <button 
            onClick={onClick}
            className="bg-[#1A1A1A] text-white border border-white/10 hover:bg-white hover:text-black font-bold px-10 py-3.5 rounded-2xl transition-all active:scale-95 shadow-xl"
          >
              {buttonText}
          </button>
          <p className="text-[10px] text-white/30 mt-6 font-medium uppercase tracking-widest">{footerText}</p>
      </div>
    </div>
);

// New component for uploaded files
const FileItem = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/[0.08] transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[#E8D1AB]/10 rounded-lg flex items-center justify-center text-[#E8D1AB]">
        <FileText size={20} />
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-[300px]">{file.name}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
    </div>
    <button onClick={onRemove} className="p-2 text-white/20 hover:text-red-500 transition-colors">
      <Trash2 size={18} />
    </button>
  </div>
);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Overview");
  
  // Modal States
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isSocialLinksModalOpen, setIsSocialLinksModalOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);

  // UI States
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingProfessionalInfo, setIsEditingProfessionalInfo] = useState(false);
  
  // Media Upload State (Banner)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW UPLOAD STATES ---
  const [certificates, setCertificates] = useState<File[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [profile, setProfile] = useState({
    first_name: "Namu",
    last_name: "Park",
    email: "namu@example.com",
    primary_role: "9", 
    years_of_experience: "5",
    hourly_rate: "49",
    bio: "Senior designer specializing in luxury branding and high-end visual communication for the fashion industry.",
    skills: []
  });

  const tabs = ["Overview", "Featured Work", "Certificates", "Resume", "Equipments"];

  const handleProfileUpdate = (updates: any) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith("video") ? "video" : "image";
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleAddProject = (data: any) => {
    console.log("Project added:", data);
  };

  // --- HANDLERS FOR NEW UPLOADS ---
  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCertificates(prev => [...prev, ...newFiles]);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setResume(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-[#E8D1AB] selection:text-black">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={certInputRef} 
        multiple 
        className="hidden" 
        onChange={handleCertUpload} 
        accept=".pdf,.jpg,.jpeg,.png,.docx" 
      />
      <input 
        type="file" 
        ref={resumeInputRef} 
        className="hidden" 
        onChange={handleResumeUpload} 
        accept=".pdf,.doc,.docx" 
      />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP PROFILE CARD */}
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden border-2 border-[#E8D1AB]">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Namu" alt="Profile" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
                        <span className="px-3 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] rounded-full flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Available
                        </span>
                    </div>
                    <p className="text-white/60 text-sm">{profile.bio.substring(0, 30)}...</p>
                    <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                        <MapPin size={12} /> New York, USA
                    </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {["Skill 1", "Skill 2", "+3"].map((skill) => (
                    <span key={skill} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60">{skill}</span>
                ))}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl flex max-w-sm">
                <StatBox value={`$${profile.hourly_rate}`} sublabel="/Hour" />
                <StatBox value={`${profile.years_of_experience} Yrs`} sublabel="Experience" />
                <StatBox value="5-10 Km" sublabel="Radius" />
            </div>

            <div className="flex flex-wrap gap-3">
                <SocialButton icon={Linkedin} label="LinkedIn" onClick={() => setIsSocialLinksModalOpen(true)} />
                <SocialButton icon={Globe} label="Portfolio" onClick={() => setIsSocialLinksModalOpen(true)} />
                <button onClick={() => setIsSocialLinksModalOpen(true)} className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-white/40 transition-colors">
                    <Edit3 size={18} />
                </button>
            </div>
          </div>

          <div 
            onClick={() => !mediaPreview && fileInputRef.current?.click()}
            className={`w-full lg:w-[450px] min-h-[250px] relative rounded-[2rem] flex flex-col items-center justify-center p-4 text-center group transition-all overflow-hidden
              ${mediaPreview ? 'bg-black border border-white/10 shadow-2xl' : 'bg-[#E8D1AB]/5 border-2 border-dashed border-[#E8D1AB]/20 cursor-pointer hover:bg-[#E8D1AB]/10'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            {!mediaPreview ? (
              <>
                <div className="relative w-32 h-24 mb-6">
                    <div className="absolute top-0 left-0 w-16 h-16 bg-[#E8D1AB]/20 rounded-xl rotate-[-10deg]" />
                    <div className="absolute bottom-0 right-0 w-20 h-12 bg-[#E8D1AB]/40 rounded-lg rotate-[5deg] flex items-center justify-center">
                        <ImageIcon size={20} className="text-[#E8D1AB]" />
                    </div>
                    <div className="absolute top-4 right-4 text-[#E8D1AB]/40"><Play size={24} fill="currentColor" /></div>
                </div>
                <p className="text-sm font-bold text-white mb-1">Drag and drop media, or <span className="text-[#E8D1AB] underline">browse</span></p>
                <p className="text-[10px] text-white/40 max-w-[250px] leading-relaxed">Choose an image or video. Max 10MB.</p>
              </>
            ) : (
              <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black">
                {mediaType === "image" ? (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={mediaPreview} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={removeMedia} className="p-2 bg-red-500/90 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"><X size={16} /></button>
                    <button className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-white/40 transition-colors"><Eye size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-white/5 gap-8 overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#E8D1AB]' : 'text-white/40 hover:text-white'}`}
                >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E8D1AB]" />}
                </button>
            ))}
        </div>

        {/* TAB CONTENT SECTIONS */}
        <div className="min-h-[400px] pb-20">
            
            {activeTab === "Overview" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    
                    {/* PERSONAL INFORMATION */}
                    <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8">
                        <SectionHeader title="Personal Information" isEditing={isEditingPersonalInfo} onEdit={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)} />
                        {isEditingPersonalInfo ? (
                          <div className="animate-in fade-in zoom-in-95 duration-300">
                            <PersonalInfoForm profile={profile} onChange={handleProfileUpdate} />
                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setIsEditingPersonalInfo(false)} className="bg-[#E8D1AB] text-black font-bold px-10 py-3 rounded-xl hover:bg-[#d4be9a] transition-all">Done Editing</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                              <InfoField label="First Name" value={profile.first_name} />
                              <InfoField label="Last Name" value={profile.last_name} />
                              <InfoField label="Email" value={profile.email} />
                              <InfoField label="Location" value="Manhattan, New York" />
                          </div>
                        )}
                    </div>

                    {/* PROFESSIONAL DETAILS */}
                    <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8">
                        <SectionHeader title="Professional Details" isEditing={isEditingProfessionalInfo} onEdit={() => setIsEditingProfessionalInfo(!isEditingProfessionalInfo)} />
                        {isEditingProfessionalInfo ? (
                          <div className="animate-in fade-in zoom-in-95 duration-300">
                            <ProfessionalInfoForm profile={profile} onChange={handleProfileUpdate} />
                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setIsEditingProfessionalInfo(false)} className="bg-[#E8D1AB] text-black font-bold px-10 py-3 rounded-xl hover:bg-[#d4be9a] transition-all">Done Editing</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                              <InfoField label="Primary Role" value={profile.primary_role === "9" ? "Videographer" : "Professional"} />
                              <InfoField label="Experience" value={`${profile.years_of_experience} Years`} />
                              <div className="col-span-full"><InfoField label="Bio" value={profile.bio} /></div>
                          </div>
                        )}
                    </div>

                    {/* SKILLS SECTION */}
                    <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8">
                        <SectionHeader 
                            title="Skills" 
                            isEditing={isEditingSkills} 
                            onEdit={() => setIsEditingSkills(!isEditingSkills)} 
                        />
                        
                        {isEditingSkills ? (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SkillsForm 
                                    value={profile.skills} 
                                    onChange={(newSkills) => handleProfileUpdate({ skills: newSkills })} 
                                />
                                <div className="mt-8 flex justify-end">
                                    <button 
                                        onClick={() => setIsEditingSkills(false)}
                                        className="bg-[#E8D1AB] text-black font-bold px-10 py-3 rounded-xl hover:bg-[#d4be9a] transition-all"
                                    >
                                        Done Editing
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 animate-in fade-in duration-300">
                                {profile.skills.length > 0 ? (
                                    profile.skills.map(skillId => (
                                        <span key={skillId} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80">
                                            {getSkillLabel(skillId)}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-white/20 italic text-sm">No skills added yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* FEATURED WORK TAB */}
            {activeTab === "Featured Work" && (
              <div className="animate-in fade-in duration-500">
                <TabEmptyState 
                    title="Share your work and get discovered"
                    description="Showcase your latest creations with the perfect image or video."
                    buttonText="Upload Project"
                    footerText="Minimum 1600 × 1200. Max 10MB (images), 20MB (videos)."
                    onClick={() => setIsFeaturedModalOpen(true)}
                />
              </div>
            )}

            {/* CERTIFICATES TAB (With Upload functionality) */}
            {activeTab === "Certificates" && (
              <div className="animate-in fade-in duration-500">
                {certificates.length > 0 ? (
                  <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Your Certificates</h3>
                      <button 
                        onClick={() => certInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus size={16} /> Add More
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificates.map((file, index) => (
                        <FileItem 
                          key={index} 
                          file={file} 
                          onRemove={() => setCertificates(prev => prev.filter((_, i) => i !== index))} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <TabEmptyState 
                      title="Showcase your certifications"
                      description="Upload your professional credentials and achievements to build trust with clients."
                      buttonText="Add Certificate"
                      footerText="PDF, JPG, DOCX or PNG files. Max 10MB per file."
                      onClick={() => certInputRef.current?.click()}
                  />
                )}
              </div>
            )}

            {/* RESUME TAB (With Upload functionality) */}
            {activeTab === "Resume" && (
              <div className="animate-in fade-in duration-500">
                {resume ? (
                  <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold">Resume Uploaded</h3>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <CheckCircle size={12} /> Active
                      </span>
                    </div>
                    <FileItem file={resume} onRemove={() => setResume(null)} />
                    <button 
                      onClick={() => resumeInputRef.current?.click()}
                      className="mt-6 w-full py-4 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 hover:text-white hover:border-white/20 transition-all font-bold"
                    >
                      Click to replace file
                    </button>
                  </div>
                ) : (
                  <TabEmptyState 
                      title="Upload your resume"
                      description="Browse or drag and drop a file here to keep your profile updated."
                      buttonText="Select File"
                      footerText="Acceptable file types: PDF, JPG, PNG (max 5MB)"
                      onClick={() => resumeInputRef.current?.click()}
                  />
                )}
              </div>
            )}

            {/* EQUIPMENTS TAB */}
            {activeTab === "Equipments" && (
              <div className="animate-in fade-in duration-500">
                <TabEmptyState 
                    title="List your equipment"
                    description="Showcase the professional gear and tools you use to deliver high-quality results."
                    buttonText="Add Equipment"
                    footerText="Cameras, lenses, lighting, or any specialized gear you own."
                />
              </div>
            )}

        </div>
      </div>

      <FeaturedWorkModal 
        open={isFeaturedModalOpen} 
        onClose={() => setIsFeaturedModalOpen(false)} 
        onAdd={handleAddProject}
      />
       <SocialLinksModal 
        open={isSocialLinksModalOpen}
        onClose={() => setIsSocialLinksModalOpen(false)}
        links={socialLinks}           
        onChange={(updatedLinks) => setSocialLinks(updatedLinks)} 
      />
    </div>
  );
}