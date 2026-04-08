"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/useAuthStore"

interface PayHereCheckoutData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  hash: string;
}

interface PayhereButtonProps {
  amount: number;
  itemName: string;
  buttonText?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function PayhereButton({ 
  amount, 
  itemName, 
  buttonText = "Pay with PayHere", 
  className,
  variant = "default" 
}: PayhereButtonProps) {
  const [loading, setLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<PayHereCheckoutData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { user } = useAuthStore()

  const handleCheckout = async () => {
    try {
      if (!user?.id) {
        alert("You must be logged in to subscribe.")
        return
      }

      setLoading(true)
      // Step 1: Request checkout details 
      const payload = {
        amount: amount, 
        currency: "LKR",
        userId: user.id,
        items: itemName
      };

      const response = await apiClient<{ success: boolean; checkoutData: PayHereCheckoutData }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (response.success && response.checkoutData) {
        setCheckoutData(response.checkoutData)
        // Ensure form mounts and gets populated before submission natively
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.submit()
          }
        }, 100)
      } else {
        alert("Failed to initialize payment gateway.")
      }
    } catch (error) {
      console.error("Payment setup error:", error)
      alert("Error contacting the payment gateway. Please make sure the backend is running.")
    } finally {
      // Don't set loading to false if we succeeded, because we are redirecting away
    }
  }

  const payHereUrl = process.env.NEXT_PUBLIC_PAYHERE_ENV_URL || "https://sandbox.payhere.lk/pay/checkout";

  return (
    <>
      <Button 
        onClick={handleCheckout} 
        disabled={loading} 
        className={className} 
        variant={variant}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
      </Button>

      {/* Hidden form to submit to PayHere securely */}
      {checkoutData && (
        <form ref={formRef} method="post" action={payHereUrl} style={{ display: "none" }}>
          <input type="hidden" name="merchant_id" value={checkoutData.merchant_id} />
          <input type="hidden" name="return_url" value={checkoutData.return_url} />
          <input type="hidden" name="cancel_url" value={checkoutData.cancel_url} />
          <input type="hidden" name="notify_url" value={checkoutData.notify_url} />
          <input type="hidden" name="first_name" value={checkoutData.first_name} />
          <input type="hidden" name="last_name" value={checkoutData.last_name} />
          <input type="hidden" name="email" value={checkoutData.email} />
          <input type="hidden" name="phone" value={checkoutData.phone} />
          <input type="hidden" name="address" value={checkoutData.address} />
          <input type="hidden" name="city" value={checkoutData.city} />
          <input type="hidden" name="country" value={checkoutData.country} />
          <input type="hidden" name="order_id" value={checkoutData.order_id} />
          <input type="hidden" name="items" value={checkoutData.items} />
          <input type="hidden" name="currency" value={checkoutData.currency} />
          <input type="hidden" name="amount" value={checkoutData.amount} />
          <input type="hidden" name="hash" value={checkoutData.hash} />
        </form>
      )}
    </>
  )
}
