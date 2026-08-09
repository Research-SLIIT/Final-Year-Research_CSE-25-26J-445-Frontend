import { LegacyRouteRedirect } from "@/components/workspace/legacy-route-redirect"

/** Risk analysis is now a tab of /company/[symbol]. */
export default function RiskRedirectPage() {
  return <LegacyRouteRedirect tab="risk" />
}
