"use client"

/**
 * The demo's disclosure.
 *
 * A visitor deserves to know they are looking at captured output rather than a
 * live inference call — and saying so costs nothing, because what is on screen
 * is genuinely the models' work. The details panel breaks down where each
 * module's numbers came from, including the places where the honest answer is
 * "computed, not predicted" or "curated examples, not measured accuracy".
 *
 * The disclosure is not dismissible. A notice that a visitor can close is a
 * notice that is absent for most of the visit — someone who lands on a
 * forecast three pages in would have no way to know the numbers were
 * pre-computed. Only the details panel collapses.
 *
 * It is scoped to the company workspace, because that is the only route that
 * renders captured model output. The dashboard, news and account pages show
 * live Colombo Stock Exchange data, and claiming those numbers are
 * pre-computed would be its own kind of inaccuracy. (/risk, /predict and
 * /dividend only redirect into the workspace, so they need no notice of their
 * own.)
 */

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Info } from "lucide-react"
import { DEMO_MODE, loadDemoManifest, type DemoManifest } from "@/lib/demo/config"

export function DemoBanner() {
  const pathname = usePathname()
  const [manifest, setManifest] = useState<DemoManifest | null>(null)
  const [expanded, setExpanded] = useState(false)

  const onCompanyPage = pathname?.startsWith("/company/") ?? false

  useEffect(() => {
    if (!DEMO_MODE || !onCompanyPage) return
    loadDemoManifest().then(setManifest)
  }, [onCompanyPage])

  if (!DEMO_MODE || !onCompanyPage) return null

  const rows: Array<{ label: string; text: string | null }> = manifest
    ? [
        { label: "Price forecast", text: manifest.provenance.predict },
        { label: "Dividend", text: manifest.provenance.dividend },
        { label: "Financial health", text: manifest.provenance.health },
        { label: "Risk statistics", text: manifest.provenance.stats },
        { label: "News sentiment", text: manifest.provenance.sentiment },
      ].filter((row) => row.text)
    : []

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />

        <div className="min-w-0 flex-1">
          <p>
            <span className="font-medium">Demo.</span>{" "}
            Pre-computed model outputs and metrics — not predicted live.{" "}
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="underline underline-offset-2 hover:no-underline"
            >
              {expanded ? "Hide details" : "Where do these numbers come from?"}
            </button>
          </p>

          {expanded && (
            <dl className="mt-3 space-y-2 border-t border-amber-500/25 pt-3">
              {rows.map((row) => (
                <div key={row.label} className="sm:flex sm:gap-3">
                  <dt className="font-medium sm:w-36 sm:shrink-0">{row.label}</dt>
                  <dd className="opacity-90">{row.text}</dd>
                </div>
              ))}
              {manifest && (
                <p className="pt-1 text-xs opacity-80">
                  Live market data on this site — indices, movers, prices, news — is not captured.
                  It is fetched from the Colombo Stock Exchange in real time.
                </p>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
