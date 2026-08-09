"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Settings, LogOut, LogIn, User, Newspaper, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/useAuthStore"
import { CompanySearchTrigger } from "@/components/company-search"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Application shell.
 *
 * There is deliberately no navigation rail. Every analysis is a view of a
 * company, so the way in is to search for one — the header carries the search
 * affordance and nothing else. The dashboard is the only other destination and
 * it is the root route; the remaining standalone pages (news, pricing, account)
 * hang off the account menu and the dashboard's own entry points.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, loading, loadSession, refreshUser, signOut } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadSession()
    refreshUser() // Check Latest status from backend on mount (e.g. after payment redirect)
    setMounted(true)
  }, [loadSession, refreshUser])

  useEffect(() => {
    if (!mounted || loading) return

    const isAuthPage = pathname.startsWith("/auth")
    const isRootPage = pathname === "/"
    const isProtectedPage = !isAuthPage && !isRootPage

    if (!isAuthenticated && isProtectedPage) {
      router.push("/auth/sign-in")
    } else if (isAuthenticated && isAuthPage) {
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
  }, [isAuthenticated, pathname, router, mounted, loading])

  const handleLogout = () => {
    signOut()
    router.push("/auth/sign-in")
  }

  // Auth and admin pages render without the shell
  if (!mounted || loading || pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return <>{children}</>
  }

  // The dashboard owns a full-width hero search, so the header one would be a
  // second search box on the same screen.
  const showHeaderSearch = pathname !== "/"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-card/80 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-bold text-foreground">
          InvestWise
        </Link>

        <div className="flex flex-1 justify-center px-2">
          {showHeaderSearch && <CompanySearchTrigger className="w-full max-w-md" />}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {isAuthenticated && user?.displayName ? user.displayName.charAt(0).toUpperCase() : "G"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isAuthenticated ? (
              <>
                <DropdownMenuItem disabled className="flex-col items-start py-2">
                  <p className="text-sm font-semibold">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/news" className="cursor-pointer">
                    <Newspaper className="mr-2 h-4 w-4" />
                    Market News
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pricing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/auth/sign-in" className="cursor-pointer">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
