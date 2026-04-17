"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Share, Heart, Home, Star, CalendarDays, ChevronDown, MapPin, Search } from "lucide-react";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface StudioDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studio: any;
}

export const StudioDetailsDrawer: React.FC<StudioDetailsDrawerProps> = ({
  isOpen,
  onClose,
  studio,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999999] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-[900px] h-full bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0A0A0A] z-10 sticky top-0">
          <h2 className="text-xl font-bold text-white tracking-tight">Studio Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full p-6 lg:p-10 no-scrollbar relative">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-[32px] font-bold text-[#E8D1AB] mb-2 leading-tight">
                {studio?.name || "Beige Palm Desert Golf"} 
                <span className="text-white/60 font-normal"> ({studio?.beds || 4} Bed / {studio?.baths || 3} Bath - {studio?.poolType || "Large Pool"})</span>
              </h1>
              <p className="text-white/60 text-sm underline decoration-white/30 underline-offset-4">{studio?.location || "Woodland Hills, Los Angeles, CA"}</p>
            </div>
            <div className="flex items-center gap-5 pt-2">
              <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors underline decoration-transparent hover:decoration-white underline-offset-4">
                <Share size={16} /> Share
              </button>
              <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors underline decoration-transparent hover:decoration-white underline-offset-4">
                <Heart size={16} /> Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-[24px] overflow-hidden mb-12 h-[350px] lg:h-[400px]">
            <div className="relative h-full w-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer">
               <Image src={studio?.image || "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg"} alt="Main" fill className="object-cover" />
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full relative border-l-2 border-[#0A0A0A]">
               <div className="relative w-full h-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer">
                 <Image src={studio?.images?.[0] || "https://d2jhn32fsulyac.cloudfront.net/assets/categories/corporate.jpg"} alt="1" fill className="object-cover" />
               </div>
               <div className="relative w-full h-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer">
                 <Image src={studio?.images?.[1] || "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg"} alt="2" fill className="object-cover" />
               </div>
               <div className="relative w-full h-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer">
                 <Image src={studio?.images?.[2] || "https://d2jhn32fsulyac.cloudfront.net/assets/categories/Brands&Products.jpg"} alt="3" fill className="object-cover" />
               </div>
               <div className="relative w-full h-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer">
                 <Image src={studio?.images?.[3] || studio?.image || "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg"} alt="4" fill className="object-cover" />
                 <button className="absolute bottom-4 right-4 bg-white text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-2xl hover:bg-white/90 transition-colors">
                   <Home size={16} /> Show all photos
                 </button>
               </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="flex justify-between items-start border-b border-white/10 pb-8 mb-8">
            <div className="pr-4">
              <h2 className="text-xl font-bold text-white mb-2">Entire rental unit hosted by Ghazal</h2>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-white/70 text-sm">
                <span>{studio?.beds ? studio.beds * 2 : 8} guests</span> <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{studio?.beds || 4} bedroom</span> <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{studio?.beds || 4} beds</span> <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{studio?.baths || 3} bath</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0 relative border border-white/20">
               <Image src="https://d2jhn32fsulyac.cloudfront.net/assets/creators/avatar-1.jpg" alt="Host" fill className="object-cover" />
            </div>
          </div>

          <div className="flex flex-col gap-6 border-b border-white/10 pb-8 mb-8">
            {[
              { icon: Home, title: "Entire home", desc: "You'll have the apartment to yourself" },
              { icon: Star, title: "Enhanced Clean", desc: "This Host committed to Airbnb's 5-step enhanced cleaning process. Show more", highlight: true },
              { icon: Home, title: "Self check-in", desc: "Check yourself in with the keypad." },
              { icon: CalendarDays, title: "Free cancellation before Feb 14", desc: "" }
            ].map((amenity, i) => (
              <div key={i} className="flex gap-5 items-start">
                 <amenity.icon size={26} strokeWidth={1.5} className="text-white shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-white font-bold text-base">{amenity.title}</h4>
                   {amenity.desc && (
                     <p className="text-white/60 text-[15px] mt-1 leading-relaxed">
                       {amenity.title === "Enhanced Clean" ? (
                         <>This Host committed to Beige's 5-step enhanced cleaning process. <button className="font-bold underline text-white hover:text-[#E8D1AB] transition-colors ml-1">Show more</button></>
                       ) : amenity.desc}
                     </p>
                   )}
                 </div>
              </div>
            ))}
          </div>

          <div className="border-b border-white/10 pb-8 mb-8">
            <p className="text-white/70 leading-relaxed text-[15px]">
              A fully equipped production studio in Los Angeles, ideal for photo, video, podcast, and product shoots. The space offers professional lighting, flexible shooting setups, and comfortable crew areas to ensure smooth and efficient production. Features elegant decor, open-plan spaces, and all the functional requirements to bring your creative vision to life.
            </p>
            <button className="text-white font-bold underline mt-4 text-sm flex items-center gap-1 hover:text-[#E8D1AB] transition-colors">
              Show more <ChevronDown size={14} className="rotate-[-90deg]" />
            </button>
          </div>

          {/* What this place offers */}
          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mb-10">
              {[
                { name: 'Garden view', icon: MapPin }, 
                { name: 'Kitchen', icon: MapPin }, 
                { name: 'Wifi', icon: Search }, 
                { name: 'Pets allowed', icon: Heart }, 
                { name: 'Free washer - in building', icon: Home }, 
                { name: 'Dryer', icon: Home }, 
                { name: 'Central air conditioning', icon: Home }, 
                { name: 'Security cameras on property', icon: Star }, 
                { name: 'Refrigerator', icon: Home }, 
                { name: 'Bicycles', icon: Search }
              ].map((feature, i) => (
                 <div key={i} className="flex items-center gap-4 text-white/80 text-[15px]">
                   <feature.icon size={22} strokeWidth={1.5} className="text-white/70 shrink-0" />
                   <span>{feature.name}</span>
                 </div>
              ))}
            </div>
            <button className="bg-[#E8D1AB] text-black px-6 py-3 rounded-lg font-bold text-[15px] hover:bg-[#dcb98a] transition-colors">
              Show all 37 amenities
            </button>
          </div>

          {/* Operating Hours */}
          <div className="border-b border-white/10 pb-12 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Operating Hours</h3>
            <div className="bg-[#151515] rounded-[24px] p-6 lg:p-8 max-w-md border border-white/5 shadow-xl">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="flex justify-between items-center mb-4 last:mb-0 pb-4 last:pb-0 border-white/5 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                    <span className="text-white font-medium text-[15px]">{day}</span>
                  </div>
                  <span className="text-white/60 text-sm font-medium">10:00 am - 10:00 pm</span>
                </div>
              ))}
            </div>
          </div>

          {/* Where you'll be */}
          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Where you'll be</h3>
            <div className="w-full h-[350px] bg-[#111111] rounded-3xl relative overflow-hidden mb-6 flex items-center justify-center border border-white/10 group cursor-pointer">
               {MAPBOX_TOKEN ? (
                 <Map
                   initialViewState={{
                     longitude: -118.6048,
                     latitude: 34.1683,
                     zoom: 12
                   }}
                   interactive={false}
                   style={{ width: '100%', height: '100%' }}
                   mapStyle="mapbox://styles/mapbox/dark-v11"
                   mapboxAccessToken={MAPBOX_TOKEN}
                 >
                   <Marker longitude={-118.6048} latitude={34.1683}>
                     <div className="relative">
                       <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-30 bg-[#E8D1AB]" />
                       <div className="relative p-1.5 rounded-full shadow-lg border-2 bg-[#E8D1AB] border-[#111111]">
                         <MapPin size={16} className="text-[#1A1A1A]" />
                       </div>
                     </div>
                   </Marker>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-12 pointer-events-none">
                     <span className="text-white font-bold text-sm text-center bg-white/10 px-6 py-3 rounded-xl shadow-2xl border border-white/20 backdrop-blur-xl block whitespace-nowrap">
                       Exact location provided after booking
                     </span>
                   </div>
                 </Map>
               ) : (
                 <>
                   <div className="absolute inset-0 bg-[#E8D1AB]/5 flex items-center justify-center bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/b0/OpenStreetMap_default_map_of_central_London.png')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity blur-[1px]"></div>
                   <span className="text-white font-bold text-sm text-center bg-white/10 px-6 py-3 rounded-xl relative z-10 backdrop-blur-xl shadow-2xl border border-white/20">Exact location provided after booking</span>
                 </>
               )}
            </div>
            <h4 className="text-white font-bold text-lg mb-2">Woodland Hills, Los Angeles, CA</h4>
            <p className="text-white/60 text-[15px] leading-relaxed mb-4">
              Very dynamic and appreciated district by the people of Bordeaux thanks to rue St James and place Fernand Lafargue. Home to many historical monuments such as the Grosse Cloche, the Porte de Bourgogne and the Porte Cailhau, and cultural sites such as the Aquitaine Museum.
            </p>
            <button className="text-white font-bold underline text-[15px] flex items-center gap-1 hover:text-[#E8D1AB] transition-colors">
              Show more <ChevronDown size={14} className="rotate-[-90deg]" />
            </button>
          </div>

          {/* Reviews */}
          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
              <Star className="text-[#E8D1AB] fill-[#E8D1AB]" size={24} /> {studio?.rating || "5.0"} • {studio?.reviews || 120} reviews
            </h3>
            
            <div className="max-w-md flex flex-col gap-4 mb-10">
              {[
                { label: 'Cleanliness', score: 5.0 },
                { label: 'Communication', score: 5.0 },
                { label: 'Check-in', score: 5.0 }
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center group">
                  <span className="text-white/80 text-[15px] min-w-[120px]">{stat.label}</span>
                  <div className="flex-1 max-w-[200px] h-[5px] bg-white/10 rounded-full mx-4 overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 w-full bg-white rounded-full translate-x-0 group-hover:bg-[#E8D1AB] transition-colors" />
                  </div>
                  <span className="text-white font-bold text-sm w-6 text-right">{stat.score.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-8 mb-8">
               <div className="flex gap-4 flex-col">
                 <div className="flex gap-3 items-center">
                   <div className="w-12 h-12 rounded-full overflow-hidden relative border border-white/10">
                      <Image src="https://d2jhn32fsulyac.cloudfront.net/assets/creators/avatar-2.jpg" alt="Reviewer" fill className="object-cover" />
                   </div>
                   <div>
                     <h5 className="text-white font-bold text-base">Jose</h5>
                     <span className="text-white/50 text-sm font-medium">December 2021</span>
                   </div>
                 </div>
                 <p className="text-white/80 text-[15px] leading-relaxed">Host was very attentive.</p>
               </div>
               
               <div className="flex gap-4 flex-col">
                 <div className="flex gap-3 items-center">
                   <div className="w-12 h-12 rounded-full overflow-hidden relative border border-white/10">
                      <Image src="https://d2jhn32fsulyac.cloudfront.net/assets/creators/avatar-3.jpg" alt="Reviewer" fill className="object-cover" />
                   </div>
                   <div>
                     <h5 className="text-white font-bold text-base">Shayna</h5>
                     <span className="text-white/50 text-sm font-medium">December 2021</span>
                   </div>
                 </div>
                 <p className="text-white/80 text-[15px] leading-relaxed">Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed...</p>
                 <button className="text-white font-bold underline text-[15px] w-fit hover:text-[#E8D1AB] transition-colors flex items-center gap-1">
                   Show more <ChevronDown size={14} className="rotate-[-90deg]" />
                 </button>
               </div>
            </div>

            <button className="bg-[#E8D1AB] text-black px-6 py-3 rounded-lg font-bold text-[15px] hover:bg-[#dcb98a] transition-colors">
              Show all 12 reviews
            </button>
          </div>

          {/* Rules & Health Safety Measures */}
          <div className="pb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Rules & Health Safety Measures</h3>
            <div className="flex flex-col rounded-[24px] overflow-hidden bg-[#151515] border border-white/5">
              {['Host Rules', 'Cleaning Protocol', 'Protective Gears', 'Physical Distance', 'Signage', 'Cancellation Policy'].map((rule, i, arr) => (
                <button key={rule} className={`flex justify-between items-center p-6 hover:bg-white/5 text-left text-white/70 hover:text-white transition-colors ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-[15px] font-medium">{rule}</span>
                  <ChevronDown className="rotate-[-90deg] text-white/40" size={18} />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
