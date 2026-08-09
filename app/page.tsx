"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart2,
  Bell,
  Clock,
  Star,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHero } from "@/components/dashboard-hero"
import { MarketNews } from "@/components/market-news"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// ─── Types (mirror of the /api/cse/* route contracts) ─────────────────────────

interface IndexQuote {
  label: string
  chartId: number
  value: number
  change: number
  pct: number
  high: number | null
  low: number | null
  previousClose: number
}

interface SectorRow {
  symbol: string
  name: string
  chartId: number
  value: number
  change: number
  pct: number
  turnoverMn: number
  volume: number
  trades: number
  share: number
}

interface Mover {
  symbol: string
  ticker: string
  name: string
  logo: string | null
  price: number
  change: number
  pct: number
}

interface ActiveStock {
  symbol: string
  ticker: string
  name: string
  turnoverMn: number
  volumeMn: number
  pct: number | null
}

interface SummaryTiles {
  marketCapBn: number | null
  marketCapTrend: number | null
  turnoverMn: number | null
  turnoverTrend: number | null
  volumeMn: number | null
  volumeTrend: number | null
  trades: number | null
  tradesTrend: number | null
}

interface Internals {
  per: number | null
  pbv: number | null
  dividendYield: number | null
  netForeignFlowMn: number | null
  listedCompanies: number | null
  tradedCompanies: number | null
}

type Point = { date: string; value: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTOR_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#6366f1",
]

const PERIODS = ["1D", "1W", "1M", "3M", "1Y"] as const

// ─── Formatting helpers ───────────────────────────────────────────────────────

function num(value: number | null | undefined, dp = 2): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return value.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

function signed(value: number | null | undefined, dp = 2, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${value >= 0 ? "+" : ""}${value.toFixed(dp)}${suffix}`
}

function formatChartDate(ts: number, period: string): string {
  const d = new Date(ts)
  if (period === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  }
  if (period === "1W") {
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Fetches a CSE index/sector series through our proxy and shapes it for recharts. */
async function loadSeries(chartId: number | string, period: string): Promise<Point[]> {
  const res = await fetch("/api/cse/chart-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chartId, period }),
  })
  if (!res.ok) throw new Error(`chart ${chartId} -> ${res.status}`)

  const raw = await res.json()
  const points: any[] = Array.isArray(raw) ? raw : raw?.data ?? []
  return points.map((p) => ({
    date: formatChartDate(p.d, period),
    value: Number(p.v),
  }))
}

/**
 * Real weekly returns, derived from the 1Y daily-close series: bucket closes by
 * ISO week, then measure each week's close against the previous week's.
 */
function weeklyReturns(points: Array<{ d: number; v: number }>, count = 8) {
  const byWeek = new Map<number, { ts: number; close: number }>()

  for (const p of points) {
    const d = new Date(p.d)
    const mondayOffset = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const key = monday.getTime()
    const seen = byWeek.get(key)
    if (!seen || p.d > seen.ts) byWeek.set(key, { ts: p.d, close: p.v })
  }

  const weeks = [...byWeek.entries()].sort((a, b) => a[0] - b[0])
  const out: Array<{ week: string; ret: number }> = []

  for (let i = 1; i < weeks.length; i++) {
    const prev = weeks[i - 1][1].close
    const curr = weeks[i][1].close
    if (!prev) continue
    out.push({
      week: new Date(weeks[i][0]).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      ret: ((curr - prev) / prev) * 100,
    })
  }

  return out.slice(-count)
}

// ─── Small presentational pieces ──────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}:{" "}
          <span className="font-bold">
            {typeof entry.value === "number" ? entry.value.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            }) : entry.value}
            {entry.unit ?? ""}
          </span>
        </p>
      ))}
    </div>
  )
}

function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded bg-muted/60 animate-pulse`} />
}

