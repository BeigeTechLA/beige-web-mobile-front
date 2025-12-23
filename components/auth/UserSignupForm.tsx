"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/hooks/useAuth"

const userSignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type UserSignupFormValues = z.infer<typeof userSignupSchema>

export function UserSignupForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const { register: registerUser, isRegisterLoading } = useAuth()
  const router = useRouter()

  const form = useForm<UserSignupFormValues>({
    resolver: zodResolver(userSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const onSubmit = async (data: UserSignupFormValues) => {
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone_number: data.phone,
        userType: 1, // 1 = client
      })

      toast.success("Account created! Please verify your email.")

      // Redirect to verify email page
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Registration failed. Please try again."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
          Create Your Client Account
        </h1>
        <p className="lg:text-lg text-white/60">
          Start booking amazing photographers and videographers
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-9 text-sm lg:text-base lg:mt-14">
        <div className="relative space-y-2">
          <Label htmlFor="name" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            disabled={isRegisterLoading}
            {...form.register("name")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="email" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isRegisterLoading}
            {...form.register("email")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="phone" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            disabled={isRegisterLoading}
            {...form.register("phone")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="password" className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none">Create Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isRegisterLoading}
              {...form.register("password")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="password" className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              disabled={isRegisterLoading}
              {...form.register("confirmPassword")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              )}
            </button>
          </div>

          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={form.watch("terms")}
            onCheckedChange={(checked) => form.setValue("terms", checked as boolean)}
            className="border-neutral-600 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] lg:w-5 lg:h-5 data-[state=checked]:text-[#101010]"
          />
          <Label htmlFor="terms" className="text-sm text-[#A4A0A0] leading-tight">
            By creating an account, you agree to our <Link href="/terms" className="text-[#E8D1AB] underline">Terms of Services</Link> and <Link href="/privacy" className="text-[#E8D1AB] underline">Privacy Policy</Link>
          </Label>
        </div>
        {form.formState.errors.terms && (
          <p className="text-xs text-red-500">{form.formState.errors.terms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-1"
          disabled={isRegisterLoading}
        >
          {isRegisterLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* <div className="text-center pt-4">
        <p className="text-sm text-neutral-400">
          Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
        </p>
      </div> */}
    </div>
  )
}
