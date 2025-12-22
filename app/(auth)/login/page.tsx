import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthSplitLayout 
      video="/videosnap.mp4"
    >
      <LoginForm />
    </AuthSplitLayout>
  )
}

