import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { UserSignupForm } from "@/components/auth/UserSignupForm"

type UserSignupPageProps = {
  searchParams?: {
    returnTo?: string
    bookingEmail?: string
  }
}

export default function UserSignupPage({ searchParams }: UserSignupPageProps) {
  const returnTo = String(searchParams?.returnTo || "").trim()
  const bookingEmail = String(searchParams?.bookingEmail || "").trim()
  const params = new URLSearchParams()
  if (returnTo.startsWith("/")) {
    params.set("returnTo", returnTo)
  }
  if (bookingEmail) {
    params.set("bookingEmail", bookingEmail)
  }
  const loginBackLink = params.toString() ? `/login?${params.toString()}` : "/login"

  return (
    <AuthSplitLayout 
      image="/images/loginsignup/clientSignup.png"
      imageAlt="User Signup"
      backLink={loginBackLink}
    >
      <UserSignupForm />
    </AuthSplitLayout>
  )
}
