export type StudioPricingMode = "weekend" | "hourly";

export type SelectedStudio = {
  studioId: string;
  name: string;
  location: string;
  image: string;
  pricingMode: StudioPricingMode;
  pricingCategory?: string;
  pricingLabel?: string;
  unitPrice: number;
  cleaningFee?: number;
  minimumHours?: number;
  quantity: number;
  totalPrice: number;
  priceLabel: string;
  nights?: number;
  selectedDate?: string;
  startTime?: string;
  endTime?: string;
  lat?: number;
  lng?: number;
};

export type StudioPricingOption = {
  key: string;
  label: string;
  hourlyRate: number;
  minimumHours: number;
  cleaningFee?: number;
  startingAt?: number;
  idealFor: string[];
  includes?: string[];
};

export type StudioCatalogItem = {
  id: string;
  name: string;
  beds: number;
  baths: number;
  poolType: string;
  location: string;
  operatingHours?: string;
  weeklySchedule?: string;
  minimumBookingHours?: number;
  size?: string;
  description?: string;
  highlights?: string[];
  bestFor?: string[];
  amenities?: string[];
  rules?: string[];
  pricingOptions?: StudioPricingOption[];
  priceLabel: string;
  priceValue?: number;
  rating?: string;
  reviews?: number;
  image: string;
  images?: string[];
  dates?: string;
  nights?: number;
  pricingMode: StudioPricingMode;
};

export const WEEKEND_STUDIO_LIST: StudioCatalogItem[] = [];

const cdnStudioImage = (path: string) => `https://d2jhn32fsulyac.cloudfront.net/assets/studio/${path}`;

const HOLLYWOOD_HILLS_IMAGES = [
  "hollywood-hills/living-room-2.png",
  "hollywood-hills/bathroom-1.png",
  "hollywood-hills/bedroom-2.png",
  "hollywood-hills/bedroom.PNG",
  "hollywood-hills/entry-foyer-1.png",
  "hollywood-hills/kitchen.png",
  "hollywood-hills/living+room.png",
  "hollywood-hills/living-room-3.png",
  "hollywood-hills/living-room-4.png",
  "hollywood-hills/loft+bedroom.png",
  "hollywood-hills/loft-view-1.png",
  "hollywood-hills/outdoor-lounge-1.png",
  "hollywood-hills/powder-room-1.png",
  "hollywood-hills/rooftop-firepit-2.png",
  // "hollywood-hills/upper+balcony.png",
  "hollywood-hills/wellness-room-1.png",
].map(cdnStudioImage);

const WOODLAND_HILLS_IMAGES = [
  "woodland-hills/IMG_4805.JPG",
  "woodland-hills/301A5652.jpg",
  "woodland-hills/301A5653.jpg",
  "woodland-hills/301A5665.jpg",
  "woodland-hills/301A5994.jpg",
  "woodland-hills/Copy+of+IMG_4802.JPG",
  "woodland-hills/IMG_4793.JPG",
  "woodland-hills/IMG_4794.JPG",
  "woodland-hills/IMG_4795.JPG",
  "woodland-hills/IMG_4796.JPG",
  "woodland-hills/IMG_4797.JPG",
  "woodland-hills/IMG_4798.JPG",
  "woodland-hills/IMG_4800.JPG",
  "woodland-hills/IMG_4801.JPG",
  "woodland-hills/IMG_4802.JPG",
  "woodland-hills/IMG_4803.JPG",
  "woodland-hills/IMG_4804.JPG",
  "woodland-hills/IMG_4806.JPG",
  "woodland-hills/IMG_4807.JPG",
  "woodland-hills/IMG_4808.JPG",
  "woodland-hills/IMG_4812.WEBP",
  "woodland-hills/KAWSER-4.jpg",
  "woodland-hills/KAWSER-71.jpg",
  "woodland-hills/KAWSER-476+(1).jpg",
  "woodland-hills/KAWSER-541+(2).jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+2+39+14+PM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+2+41+09+PM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+10+36+39+AM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+10+46+04+AM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+11+07+01+AM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+11+58+50+AM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+12+14+58+PM.jpg",
  "woodland-hills/Photo+Dec+23+2025%2C+12+36+32+PM.jpg",
].map(cdnStudioImage);

