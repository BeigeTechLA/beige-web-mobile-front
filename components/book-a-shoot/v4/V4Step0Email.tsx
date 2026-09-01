"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDataV4 } from "./types";

interface Props {
    data: BookingDataV4;
    updateData: (data: Partial<BookingDataV4>) => void;
    onNext: () => void;
    isLoading?: boolean;
}

export const V4Step0Email: React.FC<Props> = ({
    data,
    updateData,
    onNext,
    isLoading = false,
}) => {
    const [email, setEmail] = useState(data.email || "");
    const [fullName, setFullName] = useState(data.fullName || "");
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (val: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(val.trim());
    };

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
            setError("Please enter your email address to continue.");
            return;
        }
        if (!validateEmail(trimmed)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError(null);
        updateData({ email: trimmed, fullName: fullName.trim() || data.fullName });
        onNext();
    };

    return (
        <div className="w-full flex items-center justify-center py-4 md:py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                    background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
                    backdropFilter: "blur(20px)",
                }}
                className="w-full max-w-5xl border border-white/10 rounded-[28px] md:rounded-[36px] overflow-hidden shadow-2xl p-6 sm:p-8 md:p-12"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6 md:space-y-8 pr-0 lg:pr-4">
                        {/* Eyebrow badge */}
                        <div>
                            <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#D8C6A5] uppercase">
                                A GUIDED BOOKING
                            </span>
                        </div>

                        {/* Heading & Subtitle */}
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-[1.15]">
                                Let&apos;s get your
                                <br />
                                project started.
                            </h1>
                            <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed max-w-md">
                                We&apos;ll use your email to save your booking and keep you updated.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleContinue} className="space-y-6 pt-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="v4-email"
                                    className="block text-[11px] sm:text-xs font-semibold tracking-wider text-[#A0A0A0] uppercase"
                                >
                                    EMAIL ID
                                </label>
                                <div className="relative">
                                    <input
                                        id="v4-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError(null);

                                        }}
                                        autoFocus
                                        className="w-full bg-transparent border-b border-white/20 focus:border-[#E5D5B8] py-3 text-base sm:text-lg text-white placeholder-white/25 outline-none transition-colors duration-200"
                                    />
                                </div>
                                {error && (
                                    <p className="text-xs text-red-400 mt-1.5 animate-fadeIn">
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Continue Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Continue</span>
                                    )}
                                </button>
                            </div>

                            {/* Privacy badge */}
                            <div className="flex items-center gap-2 pt-1 text-xs text-[#7A7A7A]">
                                <CheckCircle2 className="w-4 h-4 text-[#7A7A7A] shrink-0" strokeWidth={1.75} />
                                <span>Your information stays private and secure.</span>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Exact Figma Production Crew On Set Image */}
                    <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[420px] lg:h-[500px] rounded-2xl md:rounded-[24px] overflow-hidden bg-[#181818] border border-white/10 shadow-inner">
                        <Image
                            src="/images/v4/Image (A Beige production crew on set).png"
                            alt="A Beige production crew on set"
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 450px"
                        />
                        {/* Ambient Lighting Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
