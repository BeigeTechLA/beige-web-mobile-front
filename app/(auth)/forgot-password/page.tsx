import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      image="/images/loginsignup/forgotPassword.png"
      imageAlt="Forgot Password"
      backLink="/login"
    >
      <div className="my-50">
        <ForgotPasswordForm />
      </div>
    </AuthSplitLayout>
  )
}
