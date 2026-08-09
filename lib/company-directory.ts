/**
 * Company directory — the single source of truth behind the global search.
 *
 * Before this existed each feature shipped its own picker over its own list:
 * risk searched the static CSE list (`ABAN.N0000` style symbols), prediction
 * searched the backend `/open-price/companies` list (suffix-stripped ids), and
 * dividend searched a hardcoded 15-firm array (short firm codes). Same company,
 * three spellings, three universes — which is why a symbol could not survive a
 * move from one page to another.
 *
 * The directory reconciles them:
 *   - `symbol`     canonical short code, used as the /company/[symbol] route key
 *   - `cseSymbol`  full exchange ticker, required by the financial-health endpoints
 *   - `modules`    which analyses actually have data for this company
 *
 * `modules` matters: only the 15 firms seeded into `financial_records` can be
 * analysed for dividends, so the company page uses it to disable a tab up front
 * rather than letting the user click through to a 404.
 */

import { CSE_COMPANIES } from "@/data/cse-companies"
import { fetchCompanies } from "@/lib/api/open-price-prediction.api"

export interface ModuleSupport {
  risk: boolean
  predict: boolean
  dividend: boolean
}

export interface DirectoryCompany {
  /** Canonical short code — the route key. e.g. "JKH" */
  symbol: string
  /** Full exchange ticker where known. e.g. "JKH.N0000" */
  cseSymbol: string
  name: string
  sector?: string
  modules: ModuleSupport
}

/**
 * The firms present in the backend `financial_records` collection (2011-2024).
 * Dividend prediction 404s for anything outside this list, so it is coverage
 * data, not a search shortlist. Kept verbatim from the old TickerSearchDIV.
 */
export const DIVIDEND_FIRMS: Array<{ symbol: string; name: string; sector: string }> = [
  { symbol: "BALA", name: "Balangoda Plantations PLC", sector: "Plantations" },
  { symbol: "BFL", name: "Bairaha Farms PLC", sector: "Food & Beverage" },
  { symbol: "CARG", name: "Cargills (Ceylon) PLC", sector: "Food & Staples Retailing" },
  { symbol: "CBH", name: "Ceylon Beverage Holdings PLC", sector: "Food & Beverage" },
  { symbol: "CCS", name: "Ceylon Cold Stores PLC", sector: "Food & Beverage" },
  { symbol: "CTC", name: "Ceylon Tobacco Company PLC", sector: "Tobacco" },
  { symbol: "CTEA", name: "Dilmah Ceylon Tea Company PLC", sector: "Food & Beverage" },
  { symbol: "HVA", name: "HVA Foods PLC", sector: "Food & Beverage" },
  { symbol: "KFP", name: "Keells Food Products PLC", sector: "Food & Beverage" },
  { symbol: "KTH", name: "Kotmale Holdings PLC", sector: "Food & Beverage" },
  { symbol: "MAL", name: "Malwatte Valley Plantations PLC", sector: "Plantations" },
  { symbol: "RAF", name: "Renuka Agri Foods PLC", sector: "Food & Beverage" },
  { symbol: "RF", name: "Renuka Foods PLC", sector: "Food & Beverage" },
  { symbol: "SOY", name: "Convenience Foods (Lanka) PLC", sector: "Food & Beverage" },
  { symbol: "TSH", name: "Tea Smallholder Factories PLC", sector: "Food & Beverage" },
]

/** Companies surfaced before the user has typed anything. */
export const POPULAR_SYMBOLS = ["JKH", "DIAL", "COMB", "HNB", "SAMP", "LIOC", "CARG", "CTC"]

/**
 * Strip the exchange suffix to get the canonical code.
 * Broader than `normalizeSymbol` in lib/utils, which only handles `.N<digits>` —
 * the CSE list also carries `.X0000` and `.E0000` classes.
 */
export function baseSymbol(symbol: string): string {
  return symbol.split(".")[0].trim().toUpperCase()
}

function emptyModules(): ModuleSupport {
  return { risk: false, predict: false, dividend: false }
}

