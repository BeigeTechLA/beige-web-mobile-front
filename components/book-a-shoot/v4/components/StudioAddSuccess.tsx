import Image from "next/image";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";


export interface StudiosSuccessProps {
  onContinue: () => void;
  onBack?: () => void;
  subtitle?: string;
  buttonText?: string;
  price?: string;
}

export const StudioAddSuccess: React.FC<StudiosSuccessProps> = ({
  onContinue,
  onBack,
  subtitle = "Your studio is all set. Let’s get started with your photography needs.",
  price,
  buttonText="Continue to book your shoot"
}) => {
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
        <h2 className="text-lg lg:text-4xl font-medium text-center">
          Studio Added Successfully
        </h2>
        {
          !price ?
            <p className="text-lg lg:text-[26px] text-white/50 mb-8 lg:mb-12">{subtitle}</p>
            :
            <p className="text-[#E8D1AB] text-xl lg:text-[42px] font-bold mt-2 lg:mt-5 mb-8 lg:mb-12">{formatCurrency(price)}</p>
        }

        <div className="w-full max-w-lg mb-6">
          <button
            onClick={() => onContinue()}
            className="w-full h-14 lg:h-20 rounded-[10px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-xl font-medium transition-colors flex items-center justify-center"
          >
            {buttonText ? buttonText : "Continue to book your shoot"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default StudioAddSuccess;
