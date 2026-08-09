"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getRecentCompanies } from "@/lib/recent-companies"
import { Spinner } from "@/components/ui/spinner"

/**
 * Keeps the pre-tabs URLs alive.
 *
 * /risk, /predict and /dividend were company-less pages that opened onto a
 * search box. There is no such page any more, so an old link resolves to the
 * same analysis for the last company the user looked at, or to the dashboard
 * search if there isn't one.
 */
export function LegacyRouteRedirect({ tab }: { tab: string }) {
  const router = useRouter()

  useEffect(() => {
    const [recent] = getRecentCompanies()
    router.replace(
      recent ? `/company/${encodeURIComponent(recent.symbol)}?tab=${tab}` : "/",
    )
  }, [router, tab])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
