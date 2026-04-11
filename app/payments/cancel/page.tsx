"use client"

import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-destructive" />
        </div>

        <h1 className="text-3xl font-bold">Payment Cancelled</h1>
        <p className="text-muted-foreground text-lg">
          Your payment was not completed. No charges were made.
          You can try again whenever you&apos;re ready.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/pricing")} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
