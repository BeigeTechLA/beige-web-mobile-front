"use client";

import React, { useRef, useState } from "react";
import { X, ChevronDown, FileText, CreditCard, Check, Copy, Mail, Trash2, CloudUpload } from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";

interface AddOnsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AddOnsPaymentModal({ isOpen, onClose, onSave }: AddOnsPaymentModalProps) {
  const [paymentTab, setPaymentTab] = useState<'manual' | 'generate'>('manual');
  const paymentLink = "https://payment.example.com/bkg-2026-001234";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("Link copied to clipboard");
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* MAIN CONTAINER: flex-col and max-height are key here */}
      <div className="bg-[#050505] border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER: shrink-0 keeps it from squishing */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-2xl font-bold text-white">Payment</h2>
          <button 
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* BODY: flex-1 allows it to take all available space, overflow-y-auto makes it scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Tabs Container - Sticky at the top of the scroll area */}
          <div className="flex p-1 bg-[#111111] border border-zinc-800 rounded-lg sticky top-0 z-10">
            <button 
              onClick={() => setPaymentTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                paymentTab === 'manual' 
                  ? 'bg-[#E8D1AB] text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText size={16} /> Record Payment
            </button>
            <button 
              onClick={() => setPaymentTab('generate')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                paymentTab === 'generate' 
                  ? 'bg-[#E8D1AB] text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CreditCard size={16} /> Generate Payment
            </button>
          </div>

          {paymentTab === 'manual' ? (
            /* RECORD PAYMENT FORM */
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-500 transition-colors">
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-[#050505] text-[11px] font-medium text-zinc tracking-wider">
                    Select Payment Method*
                  </label>
                  <div className="flex items-center justify-between">
                    <input type="text" placeholder="Eg : UPI, Cash, Bank Transfer..." className="w-full bg-transparent border-none outline-none text-zinc-300 text-sm placeholder:text-zinc-800" />
                    <ChevronDown size={18} className="text-zinc-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-500 transition-colors">
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-[#050505] text-[11px] font-medium text-zinc tracking-wider">Select Recipient</label>
                    <div className="flex items-center justify-between cursor-pointer">
                      <span className="text-zinc-300 text-sm truncate">Lana Guzman</span>
                      <ChevronDown size={18} className="text-zinc-500" />
                    </div>
                  </div>
                  <div className="relative border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-500 transition-colors">
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-[#050505] text-[11px] font-medium text-zinc tracking-wider">Transaction ID*</label>
                    <input type="text" placeholder="Enter ID" className="w-full bg-transparent border-none outline-none text-zinc-300 text-sm placeholder:text-zinc-800" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-medium text-[#E8D1AB]">Upload Proof (Required)</span>
                  {uploadedFiles.length === 0 ? (
                    <label onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleFileDrop} className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${isDragging ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : "border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700"}`}>
                      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                      <CloudUpload className="mb-2 h-6 w-6 text-zinc-500" />
                      <p className="text-xs text-zinc-500">Drag & Drop Or <span className="font-bold text-[#E8D1AB]">Upload</span></p>
                    </label>
                  ) : (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0A0A0A] p-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="h-5 w-5 shrink-0 text-[#E8D1AB]" />
                            <p className="truncate text-sm font-medium text-white">{file.name}</p>
                          </div>
                          <button onClick={() => removeFile(index)} className="text-zinc-500 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-600">
                  <label className="absolute -top-2.5 left-3 px-2 bg-[#050505] text-xs text-zinc">Notes (Optional)</label>
                  <textarea placeholder="Add any additional notes..." className="w-full bg-transparent border-none outline-none text-zinc-300 text-sm min-h-[80px] resize-none pt-1 placeholder:text-zinc-700" />
                </div>
              </div>
            </div>
          ) : (
            /* GENERATE PAYMENT CONTENT */
            <div className="space-y-6">
              <div className="bg-[#0A120D] border border-green-900/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                  <Check size={16} strokeWidth={3} />
                  <span>Payment Link Generated</span>
                </div>
                <div className="flex items-center gap-3 bg-[#161616] border border-zinc-800 rounded-lg p-3">
                  <span className="flex-1 text-zinc-400 text-xs truncate">{paymentLink}</span>
                  <button onClick={handleCopy} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER: shrink-0 keeps it fixed at bottom */}
        <div className="p-6 border-t border-zinc-800 shrink-0 bg-[#050505]">
          {paymentTab === 'manual' ? (
            <div className="flex gap-4">
              <Button onClick={onClose} className="flex-1 h-12 bg-[#1A1A1A] hover:bg-zinc-800 text-white border-none rounded-xl">
                No, Cancel
              </Button>
              <Button onClick={onSave} className="flex-1 h-12 bg-[#E8D1AB] hover:bg-[#d9c5a0] text-black font-bold rounded-xl">
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12 bg-[#1A1A1A] border-none text-white hover:bg-zinc-800 rounded-xl font-medium">
                Regenerate Link
              </Button>
              <Button className="flex-1 h-12 bg-[#E8D1AB] hover:bg-[#d9c5a0] text-black font-bold rounded-xl flex items-center justify-center gap-2">
                <Mail size={18} />
                Send Email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}