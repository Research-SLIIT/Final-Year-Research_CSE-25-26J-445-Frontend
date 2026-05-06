"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function SignIn() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, signIn, loadSession } = useAuthStore()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showOtp, setShowOtp] = useState(false)
  const [otpCode, setOtpCode] = useState("")

  useEffect(() => {
    // Only redirect if authenticated and not in OTP flow
    if (isAuthenticated && !authLoading && !showOtp) {
      const userStr = localStorage.getItem("cse_user")
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr)
          if (userObj.role === "admin") {
            router.push("/admin/users")
            return
          }
        } catch (e) {}
      }
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router, showOtp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Step 1: initial sign in using the real backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://16.171.27.203:8080"}/api/v1/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Sign in failed")
      }
      
      // Step 2: Show OTP screen instead of redirecting
      setShowOtp(true)
      toast({
        title: "Success",
        description: data.message || "Please check your email for the OTP code",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://16.171.27.203:8080"}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: otpCode,
        }),
      })

      if (!response.ok) {
        throw new Error("Invalid OTP code")
      }

      const data = await response.json()
      
      // Store the token in localStorage as requested
      if (data.accessToken) {
        localStorage.setItem("cse_auth_token", data.accessToken)
        
        // Decode the JWT to get basic user info
        let userRole = "user";
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
          userRole = payload.role || "user";
          const userObj = {
            id: payload.sub || "unknown_id",
            name: payload.email?.split('@')[0] || "User",
            email: payload.email || "",
            role: userRole,
            displayName: payload.email?.split('@')[0] || "User",
            bio: "",
            joinedDate: new Date().toISOString()
          }
          localStorage.setItem("cse_user", JSON.stringify(userObj))
        } catch (e) {
          console.error("Failed to parse token payload", e)
        }

        // Force store to reload session to become authenticated
        loadSession()

        toast({
          title: "Success",
          description: "OTP verified successfully",
        })

        if (userRole === "admin") {
          router.push("/admin/users")
        } else {
          router.push("/")
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "OTP verification failed"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {showOtp ? "Enter OTP" : "Sign In"}
          </CardTitle>
          <CardDescription>
            {showOtp 
              ? `Enter the verification code sent to ${email}` 
              : "Enter your credentials to access the platform"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtp ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otpCode" className="text-sm font-medium text-foreground">
                  Verification Code
                </label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}
          
          {!showOtp && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