function TickerStrip({ items, loading }: { items: Mover[]; loading: boolean }) {
  // Duplicated so the marquee wraps seamlessly.
  const loop = items.length ? [...items, ...items] : []

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b border-blue-800/40 py-2 px-4">
      {loading || !loop.length ? (
        <div className="flex gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 w-24 rounded bg-blue-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-8 animate-marquee whitespace-nowrap" style={{ animationDuration: "30s" }}>
          {loop.map((item, i) => {
            const up = item.pct >= 0
            return (
              <span key={`${item.symbol}-${i}`} className="inline-flex items-center gap-2 text-xs font-medium">
                <span className="text-blue-300/80 font-bold">{item.ticker}</span>
                <span className="text-white">{num(item.price)}</span>
                <span className={up ? "text-emerald-400" : "text-red-400"}>
                  {up ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                  {signed(item.pct, 2, "%")}
                </span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IndexCard({
  title,
  quote,
  chartColor,
  data,
  loading,
}: {
  title: string
  quote: IndexQuote | SectorRow | null
  chartColor: string
  data: Point[]
  loading: boolean
}) {
  const up = (quote?.change ?? 0) >= 0

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${chartColor}, transparent 70%)` }}
      />
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </CardTitle>
          {loading || !quote ? (
            <SkeletonLine w="w-14" h="h-5" />
          ) : (
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0.5 border-0 font-medium flex-shrink-0 ${
                up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
              }`}
            >
              {signed(quote.pct, 2, "%")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          {loading || !quote ? (
            <>
              <SkeletonLine w="w-32" h="h-8" />
              <SkeletonLine w="w-20" h="h-4" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-foreground">{num(quote.value)}</div>
              <div
                className={`flex items-center gap-1 text-sm font-medium mt-0.5 ${
                  up ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {signed(quote.change)}
              </div>
            </>
          )}
        </div>

        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${title.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#spark-${title.replace(/\W/g, "")})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-between text-xs text-muted-foreground">
          {loading || !quote ? (
            <>
              <SkeletonLine w="w-16" h="h-3" />
              <SkeletonLine w="w-16" h="h-3" />
            </>
          ) : "high" in quote && quote.high != null ? (
            <>
              <span>H: <span className="text-foreground font-medium">{num(quote.high)}</span></span>
              <span>L: <span className="text-foreground font-medium">{num(quote.low)}</span></span>
            </>
          ) : (
            <>
              <span>
                Turnover:{" "}
                <span className="text-foreground font-medium">
                  {num((quote as SectorRow).turnoverMn, 1)} Mn
                </span>
              </span>
              <span>
                Trades:{" "}
                <span className="text-foreground font-medium">
                  {num((quote as SectorRow).trades, 0)}
                </span>
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StockRow({ item, isWinner }: { item: Mover; isWinner: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0 ${
            isWinner ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/10 text-red-500"
          }`}
        >
          {item.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.logo}
              alt=""
              className="w-full h-full object-contain bg-white"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            item.ticker.slice(0, 3)
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{item.ticker}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{item.name}</div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-foreground">LKR {num(item.price)}</div>
        <div
          className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
            isWinner ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {isWinner ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {signed(item.pct, 2, "%")}
        </div>
      </div>
    </div>
  )
}

function MoverSkeleton() {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted/60 animate-pulse" />
        <div className="space-y-1.5">
          <SkeletonLine w="w-14" h="h-3.5" />
          <SkeletonLine w="w-28" h="h-3" />
        </div>
      </div>
      <div className="space-y-1.5">
        <SkeletonLine w="w-20" h="h-3.5" />
        <SkeletonLine w="w-12" h="h-3" />
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // Market status
  const [marketStatus, setMarketStatus] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState(false)

  // Indices + sectors
  const [aspi, setAspi] = useState<IndexQuote | null>(null)
  const [snp, setSnp] = useState<IndexQuote | null>(null)
  const [sectors, setSectors] = useState<SectorRow[]>([])
  const [indexLoading, setIndexLoading] = useState(true)

  // Headline tiles
  const [tiles, setTiles] = useState<SummaryTiles | null>(null)
  const [internals, setInternals] = useState<Internals | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Movers
  const [gainers, setGainers] = useState<Mover[]>([])
  const [losers, setLosers] = useState<Mover[]>([])
  const [mostActive, setMostActive] = useState<ActiveStock[]>([])
  const [moversLoading, setMoversLoading] = useState(true)

  // Charts
  const [aspiPeriod, setAspiPeriod] = useState<string>("1D")
  const [sl20Period, setSl20Period] = useState<string>("1D")
  const [aspiSeries, setAspiSeries] = useState<Point[]>([])
  const [sl20Series, setSl20Series] = useState<Point[]>([])
  const [aspiChartLoading, setAspiChartLoading] = useState(true)
  const [sl20ChartLoading, setSl20ChartLoading] = useState(true)
  const [sectorSparks, setSectorSparks] = useState<Record<number, Point[]>>({})
  const [weekly, setWeekly] = useState<Array<{ week: string; ASPI: number; "S&P SL20": number }>>([])

  const [currentTime, setCurrentTime] = useState("")

  // ── Clock ──
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(
        `${now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} LKT`
      )
    }
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [])

  // ── Market status ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cse/market-status", { method: "POST" })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setMarketStatus(data?.status ?? data?.marketStatus ?? null)
        setStatusError(false)
      } catch {
        setStatusError(true)
      } finally {
        setStatusLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  // ── Indices + sectors ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cse/indices")
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setAspi(data.aspi ?? null)
        setSnp(data.snp ?? null)
        setSectors(data.sectors ?? [])
      } catch (err) {
        console.error("[dashboard] indices unavailable:", err)
      } finally {
        setIndexLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  // ── Headline tiles ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cse/market-summary")
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setTiles(data.tiles ?? null)
        setInternals(data.internals ?? null)
      } catch (err) {
        console.error("[dashboard] market summary unavailable:", err)
      } finally {
        setSummaryLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  // ── Movers ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cse/movers")
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setGainers(data.gainers ?? [])
        setLosers(data.losers ?? [])
        setMostActive(data.mostActive ?? [])
      } catch (err) {
        console.error("[dashboard] movers unavailable:", err)
      } finally {
        setMoversLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  // ── Index series, per selected period ──
  const loadIndexSeries = useCallback(
    async (
      chartId: number,
      period: string,
      setData: (p: Point[]) => void,
      setLoading: (b: boolean) => void
    ) => {
      setLoading(true)
      try {
        setData(await loadSeries(chartId, period))
      } catch (err) {
        console.error("[dashboard] chart unavailable:", err)
        setData([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadIndexSeries(1, aspiPeriod, setAspiSeries, setAspiChartLoading)
  }, [aspiPeriod, loadIndexSeries])

  useEffect(() => {
    loadIndexSeries(40, sl20Period, setSl20Series, setSl20ChartLoading)
  }, [sl20Period, loadIndexSeries])

  // ── Weekly returns, computed from the 1Y daily closes of both indices ──
  useEffect(() => {
    const load = async () => {
      try {
        const [aspiRaw, snpRaw] = await Promise.all([
          fetch("/api/cse/chart-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chartId: 1, period: "1Y" }),
          }).then((r) => r.json()),
          fetch("/api/cse/chart-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chartId: 40, period: "1Y" }),
          }).then((r) => r.json()),
        ])

        const aspiWeeks = weeklyReturns(Array.isArray(aspiRaw) ? aspiRaw : [])
        const snpWeeks = weeklyReturns(Array.isArray(snpRaw) ? snpRaw : [])
        const snpByWeek = new Map(snpWeeks.map((w) => [w.week, w.ret]))

        setWeekly(
          aspiWeeks.map((w) => ({
            week: w.week,
            ASPI: Number(w.ret.toFixed(2)),
            "S&P SL20": Number((snpByWeek.get(w.week) ?? 0).toFixed(2)),
          }))
        )
      } catch (err) {
        console.error("[dashboard] weekly returns unavailable:", err)
      }
    }
    load()
  }, [])

  // ── Sparklines for the two most-traded sector indices ──
  const featuredSectors = useMemo(() => sectors.slice(0, 2), [sectors])

  useEffect(() => {
    if (!featuredSectors.length) return
    let cancelled = false

    Promise.all(
      featuredSectors.map(async (sector) => {
        try {
          return [sector.chartId, await loadSeries(sector.chartId, "1M")] as const
        } catch {
          return [sector.chartId, []] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) setSectorSparks(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [featuredSectors])

  // ── Derived ──
  const isMarketOpen = marketStatus?.toLowerCase().includes("open") ?? false

  const statusBadge = statusLoading
    ? { text: "● …", cls: "border-muted text-muted-foreground bg-muted/30" }
    : statusError
    ? { text: "● UNKNOWN", cls: "border-muted text-muted-foreground bg-muted/30" }
    : isMarketOpen
    ? { text: "● OPEN", cls: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" }
    : { text: "● CLOSED", cls: "border-amber-500/30 text-amber-600 bg-amber-500/10" }

  const summaryCards = [
    {
      label: "Market Cap (LKR Bn)",
      value: tiles ? num(tiles.marketCapBn, 1) : null,
      trend: tiles?.marketCapTrend ?? null,
      icon: Globe,
    },
    {
      label: "Total Turnover (LKR Mn)",
      value: tiles ? num(tiles.turnoverMn, 1) : null,
      trend: tiles?.turnoverTrend ?? null,
      icon: DollarSign,
    },
    {
      label: "Total Volume (Mn)",
      value: tiles ? num(tiles.volumeMn, 1) : null,
      trend: tiles?.volumeTrend ?? null,
      icon: BarChart2,
    },
    {
      label: "No. of Trades",
      value: tiles ? num(tiles.trades, 0) : null,
      trend: tiles?.tradesTrend ?? null,
      icon: Activity,
    },
  ]

  // Sector pie: real share of today's traded value, top 7 plus an "Other" slice.
  const sectorPie = useMemo(() => {
    const traded = sectors.filter((s) => s.share > 0)
    const top = traded.slice(0, 7).map((s, i) => ({
      name: s.name.length > 22 ? `${s.name.slice(0, 22)}…` : s.name,
      value: Number(s.share.toFixed(1)),
      change: s.pct,
      color: SECTOR_COLORS[i % SECTOR_COLORS.length],
    }))
    const restShare = traded.slice(7).reduce((sum, s) => sum + s.share, 0)
    if (restShare > 0.1) {
      top.push({
        name: `Other (${traded.length - 7} sectors)`,
        value: Number(restShare.toFixed(1)),
        change: 0,
        color: "#94a3b8",
      })
    }
    return top
  }, [sectors])

  const activeChartData = useMemo(
    () =>
      mostActive.map((s) => ({
        name: s.ticker,
        "Turnover (Mn)": Number(s.turnoverMn.toFixed(1)),
        "Volume (Mn)": Number(s.volumeMn.toFixed(2)),
      })),
    [mostActive]
  )

  const renderIndexPanel = (
    label: string,
    quote: IndexQuote | null,
    series: Point[],
    chartLoading: boolean,
    period: string,
    setPeriod: (p: string) => void,
    color: string,
    gradientId: string,
    activeBtn: string
  ) => (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label} Statistics
          </CardTitle>
          <div className="flex gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  period === p
                    ? `${activeBtn} text-white`
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1">
          {indexLoading || !quote ? (
            <SkeletonLine w="w-32" h="h-8" />
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-foreground">{num(quote.value)}</div>
              <div
                className={`flex items-center gap-1 text-sm font-semibold mt-0.5 ${
                  quote.change >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {quote.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {signed(quote.pct, 2, "%")} ({signed(quote.change)})
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {chartLoading ? (
          <div className="flex items-center justify-center h-[180px]">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color }} />
          </div>
        ) : series.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">
            No series returned by CSE for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={series} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v) => v.toLocaleString()}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 2" }} />
              <Area
                type="monotone"
                dataKey="value"
                name={label}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {quote && (
          <div className="mt-2 pt-2 border-t border-border/40 flex justify-between text-xs">
            <span className="text-muted-foreground">Session range</span>
            <span className="font-medium text-foreground">
              {num(quote.low)} – {num(quote.high)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-5">
      {/* Live ticker — top gainers and losers from CSE */}
      <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
        <TickerStrip items={[...gainers, ...losers]} loading={moversLoading} />
      </div>

      <DashboardHero />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Market Dashboard
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 font-medium ${statusBadge.cls}`}>
              {statusBadge.text}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {currentTime || "—"} · Trading hours 09:30–14:30 LKT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Star className="h-3.5 w-3.5" /> My Watchlist
          </Button>
        </div>
      </div>

      {/*
        Two-column body: market panels on the left, news as a rail on the right.
        `items-start` lets the rail stick instead of stretching to the row height.
      */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0 space-y-5">

          {/* Headline totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summaryCards.map((card) => {
              const Icon = card.icon
              const up = (card.trend ?? 0) >= 0
              return (
                <Card key={card.label} className="border-border/60 bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded-lg bg-blue-500/10 p-1.5">
                        <Icon className="h-4 w-4 text-blue-500" />
                      </div>
                      {summaryLoading ? (
                        <SkeletonLine w="w-10" h="h-3" />
                      ) : (
                        <span className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                          {signed(card.trend, 1, "%")}
                        </span>
                      )}
                    </div>
                    {summaryLoading ? (
                      <SkeletonLine w="w-24" h="h-6" />
                    ) : (
                      <div className="text-xl font-bold text-foreground">{card.value ?? "—"}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Market internals — valuation and foreign flow, straight from CSE's daily summary */}
          <Card className="border-border/60 bg-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Market PER", value: internals ? num(internals.per, 1) : null },
                  { label: "Market PBV", value: internals ? num(internals.pbv, 1) : null },
                  { label: "Dividend Yield", value: internals ? `${num(internals.dividendYield, 1)}%` : null },
                  {
                    label: "Net Foreign Flow",
                    value: internals ? `LKR ${signed(internals.netForeignFlowMn, 1)} Mn` : null,
                    tone:
                      (internals?.netForeignFlowMn ?? 0) >= 0 ? "text-emerald-600" : "text-red-500",
                  },
                  {
                    label: "Companies Traded",
                    value: internals
                      ? `${num(internals.tradedCompanies, 0)} / ${num(internals.listedCompanies, 0)}`
                      : null,
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                    {summaryLoading ? (
                      <SkeletonLine w="w-16" h="h-5" />
                    ) : (
                      <div className={`text-sm font-bold ${stat.tone ?? "text-foreground"}`}>
                        {stat.value ?? "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Index cards — two headline indices plus the two most-traded sector indices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
            <IndexCard title="ASPI" quote={aspi} chartColor="#3b82f6" data={aspiSeries} loading={indexLoading} />
            <IndexCard title="S&P SL20" quote={snp} chartColor="#8b5cf6" data={sl20Series} loading={indexLoading} />
            {featuredSectors.map((sector, i) => (
              <IndexCard
                key={sector.symbol}
                title={sector.name}
                quote={sector}
                chartColor={i === 0 ? "#10b981" : "#f59e0b"}
                data={sectorSparks[sector.chartId] ?? []}
                loading={indexLoading}
              />
            ))}
            {/* Keep the row filled while sectors load */}
            {!indexLoading &&
              featuredSectors.length === 0 &&
              Array.from({ length: 2 }).map((_, i) => (
                <IndexCard key={i} title="Sector" quote={null} chartColor="#10b981" data={[]} loading />
              ))}
          </div>

          {/* Index charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderIndexPanel(
              "ASPI", aspi, aspiSeries, aspiChartLoading, aspiPeriod, setAspiPeriod,
              "#10b981", "aspiGrad", "bg-emerald-600"
            )}
            {renderIndexPanel(
              "S&P SL20", snp, sl20Series, sl20ChartLoading, sl20Period, setSl20Period,
              "#8b5cf6", "sl20Grad", "bg-violet-600"
            )}
          </div>

          {/* Sector allocation + most active */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Sector Activity</CardTitle>
                <CardDescription className="text-xs">Share of today&apos;s traded value (%)</CardDescription>
              </CardHeader>
              <CardContent>
                {indexLoading ? (
                  <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="text-xs">Loading sector data…</span>
                  </div>
                ) : sectorPie.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-16">
                    No sector turnover reported for this session yet.
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={sectorPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sectorPie.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-1">
                      {sectorPie.map((sector) => (
                        <div key={sector.name} className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: sector.color }}
                            />
                            <span className="text-muted-foreground truncate">{sector.name}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-semibold text-foreground">{sector.value}%</span>
                            <span
                              className={`font-medium w-14 text-right ${
                                sector.change >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {signed(sector.change, 2, "%")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Most Active</CardTitle>
                <CardDescription className="text-xs">By turnover (LKR Mn) and volume (Mn shares)</CardDescription>
              </CardHeader>
              <CardContent>
                {moversLoading ? (
                  <div className="flex items-center justify-center h-[220px]">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="Turnover (Mn)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.9} />
                      <Bar dataKey="Volume (Mn)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Top movers + weekly returns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Movers</CardTitle>
                <CardDescription className="text-xs">Today&apos;s best and worst performing stocks</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="gainers">
                  <TabsList className="mb-3 bg-muted/50">
                    <TabsTrigger value="gainers" className="text-xs gap-1.5 data-[state=active]:text-emerald-600">
                      <TrendingUp className="h-3.5 w-3.5" /> Top Gainers
                    </TabsTrigger>
                    <TabsTrigger value="losers" className="text-xs gap-1.5 data-[state=active]:text-red-500">
                      <TrendingDown className="h-3.5 w-3.5" /> Top Losers
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="gainers" className="mt-0 space-y-0.5">
                    {moversLoading
                      ? Array.from({ length: 5 }).map((_, i) => <MoverSkeleton key={i} />)
                      : gainers.map((item) => <StockRow key={item.symbol} item={item} isWinner />)}
                  </TabsContent>
                  <TabsContent value="losers" className="mt-0 space-y-0.5">
                    {moversLoading
                      ? Array.from({ length: 5 }).map((_, i) => <MoverSkeleton key={i} />)
                      : losers.map((item) => <StockRow key={item.symbol} item={item} isWinner={false} />)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Weekly Returns</CardTitle>
                <CardDescription className="text-xs">
                  Last 8 weeks, from CSE daily closes (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weekly.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px]">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="ASPI" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="S&P SL20" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/*
          News rail. Sticks below the 4rem app header on xl and scrolls inside
          itself, so headlines stay in view while the market panels scroll past.
          Below xl it drops under the main column and grows naturally.
        */}
        <aside className="min-w-0 xl:sticky xl:top-20">
          {/* The height cap lives on the card, not the aside — `h-full` cannot
              resolve against a parent whose height is only bounded by max-height. */}
          <MarketNews className="xl:max-h-[calc(100vh-6rem)]" />
        </aside>
      </div>

      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> Every figure on this dashboard — indices, market totals,
            valuation ratios, foreign flow, sector activity and movers — is fetched live from the{" "}
            <strong>Colombo Stock Exchange (CSE)</strong> public API, and headlines come from CSE
            announcements plus Sri Lankan business media. Figures are indicative and may lag the
            official CSE record. This platform is for research purposes only and is not financial
            advice.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