const WEHO_CONTENT_IMAGES = [
  "weho-content/Weho+Studio-2.jpg",
  ...Array.from({ length: 44 }, (_, index) => `weho-content/Weho+Studio-${index + 1}.jpg`).filter(
    (path) => path !== "weho-content/Weho+Studio-2.jpg",
  ),
].map(cdnStudioImage);

const WEHO_GYM_IMAGES = [
  "weho-gym/Copy+of+DSC00042.jpg",
  "weho-gym/Copy+of+DSC00056.jpg",
  "weho-gym/Copy+of+IMG_1280.jpg",
  "weho-gym/Copy+of+IMG_7584.jpg",
  "weho-gym/Copy+of+IMG_7595.jpg",
  ...Array.from({ length: 77 }, (_, index) => `weho-gym/MWC+Weho+Studio-${index + 1}.jpg`),
].map(cdnStudioImage);

const PALM_SPRINGS_IMAGES = [
  "palm-springs/aim_media_group_high_v2-48.jpg",
  ...[10, 11, 12, 13, 14, 16, 17, 18, 22, 29, 30, 32, 33, 35, 41, 42, 43, 44, 46, 47, 49, 50, 51].map(
    (index) => `palm-springs/aim_media_group_high_v2-${index}.jpg`,
  ),
  ...[44, 45, 46, 47, 48, 49, 50, 51].map((index) => `palm-springs/aim_media_group_low_v2-${index}.jpg`),
  ...[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42].map(
    (index) => `palm-springs/aim_media_group_low-${index}.jpg`,
  ),
].map(cdnStudioImage);

