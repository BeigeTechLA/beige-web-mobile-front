-- =====================================================
-- Revure Crew Members Import Script
-- =====================================================
-- This script cleans existing crew members and imports new ones
-- Generated on: 2026-01-14
-- Total crew members: 46

-- =====================================================
-- STEP 1: Backup existing data (optional, uncomment if needed)
-- =====================================================
CREATE TABLE crew_members_backup AS SELECT * FROM crew_members;

-- =====================================================
-- STEP 2: Clean existing crew members
-- =====================================================
-- WARNING: This will delete all existing crew members
-- Uncomment the line below to execute
DELETE FROM crew_members;

-- =====================================================
-- STEP 3: Insert new crew members
-- =====================================================

-- Videography specialists
INSERT INTO crew_members (first_name, last_name, email, phone_number, skills, city, state, hourly_rate, equipment_ownership, portfolio_url, profile_image, bio) VALUES
('Amit', 'Sharma', 'amit.sharma@example.com', '+1-555-0101', '["videography", "cinematography", "drone"]', 'Los Angeles', 'CA', 250.00, '["Sony FX6", "DJI Mavic 3 Pro", "Gimbal"]', 'https://portfolio.com/amit', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Professional videographer specializing in cinematic content and aerial shots'),

('Priya', 'Patel', 'priya.patel@example.com', '+1-555-0102', '["videography", "editing", "color grading"]', 'San Francisco', 'CA', 280.00, '["Canon C70", "DaVinci Resolve Station"]', 'https://portfolio.com/priya', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Videographer and colorist with 8+ years of experience'),

('Raj', 'Kumar', 'raj.kumar@example.com', '+1-555-0103', '["videography", "live streaming", "multi-cam"]', 'Austin', 'TX', 260.00, '["Blackmagic 6K", "ATEM Mini Extreme", "Wireless Video"]', 'https://portfolio.com/raj', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Live streaming expert and multi-camera operator'),

('Neha', 'Singh', 'neha.singh@example.com', '+1-555-0104', '["videography", "documentary", "interviews"]', 'New York', 'NY', 300.00, '["Sony A7S III", "Audio Recorder", "LED Lights"]', 'https://portfolio.com/neha', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Documentary filmmaker and interview specialist'),

('Vikram', 'Reddy', 'vikram.reddy@example.com', '+1-555-0105', '["videography", "sports", "action"]', 'Miami', 'FL', 270.00, '["GoPro Hero 12", "DJI RS3 Pro", "Slow Motion Camera"]', 'https://portfolio.com/vikram', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Action and sports videography specialist'),

('Anjali', 'Desai', 'anjali.desai@example.com', '+1-555-0106', '["videography", "wedding", "events"]', 'Chicago', 'IL', 240.00, '["Canon R5C", "Ronin RS2", "Wireless Mic"]', 'https://portfolio.com/anjali', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Wedding and event videographer with artistic vision'),

('Rohan', 'Gupta', 'rohan.gupta@example.com', '+1-555-0107', '["videography", "commercial", "corporate"]', 'Seattle', 'WA', 290.00, '["RED Komodo", "Professional Lighting Kit", "Teleprompter"]', 'https://portfolio.com/rohan', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Commercial and corporate video production specialist'),

('Kavya', 'Iyer', 'kavya.iyer@example.com', '+1-555-0108', '["videography", "music videos", "creative"]', 'Nashville', 'TN', 265.00, '["Sony FX3", "Anamorphic Lenses", "RGB Lights"]', 'https://portfolio.com/kavya', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Creative director specializing in music videos and artistic content'),

('Arjun', 'Nair', 'arjun.nair@example.com', '+1-555-0109', '["videography", "real estate", "virtual tours"]', 'Denver', 'CO', 230.00, '["Insta360 Pro 2", "Gimbal", "Wide Angle Lens"]', 'https://portfolio.com/arjun', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Real estate and virtual tour specialist'),

('Ishita', 'Mehta', 'ishita.mehta@example.com', '+1-555-0110', '["videography", "fashion", "beauty"]', 'Los Angeles', 'CA', 275.00, '["Canon R5", "Fashion Lighting", "Reflectors"]', 'https://portfolio.com/ishita', 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400', 'Fashion and beauty content creator');

-- Photography specialists
INSERT INTO crew_members (first_name, last_name, email, phone_number, skills, city, state, hourly_rate, equipment_ownership, portfolio_url, profile_image, bio) VALUES
('Aditya', 'Joshi', 'aditya.joshi@example.com', '+1-555-0201', '["photography", "portrait", "studio"]', 'Los Angeles', 'CA', 220.00, '["Canon R5", "Studio Strobe Kit", "Softboxes"]', 'https://portfolio.com/aditya', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Portrait and studio photography expert'),

('Divya', 'Rao', 'divya.rao@example.com', '+1-555-0202', '["photography", "wedding", "candid"]', 'San Diego', 'CA', 260.00, '["Sony A1", "85mm f/1.4", "Flash Kit"]', 'https://portfolio.com/divya', 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=400', 'Wedding and candid photography specialist'),

('Karan', 'Malhotra', 'karan.malhotra@example.com', '+1-555-0203', '["photography", "commercial", "product"]', 'San Francisco', 'CA', 280.00, '["Phase One", "Product Table", "LED Panels"]', 'https://portfolio.com/karan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Commercial and product photography expert'),

('Shreya', 'Bhatt', 'shreya.bhatt@example.com', '+1-555-0204', '["photography", "fashion", "editorial"]', 'New York', 'NY', 290.00, '["Nikon Z9", "Fashion Lighting", "Medium Format"]', 'https://portfolio.com/shreya', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Fashion and editorial photographer'),

('Manish', 'Verma', 'manish.verma@example.com', '+1-555-0205', '["photography", "landscape", "nature"]', 'Portland', 'OR', 210.00, '["Nikon D850", "Wide Angle Lens", "ND Filters"]', 'https://portfolio.com/manish', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Landscape and nature photography specialist'),

('Pooja', 'Kapoor', 'pooja.kapoor@example.com', '+1-555-0206', '["photography", "food", "lifestyle"]', 'Portland', 'OR', 240.00, '["Canon R6", "Macro Lens", "Food Styling Kit"]', 'https://portfolio.com/pooja', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Food and lifestyle photography expert'),

('Siddharth', 'Pillai', 'siddharth.pillai@example.com', '+1-555-0207', '["photography", "sports", "action"]', 'Boston', 'MA', 270.00, '["Sony A9 II", "400mm f/2.8", "Monopod"]', 'https://portfolio.com/siddharth', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Sports and action photography specialist'),

('Ananya', 'Shah', 'ananya.shah@example.com', '+1-555-0208', '["photography", "real estate", "architectural"]', 'San Francisco', 'CA', 250.00, '["Canon R5", "Tilt-Shift Lens", "Drone"]', 'https://portfolio.com/ananya', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Real estate and architectural photographer'),

('Nikhil', 'Chopra', 'nikhil.chopra@example.com', '+1-555-0209', '["photography", "events", "concerts"]', 'Las Vegas', 'NV', 255.00, '["Nikon Z8", "Fast Primes", "Flash"]', 'https://portfolio.com/nikhil', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Event and concert photographer'),

('Riya', 'Saxena', 'riya.saxena@example.com', '+1-555-0210', '["photography", "newborn", "family"]', 'Austin', 'TX', 230.00, '["Canon R6 II", "50mm f/1.2", "Soft Light"]', 'https://portfolio.com/riya', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Newborn and family portrait specialist');

-- Mixed videography and photography specialists
INSERT INTO crew_members (first_name, last_name, email, phone_number, skills, city, state, hourly_rate, equipment_ownership, portfolio_url, profile_image, bio) VALUES
('Varun', 'Thakur', 'varun.thakur@example.com', '+1-555-0301', '["videography", "photography", "hybrid"]', 'Los Angeles', 'CA', 285.00, '["Sony A7S III", "Sony A1", "Complete Kit"]', 'https://portfolio.com/varun', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Hybrid shooter - both photo and video specialist'),

('Meera', 'Bansal', 'meera.bansal@example.com', '+1-555-0302', '["videography", "photography", "events"]', 'Miami', 'FL', 275.00, '["Canon R5C", "Flash Kit", "Gimbal"]', 'https://portfolio.com/meera', 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=400', 'Event specialist covering both photo and video'),

('Sahil', 'Agarwal', 'sahil.agarwal@example.com', '+1-555-0303', '["videography", "photography", "wedding"]', 'Orlando', 'FL', 270.00, '["Dual Camera Setup", "Lighting Kit", "Audio"]', 'https://portfolio.com/sahil', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Wedding specialist with photo and video expertise'),

('Tanya', 'Bose', 'tanya.bose@example.com', '+1-555-0304', '["videography", "photography", "corporate"]', 'Atlanta', 'GA', 290.00, '["Professional Kit", "Corporate Gear", "Lighting"]', 'https://portfolio.com/tanya', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Corporate content creator - photo and video'),

('Ashwin', 'Srinivasan', 'ashwin.srinivasan@example.com', '+1-555-0305', '["videography", "photography", "commercial"]', 'San Jose', 'CA', 295.00, '["High-End Camera Package", "Lighting", "Grip"]', 'https://portfolio.com/ashwin', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Commercial content specialist'),

('Isha', 'Chatterjee', 'isha.chatterjee@example.com', '+1-555-0306', '["videography", "photography", "fashion"]', 'New York', 'NY', 300.00, '["Fashion Photography Kit", "Cinema Camera", "Lighting"]', 'https://portfolio.com/isha', 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400', 'Fashion content creator with dual expertise'),

('Sameer', 'Khan', 'sameer.khan@example.com', '+1-555-0307', '["videography", "photography", "documentary"]', 'Seattle', 'WA', 280.00, '["Documentary Kit", "Audio Gear", "Lighting"]', 'https://portfolio.com/sameer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Documentary filmmaker and photographer'),

('Naina', 'Kulkarni', 'naina.kulkarni@example.com', '+1-555-0308', '["videography", "photography", "social media"]', 'Los Angeles', 'CA', 260.00, '["Content Creator Kit", "Ring Light", "Gimbal"]', 'https://portfolio.com/naina', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Social media content specialist'),

('Abhinav', 'Mishra', 'abhinav.mishra@example.com', '+1-555-0309', '["videography", "photography", "travel"]', 'San Diego', 'CA', 265.00, '["Travel Kit", "Drone", "Compact Gear"]', 'https://portfolio.com/abhinav', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Travel content creator with photography and videography skills'),

('Simran', 'Dhawan', 'simran.dhawan@example.com', '+1-555-0310', '["videography", "photography", "lifestyle"]', 'Denver', 'CO', 255.00, '["Lifestyle Kit", "Natural Light Gear", "Audio"]', 'https://portfolio.com/simran', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Lifestyle content creator');

-- Additional specialists
INSERT INTO crew_members (first_name, last_name, email, phone_number, skills, city, state, hourly_rate, equipment_ownership, portfolio_url, profile_image, bio) VALUES
('Gaurav', 'Pandey', 'gaurav.pandey@example.com', '+1-555-0401', '["videography", "editing", "post-production"]', 'Los Angeles', 'CA', 270.00, '["Editing Workstation", "Color Grading Monitor", "Storage"]', 'https://portfolio.com/gaurav', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Post-production specialist and editor'),

('Aditi', 'Menon', 'aditi.menon@example.com', '+1-555-0402', '["photography", "videography", "creative director"]', 'San Francisco', 'CA', 310.00, '["Full Production Kit", "Lighting Package", "Grip"]', 'https://portfolio.com/aditi', 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=400', 'Creative director with comprehensive production skills'),

('Harsh', 'Tandon', 'harsh.tandon@example.com', '+1-555-0403', '["videography", "cinematography", "director"]', 'Austin', 'TX', 320.00, '["Cinema Camera Package", "Lighting", "Grip Kit"]', 'https://portfolio.com/harsh', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Cinematographer and director'),

('Kriti', 'Bajaj', 'kriti.bajaj@example.com', '+1-555-0404', '["photography", "retouching", "post-production"]', 'New York', 'NY', 250.00, '["Photography Kit", "Calibrated Monitor", "Wacom Tablet"]', 'https://portfolio.com/kriti', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Photographer and retouching specialist'),

('Mohit', 'Goswami', 'mohit.goswami@example.com', '+1-555-0405', '["videography", "drone", "aerial"]', 'Phoenix', 'AZ', 280.00, '["DJI Inspire 3", "FPV Drone", "Ground Camera"]', 'https://portfolio.com/mohit', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Aerial cinematographer and drone specialist'),

('Pallavi', 'Dutta', 'pallavi.dutta@example.com', '+1-555-0406', '["photography", "art", "fine art"]', 'Portland', 'OR', 240.00, '["Medium Format", "Studio Setup", "Fine Art Printing"]', 'https://portfolio.com/pallavi', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Fine art photographer'),

('Yash', 'Sinha', 'yash.sinha@example.com', '+1-555-0407', '["videography", "animation", "motion graphics"]', 'San Jose', 'CA', 275.00, '["Animation Workstation", "Graphics Tablet", "Camera"]', 'https://portfolio.com/yash', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Motion graphics and video specialist'),

('Sonali', 'Raghavan', 'sonali.raghavan@example.com', '+1-555-0408', '["photography", "journalism", "documentary"]', 'Washington', 'DC', 260.00, '["Photojournalism Kit", "Fast Lenses", "Flash"]', 'https://portfolio.com/sonali', 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400', 'Photojournalist and documentary photographer'),

('Aryan', 'Khanna', 'aryan.khanna@example.com', '+1-555-0409', '["videography", "corporate", "training videos"]', 'Chicago', 'IL', 265.00, '["Corporate Setup", "Teleprompter", "Audio Kit"]', 'https://portfolio.com/aryan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Corporate and training video specialist'),

('Navya', 'Vyas', 'navya.vyas@example.com', '+1-555-0410', '["photography", "portrait", "headshots"]', 'San Francisco', 'CA', 235.00, '["Portrait Camera", "Studio Lighting", "Backdrop System"]', 'https://portfolio.com/navya', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Portrait and headshot photographer'),

('Kunal', 'Jain', 'kunal.jain@example.com', '+1-555-0411', '["videography", "photography", "automotive"]', 'Detroit', 'MI', 290.00, '["Automotive Photo Kit", "Rig Setup", "Lighting"]', 'https://portfolio.com/kunal', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Automotive photography and videography specialist'),

('Sanya', 'Malhotra', 'sanya.malhotra@example.com', '+1-555-0412', '["videography", "photography", "influencer"]', 'Los Angeles', 'CA', 245.00, '["Content Creator Setup", "Lighting", "Audio"]', 'https://portfolio.com/sanya', 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?w=400', 'Influencer and content creator'),

('Tarun', 'Bhatia', 'tarun.bhatia@example.com', '+1-555-0413', '["videography", "live events", "broadcast"]', 'New York', 'NY', 300.00, '["Broadcast Camera", "Switcher", "Wireless Systems"]', 'https://portfolio.com/tarun', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Live event and broadcast specialist'),

('Diya', 'Naik', 'diya.naik@example.com', '+1-555-0414', '["photography", "e-commerce", "product"]', 'Seattle', 'WA', 230.00, '["Product Photography Setup", "Turntable", "Lighting"]', 'https://portfolio.com/diya', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'E-commerce and product photography specialist'),

('Vivek', 'Raman', 'vivek.raman@example.com', '+1-555-0415', '["videography", "photography", "underwater"]', 'San Diego', 'CA', 310.00, '["Underwater Housing", "Dive Lights", "Waterproof Gear"]', 'https://portfolio.com/vivek', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Underwater photography and videography specialist'),

('Tanvi', 'Ahuja', 'tanvi.ahuja@example.com', '+1-555-0416', '["photography", "videography", "pet"]', 'Denver', 'CO', 220.00, '["Animal Photography Kit", "Fast Lenses", "Treats"]', 'https://portfolio.com/tanvi', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Pet photography and videography specialist');

-- =====================================================
-- STEP 4: Verify import
-- =====================================================
-- SELECT COUNT(*) as total_crew_members FROM crew_members;
-- SELECT first_name, last_name, email, city, state, hourly_rate FROM crew_members ORDER BY hourly_rate DESC LIMIT 10;

-- =====================================================
-- Notes:
-- =====================================================
-- 1. Adjust table/column names if your schema differs
-- 2. Uncomment the DELETE statement only after backing up data
-- 3. Some fields like role_id, user_id may need manual mapping
-- 4. Profile photos use placeholder Unsplash URLs
-- 5. Skills and equipment are stored as JSON arrays
-- 6. All rates are in USD per hour
-- =====================================================
