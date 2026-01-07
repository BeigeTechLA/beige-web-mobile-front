'use client';

import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Globe, GripHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SOCIAL_ICONS } from "@/app/data/staticData";

export default function SocialLinksModal({ open, onClose, links, onChange }) {
  const [screen, setScreen] = useState("list"); 
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!open) {
      setScreen("list");
      setSelectedPlatform(null);
      setLinkUrl("");
      setLinkName("");
      setEditId(null);
    }
  }, [open]);

  // This allows users to click an icon at the top to start adding immediately
  const handlePlatformSelect = (platformId) => {
    setSelectedPlatform(platformId);
    if (screen === "list") {
      setScreen("add");
      setLinkUrl("");
      setLinkName("");
    }
  };

  const startAdd = () => {
    setScreen("add");
    setSelectedPlatform(null);
    setLinkUrl("");
    setLinkName("");
  };

  const startEdit = (item) => {
    setScreen("edit");
    setEditId(item.id);
    setSelectedPlatform(item.platform);
    setLinkUrl(item.url);
    setLinkName(item.name);
  };

  const saveLink = () => {
    if (!selectedPlatform || !linkUrl.trim()) return;
    const platformData = SOCIAL_ICONS.find((p) => p.id === selectedPlatform);
    const autoName = selectedPlatform !== "custom" ? platformData.label : linkName.trim();

    let updated = [...links];
    if (screen === "edit") {
      updated = updated.map((i) => i.id === editId ? { ...i, platform: selectedPlatform, url: linkUrl, name: autoName } : i);
    } else {
      updated.push({ id: Date.now(), platform: selectedPlatform, url: linkUrl.trim(), name: autoName });
    }
    onChange(updated);
    setScreen("list");
  };

  const deleteLink = (id) => {
    onChange(links.filter((l) => l.id !== id));
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div className={`fixed inset-0 z-50 flex items-center justify-center duration-200 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        } mx-10 lg:mx-0`}>
        <div className="bg-[#101010] border border-white/10 w-[500px] rounded-2xl shadow-xl p-6 relative text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add Social Links</h2>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X /></button>
          </div>

          <p className="text-sm text-white/40 mb-5">
            Add links that showcase your work, recognition, personality and more!
          </p>

          <div className="flex gap-1.5 lg:gap-3 mb-5 overflow-x-auto pb-2">
            {SOCIAL_ICONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handlePlatformSelect(s.id)}
                className={`flex flex-col items-center gap-1 border rounded-xl p-1 lg:p-3 transition-colors
                  ${selectedPlatform === s.id ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-[#1A1A1A] border-white/10 text-white/60"}`}
              >
                {s?.icon ? <s.icon className="w-5 h-5" /> : <img src={s.src} alt={s.label} className="w-5 h-5" />}
              </button>
            ))}
          </div>

          {(screen === "add" || screen === "edit") && (
            <div className="space-y-3">
              <Input
                placeholder="https://your-link.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-11 bg-[#1A1A1A] border-white/20 text-white"
                autoFocus
              />

              {selectedPlatform === "custom" && (
                <Input
                  placeholder="Name the link (e.g. My Portfolio)"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="h-11 bg-[#1A1A1A] border-white/20 text-white"
                />
              )}

              <div className="flex justify-end mt-6 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setScreen("list")}
                  className="rounded-full px-6 border-white/20 text-white hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={saveLink}
                  className="rounded-full px-6 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]"
                >
                  Save Link
                </Button>
              </div>
            </div>
          )}

          {screen === "list" && (
            <>
              {links.length > 0 && <p className="text-sm text-white/40 mb-3">{links.length}/7</p>}
              
              <div className="space-y-3 max-h-[260px] overflow-auto pr-2">
                {links.map((item) => {
                    const platform = SOCIAL_ICONS.find((i) => i.id === item.platform);
                    return (
                        <div key={item.id} className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                            <GripHorizontal size={16} className="text-white/20" />
                            {platform?.src ? <img src={platform.src} className="w-5 h-5" alt="" /> : platform?.icon ? <platform.icon className="w-5 h-5 text-[#E8D1AB]" /> : <Globe className="w-5 h-5 text-[#E8D1AB]" />}
                            <span className="text-white text-sm">{item.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => startEdit(item)} className="p-2 rounded-lg bg-[#101010] border border-white/10 text-white/60 hover:text-white"><Pencil size={16} /></button>
                            <button onClick={() => deleteLink(item.id)} className="p-2 rounded-lg bg-[#101010] border border-white/10 text-white/60 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        </div>
                    );
                })}
              </div>

              <button className="flex items-center gap-2 mt-4 text-[#E8D1AB] hover:underline text-sm" onClick={startAdd}>
                <div className="w-8 h-8 rounded-full border border-[#E8D1AB]/30 flex items-center justify-center"><Plus size={16} /></div>
                Add another link
              </button>
              
              <div className="flex justify-end gap-3 mt-6 border-t border-white/10 pt-4">
                <Button variant="outline" onClick={onClose} className="rounded-full px-6 border-white/20 text-white hover:bg-white/5">Close</Button>
                <Button onClick={() => { onChange(links); onClose(); }} className="rounded-full px-6 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]">Save Changes</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}