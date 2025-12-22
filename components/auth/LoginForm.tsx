"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, ArrowRight, Star } from "lucide-react"

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
  const { login, isLoading } = useAuth()
  
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
      await login({ email: data.email, password: data.password })
      // Redirect handled by logic or router
      // For now we just log
      console.log("Logged in", data)
    } catch (error) {
      console.error("Login failed", error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Sign in to your account
        </h1>
        <p className="text-neutral-400">Welcome back! 👋</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            disabled={isLoading}
            {...form.register("email")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isLoading}
              {...form.register("password")}
              className="border-neutral-800 bg-neutral-900/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={form.watch("rememberMe")}
              onCheckedChange={(checked) => form.setValue("rememberMe", checked as boolean)}
              className="border-neutral-600 data-[state=checked]:bg-[#BEA784] data-[state=checked]:border-[#BEA784]"
            />
            <Label htmlFor="rememberMe" className="text-neutral-400">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-neutral-400 hover:text-white underline decoration-neutral-600 underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="space-y-6 pt-4">
        <p className="text-sm text-neutral-400">
          Don't have an account yet? Create your Beige account by
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/signup/user" className="group relative block overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <div className="flex h-full flex-col p-4">
               {/* Use a placeholder div or Image if available */}
               <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-neutral-800 relative">
                  <Image 
                    src="/images/influencer/natashaGraziano.png" // Placeholder
                    alt="User"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
               </div>
               <div className="flex items-center justify-between mt-auto">
                 <div>
                    <h3 className="font-medium text-white">Create New account</h3>
                    <p className="text-sm text-neutral-400">as User</p>
                 </div>
                 <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-[#ECE1CE] group-hover:text-black transition-colors">
                    <ArrowRight className="h-4 w-4" />
                 </div>
               </div>
            </div>
          </Link>

          <Link href="/signup/creator" className="group relative block overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <div className="flex h-full flex-col p-4">
               <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-neutral-800 relative">
                  <Image 
                    src="/images/man-with-tripod-and-camera.png" // Placeholder
                    alt="Creator"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
               </div>
               <div className="flex items-center justify-between mt-auto">
                 <div>
                    <h3 className="font-medium text-white">Create New account</h3>
                    <p className="text-sm text-neutral-400">as Creator</p>
                 </div>
                 <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-[#ECE1CE] group-hover:text-black transition-colors">
                    <ArrowRight className="h-4 w-4" />
                 </div>
               </div>
            </div>
          </Link>
        </div>
      </div>
      
      <div className="pt-8 border-t border-neutral-800">
         <h4 className="text-sm text-neutral-500 mb-2">Trusted by creative professionals and clients worldwide</h4>
         <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
               {[1, 2, 3, 4, 5].map((star) => (
                 <Star key={star} className="h-4 w-4 fill-[#BEA784] text-[#BEA784]" />
               ))}
            </div>
            <span className="text-sm text-white font-medium">4.9/5 Rating</span>
            <span className="text-sm text-neutral-500">1000+ Active Creatives</span>
            <span className="text-sm text-neutral-500">5,000+ Projects Completed</span>
         </div>
      </div>
    </div>
  )
}

