"use client"

import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PayhereButton } from "@/components/ui/payhere-button"
import { useAuthStore } from "@/stores/useAuthStore"
import Link from "next/link"

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    "Full access to Dashboard & basic charts",
    "Open Price Prediction models",
    "Detailed Dividend Analysis",
    "Comprehensive Risk Analysis indicators",
    "AI-driven Sentiment News Analysis",
    "Priority support"
  ]

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Upgrade to Premium
        </h1>
        <p className="mt-4 text-xl text-muted-foreground flex flex-col items-center gap-2">
          Unlock all advanced analysis tools to make better investment decisions on the CSE.
          {user?.isPremium && (
            <span className="inline-block mt-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              You are currently on the Premium tier.
            </span>
          )}
        </p>
      </div>

      <div className="max-w-md mx-auto rounded-3xl border border-border shadow-2xl overflow-hidden text-center bg-card">
        <div className="p-8 bg-muted/30">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Star className="text-yellow-500 h-6 w-6 fill-current" />
            <h3 className="text-2xl font-bold">Invest Wise Pro</h3>
          </div>
          <div className="mt-4 flex items-baseline justify-center text-5xl font-extrabold">
            Rs. 1,500
            <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
          </div>
          <p className="mt-5 text-lg text-muted-foreground">
            Billed monthly. Cancel anytime.
          </p>
        </div>
        
        <div className="px-8 pt-6 pb-8 bg-card flex flex-col justify-between">
          <ul className="space-y-4 text-left">
            {features.map((feature) => (
              <li key={feature} className="flex items-start">
                <div className="flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <p className="ml-3 text-base text-foreground">{feature}</p>
              </li>
            ))}
          </ul>
          
          <div className="mt-8">
            {!isAuthenticated ? (
              <Link href="/auth/sign-in">
                <Button className="w-full h-12 text-lg">Sign in to Upgrade</Button>
              </Link>
            ) : user?.isPremium ? (
              <Button className="w-full h-12 text-lg" disabled variant="outline">
                Currently Subscribed
              </Button>
            ) : (
              <PayhereButton 
                amount={1500} 
                itemName="Invest Wise Pro Monthly" 
                className="w-full h-12 text-lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