export const HOURLY_STUDIO_LIST: StudioCatalogItem[] = [
  {
    id: "beige-hollywood-hills-estate",
    name: "Beige Studios Hollywood Hills Estate",
    beds: 4,
    baths: 4,
    poolType: "Estate",
    location: "2021 Davies Way, Los Angeles, CA 90046",
    operatingHours: "Available by booking",
    weeklySchedule: "Available 7 days",
    minimumBookingHours: 2,
    size: "5,000+ Square Feet",
    description:
      "Perched above the city in the heart of the Hollywood Hills, Beige Studios Hollywood Hills is a modern architectural retreat designed for premium productions, content creation, brand campaigns, executive retreats, and intimate gatherings. Featuring soaring vaulted ceilings, floor-to-ceiling glass, abundant natural light, and panoramic views stretching across Los Angeles, the property offers a clean, luxurious backdrop for both lifestyle and commercial shoots.",
    highlights: [
      "Panoramic Hollywood Hills & Los Angeles skyline views",
      "Dramatic double-height living room with statement windows",
      "Designer kitchen and modern luxury interiors",
      "Multiple indoor and outdoor filming environments",
      "Natural light throughout the day",
      "Outdoor terrace and lounge areas perfect for content, interviews, and events",
    ],
    bestFor: [
      "Brand Campaigns",
      "Commercial Productions",
      "Influencer Content",
      "Podcasts",
      "Interviews",
      "Corporate Retreats",
      "Luxury Lifestyle Photography",
      "Product Launches",
      "Creative Events",
    ],
    amenities: [
      "Natural Light Throughout Property",
      "Panoramic Los Angeles City Views",
      "Hollywood Hills Location",
      "Central Air Conditioning & Heating",
      "On-Site Parking",
      "Street Parking Available",
      "Floor-to-Ceiling Windows",
      "Vaulted Ceilings",
      "Designer Kitchen",
      "Luxury Modern Interiors",
      "Outdoor Terrace & Lounge Areas",
      "Multiple Filming Locations On Property",
      "Content Creator Friendly",
      "Production Friendly Layout",
      "Hair & Makeup Prep Areas",
      "Private Restrooms",
      "High-Speed WiFi",
      "Power Access Throughout Property",
      "Load-In / Load-Out Access",
      "Furniture & Decor Included",
      "Quiet Residential Setting",
      "Golden Hour Sunset Views",
      "Suitable for Podcasts & Interviews",
      "Suitable for Brand Activations & Events",
    ],
    rules: [
      "No smoking, vaping, or illegal substances anywhere on the property.",
      "No parties, ticketed events, raves, or unauthorized gatherings.",
      "No overnight stays unless specifically approved in writing.",
      "No amplified outdoor music.",
      "No excessive noise, yelling, or disruptive behavior.",
      "Maximum of 2 vehicles parked on the street at any time.",
      "Quiet hours are strictly enforced from 9:00 PM to 8:00 AM.",
      "All setup, production, and breakdown time must be included in the reservation.",
      "No drilling, painting, nailing, stapling, or attaching items to walls, ceilings, floors, windows, or furniture.",
      "Guests are responsible for any damage caused during their booking.",
      "Guest count must not exceed the number specified in the reservation.",
      "The booking may be immediately terminated without refund for unauthorized parties, excessive noise, smoking violations, unauthorized guest counts, illegal activity, or repeated rule violations.",
    ],
    pricingOptions: [
      {
        key: "productions",
        label: "Productions",
        hourlyRate: 250,
        minimumHours: 2,
        cleaningFee: 300,
        idealFor: ["Commercial productions", "Photography shoots", "Video productions", "Podcast recordings", "Interviews", "Brand content creation", "Social media content"],
      },
      {
        key: "activations_events",
        label: "Activations & Events",
        hourlyRate: 500,
        minimumHours: 2,
        cleaningFee: 500,
        idealFor: ["Brand activations", "Product launches", "Corporate events", "Networking events", "Workshops", "Private gatherings", "VIP experiences"],
      },
      {
        key: "meetings_offsites",
        label: "Meetings & Offsites",
        hourlyRate: 250,
        minimumHours: 2,
        cleaningFee: 300,
        idealFor: ["Executive meetings", "Team offsites", "Investor presentations", "Strategy sessions", "Board meetings", "Creative workshops"],
      },
    ],
    priceLabel: "From $250/Hr",
    priceValue: 250,
    rating: "5.0",
    reviews: 5,
    image: HOLLYWOOD_HILLS_IMAGES[0],
    images: HOLLYWOOD_HILLS_IMAGES,
    pricingMode: "hourly",
  },
  {
    id: "beige-woodland-hills-villa",
    name: "Beige Studios Woodland Hills Villa",
    beds: 4,
    baths: 3,
    poolType: "Villa",
    location: "22452 Dolorosa Street Woodland Hills, CA 91367",
    operatingHours: "Available by booking",
    weeklySchedule: "Available 7 days",
    minimumBookingHours: 2,
    description:
      "Escape the city without leaving Los Angeles. Beige Studios Woodland Hills Villa is a modern luxury content house designed for creators, brands, entrepreneurs, and production teams seeking a private, elevated environment for filming, meetings, and activations. Featuring warm contemporary interiors, abundant natural light, designer finishes, luxury lounge spaces, a private outdoor courtyard, and a curated production-friendly layout, the villa blends California comfort with premium content creation functionality.",
    highlights: [
      "Modern luxury villa aesthetic",
      "Production-ready indoor and outdoor environments",
      "Private courtyard and lounge areas",
      "Natural light throughout the day",
      "Designer kitchen and open-concept living spaces",
      "Ideal backdrop for luxury, wellness, lifestyle, and business content",
      "Convenient access to Calabasas, Hidden Hills, and Malibu",
    ],
    bestFor: ["Content Creation", "Brand Campaigns", "Commercial Productions", "Podcasts & Interviews", "Executive Offsites", "Investor Meetings", "Wellness & Lifestyle Shoots", "Product Launches", "Luxury Automotive Content", "Intimate Activations"],
    amenities: [
      "Natural Light Throughout Property",
      "Private Villa Setting",
      "Modern Luxury Interiors",
      "Designer Kitchen",
      "Open Concept Living Area",
      "Private Outdoor Courtyard",
      "Outdoor Lounge Seating",
      "High-Speed WiFi",
      "Central Air Conditioning & Heating",
      "On-Site Parking",
      "Street Parking Available",
      "Power Access Throughout Property",
      "Private Restroom Access",
      "Production-Friendly Layout",
      "Content Creator Friendly",
      "Podcast Friendly",
      "Meeting & Offsite Friendly",
      "Brand Activation Friendly",
      "Furniture & Decor Included",
      "Luxury Lifestyle Aesthetic",
      "Indoor & Outdoor Filming Areas",
      "Load-In / Load-Out Access",
      "Coffee Station",
      "Catering Friendly",
      "Executive Meeting Space",
      "Investor Meeting Friendly",
      "Photo & Video Production Friendly",
    ],
    rules: [
      "Minimum booking is 2 hours.",
      "Respect neighbors and the surrounding community at all times.",
      "No smoking, vaping, or illegal substances on the property.",
      "No unauthorized gatherings, ticketed events, or parties.",
      "All setup and breakdown time must be included in the reservation.",
      "Furniture and decor must be returned to their original locations.",
      "Guests are responsible for damage, excessive cleaning, and rule violations.",
    ],
    pricingOptions: [
      {
        key: "productions",
        label: "Productions",
        hourlyRate: 150,
        minimumHours: 2,
        cleaningFee: 200,
        idealFor: ["Photography shoots", "Video productions", "Podcasts", "Interviews", "Brand content", "Social media content", "Creator sessions"],
      },
      {
        key: "activations_events",
        label: "Activations & Events",
        hourlyRate: 350,
        minimumHours: 2,
        cleaningFee: 500,
        idealFor: ["Brand activations", "Product launches", "Networking events", "Workshops", "Private gatherings", "Wellness experiences", "Community events"],
      },
      {
        key: "meetings_offsites",
        label: "Meetings & Offsites",
        hourlyRate: 150,
        minimumHours: 2,
        cleaningFee: 200,
        idealFor: ["Executive meetings", "Team offsites", "Strategy sessions", "Investor meetings", "Workshops", "Creative planning sessions"],
      },
    ],
    priceLabel: "From $150/Hr",
    priceValue: 150,
    rating: "5.0",
    reviews: 32,
    image: WOODLAND_HILLS_IMAGES[0],
    images: WOODLAND_HILLS_IMAGES,
    pricingMode: "hourly",
  },
  {
    id: "beige-west-hollywood-content-studio",
    name: "Beige Studios West Hollywood Content Studio",
    beds: 0,
    baths: 1,
    poolType: "Content Studio",
    location: "9200 West Sunset Blvd. #215 West Hollywood, CA 90069",
    operatingHours: "Available by booking",
    weeklySchedule: "Available 7 days",
    minimumBookingHours: 2,
    description:
      "Located on the world-famous Sunset Boulevard in the heart of West Hollywood, Beige Studios West Hollywood Content Studio is a premium creator, podcast, and production space designed for brands, entrepreneurs, influencers, and modern media teams. Featuring floor-to-ceiling windows, abundant natural light, designer furnishings, and a sophisticated contemporary aesthetic, the studio provides a turnkey environment for content creation, executive meetings, podcast recordings, interviews, livestreams, and brand activations.",
    highlights: [
      "Prime Sunset Boulevard location",
      "Located in the heart of West Hollywood",
      "Floor-to-ceiling windows with abundant natural light",
      "Modern luxury interiors and designer furnishings",
      "Content creator and podcast friendly",
      "Professional meeting and presentation environment",
      "Turnkey space for brands, agencies, founders, and creators",
    ],
    bestFor: ["Photography shoots", "Video productions", "Brand content", "Social media content", "Interviews", "Creator sessions", "Executive meetings", "Team offsites", "Investor presentations", "Strategy sessions", "Workshops", "Client meetings", "Podcasts", "Executive Interviews", "Thought Leadership Content", "YouTube Shows", "Founder Content", "Panel Discussions", "Corporate Video Content"],
    amenities: [
      "Prime Sunset Boulevard Location",
      "West Hollywood Address",
      "Floor-to-Ceiling Windows",
      "Abundant Natural Light",
      "Modern Designer Furnishings",
      "Premium Podcast Studio Environment",
      "3-Camera Podcast Setup Available",
      "Professional Lighting Available",
      "Professional Audio Available",
      "On-Site Beige Studio Operator Available",
      "High-Speed WiFi",
      "Central Air Conditioning & Heating",
      "Elevator Access",
      "Restroom Access",
      "Meeting & Conference Space",
      "Content Creator Friendly",
      "Podcast Friendly",
      "Production Friendly",
      "Interview Friendly",
      "Livestream Friendly",
      "Brand Activation Friendly",
      "Investor Meeting Friendly",
      "Executive Offsite Friendly",
      "Secure Building Access",
      "Load-In / Load-Out Access",
    ],
    rules: [
      "No smoking, vaping, or illegal substances inside the studio or building.",
      "No parties, nightclub-style events, or unauthorized gatherings.",
      "No overnight use of the studio.",
      "Guests must respect the building, neighboring tenants, and common areas.",
      "Music must be kept at reasonable levels.",
      "Guest count must not exceed the approved reservation capacity.",
      "Setup and breakdown time must be included within the reservation.",
      "No drilling, painting, nailing, stapling, or attaching anything to walls, windows, furniture, or ceilings.",
      "Furniture must be returned to its original position before departure.",
      "No confetti, glitter, powder, paint, fake snow, fog machines, smoke effects, pyrotechnics, or open flames.",
      "No food or beverages near sensitive production equipment.",
    ],
    pricingOptions: [
      {
        key: "productions",
        label: "Productions",
        hourlyRate: 150,
        minimumHours: 2,
        startingAt: 300,
        idealFor: ["Photography shoots", "Video productions", "Brand content", "Social media content", "Interviews", "Creator sessions"],
      },
      {
        key: "meetings_offsites",
        label: "Meetings & Offsites",
        hourlyRate: 150,
        minimumHours: 2,
        startingAt: 300,
        idealFor: ["Executive meetings", "Team offsites", "Investor presentations", "Strategy sessions", "Workshops", "Client meetings"],
      },
      {
        key: "podcast_production",
        label: "Turnkey Podcast & Production Package",
        hourlyRate: 375,
        minimumHours: 2,
        startingAt: 750,
        includes: ["3-Camera Professional Setup", "Professional Lighting Package", "Professional Audio Recording", "Beige Studio Operator", "On-Site Technical Support", "Content Capture & Monitoring"],
        idealFor: ["Podcasts", "Executive Interviews", "Thought Leadership Content", "YouTube Shows", "Founder Content", "Panel Discussions", "Corporate Video Content"],
      },
    ],
    priceLabel: "From $150/Hr",
    priceValue: 150,
    rating: "5.0",
    reviews: 7,
    image: WEHO_CONTENT_IMAGES[0],
    images: WEHO_CONTENT_IMAGES,
    pricingMode: "hourly",
  },
  {
    id: "beige-west-hollywood-wellness-gym",
    name: "Beige Studios West Hollywood Morning Wellness Club Gym",
    beds: 0,
    baths: 1,
    poolType: "Gym",
    location: "9200 West Sunset Blvd. #215 West Hollywood, CA 90069",
    operatingHours: "7 Days A Week 4pm-2am",
    weeklySchedule: "7 Days A Week 4pm-2am",
    minimumBookingHours: 2,
    description:
      "Located on iconic Sunset Boulevard in the heart of West Hollywood, Beige Studios Morning Wellness Club Gym is a premium wellness, fitness, and performance space designed for content creators, fitness brands, athletes, coaches, and production teams. Featuring floor-to-ceiling windows, abundant natural light, state-of-the-art fitness equipment, luxury locker rooms, sauna access, recovery amenities, and a modern wellness-focused design, the space provides a unique backdrop for fitness productions, wellness content, brand campaigns, workshops, and private training experiences.",
    highlights: ["Prime Sunset Boulevard location", "Luxury fitness and wellness facility", "Floor-to-ceiling windows with abundant natural light", "Premium strength and conditioning equipment", "Functional training space", "Luxury locker rooms and changing facilities", "Sauna access", "Recovery-focused environment"],
    bestFor: ["Fitness Productions", "Wellness Content Creation", "Athletic Brand Campaigns", "Commercial Productions", "Product Launches", "Corporate Wellness Events", "Fitness Workshops", "Health & Wellness Photography", "Influencer Content", "Athlete Training Content", "Recovery Content", "Team Offsites", "Executive Meetings", "Networking Events", "Luxury Lifestyle Content"],
    amenities: [
      "Prime Sunset Boulevard Location",
      "West Hollywood Address",
      "Luxury Fitness & Wellness Facility",
      "State-of-the-Art Gym Equipment",
      "Functional Training Area",
      "Strength Training Equipment",
      "Cardio Equipment",
      "Floor-to-Ceiling Windows",
      "Abundant Natural Light",
      "Premium Locker Rooms",
      "Private Changing Rooms",
      "Sauna Access",
      "Luxury Showers",
      "Restroom Access",
      "Recovery & Wellness Environment",
      "High-Speed WiFi",
      "Central Air Conditioning & Heating",
      "Elevator Access",
      "On-Site Staff Available",
      "Production-Friendly Layout",
      "Content Creator Friendly",
      "Fitness Content Friendly",
      "Wellness Content Friendly",
      "Podcast & Interview Friendly",
      "Corporate Wellness Event Friendly",
      "Load-In / Load-Out Access",
      "Catering Friendly",
    ],
    rules: [
      "No smoking, vaping, or illegal substances anywhere on the premises.",
      "No parties, nightclub-style events, or unauthorized gatherings.",
      "No alcohol consumption without prior written approval.",
      "Equipment must be used as intended and with proper care.",
      "Return all equipment, weights, benches, and accessories to their original locations after use.",
      "Setup and breakdown time must be included within the reservation.",
      "No drilling, painting, nailing, stapling, or attaching items to walls, mirrors, ceilings, floors, or equipment.",
      "Sauna use is at your own risk.",
      "Leave the facility in the same condition it was received.",
      "Guest count may not exceed the approved reservation.",
      "Bookings may be immediately terminated without refund for smoking violations, unauthorized parties, excessive noise, property damage, unsafe conduct, illegal activity, or facility-policy violations.",
    ],
    pricingOptions: [
      {
        key: "productions",
        label: "Productions",
        hourlyRate: 500,
        minimumHours: 2,
        cleaningFee: 250,
        startingAt: 1250,
        idealFor: ["Fitness content creation", "Commercial productions", "Brand campaigns", "Athlete shoots", "Wellness photography", "Influencer content", "Podcast and interview productions"],
      },
      {
        key: "events_activations",
        label: "Events & Activations",
        hourlyRate: 750,
        minimumHours: 4,
        cleaningFee: 500,
        startingAt: 3500,
        idealFor: ["Wellness events", "Fitness workshops", "Brand activations", "Product launches", "Networking events", "Corporate wellness experiences", "Community gatherings"],
      },
      {
        key: "meetings_offsites",
        label: "Meetings & Offsites",
        hourlyRate: 500,
        minimumHours: 2,
        cleaningFee: 250,
        startingAt: 1250,
        idealFor: ["Executive meetings", "Team offsites", "Investor meetings", "Strategy sessions", "Wellness retreats", "Leadership workshops"],
      },
    ],
    priceLabel: "From $500/Hr",
    priceValue: 500,
    rating: "5.0",
    reviews: 81,
    image: WEHO_GYM_IMAGES[0],
    images: WEHO_GYM_IMAGES,
    pricingMode: "hourly",
  },
  {
    id: "beige-palm-springs-oasis",
    name: "Beige Studios Palm Springs Oasis",
    beds: 4,
    baths: 4,
    poolType: "Oasis",
    location: "72870 Deer Grass Dr. Palm Desert, CA",
    operatingHours: "Available by booking",
    weeklySchedule: "Available 7 days",
    minimumBookingHours: 2,
    description:
      "Escape to a private desert retreat where luxury, creativity, and relaxation come together. Beige Studios Palm Springs Oasis is a resort-style estate designed for premium productions, brand campaigns, executive retreats, wellness experiences, and unforgettable content creation. Surrounded by towering palm trees, mountain views, and iconic Palm Springs architecture, the property features expansive outdoor living spaces, a stunning resort-style pool, designer interiors, multiple lounge areas, and seamless indoor-outdoor flow.",
    highlights: ["Resort-Style Desert Estate", "Private Palm Springs Location", "Expansive Swimming Pool", "Stunning Mountain Views", "Iconic Palm Tree-Lined Grounds", "Indoor-Outdoor Living Experience", "Luxury Outdoor Dining & Lounge Areas", "Designer Interiors", "Multiple Content Creation Environments", "Golden Hour Friendly"],
    bestFor: ["Commercial Productions", "Brand Campaigns", "Luxury Lifestyle Photography", "Influencer Content", "Product Launches", "Executive Retreats", "Team Offsites", "Wellness Retreats", "Corporate Events", "Social Media Content", "Fashion Shoots", "Swimwear & Resort Wear Campaigns", "Podcast Recordings", "Private Dinners", "Networking Events"],
    amenities: [
      "Resort-Style Swimming Pool",
      "Private Palm Springs Estate",
      "Stunning Mountain Views",
      "Palm Tree-Lined Grounds",
      "Luxury Outdoor Lounge Areas",
      "Outdoor Dining Area",
      "Indoor-Outdoor Living Experience",
      "Private Courtyards",
      "Designer Interiors",
      "Modern Desert Architecture",
      "Abundant Natural Light",
      "Multiple Content Creation Environments",
      "Open Concept Living Spaces",
      "Designer Kitchen",
      "Multiple Bedrooms",
      "Luxury Bathrooms",
      "High-Speed WiFi",
      "Central Air Conditioning & Heating",
      "On-Site Parking",
      "Street Parking Available",
      "Private Gated Property",
      "Power Access Throughout Property",
      "Production-Friendly Layout",
      "Content Creator Friendly",
      "Influencer Friendly",
      "Brand Activation Friendly",
      "Event Friendly",
      "Retreat Friendly",
      "Meeting & Offsite Friendly",
      "Podcast Friendly",
      "Photography Friendly",
      "Video Production Friendly",
      "Furniture & Decor Included",
      "Catering Friendly",
      "Load-In / Load-Out Access",
    ],
    rules: [
      "No smoking, vaping, or illegal substances inside the home.",
      "No house parties, raves, ticketed events, or unauthorized gatherings.",
      "No overnight stays unless specifically approved in writing.",
      "Guest count may not exceed the approved reservation.",
      "Quiet hours are strictly enforced from 10:00 PM to 8:00 AM.",
      "No amplified outdoor music after quiet hours.",
      "No glass containers in or around the pool area.",
      "Setup and breakdown time must be included within the reservation.",
      "No drilling, painting, stapling, nailing, or attaching items to walls, floors, furniture, windows, or landscaping.",
      "Drone operations must comply with all FAA regulations and local restrictions.",
      "Park only in designated areas and do not block neighboring driveways, streets, gates, or emergency routes.",
      "Guests are responsible for all food, beverage, and trash cleanup.",
      "Bookings may be terminated without refund for unauthorized parties, excessive noise complaints, smoking violations, illegal activity, property damage, unauthorized guest counts, or Palm Springs city regulation violations.",
    ],
    pricingOptions: [
      {
        key: "productions",
        label: "Productions",
        hourlyRate: 250,
        minimumHours: 2,
        startingAt: 500,
        idealFor: ["Commercial productions", "Photography shoots", "Video productions", "Brand campaigns", "Social media content", "Influencer content", "Product photography"],
      },
      {
        key: "activations_events",
        label: "Activations & Events",
        hourlyRate: 500,
        minimumHours: 2,
        startingAt: 1000,
        idealFor: ["Brand activations", "Product launches", "Networking events", "Private dinners", "Corporate gatherings", "Wellness experiences", "Luxury experiences"],
      },
      {
        key: "meetings_offsites",
        label: "Meetings & Offsites",
        hourlyRate: 250,
        minimumHours: 2,
        startingAt: 500,
        idealFor: ["Executive meetings", "Team offsites", "Leadership retreats", "Investor meetings", "Strategy sessions", "Workshops", "Creative planning sessions"],
      },
    ],
    priceLabel: "From $250/Hr",
    priceValue: 250,
    image: PALM_SPRINGS_IMAGES[0],
    images: PALM_SPRINGS_IMAGES,
    pricingMode: "hourly",
  },
];

