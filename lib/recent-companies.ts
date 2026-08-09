/**
 * Recently viewed companies.
 *
 * With navigation reduced to a single search box, the dashboard needs to answer
 * "what was I just looking at?" on its own — this is what replaces the sidebar's
 * job of getting you back somewhere in one click.
 */

const STORAGE_KEY = "recent-companies"
const MAX_RECENT = 6

export interface RecentCompany {
  symbol: string
  name: string
}

export function getRecentCompanies(): RecentCompany[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry): entry is RecentCompany =>
        Boolean(entry && typeof entry.symbol === "string" && typeof entry.name === "string"),
      )
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

/**
 * Recents accumulate silently from every company page visit, so the only way to
 * take one back off the list is to drop the lot.
 */
export function clearRecentCompanies(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* see pushRecentCompany — storage failures are never fatal here */
  }
}

export function pushRecentCompany(company: RecentCompany): RecentCompany[] {
  if (typeof window === "undefined") return []
  const next = [company, ...getRecentCompanies().filter((c) => c.symbol !== company.symbol)].slice(
    0,
    MAX_RECENT,
  )
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota or private mode — recents are a convenience, not a requirement */
  }
  return next
}
