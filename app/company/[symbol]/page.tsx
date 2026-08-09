"use client"

import { useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Ban, GitCompareArrows, LineChart, Shield, Banknote } from "lucide-react"

import { useCompanyDirectory } from "@/hooks/use-company-directory"
import { baseSymbol, findCompany, unknownCompany } from "@/lib/company-directory"
import { pushRecentCompany } from "@/lib/recent-companies"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyProfileCard } from "@/components/workspace/company-profile-card"
import { RiskWorkspace } from "@/components/workspace/risk-workspace"
import { PredictWorkspace } from "@/components/workspace/predict-workspace"
import { DividendWorkspace } from "@/components/workspace/dividend-workspace"
import { CompareWorkspace } from "@/components/workspace/compare-workspace"

/**
 * The company workspace — one company, every analysis.
 *
 * This route is the whole point of the navigation change. Risk, forecast and
 * dividend used to be sibling pages, each of which made you name the company
 * again on arrival. Here the company is the route and the analyses are tabs, so
 * a symbol chosen once carries through all of them.
 *
 * The active tab lives in `?tab=` rather than component state, which keeps a
 * particular analysis of a particular company linkable and leaves the browser's
 * back button meaning what the user expects.
 */

const TABS = [
  { value: "risk", label: "Risk", icon: Shield, module: "risk" },
  { value: "forecast", label: "Price Forecast", icon: LineChart, module: "predict" },
  { value: "dividend", label: "Dividend", icon: Banknote, module: "dividend" },
  { value: "compare", label: "Compare", icon: GitCompareArrows, module: null },
] as const

type TabValue = (typeof TABS)[number]["value"]

const DEFAULT_TAB: TabValue = "risk"

export default function CompanyPage() {
  const params = useParams<{ symbol: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { companies } = useCompanyDirectory()

  const routeSymbol = baseSymbol(decodeURIComponent(params.symbol ?? ""))

  // A symbol typed straight into the address bar may not be in the directory
  // yet (the backend list loads async, and the static list is not exhaustive).
  // Falling back keeps the analyses reachable instead of showing a dead end.
  const company = useMemo(
    () => findCompany(companies, routeSymbol) ?? unknownCompany(routeSymbol),
    [companies, routeSymbol],
  )

  const requestedTab = searchParams.get("tab") as TabValue | null
  const activeTab: TabValue = TABS.some((t) => t.value === requestedTab)
    ? (requestedTab as TabValue)
    : DEFAULT_TAB

  useEffect(() => {
    if (company.name) pushRecentCompany({ symbol: company.symbol, name: company.name })
  }, [company.symbol, company.name])

  const handleTabChange = (value: string) => {
    const query = new URLSearchParams(searchParams.toString())
    query.set("tab", value)
    // replace, not push: flipping between tabs of the same company should not
    // make the back button walk through every tab you happened to open.
    router.replace(`/company/${encodeURIComponent(company.symbol)}?${query.toString()}`, {
      scroll: false,
    })
  }

  const supported = (tab: (typeof TABS)[number]) =>
    tab.module === null || company.modules[tab.module]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Shared across every tab — company identity does not belong to any one
          analysis, and keeping it here means it survives tab switches. It also
          carries the name, symbol and sector, so a separate page heading above
          it would only repeat what it already says. */}
      <CompanyProfileCard symbol={company.cseSymbol} fallbackName={company.name} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* These are the page's primary navigation, so they get more presence
            than the default pill row: a taller strip and a ring on the active
            tab, which stays legible in both themes. */}
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const available = supported(tab)
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-2.5 data-[state=active]:ring-1 data-[state=active]:ring-primary/25 data-[state=active]:font-semibold"
                title={available ? undefined : `No ${tab.label.toLowerCase()} data for ${company.symbol}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {!available && <Ban className="h-3 w-3 opacity-50" />}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="risk" className="mt-6">
          <RiskWorkspace symbol={company.symbol} cseSymbol={company.cseSymbol} />
        </TabsContent>

        <TabsContent value="forecast" className="mt-6">
          <PredictWorkspace symbol={company.symbol} />
        </TabsContent>

        <TabsContent value="dividend" className="mt-6">
          {company.modules.dividend ? (
            <DividendWorkspace symbol={company.symbol} />
          ) : (
            <UnsupportedModule
              company={company.name}
              detail="Dividend prediction runs on filed financial records, which the platform currently holds for a subset of listed firms."
            />
          )}
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <CompareWorkspace symbol={company.symbol} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Shown when an analysis has no data for this company. Previously the picker
 * would happily offer such a company and the request would 404 — now the gap is
 * stated before anything is clicked.
 */
function UnsupportedModule({ company, detail }: { company: string; detail: string }) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="space-y-3 py-16 text-center">
        <Badge variant="outline" className="mx-auto">
          Not available
        </Badge>
        <p className="font-medium text-foreground">No dividend data for {company}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
