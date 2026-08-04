"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { pushToDataLayer } from "@/lib/gtm"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"

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

type AuthError = {
  data?: {
    message?: string
  }
  message?: string
}

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  const authError = error as AuthError
  return authError?.data?.message || authError?.message || fallback
}

export function UserSignupForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const { register: registerUser, googleLogin, isRegisterLoading, isGoogleLoginLoading } = useAuth()
  const isGoogleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = React.useMemo(() => {
    const value = searchParams?.get("returnTo")?.trim() || ""
    return value.startsWith("/") ? value : ""
  }, [searchParams])
  const bookingEmail = React.useMemo(() => {
    const value = searchParams?.get("bookingEmail")?.trim() || ""
    return value.toLowerCase()
  }, [searchParams])
  const loginHref = React.useMemo(() => {
    const params = new URLSearchParams()
    if (returnTo) params.set("returnTo", returnTo)
    if (bookingEmail) params.set("bookingEmail", bookingEmail)
    const query = params.toString()
    return query ? `/login?${query}` : "/login"
  }, [returnTo, bookingEmail])

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
        userType: 3, // 1 = client
      })

      toast.success("Account created! Please verify your email.")

      // Store credentials temporarily for auto-login after verification
      sessionStorage.setItem('temp_login_credentials', JSON.stringify({
        email: data.email,
        password: data.password
      }));

      // --- GA4 SIGNUP TRACKING ---
      // pushToDataLayer("sign_up_completed_user", {
      //   custom_user_id: result?.userId || null,
      //   email: data.email, // using form data
      //   user_type: userTypeName,
      //   page_name: "User Signup Page",
      //   location_in_website: "signup_user_page",
      //   duration_on_page: performance.now() / 1000,
      //   phone: data.phone || null,
      // });
      pushToDataLayer("sign_up", {
        method: "email", // Official standard parameter
        user_id: result?.userId || null,
        user_type: "Client",
        page_name: "User Signup Page",
        location_in_website: "signup_user_page",
        duration_on_page: performance.now() / 1000,
        email: data.email,
      });

      // ---------------------------

      const verifyParams = new URLSearchParams({ email: data.email })
      if (returnTo) verifyParams.set("returnTo", returnTo)
      if (bookingEmail) verifyParams.set("bookingEmail", bookingEmail)
      router.push(`/verify-email?${verifyParams.toString()}`)
    } catch (error: unknown) {
      toast.error(getAuthErrorMessage(error, "Registration failed. Please try again."))
    }
  }

  const handleGoogleSignupSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        toast.error("Google did not return a valid credential.")
        return
      }

      const phone = form.getValues("phone").trim()

      const result = await googleLogin({
        credential: credentialResponse.credential,
        mode: "signup",
        phone_number: phone || undefined,
      })

      toast.success(result.message || "Google signup successful")

      const user = result.user
      const signedUpEmail = String(user?.email || "").trim().toLowerCase()

      pushToDataLayer("sign_up", {
        method: "google",
        user_id: user?.id || null,
        user_type: "Client",
        page_name: "User Signup Page",
        location_in_website: "signup_user_page",
        duration_on_page: performance.now() / 1000,
        email: user?.email || null,
      })

      if (returnTo && (!bookingEmail || bookingEmail === signedUpEmail)) {
        router.replace(returnTo)
        return
      }

      router.push("/affiliate/dashboard")
    } catch (error: unknown) {
      toast.error(getAuthErrorMessage(error, "Google signup failed. Please try again."))
    }
  }

  const handleGoogleSignupError = () => {
    toast.error("Google signup was cancelled or failed.")
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
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
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
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
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
          disabled={isRegisterLoading || isGoogleLoginLoading}
        >
          {isRegisterLoading ? "Creating Account..." : "Create Account"}
        </Button>

        {isGoogleConfigured && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-white/45">
              <span className="h-px flex-1 bg-white/15" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/15" />
            </div>
            <GoogleLogin
              onSuccess={handleGoogleSignupSuccess}
              onError={handleGoogleSignupError}
              text="signup_with"
              width="100%"
              useOneTap={false}
            />
            {isGoogleLoginLoading && (
              <p className="text-center text-xs text-white/50">Creating your Google account...</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center mt-6 text-[#DDD] font-bold gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M0 0.25C9.89091 0.25 151.455 0.25 221 0.25" stroke="url(#paint0_linear_1780_5629)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5629" x1="0" y1="0.75" x2="221" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
          <div className="shrink-0 gap-1 flex">
            Already have an account? <Link className="font-normal" href={loginHref}>Login</Link>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M221 0.25C211.109 0.25 69.5455 0.25 6.19888e-06 0.25" stroke="url(#paint0_linear_1780_5630)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5630" x1="221" y1="0.75" x2="0" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </form>

      {/* <div className="text-center pt-4">
        <p className="text-sm text-neutral-400">
          Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
        </p>
      </div> */}
    </div>
  )
}
