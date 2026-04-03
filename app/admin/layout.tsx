"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/auth/sign-in")
        return
      }
      
      const userStr = localStorage.getItem("cse_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.role === "admin") {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
            router.push("/")
          }
        } catch (e) {
          setIsAdmin(false)
          router.push("/")
        }
      } else {
        setIsAdmin(false)
        router.push("/")
      }
    }
  }, [isAuthenticated, loading, router])

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/users" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            Users
          </Link>
          <Link href="/admin/logs" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            System Logs
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => {
              localStorage.removeItem("cse_auth_token")
              localStorage.removeItem("cse_user")
              window.location.href = "/auth/sign-in"
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
