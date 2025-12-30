'use client';

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Upload, LinkIcon } from "lucide-react";

const MAX_CERTS = 10;

const AddCertification = ({ value = [], onChange, bg = "bg-card" }) => {
  const inputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (value.length >= MAX_CERTS) {
      alert(`You can upload maximum ${MAX_CERTS} certifications.`);
      return;
    }

    const newCert = {
      id: crypto.randomUUID(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + " MB",
      file,
      url: URL.createObjectURL(file),
    };

    // Call onChange directly with the new array
    onChange([...value, newCert]);
  };

  const removeCert = (id) => {
    const updated = value.filter((c) => c.id !== id);
    onChange(updated);
  };

  const viewCertificate = (cert) => {
    if (!cert?.file) return;
    const url = URL.createObjectURL(cert.file);
    window.open(url, "_blank");
    // Revoke after a minute to save memory
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className={`w-full border border-white/30 rounded-xl p-5 ${bg}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Certifications</h2>
          <p className="text-sm text-white/50">Max {MAX_CERTS} files</p>
        </div>

        <Button asChild className="bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]">
          <label className="cursor-pointer flex items-center gap-2">
            <Upload size={16} />
            Upload
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {value.map((cert) => (
          <div
            key={cert.id}
            className="border border-white/10 bg-white/5 rounded-xl p-4 flex justify-between items-center text-sm"
          >
            <div className="flex items-center gap-3">
              <LinkIcon size={18} className="text-[#E8D1AB]" />
              <div className="flex flex-col">
                <span className="font-medium text-white">{cert.name}</span>
                <span className="text-white/40 text-xs">{cert.size}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => viewCertificate(cert)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
              >
                <Eye size={18} />
              </button>

              <button
                type="button"
                onClick={() => removeCert(cert.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddCertification;