"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronDown,
  Search,
  Plus,
  Save,
  Check,
  MoreVertical,
  Calendar,
  Minus,
  Trash2,
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Info,
  Percent,
  DollarSign,
  ArrowLeft
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DottedDivider from "@/components/admin/DottedDivider";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { DatePicker } from "@/components/ui/Datepicker";
import Image from "next/image";

const clients = [
  { id: 1, name: "Jaymin Patel", email: "jaymin@example.com", phone: "+1 (555) 123-4567" },
  { id: 2, name: "Harsh Panchal", email: "harsh@example.com", phone: "+1 (555) 987-6543" },
  { id: 3, name: "Parth Patel", email: "parth@example.com", phone: "+1 (555) 000-1111" },
  { id: 4, name: "Raj Yadav", email: "raj@example.com", phone: "+1 (555) 222-3333" },
];

export default function CreateQuotePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Views: 'selection' | 'details' | 'services' | 'addons' | 'logistics'
  const [view, setView] = useState<'selection' | 'details' | 'services' | 'addons' | 'logistics' | 'customlineitems' | 'discounts' | 'tax'>('selection');

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [clientName, setClientName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [validityDays, setValidityDays] = useState<number | 'custom'>(7);
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));

  // Step 2: Services & Config State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedShootType, setSelectedShootType] = useState<string>("private_event");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceCost, setCustomServiceCost] = useState("");
  const [customShootType, setCustomShootType] = useState("");
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [showAddShootTypeForm, setShowAddShootTypeForm] = useState(false);
  const [selectedEditingType, setSelectedEditingType] = useState<string>("social_media_reel_30_90");
  const [showAddEditingTypeForm, setShowAddEditingTypeForm] = useState(false);
  const [customEditingType, setCustomEditingType] = useState("");
  const [isShootTypeExpanded, setIsShootTypeExpanded] = useState(true);
  const [isEditingTypeExpanded, setIsEditingTypeExpanded] = useState(true);

  // Step 3: Add-ons State
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonConfigs, setAddonConfigs] = useState<Record<string, { quantity: number; price: number }>>({});
  const [showAddAddonForm, setShowAddAddonForm] = useState(false);
  const [customAddonName, setCustomAddonName] = useState("");
  const [customAddonCost, setCustomAddonCost] = useState("");

  // Step 4: Logistics State
  const initialLogisticsItems = [
    { id: "travel", label: "Travel and Transportation", basePrice: 500 },
    { id: "equipment", label: "Equipment Rental", basePrice: 800 },
    { id: "studio", label: "Studio Rental", basePrice: 1200 },
    { id: "permits", label: "Permits & Licenses", basePrice: 300 },
  ];
  const [logisticsItems, setLogisticsItems] = useState(initialLogisticsItems);
  const [logisticsConfigs, setLogisticsConfigs] = useState<Record<string, { price: number }>>({
    travel: { price: 500 },
    equipment: { price: 800 },
    studio: { price: 1200 },
    permits: { price: 300 },
  });
  const [customLogisticsName, setCustomLogisticsName] = useState("");
  const [customLogisticsCost, setCustomLogisticsCost] = useState("");

  //Step 5: Custom Line Items State
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCost, setCustomItemCost] = useState("");
  const [lineItems, setLineItems] = useState(initialLogisticsItems);
  const [lineItemConfigs, setLineItemConfigs] = useState<Record<string, { price: number }>>({});

  // Step 6: Discount 
  type DiscountType = "percentage" | "fixed";
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0)

  // Step 7: Discount 
  const [selectedTax, setSelectedTax] = useState<0 | 5 | 8.5 | 10>(0);
  const [taxRate, setTaxRate] = useState(0)
  const [taxtType, setTaxType] = useState("")

  // Configuration for each selected service
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, {
    quantity: number;
    duration: number;
    crewSize: number;
    estimatedPrice: number;
  }>>({});

  const services = [
    { id: "videography", label: "Videography", price: 250, icon: <Video size={20} /> },
    { id: "photography", label: "Photography", price: 250, icon: <Camera size={20} /> },
    { id: "ai_editing", label: "AI Editing", price: 500, icon: <Scissors size={20} /> },
    { id: "livestream", label: "Livestream Production", price: 250, icon: <Radio size={20} /> },
    { id: "location", label: "Location", price: 250, icon: <MapPin size={20} /> },
  ];

  const shootTypes = [
    { id: "corporate_event", label: "Corporate Event" },
    { id: "wedding", label: "Wedding" },
    { id: "private_event", label: "Private Event" },
    { id: "commercial", label: "Commercial & Advertising" },
    { id: "social_content", label: "Social Content" },
    { id: "podcast", label: "Podcast & Shows" },
  ];

  const editingTypes = [
    { id: "social_media_reel_15_30", label: "Social Media Reel (15 sec-30 sec)" },
    { id: "social_media_reel_30_90", label: "Social Media Reel (30 sec-90 sec)" },
    { id: "mini_highlight_video", label: "Mini Highlight Video (1-2 mins)" },
    { id: "highlight_video", label: "Highlight Video (4-7 min)" },
    { id: "feature_video", label: "Feature Video (30-40 min)" },
  ];

  const addons = [
    { id: "4k_upgrade", label: "4K Camera Upgrade", price: 500 },
    { id: "drone_footage", label: "Drone Footage", price: 800 },
    { id: "additional_crew", label: "Additional Crew Member", price: 300 },
    { id: "lightning_package", label: "Lightning Package", price: 600 },
    { id: "audio_kit", label: "Audio Recording Kit", price: 400 },
    { id: "green_screen", label: "Green Screen Setup", price: 600 },
    { id: "teleprompter", label: "Teleprompter", price: 200 },
    { id: "hair_makeup", label: "Hair and Makeup Artist", price: 450 },
  ];

  useEffect(() => setMounted(true), []);
  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  const handleConfigUpdate = (serviceId: string, field: string, value: number) => {
    setServiceConfigs(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: Math.max(0, value)
      }
    }));
  };

  const handleAddonConfigUpdate = (addonId: string, field: string, value: number) => {
    setAddonConfigs(prev => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        [field]: Math.max(0, value)
      }
    }));
  };

  const handleServiceSelect = (serviceId: string, price: number) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceId);
      if (isSelected) {
        const newSelected = prev.filter(id => id !== serviceId);
        // Remove config if no services selected
        if (newSelected.length === 0) {
          setServiceConfigs({});
        }
        return newSelected;
      } else {
        const newSelected = [...prev, serviceId];
        // Initialize config for the new service
        if (!serviceConfigs[serviceId]) {
          setServiceConfigs(prevConfigs => ({
            ...prevConfigs,
            [serviceId]: { quantity: 1, duration: 4, crewSize: 1, estimatedPrice: price }
          }));
        }
        return newSelected;
      }
    });
  };

  const handleDiscountToggle = () => {
    const newState = !discountEnabled;
    setDiscountEnabled(newState);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValiditySelect = (days: number | 'custom') => {
    setValidityDays(days);
    if (days !== 'custom') {
      const newDate = addDays(new Date(), days);
      setValidUntil(format(newDate, "yyyy-MM-dd"));
    }
  };

  const formattedValidUntil = (() => {
    if (!validUntil) return "";
    const parsedDate = parseISO(validUntil);
    return isValid(parsedDate) ? format(parsedDate, "dd-MM-yyyy") : validUntil;
  })();

  const progressLabel =
    view === 'selection' ? '0%' :
      view === 'details' ? '10%' :
        view === 'services' ? (selectedServices.length > 0 ? '30%' : '10%') :
          view === 'addons' ? '50%' : '70%';

  const stepNumber =
    ['selection', 'details', 'services', 'addons'].includes(view) ? 1 :
      ['logistics', 'customlineitems'].includes(view) ? 2 : 3;

  const handleContinue = () => {
    if (view === 'selection' && selectedClient) {
      setClientName(selectedClient.name);
      setEmailId(selectedClient.email || "");
      setPhoneNumber(selectedClient.phone || "");
      setView('details');
    } else if (view === 'details') {
      setView('services');
    } else if (view === 'services') {
      setView('addons');
    } else if (view === 'addons') {
      setView('logistics');
    } else if (view === 'logistics') {
      setView('customlineitems');
    } else if (view === 'customlineitems') {
      setView('discounts');
    } else if (view === 'discounts') {
      setView('tax');
    } else {
      // Logic for next major step (Step 4)
      router.push("/admin/quotes/preview")
      console.log("Moving to Step 4...");
    }
  };

  const handleBack = () => {
    if (view === 'details') {
      setView('selection');
    } else if (view === 'services') {
      setView('details');
    } else if (view === 'addons') {
      setView('services');
    } else if (view === 'logistics') {
      setView('addons');
    } else if (view === 'customlineitems') {
      setView('logistics');
    } else if (view === 'discounts') {
      setView('customlineitems');
      // Further steps to be added form customlineitems on wards
    } else {
      router.back();
    }
  };

  const handleAddLogisticsItem = () => {
    if (customLogisticsName && customLogisticsCost) {
      const newId = `custom_${Date.now()}`;
      const cost = parseFloat(customLogisticsCost) || 0;
      setLogisticsItems(prev => [...prev, { id: newId, label: customLogisticsName, basePrice: cost }]);
      setLogisticsConfigs(prev => ({ ...prev, [newId]: { price: cost } }));
      setCustomLogisticsName("");
      setCustomLogisticsCost("");
    }
  };

  const handleAddLineItem = () => {
    if (customItemName && customItemCost) {
      const newId = `custom_${Date.now()}`;
      const cost = parseFloat(customItemCost) || 0;
      setLineItems(prev => [...prev, { id: newId, label: customLogisticsName, basePrice: cost }]);
      setLineItemConfigs(prev => ({ ...prev, [newId]: { price: cost } }));
      setCustomItemName("");
      setCustomItemCost("");
    }
  };

  const handleDiscountTypeSelect = (type: DiscountType) => {
    setDiscountType(type);
  };

  // const handleTaxRate = (taxRate) => {
  //   setDiscountType(taxRate);
  // };

  return (
    <div className={`min-h-screen overflow-hidden ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "create": "Creating New Quote"
        }}
        actions={
          <Button onClick={() => router.push("/admin/quotes/summary")} className="bg-[#E5D5B8] text-black">
            View Quote Summary
          </Button>
        }
      />

      <div className="px-4 pb-30 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
        {/* Navigation & Progress Header */}
        <div className="flex justify-between items-center mb-7">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 transition-colors ${isDark ? "text-[#D4D4D4] hover:text-white" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-right">
            <Button onClick={() => router.push("/admin/quotes/summary")} className="block lg:hidden bg-[#E5D5B8] text-sm h-8 text-black">
              View Quote Summary
            </Button>
            <span className={`hidden lg:block text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Step {stepNumber} - {progressLabel} Completed
            </span>
          </div>
        </div>

        <div className="block lg:hidden mb-2">
          <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Step {stepNumber} - {progressLabel} Completed
          </span>
        </div>
        {/* Progress Bars */}
        <div className="flex gap-3 mb-8 lg:mb-9">
          <div className={`h-1 flex-1 rounded-full overflow-hidden relative ${isDark ? "bg-[#5B5B5B]" : "bg-[#5B5B5B]/50"}`}>
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'selection' ? '0%' : view === 'details' ? '20%' : '100%' }}
            />
          </div>
          <div className={`h-1 flex-1 rounded-full overflow-hidden relative ${isDark ? "bg-[#5B5B5B]" : "bg-[#5B5B5B]/50"}`}>
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'services' ? '20%' : view === 'addons' ? '100%' : '0%' }}
            />
          </div>
          <div className={`h-1 flex-1 rounded-full overflow-hidden relative ${isDark ? "bg-[#5B5B5B]" : "bg-[#5B5B5B]/50"}`}>
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'addons' ? '20%' : '0%' }}
            />
          </div>
        </div>

        {/* Main Card */}
        {/* <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] ${view === 'selection' ? 'overflow-visible' : 'p-10 overflow-hidden'}`}> */}
        <div className={`border rounded-[18px] mb-8 overflow-visible ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#DFDDDD]"}`}>
          {view === 'logistics' ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Logistics</h2>
                  <p className={`text-sm ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Manage travel, equipment, permits, and other logistical costs</p>
                </div>
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                <div className="space-y-4 p-4 lg:p-9">
                  {logisticsItems.map((item) => {
                    const config = logisticsConfigs[item.id];
                    return (
                      <div key={item.id}
                        className={`border rounded-[14px] p-4 lg:p-5 relative overflow-hidden ${isDark ? "bg-[#0F0F0F] border-[#4A4A4A]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                        <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center">
                          <div className="flex lg:flex-col justify-between lg:gap-1">
                            <h3 className={`text-base lg:text-lg font-medium leading-none ${isDark ? " text-white" : "text-black"}`}>{item.label}</h3>
                            <p className={`text-sm lg:text-lg font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#D4A75D]"}`}>${item.basePrice.toFixed(2)}</p>
                          </div>
                          <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                          <div className="flex items-center gap-6">
                            <div className="relative w-2/3 lg:w-36">
                              <Input
                                value={`$ ${config?.price || 0}`}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                                  setLogisticsConfigs(prev => ({ ...prev, [item.id]: { price: val } }));
                                }}
                                className={`h-9 rounded-lg text-sm pl-3 ${isDark ? "bg-[#1A1A1F] border-[#3B3B46] text-white " : "bg-white border-[#d7d7d7] text-black"}`}
                              />
                            </div>
                            <div className="flex items-center gap-6 lg:gap-4">
                              <button
                                onClick={() => {
                                  setLogisticsItems(prev => prev.filter(i => i.id !== item.id));
                                  setLogisticsConfigs(prev => {
                                    const newConfigs = { ...prev };
                                    delete newConfigs[item.id];
                                    return newConfigs;
                                  });
                                }}
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                              <div className="text-green-500">
                                <Check size={18} strokeWidth={3} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                <div className="p-4 lg:p-9">
                  <h3 className={`lg:text-xl font-medium mb-6 ${isDark ? "text-white" : "text-black"}`}>Add Custom Logistics Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-7">
                    <div className="md:col-span-8 relative">
                      <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                        <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Item Name</span>
                      </div>
                      <Input
                        placeholder="Eg : Cleaning Services"
                        value={customLogisticsName}
                        onChange={(e) => setCustomLogisticsName(e.target.value)}
                        className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                      />
                    </div>
                    <div className="md:col-span-4 relative">
                      <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                        <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Cost</span>
                      </div>
                      <Input
                        placeholder="$ 0.00"
                        value={customLogisticsCost}
                        onChange={(e) => setCustomLogisticsCost(e.target.value)}
                        className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddLogisticsItem}
                    className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add Item
                  </Button>
                </div>

                <div className={`m-4 lg:m-9 mt-0 lg:mt-0 rounded-xl p-4 lg:p-6 flex justify-between items-center border ${isDark ? "bg-[#282727] border-zinc-800/50" : "border-[#E8D1AB] bg-[#FFF7E6]"}`}>
                  <span className={`text-sm lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>Total Logistics Cost</span>
                  <span className={`text-lg lg:text-2xl font-bold tracking-tight ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                    ${Object.values(logisticsConfigs).reduce((acc, curr) => acc + curr.price, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </section>
            </div>
          ) : view === 'addons' ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Add-ons</h2>
                  <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Select additional items to enhance your service offering</p>
                </div>
                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-9">
                  {(addons || []).map((addon) => (
                    <button
                      key={addon.id}
                      onClick={() => {
                        const isSelected = selectedAddons.includes(addon.id);
                        if (isSelected) {
                          setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                          setAddonConfigs(prev => {
                            const newConfigs = { ...prev };
                            delete newConfigs[addon.id];
                            return newConfigs;
                          });
                        } else {
                          setSelectedAddons(prev => [...prev, addon.id]);
                          setAddonConfigs(prev => ({
                            ...prev,
                            [addon.id]: { quantity: 1, price: addon.price }
                          }));
                        }
                      }}
                      className={`relative flex flex-col items-start p-5 lg:p-6 rounded-xl lg:rounded-2xl border transition-all h-[78px] lg:h-[98px] text-left group ${selectedAddons.includes(addon.id)
                        ? (isDark ? 'bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' : 'bg-[#FFF7E6] border-[#E8D1AB] shadow-sm')
                        : (isDark ? 'bg-transparent border-[#303030] hover:border-zinc-700' : 'bg-[#F4F5F7] border-[#d7d7d7] hover:border-zinc-400')
                        }`}
                    >
                      <div className="flex items-start gap-4 w-full">
                        <div className={`w-6 h-6 rounded-[4px] border-[1.5px] mt-0.5 flex items-center justify-center transition-all ${selectedAddons.includes(addon.id)
                          ? (isDark ? 'bg-[#E8D1AB] border-[#E8D1AB] text-black' : 'bg-black text-[#E8D1AB] border-black')
                          : (isDark ? 'border-zinc-700 bg-transparent' : 'border-[#3d3d3d]')
                          }`}>
                          {selectedAddons.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                        <div className="space-y-2">
                          <div className={`font-medium text-base lg:text-lg leading-none ${isDark ? "text-white" : "text-black"}`}>{addon.label}</div>
                          <div className={`${isDark ? "text-[#F0DCB1]" : "text-[#D4A75D]"} text-sm lg:text-lg font-semibold tracking-tight leading-none `}>
                            ${addon.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-6 p-4 lg:p-9 pt-0 lg:pt-0">
                  <Button
                    onClick={() => setShowAddAddonForm(!showAddAddonForm)}
                    className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add More Add-ons
                  </Button>

                  <AnimatePresence>
                    {showAddAddonForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-6"
                      >
                        <div className="md:col-span-8 relative">
                          <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                            <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Add-on Name</span>
                          </div>
                          <Input
                            placeholder="Eg : 4K RAW Recording"
                            value={customAddonName}
                            onChange={(e) => setCustomAddonName(e.target.value)}
                            className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                          />
                        </div>
                        <div className="md:col-span-4 relative">
                          <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                            <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Cost</span>
                          </div>
                          <Input
                            placeholder="$ 0.00"
                            value={customAddonCost}
                            onChange={(e) => setCustomAddonCost(e.target.value)}
                            className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Selected Add-Ons Section */}
              {selectedAddons.length > 0 && (
                <>
                  <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                  <section className="p-4 lg:p-9">
                    <div className="mb-4 lg:mb-8">
                      <h2 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>Selected Add-Ons</h2>
                    </div>

                    <div className="space-y-4">
                      {selectedAddons.map(addonId => {
                        const addon = addons.find(a => a.id === addonId);
                        const config = addonConfigs[addonId];
                        if (!addon || !config) return null;

                        return (
                          <div key={addonId} className={`border rounded-[14px] p-5 relative overflow-hidden ${isDark ? "bg-[#0F0F0F] border-[#4A4A4A]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                            {/* desktop version */}
                            <div className="hidden lg:flex justify-between items-center">
                              <div className="space-y-1">
                                <h3 className={`text-base lg:text-lg font-medium leading-none ${isDark ? "text-white" : "text-black"}`}>{addon.label}</h3>
                                <p className={`text-sm lg:text-lg font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#D4A75D]"}`}>${addon.price.toFixed(2)}</p>
                              </div>

                              <div className="flex items-center gap-6">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 h-9">
                                  <button
                                    onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity - 1)}
                                    className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <div className={`w-24 flex-1 h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                    Qty
                                  </div>
                                  <button
                                    onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity + 1)}
                                    className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                </div>

                                {/* Price Override */}
                                <div className="relative w-28">
                                  <Input
                                    value={`$ ${config.price}`}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                                      handleAddonConfigUpdate(addonId, 'price', val);
                                    }}
                                    className={`h-9 rounded-lg text-sm pl-3 ${isDark ? "bg-[#1A1A1F] border-[#3B3B46] text-white " : "bg-white border-[#d7d7d7] text-black"}`}
                                  />
                                </div>

                                <div className="flex items-center gap-4 ml-2">
                                  <button
                                    onClick={() => {
                                      setSelectedAddons(prev => prev.filter(id => id !== addonId));
                                      setAddonConfigs(prev => {
                                        const newConfigs = { ...prev };
                                        delete newConfigs[addonId];
                                        return newConfigs;
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                  <div className="text-green-500">
                                    <Check size={18} strokeWidth={3} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* mobile version */}
                            <div className="flex flex-col lg:hidden gap-4">
                              <div className="flex justify-between">
                                <h3 className={`text-sm font-medium leading-none ${isDark ? "text-white" : "text-black"}`}>{addon.label}</h3>
                                <p className="text-[#E8D1AB] text-sm font-semibold">${addon.price.toFixed(2)}</p>
                              </div>
                              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                              <div className="flex gap-4 items-center">
                                {/* Price Override */}
                                <div className="relative w-3/4">
                                  <Input
                                    value={`$ ${config.price}`}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                                      handleAddonConfigUpdate(addonId, 'price', val);
                                    }}
                                    className={`h-9 rounded-lg text-sm pl-3 ${isDark ? "bg-[#1A1A1F] border-[#3B3B46] text-white " : "bg-white border-[#d7d7d7] text-black"}`}
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedAddons(prev => prev.filter(id => id !== addonId));
                                    setAddonConfigs(prev => {
                                      const newConfigs = { ...prev };
                                      delete newConfigs[addonId];
                                      return newConfigs;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <div className="text-green-500">
                                  <Check size={18} strokeWidth={3} />
                                </div>
                              </div>

                              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 h-9">
                                <button
                                  onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity - 1)}
                                  className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <div className={`w-full h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                  Qty
                                </div>
                                <button
                                  onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity + 1)}
                                  className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : view === 'services' ? (
            <div className="">
              {/* Services Section */}
              <section>
                <div className="px-5 pt-5 lg:px-8 lg:pt-8 mb-7">
                  <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Services</h2>
                  <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Select services and configure pricing</p>
                </div>
                <hr className={`my-4 lg:my-8 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                <div className="px-5 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-4 lg:space-y-8 ">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {(services || []).map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id, service.price)}
                        className={`relative flex flex-col items-start p-5 lg:p-6 rounded-xl lg:rounded-2xl border transition-all h-[78px] lg:h-[98px] text-left group ${selectedServices.includes(service.id)
                          ? (isDark ? 'bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' : 'bg-[#FFF7E6] border-[#E8D1AB] shadow-sm')
                          : (isDark ? 'bg-transparent border-[#303030] hover:border-zinc-700' : 'bg-[#F4F5F7] border-[#d7d7d7] hover:border-zinc-400')
                          }`}
                      >
                        <div className={`font-medium text-base lg:text-lg mb-2 leading-none ${isDark ? "text-white" : "text-black"}`}>{service.label}</div>
                        <div className={`${isDark ? "text-[#F0DCB1]" : "text-[#D4A75D]"} text-sm lg:text-lg font-semibold tracking-tight leading-none `}>
                          ${service.price.toFixed(2)} <span className="text-[#71717B] font-medium text-xs lowercase ml-1">per hour</span>
                        </div>
                        {selectedServices.includes(service.id) && (
                          <div className="absolute top-6 right-6 bg-[#0DC752] text-[#09090B] text-xs font-medium px-4 py-1 rounded-[6px] leading-none">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 lg:mt-7 space-y-6 lg:space-y-8">
                    <Button
                      onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                      className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Add Services
                    </Button>

                    <AnimatePresence>
                      {showAddServiceForm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 md:grid-cols-12 gap-6"
                        >
                          <div className="md:col-span-8 relative">
                            <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                              <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Service Name</span>
                            </div>
                            <Input
                              placeholder="Eg : Post Production Editing"
                              value={customServiceName}
                              onChange={(e) => setCustomServiceName(e.target.value)}
                              className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                            />
                          </div>
                          <div className="md:col-span-4 relative">
                            <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                              <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Cost</span>
                            </div>
                            <Input
                              placeholder="$ 0.00"
                              value={customServiceCost}
                              onChange={(e) => setCustomServiceCost(e.target.value)}
                              className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Conditional Sections based on selection */}
              {selectedServices.length > 0 && (
                <>
                  <div className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Shoot Type Section */}
                    {(selectedServices.includes('videography') || selectedServices.includes('photography')) && (
                      <section className="">
                        <hr className={`mb-4 lg:mb-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                        <div className="px-4 pt-4 pb-5 lg:px-8 lg:pb-10">
                          <button
                            onClick={() => setIsShootTypeExpanded(!isShootTypeExpanded)}
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>Video Shoot Type</h2>
                            <div className="text-zinc-600 transition-transform duration-300">
                              {isShootTypeExpanded ? <ChevronDown size={22} className="rotate-180" /> : <ChevronDown size={22} />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isShootTypeExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {(shootTypes || []).map((type) => (
                                    <button
                                      key={type.id}
                                      onClick={() => setSelectedShootType(type.id)}
                                      className={`h-[52px] rounded-[14px] font-normal transition-all border text-sm tracking-tight ${selectedShootType === type.id
                                        ? (isDark ? 'bg-[#262118] border-[#9F7B43] text-[#E1C48B] shadow-inner' : 'bg-[#FFF7E6] border-[#E8D1AB] text-[#000]')
                                        : (isDark ? 'bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700' : 'bg-transparent border-[#d7d7d7] text-[#00000099] hover:border-zinc-400')
                                        }`}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() => setShowAddShootTypeForm(!showAddShootTypeForm)}
                                    className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                    Add Video Shoot Type
                                  </Button>

                                  <AnimatePresence>
                                    {showAddShootTypeForm && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative"
                                      >
                                        <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                                          <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Video Shoot Type Name</span>
                                        </div>
                                        <Input
                                          placeholder="Eg : Real Estate.."
                                          value={customShootType}
                                          onChange={(e) => setCustomShootType(e.target.value)}
                                          className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </section>
                    )}

                    {/* AI Editing Types Section - Only shown if AI Editing is selected */}
                    {selectedServices.includes("ai_editing") && (
                      <div className="">
                        <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                        <section className="px-4 pt-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                          <button
                            onClick={() => setIsEditingTypeExpanded(!isEditingTypeExpanded)}
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>AI Editing Types</h2>
                            <div className="text-zinc-600 transition-transform duration-300">
                              {isEditingTypeExpanded ? <ChevronDown size={22} className="rotate-180" /> : <ChevronDown size={22} />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isEditingTypeExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {(editingTypes || []).map((type) => (
                                    <button
                                      key={type.id}
                                      onClick={() => setSelectedEditingType(type.id)}
                                      className={`h-[52px] rounded-[14px] font-normal transition-all border text-sm tracking-tight ${selectedShootType === type.id
                                        ? (isDark ? 'bg-[#262118] border-[#9F7B43] text-[#E1C48B] shadow-inner' : 'bg-[#FFF7E6] border-[#E8D1AB] text-[#000]')
                                        : (isDark ? 'bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700' : 'bg-transparent border-[#d7d7d7] text-[#00000099] hover:border-zinc-400')
                                        }`}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() => setShowAddEditingTypeForm(!showAddEditingTypeForm)}
                                    className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                    Add Editing Types
                                  </Button>

                                  <AnimatePresence>
                                    {showAddEditingTypeForm && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative"
                                      >
                                        <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                                          <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Editing Type Name</span>
                                        </div>
                                        <Input
                                          placeholder="Eg : Reel Editing..."
                                          value={customEditingType}
                                          onChange={(e) => setCustomEditingType(e.target.value)}
                                          className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>
                      </div>
                    )}

                    {/* Configure Selected Services */}
                    <>
                      <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                      <section className="px-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                        <div className="mb-4 lg:mb-8">
                          <h2 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>Configure Selected Services</h2>
                        </div>

                        <div className="space-y-4 lg:space-y-6">
                          {(selectedServices || []).map(serviceId => {
                            const service = services.find(s => s.id === serviceId);
                            const config = serviceConfigs[serviceId];
                            if (!service || !config) return null;

                            const shootTypeLabel = shootTypes.find(t => t.id === selectedShootType)?.label;
                            const editingTypeLabel = editingTypes.find(t => t.id === selectedEditingType)?.label;

                            return (
                              <div key={serviceId} className={`border rounded-[18px] p-6 lg:px-7 lg:py-6 relative overflow-hidden ${isDark ? "bg-[#0F0F0F] border-[#4A4A4A]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                                <div className="flex justify-between items-start mb-4 lg:mb-8">
                                  <div className="space-y-2">
                                    <h3 className={`text-base font-medium flex items-center gap-1.5 leading-none ${isDark ? "text-white" : "text-black"}`}>
                                      {serviceId === 'ai_editing' ? (
                                        <>AI Editing Type - <span className={isDark ? "text-[#8E826A]" : "text-black"}>{editingTypeLabel}</span></>
                                      ) : (
                                        <>{service.label} - <span className={isDark ? "text-[#8E826A]" : "text-black"}>({shootTypeLabel})</span></>
                                      )}
                                    </h3>
                                    <p className={`text-xs lg:text-sm ${isDark ? "text-[#8A8A8A]" : "text-[#727272]"}`}>Base: ${service.price.toFixed(2)} per hour</p>
                                  </div>
                                  <div className="flex items-center gap-5">
                                    <div className="hidden lg:flex flex-col items-end gap-1">
                                      <span className={`${isDark ? "text-[#7B7B85]" : "text-[#71717B]"} text-xs lg:text-sm`}>Total</span>
                                      <span className={`text-xl font-semibold ${isDark ? "text-[#F0DCB1]" : "text-[#D4A75D]"} tracking-tight leading-none`}>${(config.quantity * config.duration * config.crewSize * config.estimatedPrice).toLocaleString()}</span>
                                    </div>
                                    <button
                                      onClick={() => setSelectedServices(prev => prev.filter(id => id !== serviceId))}
                                      className={`w-10 h-10 rounded-full border border-transparent flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all ${isDark ? "bg-[#2A2A2A] text-zinc-500 " : "bg-[#FFFFFF] text-[#FF6467]"}`}
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                                <hr className={`my-4 lg:my-8 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                                <div className="flex lg:hidden justify-between  items-center gap-1">
                                  <span className={`${isDark ? "text-[#7B7B85]" : "text-[#71717B]"} text-xs lg:text-sm`}>Total</span>
                                  <span className={`text-xl font-semibold ${isDark ? "text-[#F0DCB1]" : "text-[#D4A75D]"} tracking-tight leading-none`}>${(config.quantity * config.duration * config.crewSize * config.estimatedPrice).toLocaleString()}</span>
                                </div>
                                <hr className={`lg:hidden my-4 lg:my-8 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-6">
                                  {/* Quantity */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">Quantity</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'quantity', config.quantity - 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className={`flex-1 h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                        {config.quantity}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'quantity', config.quantity + 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Duration */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">Duration (hours)</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'duration', config.duration - 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className={`flex-1 h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                        {config.duration}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'duration', config.duration + 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Crew Size */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">Crew Size</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'crewSize', config.crewSize - 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className={`flex-1 h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                        {config.crewSize}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'crewSize', config.crewSize + 1)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Estimated Pricing */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">Estimated Pricing</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'estimatedPrice', config.estimatedPrice - 50)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className={`flex-1 h-full flex items-center justify-center border rounded-lg font-normal text-sm ${isDark ? "border-[#3B3B46] bg-[#1A1A1F] text-white" : "bg-white text-black border-[#D7D7D7]"}`}>
                                        ${config.estimatedPrice}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'estimatedPrice', config.estimatedPrice + 50)}
                                        className={`w-10 h-full flex items-center justify-center rounded-lg hover:opacity-90 transition-all active:scale-95 ${isDark ? "bg-[#F0DCB1]" : "bg-[#E8D1AB]"}`}
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </>
                  </div>
                </>
              )}
            </div>
          ) : view === 'selection' ? (
            /* Client Selector View */
            <div>
              <div className="px-7 pt-7 lg:px-8 lg:pt-8">
                <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Client Information</h2>
                <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Select an existing client or create a new one</p>
              </div>
              <hr className={`my-4 lg:my-8 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

              <div className="px-7 pb-9 lg:px-8 lg:pb-10">
                <div className="relative max-w-full">
                  <div className={`absolute -top-3 left-5 z-10 px-3 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`text-sm font-normal tracking-[0.01em] ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Select Client</span>
                  </div>

                  <div className={`relative border rounded-[14px] bg-transparent ${isDark ? "border-[#4A4A4A]" : "border-[#00000080]"}`}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full group bg-transparent rounded-[14px] px-6 py-6 flex justify-between items-center transition-all ${isDropdownOpen ? 'ring-1 ring-[#8E826A]/30' : ''}`}
                    >
                      <span className={`text-base ${selectedClient ? (isDark ? "text-white" : "text-black") : "text-[#6B6B6B]"}`}>
                        {selectedClient ? selectedClient.name : "Choose a Client..."}
                      </span>
                      <ChevronDown size={20} className={` ${isDark ? "text-[#E5E5E5]" : "text-[#000000]"} transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.99, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.99, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className={`absolute top-[calc(100%+8px)] left-0 right-0 border rounded-2xl overflow-hidden z-50 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ${isDark ? "bg-[#0F0F0F] border-zinc-800" : "bg-white border-[#00000033]"}`}
                        >
                          <div className="max-h-80 overflow-y-auto custom-scrollbar p-3">
                            {(filteredClients || []).map((client) => (
                              <div
                                key={client.id}
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsDropdownOpen(false);
                                }}
                                className={`group flex items-center gap-4 px-5 py-3 lg:py-4 rounded-xl cursor-pointer transition-all mb-1 ${selectedClient?.id === client.id
                                  ? (isDark ? 'bg-[#FFFCE8] text-[#171717]' : 'bg-[#E8D1AB] text-[#000000]')
                                  : (isDark ? 'hover:bg-[#FFFCE8] hover:text-[#171717] text-[#FFFFFF85]' : 'hover:bg-[#E8D1AB] hover:text-[#000000] text-[#00000085]')
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedClient?.id === client.id
                                  ? (isDark ? 'border-[#E8D1AB] bg-[#E8D1AB]' : 'border-[#000000] bg-[#000000]')
                                  : (isDark ? 'border-[#FFFFFF85] group-hover:border-[#171717]' : 'border-[#00000085] group-hover:border-[#171717]')
                                  }`}>
                                  {selectedClient?.id === client.id && (
                                    <div className={`w-2.5 h-2.5 rounded-sm ${isDark ? "bg-[#101010] " : "bg-[#E8D1AB]"}`} />
                                  )}
                                </div>
                                <span className="lg:text-lg">{client.name}</span>
                              </div>
                            ))}

                            <button className={`w-full flex items-center gap-4 px-5 py-4 transition-all rounded-xl ${isDark ? "text-[#E8D1AB] hover:bg-[#E8D1AB]/5 border-zinc-800/50" : "text-[#000000] hover:bg-[#E8D1AB] "}`}>
                              <div className="w-6 h-6 rounded border border-[#E8D1AB]/40 flex items-center justify-center bg-[#E8D1AB]">
                                <Plus size={16} className="text-[#171717]" />
                              </div>
                              <span className="font-semibold text-lg">Create New Client</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'customlineitems' ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Custom Line Items</h2>
                <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Add any custom charges or fees not covered by services or add-ons</p>
              </div>
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
              <div className=" p-4 lg:p-9">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-7">
                  <div className="md:col-span-8 relative">
                    <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                      <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Item Name</span>
                    </div>
                    <Input
                      placeholder="Eg : Cleaning Services"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                    />
                  </div>
                  <div className="md:col-span-4 relative">
                    <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                      <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Cost</span>
                    </div>
                    <Input
                      placeholder="$ 0.00"
                      value={customItemCost}
                      onChange={(e) => setCustomItemCost(e.target.value)}
                      className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddLineItem}
                  className="bg-[#E8D1AB] text-black hover:bg-[#e7d09e] h-11 px-5 rounded-lg flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Item
                </Button>
              </div>

              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
              <div className={`border rounded-[14px] p-5 relative overflow-hiddenm-4 m-5 lg:m-9  ${isDark ? "bg-[#0F0F0F] border-[#4A4A4A]" : "border-[#D7D7D7] bg-[#F4F5F7]"}`}>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <div className="flex lg:flex-col justify-between lg:gap-1">
                    <h3 className={`text-base font-medium leading-none ${isDark ? "text-white" : "text-black"}`}>Rush Delivery</h3>
                    <p className={`text-sm lg:text-lg font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#D4A75D]"}`}>$1,500.00</p>
                  </div>

                  <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

                  <div className="flex items-center gap-6">
                    <div className="relative w-2/3 lg:w-36">
                      <Input
                        value={`$ ${0}`}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                          // setLineItemConfigs(prev => ({ ...prev, [item.id]: { price: val } }));
                        }}
                        className={`h-9 rounded-lg text-sm pl-3 ${isDark ? "bg-[#1A1A1F] border-[#3B3B46] text-white " : "bg-white border-[#d7d7d7] text-black"}`}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          // setLineItems(prev => prev.filter(i => i.id !== item.id));
                          // setLineItemConfigs(prev => {
                          //   const newConfigs = { ...prev };
                          //   delete newConfigs[item.id];
                          //   return newConfigs;
                          // });
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="text-green-500">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : view === 'discounts' ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Discounts</h2>
                <p className={`text-sm ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Add any custom charges or fees not covered by services or add-ons</p>
              </div>
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

              <div className="p-4 lg:p-9">
                <div
                  className={`w-full p-4 lg:p-5 rounded-2xl border transition-colors duration-300 flex items-center justify-between ${isDark ? "bg-[#171717] border-[#222222] " : "bg-[#F4F5F7] border-[#D7D7D7]"}`}
                  style={{ fontFamily: 'var(--font-instrument-sans), sans-serif' }}
                >
                  <div className="lg:space-y-1">
                    <h3 className={`text-sm lg:text-lg font-medium tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      Apply Discount
                    </h3>
                    <p className={`text-sm ${isDark ? "text-[#888888]" : "text-[#7D7D7D]"}`}>
                      Add a discount to this quotation
                    </p>
                  </div>

                  {/* Custom Toggle Switch */}
                  <button
                    onClick={handleDiscountToggle}
                    className={`relative w-12 h-[28px] rounded-lg p-1 transition-colors duration-300 flex items-center ${discountEnabled
                      ? "bg-[#E8D1AB]" : "bg-[#333333]"}`}
                  >
                    <motion.div
                      animate={{ x: discountEnabled ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`w-5 h-5 rounded-md shadow-sm transition-colors duration-300 ${discountEnabled ? "bg-white" : "bg-white"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {discountEnabled ? (
                <>
                  <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
                  <div className="p-4 lg:p-9">
                    <h3 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                      Discount Type
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 mt-3 lg:mt-6 mb-6 lg:mb-8">
                      {/* Percentage Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("percentage")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "percentage"
                          ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : 'bg-[#FFF7E6] border-[#E8D1AB]')
                          : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-[#F4F5F7] border-[#D7D7D7] hover:border-[#333333]/50")
                          }`}
                      >
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "percentage"
                          ? (isDark ? "bg-[#E8D1AB] text-black" : "bg-white text-[#09090B]")
                          : (isDark ? "bg-[#3F3F47] text-[#888888]" : "bg-white text-[#9F9FA9]")
                          }`}>
                          <Percent size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className={`font-medium text-base ${isDark ? "text-white " : "text-black"}`}>
                            Percentage
                          </h4>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-[#888888]" : "text-[#7D7D7D]"}`}>
                            % off subtotal
                          </p>
                        </div>
                      </button>

                      {/* Fixed Amount Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("fixed")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "fixed"
                          ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : 'bg-[#FFF7E6] border-[#E8D1AB]')
                          : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-[#F4F5F7] border-[#D7D7D7] hover:border-[#333333]/50")
                          }`}
                      >
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "fixed"
                          ? (isDark ? "bg-[#E8D1AB] text-black" : "bg-white text-[#09090B]")
                          : (isDark ? "bg-[#3F3F47] text-[#888888]" : "bg-white text-[#9F9FA9]")
                          }`}>
                          <DollarSign size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className={`font-medium text-base ${isDark ? "text-white " : "text-black"}`}>
                            Fixed Amount
                          </h4>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-[#888888]" : "text-[#7D7D7D]"}`}>
                            $ off subtotal
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="md:col-span-8 relative">
                      <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                        <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Discount Value</span>
                      </div>
                      <Input
                        placeholder="0.00"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value))}
                        className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                      />
                    </div>

                    <div className="my-6 flex flex-col gap-2">
                      <div className={`flex justify-between ${isDark ? "text-[#9F9FA9]" : "text-[#000000]"}`}>
                        <p>Subtotal</p>
                        <p>$ 2211.00</p>
                      </div>
                      <div className={`flex justify-between font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                        <p>Discount Applied </p>
                        <p>- $ 211.00</p>
                      </div>
                    </div>

                    <div className={`rounded-xl p-4 lg:p-6 flex justify-between items-center ${isDark ? "bg-[#282727] " : "bg-[#FFF7E6] border border-[#E8D1AB]"}`}>
                      <span className={`text-sm lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>After Discount</span>
                      <span className={`text-lg lg:text-2xl font-semibold tracking-tight ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                        {/* This needs to be updated  */}
                        $ 2000.00
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-5 items-center justify-center my-4 lg:my-12">
                  <Image
                    src={isDark ? "/images/misc/DiscountTag.svg" : "/images/misc/DiscountTagWhite.svg"}
                    width={132}
                    height={132}
                    alt="Discount Tag"
                  />
                  <p className={isDark ? "text-white" : "text-black"}>
                    No discount applied to this quote
                  </p>
                </div>
              )}
            </div>
          ) : view === 'tax' ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Tax</h2>
                <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Configure tax rate and type for this quotation</p>
              </div>
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

              <div className="p-4 lg:p-9">
                <h3 className={`text-base lg:text-lg font-medium tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                  Common Tax Rates
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3 lg:mt-6 ">
                  <button
                    onClick={() => setSelectedTax(0)}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 0
                      ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : "bg-[#FFF7E6] border-[#E8D1AB]")
                      : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-white border-[#d7d7d7]")
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 0 ? (isDark ? "text-[#E8D1AB]" : "text-black") : (isDark ? "text-white" : "text-[#00000099]")} font-semibold text-sm lg:text-base `}>
                        0 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(5)}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 5
                      ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : "bg-[#FFF7E6] border-[#E8D1AB]")
                      : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-white border-[#d7d7d7]")
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 0 ? (isDark ? "text-[#E8D1AB]" : "text-black") : (isDark ? "text-white" : "text-[#00000099]")} font-semibold text-sm lg:text-base `}>
                        5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(8.5)}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 8.5
                      ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : "bg-[#FFF7E6] border-[#E8D1AB]")
                      : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-white border-[#d7d7d7]")
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 0 ? (isDark ? "text-[#E8D1AB]" : "text-black") : (isDark ? "text-white" : "text-[#00000099]")} font-semibold text-sm lg:text-base `}>
                        8.5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(10)}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 10
                      ? (isDark ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]" : "bg-[#FFF7E6] border-[#E8D1AB]")
                      : (isDark ? "bg-[#171717] border-[#222222] hover:border-[#333333]" : "bg-white border-[#d7d7d7]")
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 0 ? (isDark ? "text-[#E8D1AB]" : "text-black") : (isDark ? "text-white" : "text-[#00000099]")} font-semibold text-sm lg:text-base `}>
                        10 %
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
              <div className="p-4 lg:p-9">
                <h3 className={`text-base lg:text-lg font-medium tracking-tight ${isDark ? "text-white" : "text-black"} mb-3 lg:mb-6`}>
                  Tax Calculation
                </h3>

                <div className={`rounded-xl p-4 lg:p-6 ${isDark ? "bg-[#282727]" : "bg-[#F4F5F7] border border-[#D7D7D7]"}`}>
                  <div className="flex justify-between items-center ">
                    <span className={`text-sm lg:text-base ${isDark ? "text-[#9F9FA9]" : "text-black"}`}>Subtotal</span>
                    <span className={`text-sm lg:text-base ${isDark ? "text-[#9F9FA9]" : "text-black"} tracking-tight `}>
                      $5,550.00
                    </span>
                  </div>
                  <div className={`my-4 lg:my-6 border-t ${isDark ? "border-[#FFFFFF33]" : "border-[#00000033]"}`} />
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm lg:text-base font-medium ${isDark ? "text-text" : "text-black"}`}>Amount Before Tax</span>
                    <span className={`text-sm lg:text-base font-medium tracking-light ${isDark ? "text-text" : "text-black"}`}>
                      $5,550.00
                    </span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span className={`text-sm lg:text-base ${isDark ? "text-[#9F9FA9]" : "text-[#565656]"}`}>Sales Tax (8.5%)</span>
                    <span className={`text-sm lg:text-base ${isDark ? "text-[#9F9FA9]" : "text-[#565656]"} tracking-tight `}>
                      $471.75
                    </span>
                  </div>
                  <div className={`my-4 lg:my-6 border-t ${isDark ? "border-[#FFFFFF33]" : "border-[#00000033]"}`} />

                  <div className="flex justify-between items-center ">
                    <span className={`text-sm lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>Final Total</span>
                    <span className={`text-sm lg:text-2xl font-semibold tracking-tight ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                      $ 2000.00
                    </span>
                  </div>
                </div>
              </div>

              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-3 w-full p-4 pt-6 lg:p-9">
                <div className="w-full relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Tax Rate (%)</span>
                  </div>
                  <Input
                    placeholder="0.00"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseInt(e.target.value))}
                    className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                  />
                </div>
                <div className="w-full relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm"`}>Tax Type</span>
                  </div>
                  <Input
                    placeholder="Sales Tax"
                    value={taxtType}
                    onChange={(e) => setTaxType(e.target.value)}
                    className={`h-15 lg:h-[84px] bg-transparent rounded-[14px] pl-7 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-[#4A4A4A] focus:border-[#A78857] placeholder:text-[#666666]" : "border-[#00000080] text-black placeholder:text-[#0000004D]"}`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Client Details View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="px-5 pt-5 lg:px-8 lg:pt-8">
                <h2 className={`text-base lg:text-xl font-medium mb-1 ${isDark ? "text-white" : "text-black"}`}>Client Information</h2>
                <p className={`text-sm  ${isDark ? "text-[#A1A1AA]" : "text-[#000000B2]"}`}>Select an existing client or create a new one</p>
              </div>
              <hr className={`my-4 lg:my-8 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000033]"}`} />

              <div className="px-5 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-6 lg:space-y-8 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                      <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm font-medium"`}>Client Name*</span>
                    </div>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={`h-16 bg-transparent rounded-xl transition-all pl-6 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-zinc-800 " : "border-[#00000080] text-black"}`}
                    />
                  </div>
                  <div className="relative">
                    <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                      <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm font-medium"`}>Email ID*</span>
                    </div>
                    <Input
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      className={`h-16 bg-transparent rounded-xl transition-all pl-6 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-zinc-800 " : "border-[#00000080] text-black"}`}
                    />
                  </div>
                  <div className="relative">
                    <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                      <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm font-medium"`}>Phone Number*</span>
                    </div>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`h-16 bg-transparent rounded-xl transition-all pl-6 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-zinc-800 " : "border-[#00000080] text-black"}`}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} text-sm font-medium`}>Address*</span>
                  </div>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="567 Mission Street, San Francisco, CA 94105"
                    className={`h-16 bg-transparent rounded-xl transition-all pl-6 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-zinc-800 " : "border-[#00000080] text-black"}`}
                  />
                </div>

                <div className="relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`${isDark ? "text-[#FFFFFF99]" : "text-[#00000099]"} "text-sm font-medium"`}>Project Description*</span>
                  </div>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the project scope and requirements....."
                    className={`min-h-[120px] bg-transparent rounded-xl transition-all p-6 pt-8 text-sm lg:text-base ${isDark ? "text-white focus:border-[#E8D1AB]/50 border-zinc-800 " : "border-[#00000080] text-black"}`}
                  />
                </div>
                {/* <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Phone Number*</span>
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div> */}
                <div>
                  <h3 className="lg:text-xl font-semibold mb-6">Quote Validity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[3, 5, 7].map((days: number) => (
                      <button
                        key={days}
                        onClick={() => handleValiditySelect(days)}
                        className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${validityDays === days
                          ? (isDark ? 'bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]' : 'bg-[#FFF7E6] border-[#E8D1AB] text-[#000]')
                          : (isDark ? 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-white border-[#00000080] text-[#00000099]')
                          }`}
                      >
                        {days} Days
                      </button>
                    ))}
                    <button
                      onClick={() => handleValiditySelect('custom')}
                      className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${validityDays === 'custom'
                        ? (isDark ? 'bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]' : 'bg-[#FFF7E6] border-[#E8D1AB] text-[#000]')
                        : (isDark ? 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-white border-[#00000080] text-[#00000099]')
                        }`}
                    >
                      Add Custom Date
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-8">
                    <Check size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#C99642]"} />
                    <span className={`font-medium ${isDark ? "text-[#E8D1AB]/80" : "text-[#C99642]"}`}>This quote is valid for {validityDays === 'custom' ? 'X' : validityDays} days from today.</span>
                  </div>

                  <div className="relative pt-4">
                    <DatePicker
                      label="Quote Valid Until*"
                      value={parseISO(validUntil)}
                      onChange={(date) => {
                        if (date && isValid(date)) {
                          setValidUntil(format(date, "yyyy-MM-dd"));
                        }
                      }}
                      isDark={isDark}
                      disabled={validityDays !== 'custom'}
                      format="dd-MM-yyyy"
                      colors={{
                        inputBackground: "transparent",
                        inputText: isDark ? "#F5F5F5" : "#171717",
                        inputDisabled: isDark ? "rgba(214, 195, 157, 0.9)" : "#171717",
                        iconColor: isDark ? "#FFFFFF" : "#171717",
                        labelText: isDark ? "rgba(113, 113, 122, 1)" : "rgba(113, 113, 122, 1)",
                        inputBorder: isDark ? "rgba(39, 39, 42, 1)" : "#00000080",
                        inputBorderFocus: isDark ? "rgba(229, 213, 184, 0.5)" : "#E8D1AB",
                      }}
                      sx={{
                        height: "64px", // h-16
                        borderRadius: "12px", // rounded-xl
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          paddingLeft: "10px",
                          backgroundColor: isDark ? "transparent" : "#FFFFFF",
                          "& fieldset": {
                            borderWidth: '1px',
                            borderColor: isDark ? "rgba(39, 39, 42, 1)" : "#00000080",
                          },
                          "&:hover fieldset": {
                            borderColor: isDark ? "rgba(229, 213, 184, 0.5)" : "#E8D1AB",
                          }
                        },
                        "& .MuiInputBase-input": {
                          fontSize: "16px",
                          fontWeight: "500", // font-medium
                          color: validityDays === 'custom'
                            ? (isDark ? "white" : "#171717")
                            : "rgba(113, 113, 122, 1)",
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: isDark ? "rgba(214, 195, 157, 0.9)" : "rgba(161, 161, 170, 0.8)",
                          color: isDark ? "rgba(214, 195, 157, 0.9)" : "rgba(161, 161, 170, 0.8)",
                          opacity: 1,
                        },
                        "& .Mui-disabled .MuiSvgIcon-root": {
                          color: isDark ? "#FFFFFF" : "rgba(161, 161, 170, 0.6)",
                          opacity: 1,
                        },
                      }}
                      labelSx={{
                        position: "absolute",
                        top: "-10px",
                        left: "16px",
                        zIndex: 10,
                        backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
                        padding: "0 8px",
                        fontSize: "12px", // text-xs
                        fontWeight: "500", // font-medium
                        color: "rgba(113, 113, 122, 1)", // text-zinc-400
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            // </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="hidden lg:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pb-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className={`border h-[62px] min-w-[166px] rounded-xl text-xl font-medium bg-transparent transition-all ${isDark ? "border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818]" : "bg-white border-[#e5e5e5] hover:bg-[#FFFFFF80] text-black"}`}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className={`h-[62px] min-w-[166px] rounded-xl text-xl font-medium transition-all shadow-md hover:opacity-90
                ${(() => {
                  const isEnabled = (
                    view === 'selection' ? selectedClient :
                      view === 'details' ? clientName :
                        view === 'services' ? selectedServices.length > 0 :
                          true
                  );
                  if (isEnabled) {
                    return 'bg-[#E8D1AB] text-[#101010] cursor-pointer';
                  } else {
                    return isDark
                      ? 'bg-[#2A2B2D] text-zinc-600 cursor-not-allowed'
                      : 'bg-[#E8D1AB]/60 text-black/60 border border-[#E8D1AB]/60 cursor-not-allowed';
                  }
                })()}  `}
              disabled={!(
                view === 'selection' ? selectedClient :
                  view === 'details' ? clientName :
                    view === 'services' ? selectedServices.length > 0 :
                      true
              )}
              onClick={handleContinue}
            >
              {view === "tax" ? "Preview Quote" : "Continue"}
            </Button>
          </div>

          <Button className={`h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-medium transition-all group shadow-lg self-start sm:self-auto ${isDark ? "bg-white text-[#1B1B1B] hover:bg-zinc-100" : "bg-black text-white hover:bg-black/80 "}`}>
            <div className="flex items-center justify-center">
              <Save size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            Save as Draft
          </Button>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] items-center ${isDark ? "bg-[#0f0f0f]" : "bg-[#F3F4F6]"}`}>
        <Button className={`underline h-14 min-w-[166px] rounded-xl text-sm font-medium bg-transparent transition-all ${isDark ? "text-white hover:text-[#181818]" : "text-black"}`}>
          <div className="flex items-center justify-center">
            <Save size={24} className="transition-transform" />
          </div>
          Save as Draft
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`border h-14 min-w-[166px] rounded-xl text-sm font-semibold bg-transparent transition-all ${isDark ? "border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818]" : "bg-white border-[#e5e5e5] hover:bg-[#FFFFFF80] text-black"}`}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            className={`h-14 min-w-[166px] rounded-xl text-sm font-semibold transition-all shadow-md hover:opacity-90
              ${(() => {
                const isEnabled = (
                  view === 'selection' ? selectedClient :
                    view === 'details' ? clientName :
                      view === 'services' ? selectedServices.length > 0 :
                        true
                );
                if (isEnabled) {
                  return 'bg-[#E8D1AB] text-[#101010] cursor-pointer';
                } else {
                  return isDark
                    ? 'bg-[#2A2B2D] text-zinc-600 cursor-not-allowed'
                    : 'bg-[#E8D1AB]/60 text-black/60 border border-[#E8D1AB]/60 cursor-not-allowed';
                }
              })()}  `}
            disabled={!(
              view === 'selection' ? selectedClient :
                view === 'details' ? clientName :
                  view === 'services' ? selectedServices.length > 0 :
                    true
            )}
            onClick={handleContinue}
          >
            {view === "tax" ? "Preview Quote" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
