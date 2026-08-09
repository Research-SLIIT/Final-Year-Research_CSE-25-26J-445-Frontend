import { LegacyRouteRedirect } from "@/components/workspace/legacy-route-redirect"

/** Price prediction is now a tab of /company/[symbol]. */
export default function PredictRedirectPage() {
  return <LegacyRouteRedirect tab="forecast" />
}