const STUDIO_BY_ID = new Map(
  [...WEEKEND_STUDIO_LIST, ...HOURLY_STUDIO_LIST].map((studio) => [studio.id, studio]),
);

export const STUDIO_META_MARKER = "[BEIGE_STUDIO_META]";

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const timeToMinutes = (time = "") => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

export const calculateHourlyDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return 0;
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 60));
};

export const getStudioById = (studioId: string) => STUDIO_BY_ID.get(studioId);

export const upsertSelectedStudio = (
  current: SelectedStudio[] = [],
  next: SelectedStudio,
) => {
  const filtered = current.filter((studio) => studio.studioId !== next.studioId);
  return [...filtered, next];
};

export const removeSelectedStudio = (current: SelectedStudio[] = [], studioId: string) =>
  current.filter((studio) => studio.studioId !== studioId);

export const buildWeekendStudioSelection = (studio: StudioCatalogItem): SelectedStudio => {
  const quantity = safeNumber(studio.nights, 1);
  const totalPrice = safeNumber(studio.priceValue, 0);

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "weekend",
    unitPrice: quantity > 0 ? totalPrice / quantity : totalPrice,
    quantity,
    totalPrice,
    priceLabel: studio.priceLabel,
    nights: quantity,
  };
};

export const buildHourlyStudioSelection = (
  studio: StudioCatalogItem,
  details: {
    selectedDate: string;
    startTime: string;
    endTime: string;
    pricingKey?: string;
  },
): SelectedStudio => {
  const durationHours = calculateHourlyDuration(details.startTime, details.endTime);
  const pricingOption =
    studio.pricingOptions?.find((option) => option.key === details.pricingKey) ||
    studio.pricingOptions?.[0];
  const unitPrice = safeNumber(pricingOption?.hourlyRate ?? studio.priceValue, 0);
  const minimumHours = safeNumber(pricingOption?.minimumHours ?? studio.minimumBookingHours, 1);
  const billableHours = Math.max(durationHours, minimumHours);
  const cleaningFee = safeNumber(pricingOption?.cleaningFee, 0);
  const totalPrice = unitPrice * billableHours + cleaningFee;

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "hourly",
    pricingCategory: pricingOption?.key,
    pricingLabel: pricingOption?.label,
    unitPrice,
    cleaningFee,
    minimumHours,
    quantity: billableHours,
    totalPrice,
    priceLabel: pricingOption
      ? `$${unitPrice.toLocaleString()}/hour${cleaningFee ? ` + $${cleaningFee.toLocaleString()} cleaning` : ""}`
      : studio.priceLabel,
    selectedDate: details.selectedDate,
    startTime: details.startTime,
    endTime: details.endTime,
  };
};

