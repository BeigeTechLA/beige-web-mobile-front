"use client";

import React, { useState, useEffect } from "react";
import AddSkills from "./addSkills";

const skillOptions = [
  { value: "1", label: "Video Commercial" },
  { value: "2", label: "Video Event" },
  { value: "3", label: "Video Music" },
  { value: "4", label: "Video Lifestyle" },
  { value: "5", label: "Photo Portrait" },
  { value: "6", label: "Photo Product" },
  { value: "7", label: "Photo Event" },
  { value: "8", label: "Photo Lifestyle" },
  { value: "9", label: "Audio Engineer" },
  { value: "10", label: "Creative Director" },
  { value: "11", label: "Livestream Director" },
  { value: "12", label: "Livestream Audio" },
  { value: "13", label: "Director" },
  { value: "14", label: "Video Weddings" },
  { value: "15", label: "Photo Weddings" },
  { value: "16", label: "Portrait Photo" },
  { value: "17", label: "Cinematographer" },
];

interface SkillsFormProps {
  value?: string[];
  onChange?: (skills: string[]) => void;
}

const SkillsForm = ({ value = [], onChange }: SkillsFormProps) => {
  // Sync local state if value changes from parent
  const [localSkills, setLocalSkills] = useState<string[]>(value);

  useEffect(() => {
    setLocalSkills(value);
  }, [value]);

  return (
    <div className="animate-in fade-in duration-500">
      <AddSkills
        value={localSkills}
        options={skillOptions}
        onChange={(skills) => {
          setLocalSkills(skills);
          onChange?.(skills);
        }}
      />
    </div>
  );
};

export default SkillsForm;