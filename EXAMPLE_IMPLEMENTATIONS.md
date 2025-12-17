# Example API Implementations

This file contains example code for integrating backend APIs into existing components.

## 1. Search Results Page with Real API

Replace mock data in `/app/search-results/page.tsx`:

```tsx
"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "@/src/components/landing/Separator";

import NewCreatorsSection from "./components/NewCreatorsSection";
import SimilarCreatorsSection from "./components/SimilarCreatorsSection";
import HeroSection from "./components/HeroSection";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const shootId = searchParams.get("shootId") || undefined;

  // Get filters from URL params
  const budget = searchParams.get("budget") ? parseInt(searchParams.get("budget")!) : undefined;
  const location = searchParams.get("location") || undefined;
  const contentType = searchParams.get("content_type") ? parseInt(searchParams.get("content_type")!) : undefined;

  // Fetch creators from API
  const { data, isLoading, error } = useSearchCreatorsQuery({
    budget,
    location,
    content_type: contentType,
    page: 1,
    limit: 20
  });

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-screen">
        <div className="text-white">Loading creators...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-screen">
        <div className="text-red-400">Failed to load creators. Please try again.</div>
      </div>
    );
  }

  // Transform API data to component format
  const matchedCreators = data?.data.map(creator => ({
    id: creator.crew_member_id.toString(),
    name: creator.name,
    role: creator.role_name || "Creator",
    price: `From $${creator.hourly_rate || 0}/Hr`,
    rating: creator.rating || 0,
    reviews: creator.total_reviews || 0,
    image: creator.profile_image || "/images/influencer/default.png",
    isTopMatch: false // You can implement logic for top match
  })) || [];

  return (
    <div className="pt-32 pb-20">
      <HeroSection matchedCreators={matchedCreators} shootId={shootId} />
      <Separator />

      {/* Keep existing sections with mock data or fetch separately */}
      <SimilarCreatorsSection
        additionalCreators={[]}
        shootId={shootId}
      />

      <NewCreatorsSection
        newCreators={[]}
        shootId={shootId}
      />
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <SearchResultsContent />
      </Suspense>
      <Footer />
    </main>
  );
}
```

## 2. Creator Profile Page with Real API

Replace mock data in `/app/search-results/[creatorId]/page.tsx`:

```tsx
"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetCreatorProfileQuery } from "@/lib/redux/features/creators/creatorsApi";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "./components/Separator";

import CreatorGallery from "./components/CreatorGallery";

function CreatorProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const creatorId = parseInt(params.creatorId as string);
  const shootId = searchParams.get("shootId") ?? undefined;

  // Fetch creator profile from API
  const { data: creator, isLoading, error } = useGetCreatorProfileQuery(creatorId);

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-screen">
        <div className="text-white">Loading creator profile...</div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-screen">
        <div className="text-red-400">Creator not found</div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20">
      <div className="px-4 md:px-0">
        <section className="mx-auto mt-12 container">
          <Link
            href={`/search-results${shootId ? `?shootId=${shootId}` : ""}`}
            className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: Gallery */}
            <div className="w-1/2">
              <CreatorGallery mockCreator={{
                images: creator.portfolio?.slice(0, 7).map(p => p.image_url || "") || [],
                ...creator
              }} />
            </div>

            {/* Right: Info */}
            <div className="flex-1 w-1/2 flex flex-col gap-[30px]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <h1 className="text-3xl font-medium text-white">
                    {creator.name}
                  </h1>
                  <p className="text-[#E8D1AB] text-[22px]">{creator.role_name}</p>
                </div>
                {creator.is_available && (
                  <p className="bg-[#EDF7EE] text-[#4CAF50] text-xl px-5 py-3 rounded-full border border-[#4CAF50] leading-[20px]">
                    Available
                  </p>
                )}
              </div>
              <Separator />

              {/* About */}
              <div className="flex flex-col gap-3.5">
                <h3 className="text-xl font-bold text-white">About Creator</h3>
                <p className="text-white/60 leading-relaxed text-lg font-normal">
                  {creator.bio || "No bio available"}
                </p>
              </div>
              <Separator />

              {/* Skills */}
              {creator.skills && creator.skills.length > 0 && (
                <>
                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-xl font-bold text-white">Skills</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {creator.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Equipment */}
              {creator.equipment && creator.equipment.length > 0 && (
                <div className="flex flex-col gap-3.5">
                  <h3 className="text-xl font-bold text-white">Equipment's</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {creator.equipment.map((item) => (
                      <span
                        key={item}
                        className="px-5 py-4 bg-[#101010] border border-white/20 rounded-[10px] text-sm font-medium text-white/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="bg-[#171717] rounded-[20px] p-7 flex flex-col gap-7 mt-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <p className="text-white text-2xl font-semibold">
                      Starting Price
                    </p>
                    <span className="text-white text-sm">for 1 hour</span>
                  </div>

                  <span className="text-3xl font-bold text-white">
                    ${creator.hourly_rate || 0}
                  </span>
                </div>
                <Link
                  href={`/search-results/${creatorId}/payment${shootId ? `?shootId=${shootId}` : ""}`}
                  className="w-full md:w-auto"
                >
                  <Button className="w-full h-[71px] px-10 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-2xl font-medium rounded-[12px]">
                    Proceed to Payment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <CreatorProfileContent />
      </Suspense>
      <Footer />
    </main>
  );
}
```

