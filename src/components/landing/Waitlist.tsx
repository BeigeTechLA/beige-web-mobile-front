"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
}

export const Waitlist = () => {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Waitlist form submitted:', formData);
    setStatus("loading");
    // Mock submission
    setTimeout(() => setStatus("success"), 1500);
  };

  return (
    <section className="py-10 md:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="p-5 lg:p-10 lg:py-[100px] lg:px-[50px] bg-[#171717] rounded-[20px] mx-auto text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5 lg:mb-24"
          >
            <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
              <p className="text-xs md:text-base text-white">Contact Us</p>
            </div>

            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-6 tracking-tight">
              Coming to Your City Soon.
            </h2>
            <p className="text-white/50 text-xs lg:text-base lg:max-w-2/3 mx-auto font-light">
              We&apos;re currently launching in Los Angeles, but we&apos;re expanding to
              new cities soon. Join our waitlist to be the first to know when
              Beige becomes available in your area and get priority access when
              we launch.
            </p>
          </motion.div>

          {/* Main Content Row */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-24 bg-[#010101] rounded-[20px]">
            {/* LEFT: Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 text-left p-5 lg:p-16"
            >
              <div className="mb-5 lg:mb-12">
                <p className="text-xl lg:text-[28px] text-white font-light">
                  Get Early Access to Beige
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-6">
                <div className="relative">
                  <label className="absolute -top-[10px] left-[20px] bg-[#010101] px-2 text-white/60 text-[10px] lg:text-sm tracking-wide">
                    Full Name*
                  </label>
                  <input
                    className="w-full h-14 lg:h-[74px] bg-[#010101] border border-white/20 rounded-[5px] lg:rounded-xl px-6 text-white text-base lg:text-lg outline-none focus:border-white/60 transition-all"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-[10px] left-[20px] bg-[#010101] px-2 text-white/60 text-[10px] lg:text-sm tracking-wide">
                    Email ID*
                  </label>
                  <input
                    className="w-full h-14 lg:h-[74px] bg-[#010101] border border-white/20 rounded-[5px] lg:rounded-xl px-6 text-white text-base lg:text-lg outline-none focus:border-white/60 transition-all"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-[10px] left-[20px] bg-[#010101] px-2 text-white/60 text-[10px] lg:text-sm tracking-wide">
                    Mobile Number
                  </label>
                  <input
                    className="w-full h-14 lg:h-[74px] bg-[#010101] border border-white/20 rounded-[5px] lg:rounded-xl px-6 text-white text-base lg:text-lg outline-none focus:border-white/60 transition-all"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-[10px] left-[20px] bg-[#010101] px-2 text-white/60 text-[10px] lg:text-sm tracking-wide">
                    Company Name
                  </label>
                  <input
                    className="w-full h-14 lg:h-[74px] bg-[#010101] border border-white/20 rounded-[5px] lg:rounded-xl px-6 text-white text-base lg:text-lg outline-none focus:border-white/60 transition-all"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-[10px] left-[20px] bg-[#010101] px-2 text-white/60 text-[10px] lg:text-sm tracking-wide">
                    Location (City)*
                  </label>
                  <input
                    className="w-full h-14 lg:h-[74px] bg-[#010101] border border-white/20 rounded-[5px] lg:rounded-xl px-6 text-white text-base lg:text-lg outline-none focus:border-white/60 transition-all"
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mt-4 flex justify-center lg:justify-start">
                  <Button
                    type="submit"
                    className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4  pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
                    disabled={status === "loading"}
                  >
                    <span className="lg:pr-4 text-sm md:text-xl">
                      {status === "loading"
                        ? "Joining..."
                        : "Join Waitlist"}
                    </span>

                    {/* Right Dark Icon Box */}
                    <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="32"
                        viewBox="0 0 33 26"
                        fill="none"
                      >
                        <path
                          d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z"
                          fill="#E8D1AB"
                        />
                      </svg>
                    </div>
                  </Button>
                </div>

                {status === "success" && (
                  <div className="text-green-400 mt-4 p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
                    You have successfully joined the waitlist!
                  </div>
                )}
              </form>
            </motion.div>

            {/* RIGHT: Globe Image Column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 flex items-center justify-center"
            >
              <div className="relative w-full h-[225px] lg:h-[700px] xl:h-[800px] max-w-[500px] lg:max-w-none">
                <Image
                  src="/images/misc/SquareGlobe.png"
                  alt="Global Reach"
                  fill
                  className="object-cover lg:object-contain"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