function merge(index: Map<string, DirectoryCompany>, entry: {
  symbol: string
  cseSymbol?: string
  name: string
  sector?: string
  module: keyof ModuleSupport
}) {
  const key = baseSymbol(entry.symbol)
  if (!key) return

  const existing = index.get(key)
  if (existing) {
    existing.modules[entry.module] = true
    // A full ticker beats a bare code, and a longer name is usually the more
    // complete one ("Cargills (Ceylon) PLC" over "Cargills").
    if (entry.cseSymbol && existing.cseSymbol === existing.symbol) existing.cseSymbol = entry.cseSymbol
    if (entry.name.length > existing.name.length) existing.name = entry.name
    if (entry.sector && !existing.sector) existing.sector = entry.sector
    return
  }

  const modules = emptyModules()
  modules[entry.module] = true
  index.set(key, {
    symbol: key,
    cseSymbol: entry.cseSymbol ?? key,
    name: entry.name,
    sector: entry.sector,
    modules,
  })
}

function buildStaticIndex(): Map<string, DirectoryCompany> {
  const index = new Map<string, DirectoryCompany>()
  for (const company of CSE_COMPANIES) {
    merge(index, {
      symbol: company.symbol,
      cseSymbol: company.symbol,
      name: company.name,
      module: "risk",
    })
  }
  for (const firm of DIVIDEND_FIRMS) {
    merge(index, {
      symbol: firm.symbol,
      name: firm.name,
      sector: firm.sector,
      module: "dividend",
    })
  }
  return index
}

function sortByName(companies: DirectoryCompany[]): DirectoryCompany[] {
  return companies.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Synchronous baseline — everything knowable without a network call. Rendered
 * on first paint so the search box is usable before the backend list lands.
 */
export const STATIC_DIRECTORY: DirectoryCompany[] = sortByName([...buildStaticIndex().values()])

let cached: DirectoryCompany[] | null = null
let inflight: Promise<DirectoryCompany[]> | null = null

/**
 * Full directory, including the prediction-capable companies reported by the
 * backend. Cached for the page session; a failed fetch degrades to the static
 * baseline rather than emptying the search.
 */
export function loadDirectory(): Promise<DirectoryCompany[]> {
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight

  inflight = fetchCompanies()
    .then((list) => {
      const index = buildStaticIndex()
      for (const company of list) {
        merge(index, {
          symbol: company.id,
          cseSymbol: company.id.includes(".") ? company.id : undefined,
          name: company.name || company.id,
          module: "predict",
        })
      }
      cached = sortByName([...index.values()])
      return cached
    })
    .catch(() => STATIC_DIRECTORY)
    .finally(() => {
      inflight = null
    })

  return inflight
}

/**
 * Rank matches so an exact ticker wins over a company whose name merely
 * contains the query — typing "HNB" should not bury HNB under "Ashen HNB…".
 */
export function filterDirectory(
  companies: DirectoryCompany[],
  query: string,
  limit = 8,
): DirectoryCompany[] {
  const q = query.trim().toLowerCase()

  if (!q) {
    const popular = POPULAR_SYMBOLS.map((symbol) =>
      companies.find((c) => c.symbol === symbol),
    ).filter((c): c is DirectoryCompany => Boolean(c))
    return popular.length ? popular.slice(0, limit) : companies.slice(0, limit)
  }

  const scored: Array<{ company: DirectoryCompany; score: number }> = []
  for (const company of companies) {
    const symbol = company.symbol.toLowerCase()
    const name = company.name.toLowerCase()

    let score = -1
    if (symbol === q) score = 0
    else if (symbol.startsWith(q)) score = 1
    else if (name.startsWith(q)) score = 2
    else if (name.includes(q)) score = 3
    else if (company.cseSymbol.toLowerCase().includes(q)) score = 4
    else if ((company.sector ?? "").toLowerCase().includes(q)) score = 5

    if (score >= 0) scored.push({ company, score })
  }

  return scored
    .sort((a, b) => a.score - b.score || a.company.name.localeCompare(b.company.name))
    .slice(0, limit)
    .map((entry) => entry.company)
}

export function findCompany(
  companies: DirectoryCompany[],
  symbol: string,
): DirectoryCompany | undefined {
  const key = baseSymbol(symbol)
  return companies.find((c) => c.symbol === key)
}

/**
 * Fallback for a symbol typed straight into the URL that the directory has
 * never heard of. The analyses may still answer, so we route rather than 404.
 */
export function unknownCompany(symbol: string): DirectoryCompany {
  const key = baseSymbol(symbol)
  return {
    symbol: key,
    cseSymbol: symbol.includes(".") ? symbol : key,
    name: key,
    modules: { risk: true, predict: true, dividend: false },
  }
}
