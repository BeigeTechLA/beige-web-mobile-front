"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image" // Or use lucide-react if no image
import { Button } from "@/components/ui/button"

export function InvestorSuccess() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto p-8">
      <div className="mb-6 lg:mb-15">
        <div className="flex-shrink-0 w-20 h-18 lg:w-[218px] lg:h-[346px]">
          <Image
            src={"/images/loginsignup/Success.svg"}
            alt={"Verify Email"}
            width={82}
            height={82}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      <h2 className="text-lg lg:text-4xl font-semibold tracking-tight text-white">
        Thank You For Reaching Out
      </h2>

      <p className="text-sm lg:text-base text-[#9E9696] mx-auto mt-4 lg:mt-7">
        Your details have been submitted. Our team will contact you soon to discuss potential investment pathways.
      </p>

      <Button
        asChild
        className="w-3/4 lg:w-[206px] bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-8 lg:mt-15"
      >
        <Link href="/">
          Explore Beige
        </Link>
      </Button>
    </div>
  )
}


