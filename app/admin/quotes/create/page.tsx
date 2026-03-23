"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
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

      <div className="px-4 pb-10 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
        {/* Navigation & Progress Header */}
        <div className="flex justify-between items-center mb-7">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[15px] text-[#D4D4D4] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-right">
            <span className="text-[15px] font-semibold text-white">
              Step {stepNumber} - {progressLabel} Completed
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-3 mb-8 lg:mb-9">
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'selection' ? '0%' : view === 'details' ? '20%' : '100%' }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'services' ? '20%' : view === 'addons' ? '100%' : '0%' }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: view === 'addons' ? '20%' : '0%' }}
            />
          </div>
        </div>

        {/* Main Card */}
        {/* <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] ${view === 'selection' ? 'overflow-visible' : 'p-10 overflow-hidden'}`}> */}
        <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] overflow-visible`}>
          {view === 'logistics' ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className="lg:text-xl font-medium leading-none mb-2 text-white">Logistics</h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">Manage travel, equipment, permits, and other logistical costs</p>
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="space-y-4 p-4 lg:p-9">
                  {logisticsItems.map((item) => {
                    const config = logisticsConfigs[item.id];
                    return (
                      <div key={item.id} className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[14px] p-5 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h3 className="text-[15px] font-medium text-white leading-none">{item.label}</h3>
                            <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">${item.basePrice.toFixed(2)}</p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="relative w-36">
                              <Input
                                value={`$ ${config?.price || 0}`}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                                  setLogisticsConfigs(prev => ({ ...prev, [item.id]: { price: val } }));
                                }}
                                className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
                              />
                            </div>
                            <div className="flex items-center gap-4">
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
                <hr className="border-t border-[#3D3D3D]" />

                <div className="p-4 lg:p-9">
                  <h3 className="lg:text-xl font-medium text-white mb-6">Add Custom Logistics Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-7">
                    <div className="md:col-span-8 relative">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-[12px] text-[#8A8A8A] font-normal">Item Name</span>
                      </div>
                      <Input
                        placeholder="Eg : Cleaning Services"
                        value={customLogisticsName}
                        onChange={(e) => setCustomLogisticsName(e.target.value)}
                        className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                      />
                    </div>
                    <div className="md:col-span-4 relative">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-[12px] text-[#8A8A8A] font-normal">Cost</span>
                      </div>
                      <Input
                        placeholder="$ 0.00"
                        value={customLogisticsCost}
                        onChange={(e) => setCustomLogisticsCost(e.target.value)}
                        className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddLogisticsItem}
                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[40px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add Item
                  </Button>
                </div>

                <div className="m-4 lg:m-9 mt-0 lg:mt-0 bg-[#282727] rounded-[12px] p-6 flex justify-between items-center border border-zinc-800/50">
                  <span className="lg:text-xl font-medium text-[#FFF]">Total Logistics Cost</span>
                  <span className="text-lg lg:text-2xl font-bold text-[#E8D1AB] tracking-tight">
                    ${Object.values(logisticsConfigs).reduce((acc, curr) => acc + curr.price, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </section>
            </div>
          ) : view === 'addons' ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className="text-xl font-medium leading-none mb-2 text-white">Add-ons</h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">Select additional items to enhance your service offering</p>
                </div>
                {/* <DottedDivider className="mb-9 opacity-10" /> */}
                <hr className="border-t border-[#3D3D3D]" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 lg:p-9">
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
                      className={`relative flex flex-col items-start p-6 rounded-[16px] border transition-all h-[98px] text-left group ${selectedAddons.includes(addon.id)
                        ? 'bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                        : 'bg-transparent border-[#303030] hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-start gap-4 w-full">
                        <div className={`w-6 h-6 rounded-[4px] border-[1.5px] mt-0.5 flex items-center justify-center transition-all ${selectedAddons.includes(addon.id)
                          ? 'bg-[#E8D1AB] border-[#E8D1AB] text-black'
                          : 'border-zinc-700 bg-transparent'
                          }`}>
                          {selectedAddons.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-[15px] text-white leading-none">{addon.label}</div>
                          <div className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                            ${addon.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-6 p-4 lg:p-9 pt-0">
                  <Button
                    onClick={() => setShowAddAddonForm(!showAddAddonForm)}
                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[40px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
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
                          <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                            <span className="text-[12px] text-[#8A8A8A] font-normal">Add-on Name</span>
                          </div>
                          <Input
                            placeholder="Eg : 4K RAW Recording"
                            value={customAddonName}
                            onChange={(e) => setCustomAddonName(e.target.value)}
                            className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                          />
                        </div>
                        <div className="md:col-span-4 relative">
                          <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                            <span className="text-[12px] text-[#8A8A8A] font-normal">Cost</span>
                          </div>
                          <Input
                            placeholder="$ 0.00"
                            value={customAddonCost}
                            onChange={(e) => setCustomAddonCost(e.target.value)}
                            className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
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
                  <hr className="border-t border-[#3D3D3D]" />
                  <section className="p-4 lg:p-9">
                    <div className="mb-8">
                      <h2 className="text-xl font-medium text-white">Selected Add-Ons</h2>
                    </div>

                    <div className="space-y-4">
                      {selectedAddons.map(addonId => {
                        const addon = addons.find(a => a.id === addonId);
                        const config = addonConfigs[addonId];
                        if (!addon || !config) return null;

                        return (
                          <div key={addonId} className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[14px] p-5 relative overflow-hidden">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <h3 className="text-[15px] font-medium text-white leading-none">{addon.label}</h3>
                                <p className="text-[#8A8A8A] text-[12px] font-normal">${addon.price.toFixed(2)}</p>
                              </div>

                              <div className="flex items-center gap-6">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 h-9">
                                  <button
                                    onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity - 1)}
                                    className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <div className="w-16 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-zinc-400 font-normal text-sm">
                                    Qty
                                  </div>
                                  <button
                                    onClick={() => handleAddonConfigUpdate(addonId, 'quantity', config.quantity + 1)}
                                    className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
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
                                    className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
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
                <div className="px-7 pt-7 lg:px-8 lg:pt-8 mb-7">
                  <h2 className="text-xl font-medium leading-none mb-2 text-white">Services</h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">Select services and configure pricing</p>
                </div>
                <div className="my-8 border-t border-[#FFFFFF80]" />

                <div className="px-4 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-4 lg:space-y-8 ">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(services || []).map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id, service.price)}
                        className={`relative flex flex-col items-start p-6 rounded-[16px] border transition-all h-[98px] text-left group ${selectedServices.includes(service.id)
                          ? 'bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                          : 'bg-transparent border-[#303030] hover:border-zinc-700'
                          }`}
                      >
                        <div className="font-medium text-[16px] text-white mb-2 leading-none">{service.label}</div>
                        <div className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                          ${service.price.toFixed(2)} <span className="text-[#7B7B85] font-normal text-[11px] lowercase ml-1">per hour</span>
                        </div>
                        {selectedServices.includes(service.id) && (
                          <div className="absolute top-6 right-6 bg-[#0DC752] text-[#09090B] text-xs font-medium px-4 py-1 rounded-[6px] leading-none">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7 space-y-6">
                    <Button
                      onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                      className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[42px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
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
                            <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                              <span className="text-[12px] text-[#8A8A8A] font-normal">Service Name</span>
                            </div>
                            <Input
                              placeholder="Eg : Post Production Editing"
                              value={customServiceName}
                              onChange={(e) => setCustomServiceName(e.target.value)}
                              className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                            />
                          </div>
                          <div className="md:col-span-4 relative">
                            <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                              <span className="text-[12px] text-[#8A8A8A] font-normal">Cost</span>
                            </div>
                            <Input
                              placeholder="$ 0.00"
                              value={customServiceCost}
                              onChange={(e) => setCustomServiceCost(e.target.value)}
                              className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
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
                  <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Shoot Type Section */}
                    {(selectedServices.includes('videography') || selectedServices.includes('photography')) && (
                      <section className="">
                        <hr className="border-t border-[#3D3D3D] mb-4 lg:mb-9" />
                        <div className="px-4 pt-4 pb-5 lg:px-8 lg:pb-10">
                          <button
                            onClick={() => setIsShootTypeExpanded(!isShootTypeExpanded)}
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className="text-xl font-medium text-white">Video Shoot Type</h2>
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
                                        ? 'bg-[#262118] border-[#9F7B43] text-[#E1C48B] shadow-inner'
                                        : 'bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700'
                                        }`}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() => setShowAddShootTypeForm(!showAddShootTypeForm)}
                                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[40px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
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
                                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                          <span className="text-[12px] text-[#8A8A8A] font-normal">Video Shoot Type Name</span>
                                        </div>
                                        <Input
                                          placeholder="Eg : Real Estate.."
                                          value={customShootType}
                                          onChange={(e) => setCustomShootType(e.target.value)}
                                          className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
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
                        <hr className="border-t border-[#3D3D3D]" />
                        <section className="px-4 pt-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                          <button
                            onClick={() => setIsEditingTypeExpanded(!isEditingTypeExpanded)}
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className="text-xl font-medium text-white">AI Editing Types</h2>
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
                                      className={`h-[52px] px-6 rounded-[14px] font-normal transition-all border text-sm text-left leading-tight tracking-tight ${selectedEditingType === type.id
                                        ? 'bg-[#262118] border-[#9F7B43] text-[#E1C48B] shadow-inner'
                                        : 'bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700'
                                        }`}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() => setShowAddEditingTypeForm(!showAddEditingTypeForm)}
                                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[40px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
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
                                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                          <span className="text-[12px] text-[#8A8A8A] font-normal">Editing Type Name</span>
                                        </div>
                                        <Input
                                          placeholder="Eg : Reel Editing..."
                                          value={customEditingType}
                                          onChange={(e) => setCustomEditingType(e.target.value)}
                                          className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
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
                      <hr className="border-t border-[#3D3D3D]" />
                      <section className="px-4 pt-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                        <div className="mb-8">
                          <h2 className="text-xl font-medium text-white">Configure Selected Services</h2>
                        </div>

                        <div className="space-y-6">
                          {(selectedServices || []).map(serviceId => {
                            const service = services.find(s => s.id === serviceId);
                            const config = serviceConfigs[serviceId];
                            if (!service || !config) return null;

                            const shootTypeLabel = shootTypes.find(t => t.id === selectedShootType)?.label;
                            const editingTypeLabel = editingTypes.find(t => t.id === selectedEditingType)?.label;

                            return (
                              <div key={serviceId} className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-6 lg:px-7 lg:py-6 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-8">
                                  <div className="space-y-2">
                                    <h3 className="text-[16px] font-medium text-white flex items-center gap-1.5 leading-none">
                                      {serviceId === 'ai_editing' ? (
                                        <>AI Editing Type - <span className="text-[#8E826A]">{editingTypeLabel}</span></>
                                      ) : (
                                        <>{service.label} - <span className="text-[#8E826A]">({shootTypeLabel})</span></>
                                      )}
                                    </h3>
                                    <p className="text-[#8A8A8A] text-[12px] font-normal">Base: ${service.price.toFixed(2)} per hour</p>
                                  </div>
                                  <div className="flex items-center gap-5">
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[#7B7B85] text-[10px] font-normal">Total</span>
                                      <span className="text-xl font-semibold text-[#F0DCB1] tracking-tight leading-none">${(config.quantity * config.duration * config.crewSize * config.estimatedPrice).toLocaleString()}</span>
                                    </div>
                                    <button
                                      onClick={() => setSelectedServices(prev => prev.filter(id => id !== serviceId))}
                                      className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-transparent flex items-center justify-center text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>

                                <div className="my-8 border-t border-dashed border-[#303030]" />

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-6">
                                  {/* Quantity */}
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-normal text-[#9A9AA4]">Quantity</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'quantity', config.quantity - 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {config.quantity}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'quantity', config.quantity + 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Duration */}
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-normal text-[#9A9AA4]">Duration (hours)</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'duration', config.duration - 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {config.duration}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'duration', config.duration + 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Crew Size */}
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-normal text-[#9A9AA4]">Crew Size</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'crewSize', config.crewSize - 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {config.crewSize}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'crewSize', config.crewSize + 1)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Estimated Pricing */}
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-normal text-[#9A9AA4]">Estimated Pricing</span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'estimatedPrice', config.estimatedPrice - 50)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        ${config.estimatedPrice}
                                      </div>
                                      <button
                                        onClick={() => handleConfigUpdate(serviceId, 'estimatedPrice', config.estimatedPrice + 50)}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
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
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Client Information</h2>
                <p className="text-sm text-[#A1A1AA]">Select an existing client or create a new one</p>
              </div>

              <div className="my-8 border-t border-[#FFFFFF80]" />

              <div className="px-7 pb-9 lg:px-8 lg:pb-10">
                <div className="relative max-w-full">
                  <div className="absolute -top-3 left-5 z-10 px-3 bg-[#171717]">
                    <span className="text-sm text-[#A1A1AA] font-normal tracking-[0.01em]">Select Client</span>
                  </div>

                  <div className="relative border border-[#4A4A4A] rounded-[14px] bg-transparent">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full group bg-transparent rounded-[14px] px-6 py-6 flex justify-between items-center transition-all ${isDropdownOpen ? 'ring-1 ring-[#8E826A]/30' : ''}`}
                    >
                      <span className={selectedClient ? "text-white text-[16px] font-normal" : "text-[#6B6B6B] text-[16px] font-normal"}>
                        {selectedClient ? selectedClient.name : "Choose a Client..."}
                      </span>
                      <ChevronDown size={20} className={`text-[#E5E5E5] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.99, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.99, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0F0F0F] border border-zinc-800 rounded-2xl overflow-hidden z-50 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                        >
                          <div className="max-h-80 overflow-y-auto custom-scrollbar p-3">
                            {(filteredClients || []).map((client) => (
                              <div
                                key={client.id}
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsDropdownOpen(false);
                                }}
                                className={`flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all mb-1 ${selectedClient?.id === client.id
                                  ? 'bg-[#FFF9EE] text-[#101010]'
                                  : 'hover:bg-white/5 text-zinc-400'
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedClient?.id === client.id
                                  ? 'border-[#101010]'
                                  : 'border-zinc-700'
                                  }`}>
                                  {selectedClient?.id === client.id && (
                                    <div className="w-2.5 h-2.5 bg-[#101010] rounded-sm" />
                                  )}
                                </div>
                                <span className="font-semibold text-lg">{client.name}</span>
                              </div>
                            ))}

                            <button className="w-full flex items-center gap-4 px-5 py-4 text-[#E8D1AB] hover:bg-[#E8D1AB]/5 transition-all rounded-xl mt-2 border-t border-zinc-800/50 pt-6">
                              <div className="w-6 h-6 rounded border border-[#E8D1AB]/40 flex items-center justify-center bg-[#1D1A15]">
                                <Plus size={16} />
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
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Custom Line Items</h2>
                <p className="text-sm text-[#A1A1AA]">Add any custom charges or fees not covered by services or add-ons</p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />
              <div className=" p-4 lg:p-9">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-7">
                  <div className="md:col-span-8 relative">
                    <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                      <span className="text-[12px] text-[#8A8A8A] font-normal">Item Name</span>
                    </div>
                    <Input
                      placeholder="Eg : Cleaning Services"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                    />
                  </div>
                  <div className="md:col-span-4 relative">
                    <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                      <span className="text-[12px] text-[#8A8A8A] font-normal">Cost</span>
                    </div>
                    <Input
                      placeholder="$ 0.00"
                      value={customItemCost}
                      onChange={(e) => setCustomItemCost(e.target.value)}
                      className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddLineItem}
                  className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[40px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Item
                </Button>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              <div className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[14px] p-5 relative overflow-hiddenm-4 lg:m-9 mt-0 ">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-medium text-white leading-none">Rush Delivery</h3>
                    <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">$1,500.00</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative w-36">
                      <Input
                        value={`$ ${0}`}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace('$ ', '')) || 0;
                          // setLineItemConfigs(prev => ({ ...prev, [item.id]: { price: val } }));
                        }}
                        className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
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
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Discounts</h2>
                <p className="text-sm text-[#A1A1AA]">Add any custom charges or fees not covered by services or add-ons</p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className=" p-4 lg:p-9">
                <div
                  className={`w-full p-5 rounded-2xl border transition-colors duration-300 flex items-center justify-between bg-[#171717] border-[#222222]`}
                  style={{ fontFamily: 'var(--font-instrument-sans), sans-serif' }}
                >
                  <div className="space-y-1">
                    <h3 className={`text-lg font-medium tracking-tight text-white`}>
                      Apply Discount
                    </h3>
                    <p className={`text-sm text-[#888888]`}>
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
                  <hr className="border-t border-[#3D3D3D]" />
                  <div className="p-4 lg:p-9">
                    <h3 className={`text-lg font-medium tracking-tight text-white`}>
                      Discount Type
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 mt-3 lg:mt-6 mb-4 lg:mb-8">
                      {/* Percentage Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("percentage")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "percentage"
                          ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                          : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "percentage"
                          ? "bg-[#E8D1AB] text-black"
                          : "bg-[#1A1A1A] text-[#888888]"
                          }`}>
                          <Percent size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Percentage
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            % off subtotal
                          </p>
                        </div>
                      </button>

                      {/* Fixed Amount Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("fixed")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "fixed"
                          ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                          : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "fixed"
                          ? "bg-[#E8D1AB] text-black"
                          : "bg-[#1A1A1A] text-[#888888]"
                          }`}>
                          <DollarSign size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Fixed Amount
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            $ off subtotal
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="md:col-span-8 relative">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-[12px] text-[#8A8A8A] font-normal">Discount Value</span>
                      </div>
                      <Input
                        placeholder="0.00"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value))}
                        className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                      />
                    </div>

                    <div className="my-6 flex flex-col gap-2">
                      <div className="flex justify-between text-[#9F9FA9] ">
                        <p>Subtotal</p>
                        <p>$ 2211.00</p>
                      </div>
                      <div className="flex justify-between text-[#E8D1AB] font-medium ">
                        <p>Discount Applied </p>
                        <p>- $ 211.00</p>
                      </div>
                    </div>

                    <div className="bg-[#282727] rounded-[12px] p-6 flex justify-between items-center ">
                      <span className="text-xl font-medium text-white">After Discount</span>
                      <span className="text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                        {/* This needs to be updated  */}
                        $ 2000.00
                      </span>
                    </div>
                  </div>
                </>

              ) : (
                <div className="flex flex-col gap-5 items-center justify-center my-4 lg:my-12">
                  <Image
                    src={"/images/misc/DiscountTag.svg"}
                    width={132}
                    height={132}
                    alt="Discount Tag"
                  />
                  <p className="text-white text-base">
                    No discount applied to this quote
                  </p>
                </div>
              )}
            </div>
          ) : view === 'tax' ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Tax</h2>
                <p className="text-sm text-[#A1A1AA]">Configure tax rate and type for this quotation</p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-9">
                <h3 className={`text-lg font-medium tracking-tight text-white`}>
                  Common Tax Rates
                </h3>

                <div className="flex flex-col md:flex-row gap-4 mt-3 lg:mt-6">
                  <button
                    onClick={() => setSelectedTax(0)}
                    className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 0
                      ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                      : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 0 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-base `}>
                        0 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(5)}
                    className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 5
                      ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                      : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 5 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-base `}>
                        5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(8.5)}
                    className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 8.5
                      ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                      : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 8.5 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-base `}>
                        8.5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTax(10)}
                    className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 10
                      ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                      : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                      }`}
                  >
                    <div>
                      <p className={`${selectedTax === 10 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-base `}>
                        10 %
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              <div className="p-4 lg:p-9">
                <h3 className={`text-lg font-medium tracking-tight text-white mb-3 lg:mb-6`}>
                  Tax Calculation
                </h3>

                <div className="bg-[#282727] rounded-[12px] p-6 ">

                  <div className="flex justify-between items-center ">
                    <span className="text-base text-[#9F9FA9]">Subtotal</span>
                    <span className="text-base text-[#9F9FA9] tracking-tight">
                      $5,550.00
                    </span>
                  </div>
                  <div className="my-6 border-t border-[#FFFFFF33]" />
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base text-white font-medium">Subtotal</span>
                    <span className="text-base text-white font-medium tracking-tight">
                      $5,550.00
                    </span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span className="text-base text-[#9F9FA9]">Sales Tax (8.5%)</span>
                    <span className="text-base text-[#9F9FA9] tracking-tight">
                      $471.75
                    </span>
                  </div>

                  <div className="my-6 border-t border-[#FFFFFF33]" />

                  <div className="flex justify-between items-center ">
                    <span className="text-xl font-medium text-white">Final Total</span>
                    <span className="text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                      $ 2000.00
                    </span>
                  </div>

                </div>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              <div className="flex gap-3 w-full p-4 lg:p-9">
                <div className="w-full relative">
                  <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                    <span className="text-[12px] text-[#8A8A8A] font-normal">Tax Rate (%)</span>
                  </div>
                  <Input
                    placeholder="0.00"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseInt(e.target.value))}
                    className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                  />
                </div>
                <div className="w-full relative">
                  <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                    <span className="text-[12px] text-[#8A8A8A] font-normal">Tax Type</span>
                  </div>
                  <Input
                    placeholder="Sales Tax"
                    value={taxtType}
                    onChange={(e) => setTaxType(e.target.value)}
                    className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-[15px] text-white placeholder:text-[#666666]"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Client Details View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="px-7 pt-7 lg:px-8 lg:pt-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">Client Information</h2>
                <p className="text-sm text-[#A1A1AA]">Select an existing client or create a new one</p>
              </div>
              <div className="my-8 border-t border-[#FFFFFF80]" />

              <div className="px-4 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-4 lg:space-y-8 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-xs text-zinc-400 font-medium">Client Name*</span>
                    </div>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-xs text-zinc-400 font-medium">Email ID*</span>
                    </div>
                    <Input
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-xs text-zinc-400 font-medium">Phone Number*</span>
                    </div>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                    <span className="text-xs text-zinc-400 font-medium">Address*</span>
                  </div>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="567 Mission Street, San Francisco, CA 94105"
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6"
                  />
                </div>

                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                    <span className="text-xs text-zinc-400 font-medium">Project Description*</span>
                  </div>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the project scope and requirements....."
                    className="min-h-[120px] bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all p-6 pt-8"
                  />
                </div>

                <div className="">
                  <h3 className="text-xl font-semibold mb-6">Quote Validity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[3, 5, 7].map((days: number) => (
                      <button
                        key={days}
                        onClick={() => handleValiditySelect(days)}
                        className={`h-14 rounded-xl font-semibold transition-all border ${validityDays === days
                          ? 'bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]'
                          : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                      >
                        {days} Days
                      </button>
                    ))}
                    <button
                      onClick={() => handleValiditySelect('custom')}
                      className={`h-14 rounded-xl font-semibold transition-all border ${validityDays === 'custom'
                        ? 'bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]'
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                    >
                      Add Custom Date
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-8">
                    <Check size={16} className="text-[#E8D1AB]" />
                    <span className="text-[#E8D1AB]/80 font-medium">This quote is valid for {validityDays === 'custom' ? 'X' : validityDays} days from today.</span>
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
                      disabled={validityDays !== 'custom'}
                      format="dd-MM-yyyy"
                      colors={{
                        inputBackground: "transparent",
                        inputText: "#F5F5F5",
                        inputDisabled: "rgba(214, 195, 157, 0.9)",
                        iconColor: "#FFFFFF",
                        labelText: "rgba(113, 113, 122, 1)",
                        inputBorder: "rgba(39, 39, 42, 1)",
                        inputBorderFocus: "rgba(229, 213, 184, 0.5)",
                      }}
                      sx={{
                        height: "64px", // h-16
                        borderRadius: "12px", // rounded-xl
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          paddingLeft: "10px",
                          "& fieldset": {
                            borderWidth: '1px',
                          }
                        },
                        "& .MuiInputBase-input": {
                          fontSize: "16px",
                          fontWeight: "500", // font-medium
                          color: validityDays === 'custom' ? "white" : "rgba(113, 113, 122, 1)", // text-zinc-500
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "rgba(214, 195, 157, 0.9)",
                          color: "rgba(214, 195, 157, 0.9)",
                          opacity: 1,
                        },
                        "& .Mui-disabled .MuiSvgIcon-root": {
                          color: "#FFFFFF",
                          opacity: 1,
                        },
                      }}
                      labelSx={{
                        position: "absolute",
                        top: "-10px",
                        left: "16px",
                        zIndex: 10,
                        backgroundColor: "#0A0A0A",
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
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pb-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818] h-[62px] min-w-[166px] rounded-xl text-[17px] font-medium bg-transparent transition-all"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className={`${(
                view === 'selection' ? selectedClient :
                  view === 'details' ? clientName :
                    view === 'services' ? selectedServices.length > 0 :
                      true // Add-ons are optional
              ) ? 'bg-[#E8D1AB] text-[#101010]' : 'bg-[#2A2B2D] text-zinc-600'} hover:opacity-90 h-[62px] min-w-[166px] rounded-xl text-[17px] font-bold transition-all shadow-md`}
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

          <Button className="bg-white text-[#1B1B1B] hover:bg-zinc-100 h-[62px] px-8 rounded-xl flex items-center gap-3 text-[17px] font-bold transition-all group border-0 shadow-lg self-start sm:self-auto">
            <div className="flex items-center justify-center">
              <Save size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
