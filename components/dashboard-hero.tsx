"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Banknote,
  Clock3,
  GitCompareArrows,
  LineChart,
  Newspaper,
  Search,
  Shield,
  Sparkles,
} from "lucide-react"

import { CompanySearch } from "@/components/company-search"
import { useCompanyDirectory } from "@/hooks/use-company-directory"
import type { ModuleSupport } from "@/lib/company-directory"
import {
  clearRecentCompanies,
  getRecentCompanies,
  type RecentCompany,
} from "@/lib/recent-companies"
import { cn } from "@/lib/utils"

/**
 * The dashboard's entry point into the rest of the app.
 *
 * With the nav rail gone, this block carries the discoverability the sidebar
 * used to provide: the search is the way in, and the capability chips below it
 * say what searching a company will get you. Without them a first-time visitor
 * has no way to learn the platform does risk scoring or dividend forecasting.
 *
 * The chips are also the search's scope. They used to be inert labels that
 * looked exactly like the clickable "Market news" pill next to them, so picking
 * one did nothing — now the choice both narrows results to companies the
 * analysis actually covers and decides which tab the company opens on.
 */

interface Scope {
  id: string
  label: string
  icon: typeof Shield
  /** Restricts results to companies with data for this analysis. */
  module?: keyof ModuleSupport
  /** Tab the chosen company opens on. */
  tab?: string
  placeholder: string
  hint: string
  /** Shown when a search inside this scope comes back empty. */
  noResultsHint?: string
}

const SCOPES: Scope[] = [
  {
    id: "all",
    label: "All analyses",
    icon: Sparkles,
    placeholder: "Search a company or symbol…",
    hint: "Pick a company and every analysis we have on it opens in one place.",
  },
  {
    id: "risk",
    label: "Risk analysis",
    icon: Shield,
    module: "risk",
    tab: "risk",
    placeholder: "Which company's risk do you want scored?",
    hint: "Financial-health scoring from the company's published fundamentals.",
  },
  {
    id: "forecast",
    label: "Price forecast",
    icon: LineChart,
    module: "predict",
    tab: "forecast",
    placeholder: "Which company's price do you want forecast?",
    hint: "Next-session opening-price forecast, for companies with model coverage.",
    noResultsHint: "Only companies with enough trading history are modelled.",
  },
  {
    id: "dividend",
    label: "Dividend outlook",
    icon: Banknote,
    module: "dividend",
    tab: "dividend",
    placeholder: "Which company's dividend do you want checked?",
    hint: "Probability of a dividend cut, from a decade of annual filings.",
    noResultsHint: "Dividend history has only been ingested for a shortlist of firms so far.",
  },
  {
    id: "compare",
    label: "Compare firms",
    icon: GitCompareArrows,
    tab: "compare",
    placeholder: "Start with one company, then add its peers…",
    hint: "Line a company up against its peers side by side.",
  },
]

/** How many companies each scope can actually answer for. */
function useScopeCounts() {
  const { companies } = useCompanyDirectory()

  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const scope of SCOPES) {
      counts[scope.id] = scope.module
        ? companies.filter((company) => company.modules[scope.module!]).length
        : companies.length
    }
    return counts
  }, [companies])
}

export function DashboardHero() {
  const [recents, setRecents] = useState<RecentCompany[]>([])
  const [scopeId, setScopeId] = useState("all")
  const counts = useScopeCounts()

  const scope = SCOPES.find((s) => s.id === scopeId) ?? SCOPES[0]

  // localStorage is client-only, so recents fill in after hydration rather
  // than rendering a server/client mismatch.
  useEffect(() => {
    setRecents(getRecentCompanies())
  }, [])

  return (
    <section className="relative rounded-2xl border border-border/70 bg-card/40 p-6 md:p-9">
      {/*
        Decorative wash — kept behind a pointer-events-none layer so it never
        swallows a click meant for the search.

        The clipping lives on this layer rather than on the section: the section
        used to be `overflow-hidden` to keep the blur inside the rounded corners,
        which also cropped the search's result dropdown at the section's bottom
        edge. Only the decoration needs clipping.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-500/10" />
        <div className="absolute -top-24 left-1/2 h-56 w-xl max-w-full -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
            Analyse any{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              CSE-listed
            </span>{" "}
            company
          </h2>
          <p className="text-sm text-muted-foreground text-pretty md:text-base">
            Search once — risk, forecast and dividend analysis all open on the company you pick.
          </p>
        </div>

        {/*
          Not keyed on the scope: switching analysis should re-filter what you
          already typed, not throw it away and make you type it again.

          The module filter is dropped when the directory reports no coverage
          for it — the prediction list only arrives from the backend, and
          filtering against an empty set would turn a scope into a search that
          matches nothing at all whenever that fetch fails.
        */}
        <CompanySearch
          module={counts[scope.id] > 0 ? scope.module : undefined}
          tab={scope.tab}
          placeholder={scope.placeholder}
          noResultsHint={scope.noResultsHint}
          emptyQueryHeading={scopeId === "all" ? "Popular companies" : "Suggested companies"}
          hotkey="/"
          autoFocus={false}
          className="text-left"
        />

        <div className="space-y-2.5">
          {/*
            Toggle buttons rather than role="radio": a radiogroup promises
            arrow-key roving focus to a screen reader, and these are plain
            tab-stops.
          */}
          <div
            role="group"
            aria-label="Analysis to search for"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {SCOPES.map(({ id, label, icon: Icon }) => {
              const active = id === scopeId
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setScopeId(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                      : "border-transparent bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {counts[id] > 0 && (
                    <span
                      className={cn(
                        "font-mono text-[10px] tabular-nums",
                        active ? "text-blue-600/80 dark:text-blue-400/80" : "text-muted-foreground",
                      )}
                    >
                      {counts[id]}
                    </span>
                  )}
                </button>
              )
            })}

            {/* News is a destination, not a search scope — separated so it stops
                reading as a sixth chip in the group. */}
            <span aria-hidden className="mx-1 hidden h-4 w-px bg-border sm:block" />
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Newspaper className="h-3.5 w-3.5" />
              Market news
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Fixed height so switching scope never nudges the layout. */}
          <p className="flex min-h-5 items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Search className="h-3 w-3 shrink-0" />
            {scope.hint}
          </p>
        </div>

        {recents.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 pt-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Recently viewed
            </span>
            {recents.map((company) => (
              <Link
                key={company.symbol}
                href={`/company/${encodeURIComponent(company.symbol)}${
                  scope.tab ? `?tab=${scope.tab}` : ""
                }`}
                title={company.name}
                className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:border-blue-500/40 hover:bg-accent"
              >
                {company.symbol}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                clearRecentCompanies()
                setRecents([])
              }}
              className="rounded-full px-2 py-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
