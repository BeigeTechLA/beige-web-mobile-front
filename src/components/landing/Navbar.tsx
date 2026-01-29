"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, ChevronDown, LayoutDashboard, LogOut, Image as PhotoIcon, Film, Briefcase, PartyPopper, ChevronRight, BriefcaseMedical, Megaphone, Package, Building2, PersonStanding, Landmark, LandmarkIcon, CirclePlay, Podcast, MessageSquare } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Separator } from "./Separator";
import { CartIcon } from "@/components/ui/CartIcon";
import { useAuth } from "@/lib/hooks/useAuth";

const portfolioConfig = {
  photos: {
    label: "Photo",
    icon: <PhotoIcon size={24} />,
    sectors: [
      {
        id: "corporate",
        label: "Corporate",
        icon: <Briefcase size={24} />,
        subSectors: ["All", "Food & Restaurant", "Automotive"]
      },
      {
        id: "private-events",
        label: "Private Events",
        icon: <PartyPopper size={24} />,
        subSectors: ["Barmitvahs", "Family Events", "Birthday Parties", "Quinceaneras"]
      },
      {
        id: "healthcare",
        label: "Healthcare",
        icon: <BriefcaseMedical size={24} />,
        subSectors: []
      },
      {
        id: "non-profit",
        label: "Non - Profit",
        icon: <Megaphone size={24} />,
        subSectors: []
      },
      {
        id: "products",
        label: "Products",
        icon: <Package size={24} />,
        subSectors: []
      },
      {
        id: "real-estate",
        label: "Real - Estate",
        icon: <Building2 size={24} />,
        subSectors: []
      },
      {
        id: "lifestyle",
        label: "Lifestyle",
        icon: <PersonStanding size={24} />,
        subSectors: []
      },
    ]
  },
  videos: {
    label: "Video",
    icon: <Film size={24} />,
    sectors: [
      {
        id: "corporate",
        label: "Corporate",
        icon: <Briefcase size={24} />,
        subSectors: ["All", "Food & Restuarants", "Construction", "Manufacturing", "Automotive", "Technology", "Keynote Speech"]
      },
      {
        id: "private-events",
        label: "Private Events",
        icon: <PartyPopper size={24} />,
        subSectors: ["Barmitvahs", "Birthday Parties", "Quinceaneras"]
      },
      {
        id: "government",
        label: "Government",
        icon: <LandmarkIcon size={24} />,
        subSectors: []
      },
      {
        id: "music-videos",
        label: "Music Videos",
        icon: <CirclePlay size={24} />,
        subSectors: []
      },
      {
        id: "real-estate",
        label: "Real - Estate",
        icon: <Building2 size={24} />,
        subSectors: []
      },
      {
        id: "healthcare",
        label: "Healthcare",
        icon: <BriefcaseMedical size={24} />,
        subSectors: []
      },
      {
        id: "podcast",
        label: "Podcast",
        icon: <Podcast size={24} />,
        subSectors: []
      },
      {
        id: "interviews",
        label: "Interviews",
        icon: <MessageSquare size={24} />,
        subSectors: []
      },
      {
        id: "non-profit",
        label: "Non - Profit",
        icon: <Megaphone size={24} />,
        subSectors: []
      },
      {
        id: "products",
        label: "Products",
        icon: <Package size={24} />,
        subSectors: []
      },
    ]
  }
};