## 3. Authentication Modal Component

Create `/src/components/auth/AuthModal.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
        toast.success("Login successful!");
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        });
        toast.success("Registration successful!");
      }

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : "Authentication failed";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#171717] rounded-[20px] p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-white/60 text-sm">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#101010] border border-white/20 rounded-lg text-white"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="text-white/60 text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#101010] border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-[#101010] border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-white/60 text-sm">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#101010] border border-white/20 rounded-lg text-white"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#E8D1AB] hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-white/60 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

## 4. Protected Booking Component

Create `/src/components/booking/ProtectedBooking.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCreateBookingMutation } from "@/lib/redux/features/booking/bookingApi";
import { AuthModal } from "@/src/components/auth/AuthModal";
import { toast } from "sonner";
import { BookingData } from "@/lib/types";

export function ProtectedBooking() {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const handleBooking = async (bookingData: BookingData) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const result = await createBooking(bookingData).unwrap();
      toast.success(`Booking created! Confirmation: ${result.confirmation_number}`);
      // Navigate to confirmation page
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : "Failed to create booking";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      {/* Your booking form UI */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Retry booking after successful auth
          toast.success("Authentication successful! Continue with your booking.");
        }}
      />
    </>
  );
}
```

## 5. User Profile Component

Create `/src/components/user/UserProfile.tsx`:

```tsx
"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGetUserBookingsQuery } from "@/lib/redux/features/booking/bookingApi";

export function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: bookingsData, isLoading } = useGetUserBookingsQuery(
    { page: 1, limit: 10 },
    { skip: !isAuthenticated }
  );

  if (!isAuthenticated) {
    return <div>Please login to view your profile</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.name}</h1>
        <p className="text-white/60">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Bookings</h2>
        {isLoading ? (
          <div className="text-white/60">Loading bookings...</div>
        ) : (
          <div className="space-y-4">
            {bookingsData?.data.map((booking) => (
              <div
                key={booking.stream_project_booking_id}
                className="p-6 bg-[#171717] rounded-lg"
              >
                <h3 className="text-xl font-semibold text-white">
                  {booking.order_name}
                </h3>
                <p className="text-white/60">Status: {booking.status}</p>
                <p className="text-white/60">
                  Date: {new Date(booking.start_date_time).toLocaleDateString()}
                </p>
                <p className="text-white/60">
                  Duration: {booking.duration_hours} hours
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Implementation Checklist

- [x] Install dependencies
- [x] Create API client
- [x] Set up Redux store
- [x] Create auth slice and API
- [x] Create booking slice and API
- [x] Create creators API
- [x] Create waitlist API
- [x] Create useAuth hook
- [x] Integrate Redux Provider in layout
- [x] Update Waitlist component
- [ ] Update search results page with real API
- [ ] Update creator profile page with real API
- [ ] Create authentication modal
- [ ] Integrate auth in booking flow
- [ ] Create user profile/dashboard page
