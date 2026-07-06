'use client';

import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Globe, GripHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SOCIAL_ICONS } from "@/app/data/staticData";

export default function SocialLinksModal({ open, onClose, links, onChange, isDark }) {
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
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <div className={`fixed inset-0 z-50 flex items-center justify-center duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        } mx-10 lg:mx-0`}>
        <div className={`w-[500px] rounded-xl lg:rounded-2xl shadow-xl p-6 relative border transition-colors ${isDark ? "bg-[#101010] border-white/10 text-white" : "bg-white border-black/5 text-black"}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-current">Add Social Links</h2>
            <button
              onClick={onClose}
              className={`transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}
            >
              <X />
            </button>
          </div>

          <p className={`text-sm mb-5 ${isDark ? "text-white/40" : "text-black/40"}`}>
            Add links that showcase your work, recognition, personality and more!
          </p>

          <div className="flex gap-1.5 lg:gap-3 mb-5 overflow-x-auto pb-2">
            {SOCIAL_ICONS.map((s) => {
              const isSelected = selectedPlatform === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handlePlatformSelect(s.id)}
                  className={`flex flex-col items-center gap-1 border rounded-xl p-1 lg:p-3 transition-colors ${isSelected
                      ? isDark
                        ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                        : "bg-[#cbb38b] border-[#cbb38b] text-white"
                      : isDark
                        ? "bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white"
                        : "bg-black/5 border-black/5 text-black/60 hover:text-black"
                    }`}
                >
                  {s?.icon ? (
                    <s.icon className="w-5 h-5" />
                  ) : (
                    <img src={s.src} alt={s.label} className="w-5 h-5" />
                  )}
                </button>
              );
            })}
          </div>

          {(screen === "add" || screen === "edit") && (
            <div className="space-y-3">
              <Input
                placeholder="https://your-link.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={`h-11 ${isDark
                    ? "bg-[#1A1A1A] border-white/20 text-white placeholder:text-white/30 focus:border-[#E8D1AB]"
                    : "bg-neutral-50 border-black/10 text-black placeholder:text-black/40 focus:border-[#cbb38b]"
                  }`}
                autoFocus
              />

              {selectedPlatform === "custom" && (
                <Input
                  placeholder="Name the link (e.g. My Portfolio)"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className={`h-11 ${isDark
                      ? "bg-[#1A1A1A] border-white/20 text-white placeholder:text-white/30 focus:border-[#E8D1AB]"
                      : "bg-neutral-50 border-black/10 text-black placeholder:text-black/40 focus:border-[#cbb38b]"
                    }`}
                />
              )}

              <div className="flex justify-end mt-6 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setScreen("list")}
                  className={`rounded-full px-6 border ${isDark
                      ? "border-white/20 text-white hover:bg-white/5"
                      : "border-black/10 text-black hover:bg-black/5"
                    }`}
                >
                  Back
                </Button>
                <Button
                  onClick={saveLink}
                  className={`rounded-full px-6 ${isDark
                      ? "bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]"
                      : "bg-[#cbb38b] text-white hover:bg-[#bfa57c]"
                    }`}
                >
                  Save Link
                </Button>
              </div>
            </div>
          )}

          {screen === "list" && (
            <>
              {links.length > 0 && (
                <p className={`text-sm mb-3 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  {links.length}/7
                </p>
              )}

              <div className="space-y-3 max-h-[260px] overflow-auto pr-2">
                {links.map((item) => {
                  const platform = SOCIAL_ICONS.find((i) => i.id === item.platform);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between border p-3 rounded-xl ${isDark ? "bg-[#1A1A1A] border-white/10" : "bg-neutral-50 border-black/5"}`}
                    >
                      <div className="flex items-center gap-3">
                        <GripHorizontal size={16} className={isDark ? "text-white/20" : "text-black/20"} />
                        {platform?.src ? (
                          <img src={platform.src} className="w-5 h-5" alt="" />
                        ) : platform?.icon ? (
                          <platform.icon className={`w-5 h-5 ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}`} />
                        ) : (
                          <Globe className={`w-5 h-5 ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}`} />
                        )}
                        <span className={`text-sm ${isDark ? "text-white" : "text-black"}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className={`p-2 rounded-lg border transition-colors ${isDark
                              ? "bg-[#101010] border-white/10 text-white/60 hover:text-white"
                              : "bg-white border-black/10 text-black/60 hover:text-black"
                            }`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteLink(item.id)}
                          className={`p-2 rounded-lg border transition-colors ${isDark
                              ? "bg-[#101010] border-white/10 text-white/60 hover:text-red-500"
                              : "bg-white border-black/10 text-black/60 hover:text-red-500"
                            }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={startAdd}
                className={`flex items-center gap-2 mt-4 text-sm hover:underline ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isDark ? "border-[#E8D1AB]/30" : "border-[#cbb38b]/30"}`}>
                  <Plus size={16} />
                </div>
                Add another link
              </button>

              <div className={`flex justify-end gap-3 mt-6 border-t pt-4 ${isDark ? "border-white/10" : "border-black/5"}`}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className={`rounded-full px-6 border ${isDark
                      ? "border-white/20 text-white hover:bg-white/5"
                      : "border-black/10 text-black hover:bg-black/5"
                    }`}
                >
                  Close
                </Button>
                <Button
                  onClick={() => { onChange(links); onClose(); }}
                  className={`rounded-full px-6 font-bold ${isDark
                      ? "bg-[#E8D1AB] text-black hover:bg-[#DCD1BE]"
                      : "bg-[#cbb38b] text-white hover:bg-[#bfa57c]"
                    }`}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}