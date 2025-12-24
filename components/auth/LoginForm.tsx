"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const { login, isLoginLoading } = useAuth()
  const router = useRouter()

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
      const result = await login({ email: data.email, password: data.password })
      toast.success(result.message || "Login successful!")

      // Redirect to affiliate dashboard
      router.push('/affiliate/dashboard')
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Login failed. Please check your credentials."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
          Sign in to your account
        </h1>
        <p className="lg:text-lg text-white/60">Welcome back! 👋</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-9">
        <div className="relative space-y-2">
          <Label htmlFor="email" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Email</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            disabled={isLoginLoading}
            {...form.register("email")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label
            htmlFor="password"
            className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isLoginLoading}
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
              className="border-neutral-600 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] lg:w-5 lg:h-5 data-[state=checked]:text-[#101010]"
            />
            <Label htmlFor="rememberMe" className="text-[#A4A0A0]">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#E8D1AB] hover:text-white underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium"
            disabled={isLoginLoading}
          >
            {isLoginLoading ? "Logging in..." : "Login"}
          </Button>
          <p className="text-sm text-[#DDD] mt-4 lg:mt-6">
            <b>Don't have an account yet?</b> Create your Beige account by
          </p>
        </div>

      </form>

      <div className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-4">
          <Link
            href="/signup/user"
            className="relative w-full rounded-lg lg:rounded-[20px] bg-gradient-to-br from-[#E9D3A2] to-[#E4C48A] flex items-center p-3 lg:py-5 lg:px-6 transition-transform duration-300 lg:h-[163px]"
          >
            <div className="relative z-10 flex lg:flex-col justify-between gap-2 h-full lg:w-1/2">
              <h2 className="text-black text-sm font-semibold leading-tight">
                Create New account as User
              </h2>

              <div className="w-5 h-5 lg:w-[30px] lg:h-[30px] rounded-full border border-black flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-black" />
              </div>
            </div>

            <div className="absolute right-0 bottom-0 h-20 lg:h-[190px] w-[45%] lg:w-[164px]">
              <Image
                src="/images/loginsignup/userSignup.png"
                alt="Create account"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>
          </Link>
          <Link href="/signup/creator" className="relative w-full rounded-lg lg:rounded-[20px] bg-gradient-to-br from-[#101010] to-[#474343] flex items-center p-3 lg:py-5 lg:px-6 transition-transform duration-300 lg:h-[163px]">
            <div className="relative z-10 flex lg:flex-col justify-between gap-2 h-full lg:w-1/2">
              <h2 className="text-white text-sm font-semibold leading-tight">
                Create New account as Creator
              </h2>

              <div className="w-5 h-5 lg:w-[30px] lg:h-[30px] rounded-full border border-white flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="absolute right-0 bottom-0 h-20 lg:h-[190px] w-[45%] lg:w-[164px]">
              <Image
                src="/images/loginsignup/creatorSignup.png"
                alt="Create account"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>
          </Link>
        </div>
      </div>

      <div className="pt-9">
        <h4 className="text-sm lg:text-[22px] text-[#878787] mb-2 lg:mb-3">Trusted by creative professionals and clients worldwide</h4>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 lg:gap-1.5">
            <Star className="h-4 w-4 fill-[#BEA784] text-[#BEA784]" />
            <span className="text-xs lg:text-[13px] text-[#D9D9D9] font-medium">4.9/5 Rating</span>

          </div>
          <span className="text-xs lg:text-[13px] text-[#D9D9D9]">1000+ Active Creatives</span>
          <span className="text-xs lg:text-[13px] text-[#D9D9D9]">5,000+ Projects Completed</span>
        </div>
      </div>
    </div>
  )
}
