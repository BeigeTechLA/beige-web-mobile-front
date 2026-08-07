"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Check, AlertCircle, ChevronDown, FileText, CreditCard, X } from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { ReviewAddOnsModal } from "@/components/admin/shoot-details/ReviewAddOnsModal";
import { AddOnsPaymentModal } from "@/components/admin/shoot-details/AddOnsPaymentModal";

interface AddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
}

export default function AddOnsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  // Mock data based on your screenshot
  const [addOns, setAddOns] = useState<AddOn[]>([
    { id: "1", name: "Additional Camera", price: 350, quantity: 1, selected: true },
    { id: "2", name: "Teleprompter", price: 250, quantity: 0, selected: false },
    { id: "3", name: "Drone", price: 500, quantity: 1, selected: true },
    { id: "4", name: "Additional Lavalier Microphones", price: 250, quantity: 0, selected: false },
    { id: "5", name: "Green Screen", price: 500, quantity: 1, selected: true },
    { id: "6", name: "Backdrop", price: 500, quantity: 0, selected: false },
    { id: "7", name: "Additional Lights", price: 350, quantity: 0, selected: false },
    { id: "8", name: "Next-Day Editing (Per Video)", price: 500, quantity: 0, selected: false },
    { id: "9", name: "Expedited Editing (1 Week)", price: 750, quantity: 0, selected: false },
  ]);

   const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedItems = addOns.filter(item => item.selected && item.quantity > 0);
  const totalAmount = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [paymentTab, setPaymentTab] = useState<'manual' | 'generate'>('manual');
  const toggleSelect = (index: number) => {
    const newAddOns = [...addOns];
    newAddOns[index].selected = !newAddOns[index].selected;
    if (newAddOns[index].selected && newAddOns[index].quantity === 0) {
      newAddOns[index].quantity = 1;
    }
    setAddOns(newAddOns);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newAddOns = [...addOns];
    const newQty = Math.max(0, newAddOns[index].quantity + delta);
    newAddOns[index].quantity = newQty;
    newAddOns[index].selected = newQty > 0;
    setAddOns(newAddOns);
  };

  const handleSave = async () => {
    try {
      // API Logic would go here
      toast.success("Add-ons updated successfully");
      router.back();
    } catch (error) {
      toast.error("Failed to update add-ons");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 lg:p-10">
      {/* Back Link */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Add-ons</h1>
        <p className="text-zinc-400 text-sm md:text-base">
          Customize your shoot with professional equipment and premium services tailored to your production needs.
        </p>
      </div>

      {/* Grid Container */}
      <div className="bg-[#111111] rounded-2xl border border-zinc-800 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {addOns.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-4">
              {/* Top Row: Checkbox, Name, Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => toggleSelect(index)}
                    className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border transition-all ${
                      item.selected 
                        ? "bg-[#E8D1AB] border-[#E8D1AB]" 
                        : "bg-transparent border-zinc-600"
                    }`}
                  >
                    {item.selected && <Check size={14} className="text-black stroke-[3]" />}
                  </div>
                  <span className={`text-sm font-medium ${item.selected ? "text-white" : "text-zinc-400"}`}>
                    {item.name}
                  </span>
                </div>
                <span className="text-lg text-[#E8D1AB] font-semibold">${item.price.toFixed(2)}</span>
              </div>

              {/* Quantity Selector */}
              <div className={`flex items-center justify-between rounded-lg h-12 overflow-hidden transition-colors ${
                item.selected ? "bg-[#E8D1AB] text-black" : "bg-[#E8D1AB]/30 text-black"
              }`}>
                <button 
                  onClick={() => updateQuantity(index, -1)}
                  className="px-4 h-full hover:bg-black/10 flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                
                <span className="text-lg font-bold">
                  {item.quantity.toString().padStart(2, '0')}
                </span>

                <button 
                  onClick={() => updateQuantity(index, 1)}
                  className="px-4 h-full hover:bg-black/10 flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-4 mt-10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="h-14 px-12 rounded-lg border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
        >
          Back
        </Button>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-12 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] font-bold"
        >
          Continue
        </Button>
      </div>
     <ReviewAddOnsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContinue={() => {
          setIsModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
        selectedItems={selectedItems}
        totalAmount={totalAmount}
      />
      <AddOnsPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSave}
      />
    </div> 
  );
}