import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthSplitLayout 
      video="/videos/LoginVideo.mp4"
    >
      <LoginForm />
    </AuthSplitLayout>
  )
}

