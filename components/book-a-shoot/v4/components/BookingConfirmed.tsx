import Image from "next/image";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

const BookingConfirmed = () => {
  return (
    <div className="container mx-auto px-4 md:px-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="relative mb-8">
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
        <h2 className="text-lg lg:text-4xl font-medium mb-2 lg:mb-5 text-center">
          Booking Confirmed
        </h2>
        <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mb-8 lg:mb-12">{formatCurrency("4211")}</p>
        <div className="w-full max-w-lg mb-6">
          <button
            // onClick={() => setIsDetailsFormOpen(true)}
            className="w-full h-14 lg:h-20 rounded-[10px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-xl font-medium transition-colors flex items-center justify-center"
          >
            Complete All The Details For Your Shoot
          </button>
        </div>
        <button
          // onClick={handleViewSummary}
          className="h-12 lg:h-18 px-6 py-5 lg:px-20 lg:py-10 bg-white/10 hover:bg-white/20 text-white text-base lg:text-2xl font-medium rounded-[10px] inline-flex items-center justify-center border border-white/20"
        >
          View Booking Summary
        </button>
      </motion.div>
    </div>
  )
}

export default BookingConfirmed