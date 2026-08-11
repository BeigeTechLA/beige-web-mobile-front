import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { UserSignupForm } from "@/components/auth/UserSignupForm"

type UserSignupPageProps = {
  searchParams?: Promise<{
    returnTo?: string
    bookingEmail?: string
  }>
}

export default async function UserSignupPage({ searchParams }: UserSignupPageProps) {
  const resolvedSearchParams = await searchParams
  const returnTo = String(resolvedSearchParams?.returnTo || "").trim()
  const bookingEmail = String(resolvedSearchParams?.bookingEmail || "").trim()
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