const navLinks = [
  { label: "Home", href: "/", isButton: true },
  { label: "About", href: "#about" },
  { label: "Find Creative Work", href: "/find-creative-work" },
  { label: "Portfolio", href: "#portfolio", hasDropdown: true },
  { label: "Press", href: "#press" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPortfolioMenu, setShowPortfolioMenu] = useState(false);

  // Mobile Specific States
  const [mobilePortfolioOpen, setMobilePortfolioOpen] = useState(false);
  const [mobileActiveCategory, setMobileActiveCategory] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<"photos" | "videos">("photos");
  const [activeSector, setActiveSector] = useState("corporate");
  const [localUser, setLocalUser] = useState<any>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const portfolioRef = useRef<HTMLDivElement>(null);

  const showCartIcon = pathname?.startsWith("/search-results");

  useEffect(() => {
    const storedUser = localStorage.getItem("revure_user");
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const handleClickOutside = (e: MouseEvent) => {
      if (portfolioRef.current && !portfolioRef.current.contains(e.target as Node)) {
        setShowPortfolioMenu(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavClick = (href: string) => {
    if (href === "#portfolio") {
      setShowPortfolioMenu(!showPortfolioMenu);
      return;
    }
    setShowPortfolioMenu(false);
    setMobileOpen(false);
    if (href.startsWith("#")) {
      if (pathname !== "/") router.push("/" + href);
      else {
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }
    } else router.push(href);
  };

  const handleInvestor = () => {
    setMobileOpen(false);
    router.push("/investors");
  };

  const handlePortfolioSelect = (category: string, sector: string, subSector?: string) => {
    const formattedSector = sector.toLowerCase().replace(/\s+/g, '-');
    const formattedSub = (subSector && subSector.toLowerCase() !== "all")
      ? `/${encodeURIComponent(subSector.toLowerCase().replace(/\s+/g, '-'))}`
      : "";

    const targetPath = `/portfolio/${category}/${formattedSector}${formattedSub}`;

    router.push(targetPath);
    setShowPortfolioMenu(false);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogin = () => {
    setMobileOpen(false);
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    setLocalUser(null);
    setMobileOpen(false);
    router.push("/");
  };

  const goToDashboard = () => {
    setMobileOpen(false);
    setShowProfileDropdown(false);
    if (localUser?.user_type_id === 1) router.push("/admin/dashboard");
    else if (localUser?.user_type_id === 2) router.push("/creator/dashboard/request");
    else if (localUser?.user_type_id === 3) router.push("/affiliate/dashboard");
  };

  return (
    <nav className="fixed top-6 left-2 right-2 lg:left-0 lg:right-0 z-50 pointer-events-none z-50">
      <div className={`pointer-events-auto mx-auto max-w-[1600px] px-6 lg:px-0 transition-all duration-300 rounded-[20px] ${isScrolled ? "bg-[#050505]/80 backdrop-blur-[12px]" : "bg-[#050505]/60 backdrop-blur-[8px]"} border-[0.5px] border-[#E8D1AB]/30`}>
        <div className="h-13 md:h-[88px] flex items-center justify-between lg:px-6">
          <a href="https://book.beige.app" target="_blank" rel="noopener noreferrer" className="relative flex items-center">
            <Image
              src="/images/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={158} height={32}
              className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
              priority />
            <span className="absolute right-4 md:right-5 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-[#2E2E2E] border border-white/40 bg-gradient-to-br from-[#f8f8f8] via-[#d9d9d9] to-[#f2f2f2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-sm overflow-hidden">
              Beta
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
            </span>
          </a>
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-12">
            <div className="flex items-center gap-2 relative" ref={portfolioRef}>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-lg font-medium transition-all px-4 py-2 rounded-lg flex items-center gap-2 ${link.isButton ? "bg-white text-black hover:bg-white/90" : "text-white/70 hover:text-[#ECE1CE]"}`}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={16} className={`transition-transform duration-300 ${showPortfolioMenu ? 'rotate-180' : ''}`} />}
                </button>
              ))}

              <AnimatePresence>
                {showPortfolioMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute top-20 left-1/2 -translate-x-1/2 w-[1090px] bg-[#000000] border border-[#424242] rounded-[30px] overflow-hidden shadow-2xl flex"
                  >
                    {/* LEFT SIDEBAR (Category Selection) */}
                    <div className="w-1/3 p-10 flex flex-col gap-6 border-r border-[#424242]">
                      {(Object.keys(portfolioConfig) as Array<keyof typeof portfolioConfig>).map((cat) => (
                        <button
                          key={cat}
                          onMouseEnter={() => {
                            setActiveCategory(cat);
                            setActiveSector(portfolioConfig[cat].sectors[0].id);
                          }}
                          className={`flex items-center justify-between px-6 py-5 rounded-[40px] transition-all ${activeCategory === cat ? "bg-[#F3E6D0] text-black" : "text-white/60 hover:bg-white/5"}`}
                        >
                          <div className="flex items-center gap-4 font-semibold text-xl">
                            <div className={`p-2 rounded-full ${activeCategory === cat ? 'bg-black/10' : 'bg-white/10'}`}>
                              {portfolioConfig[cat].icon}
                            </div>
                            {portfolioConfig[cat].label}
                          </div>
                          <ChevronRight size={18} className={activeCategory === cat ? "opacity-100" : "opacity-0"} />
                        </button>
                      ))}
                    </div>

                    {/* RIGHT PANEL (Sectors & Sub-Sectors) */}
                    <div className="w-2/3 flex-1 flex flex-col">
                      {/* TOP SECTION: Two-Column Grid for Primary Sectors */}
                      <div className="grid grid-cols-2 gap-x-12 pt-8">
                        {portfolioConfig[activeCategory].sectors.slice(0, 2).map((sector, index) => (
                          <button
                            key={sector.id}
                            onMouseEnter={() => setActiveSector(sector.id)}
                            className={`flex items-center justify-between transition-colors px-10 ${index == 1 ? "pl-0" : ""} ${activeSector === sector.id ? "text-white " : "text-white/40"}`}
                          >
                            <div className={`flex items-center gap-4 text-xl font-medium `}>
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">{sector.icon}</div>
                              {sector.label}
                            </div>
                            {sector.subSectors.length > 0 && <ChevronRight size={20} />}
                          </button>
                        ))}
                      </div>

                      {/* DYNAMIC MIDDLE ROW: Sub-sectors (Only if they exist for active sector) */}
                      <AnimatePresence mode="wait">
                        {portfolioConfig[activeCategory].sectors.find(s => s.id === activeSector)?.subSectors.length ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/[0.04] border-y border-y-white/10 overflow-hidden mt-6"
                          >
                            <div className="flex flex-wrap gap-12 px-10 py-6">
                              {portfolioConfig[activeCategory].sectors.find(s => s.id === activeSector)?.subSectors.map((sub) => (
                                <button
                                  key={sub}
                                  onClick={() => handlePortfolioSelect(activeCategory, activeSector, sub)}
                                  className="text-left text-[#B8ACAC] hover:text-white text-xl font-light transition-colors py-1"
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      {/* BOTTOM SECTION: Remaining Sectors in 2-Col Grid */}
                      <div className="grid grid-cols-2 p-10 pt-6 gap-x-12 gap-y-6">
                        {portfolioConfig[activeCategory].sectors.slice(2).map((sector) => (
                          <button
                            key={sector.id}
                            onMouseEnter={() => setActiveSector(sector.id)}
                            onClick={() => handlePortfolioSelect(activeCategory, activeSector)}
                            className={`flex items-center gap-4 transition-all ${activeSector === sector.id ? "text-white" : "text-white/40 hover:text-white/60"}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">{sector.icon}</div>
                            <span className="text-lg font-medium">{sector.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side Auth (Existing logic) */}
          <div className="hidden lg:flex items-center gap-4">
            {showCartIcon && <CartIcon />}
            {!localUser ? (
              <button onClick={handleLogin} className="text-white hover:text-[#ECE1CE] text-lg font-medium transition-colors px-6 py-3 border border-white/30 hover:border-[#ECE1CE]/50 rounded-[10px]">Login / Sign up</button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white text-sm font-medium leading-none">{localUser.name}</span>
                  </div>
                  <ChevronDown size={16} className={`text-white/50 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-14 right-0 w-48 bg-[#000000] border border-[#424242] rounded-xl overflow-hidden shadow-2xl z-50"
                    >
                      <div className="p-2 flex flex-col gap-1">
                        <button
                          onClick={goToDashboard}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
                        >
                          <LogOut size={18} />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-3">
            {showCartIcon && <CartIcon className="scale-90" />}
            <button className="text-white p-2" onClick={() => setMobileOpen(true)}><Menu size={28} /></button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden pointer-events-auto" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#050505] z-[70] lg:hidden pointer-events-auto flex flex-col">
              <div className="flex items-center justify-between px-5 py-8">
                <Image src="/images/logos/beige_logo_vb.png" alt="BEIGE" width={120} height={24} />
                <button onClick={() => setMobileOpen(false)} className="text-white p-2 bg-[#171717] rounded-full"><X size={28} /></button>
              </div>
              <Separator />

              <div className="flex flex-col gap-6 p-5 overflow-y-auto">
                {navLinks.map((link) => (
                  <div key={link.label} className="flex flex-col">
                    <button
                      onClick={() => link.hasDropdown ? setMobilePortfolioOpen(!mobilePortfolioOpen) : handleNavClick(link.href)}
                      className={`text-xl font-medium text-left flex justify-between items-center ${link.isButton ? "text-[#ECE1CE]" : "text-[#B8ACAC]"}`}
                    >
                      {link.label}
                      {link.hasDropdown && <ChevronDown size={20} className={`transition-transform ${mobilePortfolioOpen ? 'rotate-180' : ''}`} />}
                    </button>

                    {/* Mobile Nested Portfolio Menu */}
                    {/* Mobile Nested Portfolio Menu */}
                    {link.hasDropdown && mobilePortfolioOpen && (
                      <div className="flex flex-col gap-4 mt-4 ml-4 border-l border-white/10 pl-4">
                        {(Object.keys(portfolioConfig) as Array<keyof typeof portfolioConfig>).map((cat) => (
                          <div key={cat} className="flex flex-col gap-2">
                            <button
                              onClick={() => setMobileActiveCategory(mobileActiveCategory === cat ? null : cat)}
                              className="text-white text-lg font-semibold flex items-center justify-between py-2"
                            >
                              <span className="flex items-center gap-2">
                                {portfolioConfig[cat].icon} {portfolioConfig[cat].label}
                              </span>
                              <ChevronDown size={16} className={mobileActiveCategory === cat ? "rotate-180" : ""} />
                            </button>

                            {mobileActiveCategory === cat && (
                              <div className="flex flex-col gap-4 ml-4 mb-4">
                                {portfolioConfig[cat].sectors.map((sector) => (
                                  <div key={sector.id} className="flex flex-col gap-2">
                                    {/* Made the Sector Label clickable if there are no subsectors */}
                                    <div className="flex justify-between items-center pr-4">
                                      <button
                                        onClick={() => handlePortfolioSelect(cat, sector.id)}
                                        className="text-white/40 text-sm font-bold uppercase tracking-widest">
                                        {sector.label}
                                      </button>
                                      {/* {sector.subSectors.length === 0 && (
                                        <button
                                          onClick={() => handlePortfolioSelect(cat, sector.id)}
                                          className="text-[#E8D1AB] text-xs font-medium"
                                        >
                                          View All
                                        </button>
                                      )} */}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {/* If there are subsectors, show them as pills (old design) */}
                                      {sector.subSectors.length > 0 ? (
                                        sector.subSectors.map((sub) => (
                                          <button
                                            key={sub}
                                            onClick={() => handlePortfolioSelect(cat, sector.id, sub)}
                                            className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/70 text-sm active:bg-white/20"
                                          >
                                            {sub}
                                          </button>
                                        ))
                                      ) : (
                                        /* If no subsectors, provide a subtle pill to ensure the user can still click the sector */
                                        <button
                                          onClick={() => handlePortfolioSelect(cat, sector.id)}
                                          className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/70 text-sm"
                                        >
                                          Explore {sector.label}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Separator />

                {/* Mobile Auth Sections */}
                {!localUser ? (
                  <div className="flex flex-col gap-4">
                    <button onClick={handleLogin} className="text-white py-6 border border-white/30 rounded-[10px] text-base font-medium">Login / Sign up</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-12 h-12 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black"><User size={24} /></div>
                      <div><p className="text-white font-semibold text-lg">{localUser.name}</p></div>
                    </div>
                    <button onClick={goToDashboard} className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-[10px] font-medium"><LayoutDashboard size={20} /> Dashboard</button>
                    <button onClick={handleLogout} className="text-red-400 py-4 border border-red-400/20 rounded-[10px] font-medium">Log out</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};