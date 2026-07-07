"use client";

import React from "react";
import AddSkills from "./addSkills";
// Ensure these paths are correct for your project structure
import { videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";
import { normalizeCreatorRoleIds } from "@/lib/creatorRoles";

interface SkillsFormProps {
  value?: any[]; // Array of objects like {id: 19, name: 'Weddings'}
  primaryRole?: unknown;
  onChange?: (skills: any[]) => void;
}

const SkillsForm = ({ value = [], primaryRole, onChange }: SkillsFormProps) => {
  
  const roleIds = normalizeCreatorRoleIds(primaryRole);

  // 2. SELECT THE CORRECT LIST BASED ON ROLE
  const getOptionsByRole = () => {
    const options = [
      ...(roleIds.includes("1") ? videographerSkills : []),
      ...(roleIds.includes("2") ? photographerSkills : []),
      ...(roleIds.includes("3") ? editorSkills : []),
    ];

    if (options.length) {
      return options.filter(
        (option: any, index: number, arr: any[]) =>
          arr.findIndex((item: any) => String(item.value) === String(option.value)) === index
      );
    }
    
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
