"use client";

import React from "react";
import AddSkills from "./addSkills";
// Ensure these paths are correct for your project structure
import { videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";

interface SkillsFormProps {
  value?: any[]; // Array of objects like {id: 19, name: 'Weddings'}
  primaryRole?: string; // The messy string from API: "["[\"10\"]"]"
  onChange?: (skills: any[]) => void;
}

const SkillsForm = ({ value = [], primaryRole, onChange }: SkillsFormProps) => {
  
  // 1. ROBUST ROLE PARSING
  const getRoleId = () => {
    try {
      if (!primaryRole) return null;
      let parsed = typeof primaryRole === 'string' ? JSON.parse(primaryRole) : primaryRole;
      
      // If it's double stringified like ["[\"10\"]"]
      if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0].startsWith('[')) {
        parsed = JSON.parse(parsed[0]);
      }
      
      const id = Array.isArray(parsed) ? parsed[0] : parsed;
      return id?.toString();
    } catch (e) {
      console.error("Error parsing primary_role:", e);
      return null;
    }
  };

  const roleId = getRoleId();

  // 2. SELECT THE CORRECT LIST BASED ON ROLE
  const getOptionsByRole = () => {
    // Note: In your specific data: 9=Video, 10=Photo, 11=Editor
    if (roleId === "1") return videographerSkills;
    if (roleId === "2") return photographerSkills;
    if (roleId === "3") return editorSkills;
    
    // Default: Combine all if role is missing/different
    return [...videographerSkills, ...photographerSkills, ...editorSkills];
  };

  const currentOptions = getOptionsByRole();

  // 3. MAP PROFILE SKILLS TO IDs (for the selection UI)
  // Profile has {id, name}, Static Data has {value, label}
  const selectedIds = value?.map(skill => {
    if (typeof skill === 'object' && skill !== null) {
      return (skill.id || skill.value)?.toString();
    }
    return skill?.toString();
  }).filter(Boolean) || [];

  return (
    <div className="animate-in fade-in duration-500">
      <AddSkills
        value={selectedIds}
        options={currentOptions} // Uses value/label directly from your static data
        onChange={(newIds) => {
          // 4. MAP BACK TO PROFILE FORMAT {id, name}
          // When user selects a skill, find it in the static list 
          // and format it for the API/State
          const updatedSkills = currentOptions
            .filter((opt: any) => newIds.includes(opt.value.toString()))
            .map((opt: any) => ({
              id: parseInt(opt.value),
              name: opt.label
            }));
          
          onChange?.(updatedSkills);
        }}
      />
    </div>
  );
};

export default SkillsForm;