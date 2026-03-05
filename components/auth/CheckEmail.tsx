"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Separator } from "@/src/components/landing/Separator";
import Link from "next/link";
import { Button } from "../ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResend: () => void;
}

const CheckEmail = ({ isOpen, onClose, email, onResend }: ModalProps) => {
  const [counter, setCounter] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && counter > 0) {
      timer = setInterval(() => setCounter((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, counter]);

  const handleOpenEmail = () => {
    window.location.href = "mailto:";
  };

  const handleResend = () => {
    if (counter === 0) {
      onResend();
      setCounter(60);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg md:max-w-xl 2xl:max-w-2xl bg-[linear-gradient(354deg,_#090909_4.46%,_#101010_94.68%)] rounded-[24px] p-6 lg:p-12 shadow-2xl pointer-events-auto border border-transparent flex flex-col items-center"
              style={{
                background: `
                  linear-gradient(354deg, #090909 4.46%, #101010 94.68%) padding-box,
                  linear-gradient(to bottom, #E8D1AB, #E8D1AB1A) border-box
                `,
                border: '1px solid transparent',
              }}
            >
              <div className="bg-white/5 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-full border border-white/10 shadow-2xl mb-6 lg:mb-12">
                <Link
                  href="/"
                  className="relative flex items-center"
                >
                  <Image
                    src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
                    alt="BEIGE"
                    width={100}
                    height={30}
                    className="object-contain w-[80px] md:w-[120px] h-auto"
                    priority
                  />
                  <span className="absolute -right-1 md:right-1 -bottom-6 md:-bottom-9 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
                    Beta
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
                  </span>
                </Link>
              </div>
              <Separator />

              <div className="relative w-28 h-28 lg:w-55 lg:h-55 mb-1">
                <Image
                  src="/images/Email.gif"
                  alt="Email Notification"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              <h2 className="text-lg lg:text-[34px] font-bold text-white mb-2">Check Your Email</h2>
              <p className="lg:text-lg text-center text-white/60 mb-8 px-4">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                This might take a moment. If it doesn't appear, please try again.
              </p>


              <Button
                onClick={handleOpenEmail}
                className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-14 lg:h-19 rounded-xl lg:text-xl font-semibold mb-6"
              >
                Open Email
              </Button>


              <div className="text-center mb-10">
                <button
                  onClick={handleResend}
                  disabled={counter > 0}
                  className={`${counter > 0 ? 'text-[#8C8C8C]' : 'text-[#E8D1AB] hover:underline text-lg'}`}
                >
                  Resend Link <span className="text-white font-medium">{counter > 0 && `(${counter}s)`}</span>
                </button>
              </div>

              <Separator />

              <Link href="/login" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-[#E8D1AB] hover:text-white hover:bg-transparent h-9 lg:h-12 text-sm md:text-base mt-6 lg:mt-12 underline"
                >
                  Back to Login
                </Button>
              </Link>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckEmail;
