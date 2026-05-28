"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Star, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/hooks/useAuth"
import { pushToDataLayer } from "@/lib/gtm"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

// const eventImgUrl = "https://d1pgtgqp0jru64.cloudfront.net/Frame-2147226676.png"
const eventImgUrl = "/images/login-event.jpeg"
// const mobileEventImgUrl = "https://beige-web-dev.s3.us-east-1.amazonaws.com/beige/assets/coachella+/image1.jpeg"
const mobileEventImgUrl = "/images/login-event-mobile-2.png"

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const { login, isLoginLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasShownAdminOnlyToast = React.useRef(false)
  const returnTo = React.useMemo(() => {
    const value = searchParams?.get("returnTo")?.trim() || ""
    return value.startsWith("/") ? value : ""
  }, [searchParams])
  const bookingEmail = React.useMemo(() => {
    const value = searchParams?.get("bookingEmail")?.trim() || ""
    return value.toLowerCase()
  }, [searchParams])

  React.useEffect(() => {
    if (hasShownAdminOnlyToast.current) return
    const adminOnly = searchParams?.get("adminOnly") === "1"
    const reason = searchParams?.get("reason")
    if (adminOnly || reason === "admin_only") {
      toast.error("You are not an admin. Please log in with an admin account to access the admin dashboard.")
      hasShownAdminOnlyToast.current = true
      return
    }
    if (reason === "role_mismatch") {
      toast.error("You are not authorized for that dashboard. Please log in with the correct account.")
      hasShownAdminOnlyToast.current = true
    }
  }, [searchParams])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // The 'result' variable will now contain the JSON object you provided
      const result = await login({ email: data.email, password: data.password })

      toast.success(result.message || "Login successful!")

      // --- GA4 LOGIN TRACKING ---
      // Extract user data for tracking
      const user = result?.user
      const userTypeId = user?.user_type_id
      const userTypeName = userTypeId ? USER_TYPE[userTypeId as keyof typeof USER_TYPE] : "Unknown";
      const loggedInEmail = String(user?.email || data.email || "").trim().toLowerCase()

      pushToDataLayer("login", {
        custom_user_id: user?.id || null,
        email: data.email, // using form data
        user_type: userTypeName,
        page_name: "Login Page",
        location_in_website: "login_page",
        duration_on_page: performance.now() / 1000,
        // Phone might be in the result object depending on your API
        phone: user?.phone || null,
      });
      // ---------------------------

      if (returnTo && (!bookingEmail || bookingEmail === loggedInEmail)) {
        router.replace(returnTo)
        return
      }

      // Logic for conditional redirection
      if (userTypeId === 1) {
        router.push('/admin/dashboard')
      } else if (userTypeId === 2) {
        router.push('/creator/dashboard')
      } else if (userTypeId === 3) {
        router.push('/affiliate/dashboard')
      } else if (userTypeId === 4 || userTypeId === 5 || userTypeId === 7) {
        router.push('/sales/dashboard')
      }
      else if (userTypeId === 6) {
        router.push('/production-manager/dashboard')
      } else {
        // Fallback in case user_type_id is missing or different
        router.push('/admin/dashboard')
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Login failed. Please check your credentials."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="w-full">
      <div className="absolute top-0 left-0 w-screen h-[380px] overflow-hidden lg:hidden -z-10 bg-[#101010]">
        <div className="relative h-full w-full">
          {/* <Image
            src={mobileEventImgUrl}
            alt="Coachella x Neon Carnival"
            fill
            priority
            className="object-cover object-[80%_0%] -translate-y-14"
          /> */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 backdrop-blur-[0.5px]"
            style={{
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 10%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 40%)'
            }}
          />
          <Image
            src="/images/loginsignup/Group.png"
            alt="Beige logo"
            width={68}
            height={14}
            className="absolute left-4 top-4 z-20 lg:hidden"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-62 bg-gradient-to-t from-[#101010] via-[#101010]/50 to-transparent" />
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8 overflow-x-hidden pt-8 lg:pt-0 relative z-10 w-full">
        <div className="space-y-2 text-center lg:mt-15">
          <h1 className="text-[28px] lg:text-4xl font-semibold tracking-tight text-[#E8D1AB] leading-tight">
            Welcome Back
          </h1>
          <p className="text-[13px] lg:text-lg text-[#878787] lg:text-white/60">Log in to continue to your creative dashboard.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:space-y-9">
          <div className="relative space-y-1 lg:space-y-2">
            <Label htmlFor="email" className="block text-sm font-medium text-[#A4A0A0] lg:absolute lg:-top-3 lg:left-4 lg:px-2 lg:bg-[#101010] lg:text-white/60">Email Address</Label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              disabled={isLoginLoading}
              {...form.register("email")}
              className="h-12 lg:h-[82px] w-full rounded-[8px] lg:rounded-[12px] border border-white/20 lg:border-white/30 bg-[#161616] lg:bg-[#101010] px-4 text-sm text-white outline-none transition-colors focus:border-[#E8D1AB] focus-visible:ring-0 lg:text-base"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="relative space-y-1 lg:space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-[#A4A0A0] lg:absolute lg:-top-3 lg:left-4 lg:z-10 lg:px-2 lg:bg-[#101010] lg:text-white/60 lg:pointer-events-none"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                onClick={() => {
                  pushToDataLayer("forgot_password", {
                    type: "Action Tracking",
                    page_name: "Login Page",
                    location_in_website: "login_page",
                    duration_on_page: performance.now() / 1000,
                  });
                }}
                className="text-xs font-medium text-[#E8D1AB] hover:text-white underline underline-offset-4 lg:hidden"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                disabled={isLoginLoading}
                {...form.register("password")}
                className="h-12 lg:h-[82px] w-full rounded-[8px] lg:rounded-[12px] border border-white/20 lg:border-white/30 bg-[#161616] lg:bg-[#101010] px-4 text-sm text-white outline-none transition-colors focus:border-[#E8D1AB] focus-visible:ring-0 lg:text-base"
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
              <p className="text-xs text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>


          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={form.watch("rememberMe")}
                onCheckedChange={(checked) => form.setValue("rememberMe", checked as boolean)}
                className="border-neutral-600 rounded bg-[#404040]/30 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] w-4 h-4 lg:w-5 lg:h-5 data-[state=checked]:text-[#101010]"
              />
              <Label htmlFor="rememberMe" className="text-sm font-medium text-[#E5E5E5] lg:text-[#A4A0A0]">
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              onClick={() => {
                pushToDataLayer("forgot_password", {
                  type: "Action Tracking",
                  page_name: "Login Page",
                  location_in_website: "login_page",
                  duration_on_page: performance.now() / 1000,
                });
              }}
              className="hidden lg:block text-sm font-medium text-[#E8D1AB] hover:text-white underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] rounded-md lg:rounded-[8px] h-11 lg:h-[76px] text-base lg:text-xl font-semibold"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Mobile standard divider */}
            <div className="flex items-center justify-center mt-6 lg:hidden">
              <div className="h-[1px] w-12 bg-white/10 hidden sm:block"></div>
              <p className="text-xs text-[#878787] px-4 flex items-center gap-4">
                <span className="h-[1px] w-12 bg-[#878787]/30"></span>
                Don't have an account?
                <span className="h-[1px] w-12 bg-[#878787]/30"></span>
              </p>
            </div>

            {/* Desktop original style */}
            <p className="text-sm text-[#DDD] mt-6 hidden lg:block">
              <b>Don't have an account yet?</b> Create your Beige account by
            </p>
          </div>

        </form>

        {/* Signup Options */}
        <div className="space-y-6 lg:pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <Link
              href="/signup/user"
              onClick={() => {
                pushToDataLayer("sign_up_started_user", {
                  type: "Action Tracking",
                  user_type: "client",
                  location_in_website: "login_page",
                  page_name: "Login Page",
                  duration_on_page: performance.now() / 1000,
                });
              }}
              className="relative w-full rounded-[8px] lg:rounded-[20px] bg-gradient-to-br from-[#2a2a2a] to-[#121212] lg:from-[#E9D3A2] lg:to-[#E4C48A] border border-white/5 lg:border-none flex items-center justify-between lg:justify-start p-4 lg:py-5 lg:px-6 transition-transform duration-300"
            >
              <div className="w-full relative z-10 flex justify-between gap-2 h-full items-center">
                <h2 className="text-[#E8E8E8] lg:text-black text-[13px] lg:text-sm font-medium lg:font-semibold leading-tight">
                  JOIN BEIGE
                </h2>

                <div className="w-6 h-6 lg:w-[30px] lg:h-[30px] rounded-full border border-white/20 lg:border-black flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3 h-3 text-white/60 lg:text-black" />
                </div>
              </div>
            </Link>
            <Link
              href="/creative-partner-signup"
              onClick={() => {
                pushToDataLayer("sign_up_started_cp", {
                  type: "Action Tracking",
                  user_type: "creative_partner",
                  page_name: "Login Page",
                  location_in_website: "login_page",
                  duration_on_page: performance.now() / 1000,
                });
              }}
              className="relative w-full rounded-[8px] lg:rounded-[20px] bg-gradient-to-br from-[#2a2a2a] to-[#121212] lg:from-[#101010] lg:to-[#474343] border border-white/5 lg:border-none flex items-center justify-between lg:justify-start p-4 lg:py-5 lg:px-6 transition-transform duration-300"
            >
              <div className="w-full relative z-10 flex justify-between gap-2 h-full items-center">
                <h2 className="text-[#E8E8E8] lg:text-white text-[13px] lg:text-sm font-medium lg:font-semibold leading-tight">
                  SHOOT FOR BEIGE
                </h2>

                <div className="w-6 h-6 lg:w-[30px] lg:h-[30px] rounded-full border border-white/20 lg:border-white flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3 h-3 text-white/60 lg:text-white" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="pt-8 pb-4 lg:py-0">
          <h4 className="text-[11px] lg:text-[22px] text-[#A0A0A0] lg:text-[#878787] mb-3">Trusted by creative professionals and clients worldwide</h4>
          <div className="flex items-center justify-between">
            {/* <div className="flex gap-1 lg:gap-1.5"> */}
            {/* <Star className="h-4 w-4 fill-[#BEA784] text-[#BEA784]" /> */}
            <p className="text-[9px] lg:text-[13px] text-[#D9D9D9] flex flex-col"><span className="text-xs lg:text-sm font-semibold">$10M+</span>in Content Produced</p>
            {/* </div> */}
            <p className="text-[9px] lg:text-[13px] text-[#D9D9D9] flex flex-col"><span className="text-xs lg:text-sm font-semibold">5K+</span> Vetted Creative Partners</p>
            <p className="text-[9px] lg:text-[13px] text-[#D9D9D9] flex flex-col"><span className="text-xs lg:text-sm font-semibold">4K+</span> Shoots Booked</p>
          </div>
        </div>
      </div>
    </div>
  )
}
