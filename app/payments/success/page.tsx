"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/useAuthStore"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { refreshUser } = useAuthStore()
  const [countdown, setCountdown] = useState(5)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    // Refresh user to pick up isPremium: true after payment
    refreshUser().finally(() => setSynced(true))
  }, [refreshUser])

  useEffect(() => {
    if (!synced) return
    if (countdown <= 0) {
      router.push("/")
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, synced, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground text-lg">
          You&apos;re now an <span className="font-semibold text-primary">Invest Wise Pro</span> member.
          All premium features are now unlocked.
        </p>

        {!synced ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Activating your subscription...</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard in <span className="font-semibold">{countdown}</span>s...
          </p>
        )}

        <Button onClick={() => router.push("/")} className="w-full" disabled={!synced}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
