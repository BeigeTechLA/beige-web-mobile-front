"use client";

import React from "react";
import AddSkills from "./addSkills";
// Ensure these paths are correct for your project structure
import { videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";
import { normalizeCreatorRoleIds } from "@/lib/creatorRoles";

type SkillOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectedSkill = {
  id?: string | number;
  value?: string | number;
  name?: string;
};

interface SkillsFormProps {
  value?: Array<SelectedSkill | string | number>; // Array of objects like {id: 19, name: 'Weddings'}
  primaryRole?: unknown;
  onChange?: (skills: SelectedSkill[]) => void;
  isDark?: boolean;
}

const SkillsForm = ({ value = [], primaryRole, onChange, isDark = true }: SkillsFormProps) => {
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
        (option: SkillOption, index: number, arr: SkillOption[]) =>
          arr.findIndex((item: SkillOption) => String(item.value) === String(option.value)) === index
      );
    }
    
    // Default: Combine all if role is missing/different
    return [...videographerSkills, ...photographerSkills, ...editorSkills];
  };

  const currentOptions = getOptionsByRole();

  // 3. MAP PROFILE SKILLS TO IDs (for the selection UI)
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
        isDark={isDark}
        onChange={(newIds) => {
          // 4. MAP BACK TO PROFILE FORMAT {id, name}
          const updatedSkills = currentOptions
            .filter((opt: SkillOption) => newIds.includes(opt.value.toString()))
            .map((opt: SkillOption) => ({
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