export const normalizeSelectedStudios = (payload: {
  selectedStudios?: SelectedStudio[];
  selectedStudioIds?: string[];
}) => {
  if (Array.isArray(payload.selectedStudios) && payload.selectedStudios.length) {
    return payload.selectedStudios.filter((studio) => !!studio?.studioId);
  }

  if (!Array.isArray(payload.selectedStudioIds)) return [];

  return payload.selectedStudioIds
    .map((studioId) => getStudioById(studioId))
    .filter((studio): studio is StudioCatalogItem => !!studio)
    .map((studio) =>
      studio.pricingMode === "hourly"
        ? {
            studioId: studio.id,
            name: studio.name,
            location: studio.location,
            image: studio.image,
            pricingMode: "hourly" as const,
            unitPrice: safeNumber(studio.priceValue, 0),
            quantity: 0,
            totalPrice: 0,
            priceLabel: studio.priceLabel,
          }
        : buildWeekendStudioSelection(studio),
    );
};

export const getSelectedStudiosTotal = (selectedStudios: SelectedStudio[] = []) =>
  selectedStudios.reduce((sum, studio) => sum + safeNumber(studio.totalPrice, 0), 0);

export const serializeStudioMeta = (selectedStudios: SelectedStudio[] = []) => {
  if (!selectedStudios.length) return "";
  return `${STUDIO_META_MARKER}${JSON.stringify(selectedStudios)}`;
};

