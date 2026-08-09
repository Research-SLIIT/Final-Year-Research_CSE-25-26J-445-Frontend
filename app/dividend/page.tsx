import { LegacyRouteRedirect } from "@/components/workspace/legacy-route-redirect"

/** Dividend analysis is now a tab of /company/[symbol]. */
export default function DividendRedirectPage() {
  return <LegacyRouteRedirect tab="dividend" />
}
