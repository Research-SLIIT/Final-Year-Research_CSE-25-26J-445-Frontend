"use client"

import { useEffect } from "react"
import { Building2, ExternalLink, Globe, LayoutGrid, Mail, MapPin, Phone } from "lucide-react"

import { useCompanyProfile } from "@/hooks/use-company-profile"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Company identity, shown once above the tab strip.
 *
 * This used to render inside the risk analysis, gated behind that tab's
 * financial-health response — so it appeared only on Risk, and only after a
 * multi-second stream finished. It describes the company rather than any one
 * analysis, so it belongs to the page.
 *
 * It fetches by symbol through the shared request cache, which means switching
 * tabs (or coming back to a company) re-renders it from memory instead of
 * re-requesting, and it never blinks between tabs.
 */
export function CompanyProfileCard({
  symbol,
  fallbackName,
}: {
  /** Full exchange ticker — the profile endpoint keys on this form. */
  symbol: string
  /** Directory name, shown until (or unless) the profile responds. */
  fallbackName?: string
}) {
  const { data, loading, fetchProfile } = useCompanyProfile(symbol)
  const summary = data?.summary

  // The card owns its own fetch now that it no longer rides along with the risk
  // analysis. On a revisit this resolves straight out of the cache.
  useEffect(() => {
    if (symbol) fetchProfile(symbol)
  }, [symbol, fetchProfile])

  return (
    <Card className="relative overflow-hidden bg-linear-to-br from-blue-500/10 via-indigo-500/8 to-violet-500/10 border-indigo-500/20 backdrop-blur">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[20px_20px]" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-linear-to-bl from-indigo-400/15 via-violet-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-blue-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-linear-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            Company Profile
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10">
        {loading && !summary ? (
          <div className="flex flex-col gap-6 md:flex-row">
            <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-64" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            {data?.logoUrl && (
              <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-xl bg-white dark:bg-white/5 p-2 shadow-sm shadow-indigo-500/10">
                <img
                  src={data.logoUrl}
                  alt={summary?.name ?? "Company logo"}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 space-y-4">
              {/* Header row */}
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Company Name</p>
                  {/* The page's heading: with the duplicate title above the card
                      removed, this is the only place the company is named. */}
                  <h1 className="text-base font-bold">{summary?.name ?? fallbackName ?? symbol}</h1>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    {summary?.symbol ?? symbol}
                  </Badge>
                  {summary?.sector && (
                    <Badge variant="secondary" className="text-xs">
                      <LayoutGrid className="h-3 w-3 mr-1" />
                      {summary.sector}
                    </Badge>
                  )}
                  {summary?.boardType && (
                    <Badge variant="secondary" className="text-xs">
                      {summary.boardType}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {summary?.registerOffice && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Registered Office</p>
                      <p className="font-medium text-xs">{summary.registerOffice}</p>
                    </div>
                  </div>
                )}
                {summary?.tel1 && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telephone</p>
                      <p className="font-medium text-xs">{summary.tel1}</p>
                    </div>
                  </div>
                )}
                {summary?.fax && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fax</p>
                      <p className="font-medium text-xs">{summary.fax}</p>
                    </div>
                  </div>
                )}
                {summary?.email1 && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${summary.email1}`}
                        className="font-medium text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {summary.email1}
                      </a>
                    </div>
                  </div>
                )}
                {summary?.web && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a
                        href={summary.web.startsWith("http") ? summary.web : `https://${summary.web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {summary.web}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