export const parseStudioMeta = (text?: string | null): SelectedStudio[] => {
  if (!text) return [];
  const markerIndex = text.indexOf(STUDIO_META_MARKER);
  if (markerIndex === -1) return [];
  const raw = text.slice(markerIndex + STUDIO_META_MARKER.length).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((studio) => studio && typeof studio.studioId === "string")
      .map((studio) => ({
        studioId: String(studio.studioId),
        name: String(studio.name || ""),
        location: String(studio.location || ""),
        image: String(studio.image || ""),
        pricingMode: studio.pricingMode === "hourly" ? "hourly" : "weekend",
        pricingCategory: studio.pricingCategory ? String(studio.pricingCategory) : undefined,
        pricingLabel: studio.pricingLabel ? String(studio.pricingLabel) : undefined,
        unitPrice: safeNumber(studio.unitPrice, 0),
        cleaningFee: safeNumber(studio.cleaningFee, 0) || undefined,
        minimumHours: safeNumber(studio.minimumHours, 0) || undefined,
        quantity: safeNumber(studio.quantity, 0),
        totalPrice: safeNumber(studio.totalPrice, 0),
        priceLabel: String(studio.priceLabel || ""),
        nights: safeNumber(studio.nights, 0) || undefined,
        selectedDate: studio.selectedDate ? String(studio.selectedDate) : undefined,
        startTime: studio.startTime ? String(studio.startTime) : undefined,
        endTime: studio.endTime ? String(studio.endTime) : undefined,
        lat: studio.lat ? safeNumber(studio.lat) : undefined,
        lng: studio.lng ? safeNumber(studio.lng) : undefined,
      }));
  } catch {
    return [];
  }
};
