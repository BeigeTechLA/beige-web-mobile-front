import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { UserSignupForm } from "@/components/auth/UserSignupForm"

export default function UserSignupPage() {
  return (
    <AuthSplitLayout 
      image="/images/AuthImageHD.webp" // Placeholder until specific image found
      imageAlt="User Signup"
      backLink="/login"
    >
      <UserSignupForm />
    </AuthSplitLayout>
  )
}

