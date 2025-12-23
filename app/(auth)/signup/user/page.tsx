import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { UserSignupForm } from "@/components/auth/UserSignupForm"

export default function UserSignupPage() {
  return (
    <AuthSplitLayout 
      image="/images/loginsignup/clientSignup.png"
      imageAlt="User Signup"
      backLink="/login"
    >
      <UserSignupForm />
    </AuthSplitLayout>
  )
}

