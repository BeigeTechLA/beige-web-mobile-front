"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { BookingDataV3 } from "./types";

import { motion } from "framer-motion";

import { toast } from "sonner";
import Link from "next/link";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AddStudioSuccessPage: React.FC<Props> = ({
  data,
}) => {
  return (
    <div className="pt-20 lg:pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full min-h-[60vh]">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#E8D1AB]/20 blur-[60px] rounded-full" />
            <div className="relative w-[360px] h-[220px] lg:w-[548px] lg:h-[344px]">
              <Image
                src="/images/misc/PaymentSuccess.gif"
                alt="Payment Done"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
          <h2 className="text-lg lg:text-4xl font-medium mb-5 lg:mb-11 text-center">Studio Added Successfully</h2>
          <Link
            href={`#`}
            className="text-lg lg:text-xl text-black font-medium py-8 px-15 bg-[#E8D1AB] rounded-lg"
          >
            Review Booking Summary
          </Link>
        </motion.div>
      </div>
    </div>
  )
};