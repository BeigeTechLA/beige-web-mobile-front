"use client"

import { useEffect } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"

type GoogleAuthProviderProps = {
  children: React.ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return

    console.info("[Google Auth Env] frontend NEXT_PUBLIC_GOOGLE_CLIENT_ID", {
      configured: Boolean(clientId),
      length: clientId?.length || 0,
    })
  }, [clientId])

  if (!clientId) {
    return <>{children}</>
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
