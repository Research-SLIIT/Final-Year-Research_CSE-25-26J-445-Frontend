"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, TrendingUp, PieChart, Settings, Menu, X, LogOut, LogIn, User, Newspaper, Banknote, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/useAuthStore"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const protectedNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Risk Analysis", href: "/risk", icon: PieChart },
  { name: "Price Prediction", href: "/predict", icon: TrendingUp },
  { name: "Dividend", href: "/dividend", icon: Banknote },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, loading, loadSession, signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadSession()
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) {
      setDesktopCollapsed(stored === "true")
    }
    setMounted(true)
  }, [loadSession])

  const toggleDesktopSidebar = () => {
    const next = !desktopCollapsed
    setDesktopCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

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

  // Show auth and admin pages without the main app sidebar
  if (!mounted || loading || pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border overflow-hidden transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${desktopCollapsed ? "lg:w-0 lg:border-r-0" : "lg:w-64"}`}
      >
        <div className="w-64">
          <div className="h-16 border-b border-border flex items-center px-6 gap-3">
            <Image src="/logoB.png" alt="Invest Wise Logo" width={32} height={32} className="rounded-md" />
            <h1 className="text-lg font-bold text-foreground">Invest Wise</h1>
          </div>
          <nav className="px-4 py-4">
            {protectedNavigation
              .filter(item => isAuthenticated || item.href === "/")
              .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start gap-2 mb-2"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDesktopSidebar} className="hidden lg:flex">
              <PanelLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-muted-foreground">CSE Investment Platform</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
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
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/auth/sign-in" className="cursor-pointer">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
