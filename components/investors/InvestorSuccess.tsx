"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image" // Or use lucide-react if no image
import { Button } from "@/components/ui/button"

export function InvestorSuccess() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto p-8">
      <div className="mb-8 relative h-48 w-48">
          {/* Placeholder for the phone hand image */}
          {/* Using a placeholder div or icon if image not available */}
          {/* Based on screenshot, it's a 3D looking hand holding a phone with checkmark */}
          {/* I'll use a placeholder div or check if I have a similar asset */}
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="bg-neutral-800 rounded-full h-32 w-32 flex items-center justify-center">
                <span className="text-4xl">📱✅</span>
             </div>
           </div>
           {/* If actual image exists, replace above with:
           <Image src="/path/to/image.png" alt="Success" fill className="object-contain" />
           */}
      </div>
      
      <h2 className="text-3xl font-semibold text-white mb-4">
        Thank You For Reaching Out
      </h2>
      
      <p className="text-neutral-400 mb-8 leading-relaxed">
        Your details have been submitted. Our team will contact you soon to discuss potential investment pathways.
      </p>
      
      <Button 
        asChild
        className="h-12 px-8 bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] font-medium"
      >
        <Link href="/">
          Explore Beige
        </Link>
      </Button>
    </div>
  )
}


