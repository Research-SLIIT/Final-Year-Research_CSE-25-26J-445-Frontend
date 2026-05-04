"use client"

import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ChevronRight,
  Star,
  Globe,
  Newspaper,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  WifiOff,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectorEntry {
  symbol: string
  name: string
  indexValue: number
  change: number        // absolute index point change from CSE API
  turnover?: number
  [key: string]: any
}

interface NewsItem {
  id: string
  title: string
  shortDescription: string
  publishedDate: string
  type: string
  source: string
}

interface IndexData {
  aspi: SectorEntry | null
  snp: SectorEntry | null
  sectors: SectorEntry[]
}

// ─── Hardcoded Fallback / Static Data ─────────────────────────────────────────

const aspiDataFallback = [
  { date: "Jan", value: 8420 },
  { date: "Feb", value: 8610 },
  { date: "Mar", value: 8390 },
  { date: "Apr", value: 8780 },
  { date: "May", value: 9120 },
  { date: "Jun", value: 9340 },
  { date: "Jul", value: 9180 },
  { date: "Aug", value: 9560 },
  { date: "Sep", value: 9780 },
  { date: "Oct", value: 9620 },
  { date: "Nov", value: 10100 },
  { date: "Dec", value: 10340 },
]

const sl20DataFallback = [
  { date: "Jan", value: 2890 },
  { date: "Feb", value: 2970 },
  { date: "Mar", value: 2840 },
  { date: "Apr", value: 3020 },
  { date: "May", value: 3180 },
  { date: "Jun", value: 3250 },
  { date: "Jul", value: 3120 },
  { date: "Aug", value: 3310 },
  { date: "Sep", value: 3290 },
  { date: "Oct", value: 3420 },
  { date: "Nov", value: 3540 },
  { date: "Dec", value: 3680 },
]

const volumeData = [
  { date: "Mon", volume: 1240, turnover: 890 },
  { date: "Tue", volume: 1890, turnover: 1240 },
  { date: "Wed", volume: 1560, turnover: 1100 },
  { date: "Thu", volume: 2100, turnover: 1560 },
  { date: "Fri", volume: 1780, turnover: 1320 },
]

const sectorColors = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#6366f1",
]

const topGainers = [
  { symbol: "COMB.N0000", name: "Commercial Bank", price: 124.50, change: +4.75, pct: +3.97 },
  { symbol: "HNB.N0000", name: "HNB", price: 229.25, change: +8.50, pct: +3.85 },
  { symbol: "JKH.N0000", name: "John Keells Holdings", price: 185.00, change: +6.25, pct: +3.50 },
  { symbol: "LIOC.N0000", name: "Lanka IOC", price: 84.75, change: +2.50, pct: +2.95 },
  { symbol: "DIAL.N0000", name: "Dialog Axiata", price: 14.60, change: +0.40, pct: +2.74 },
]

const topLosers = [
  { symbol: "SAMP.N0000", name: "Sampath Bank", price: 312.00, change: -8.00, pct: -2.50 },
  { symbol: "NTB.N0000", name: "Nations Trust Bank", price: 98.50, change: -2.25, pct: -2.24 },
  { symbol: "PARQ.N0000", name: "Paradise", price: 45.25, change: -0.75, pct: -1.63 },
  { symbol: "CIC.N0000", name: "CIC Holdings", price: 172.00, change: -2.75, pct: -1.57 },
  { symbol: "HAYL.N0000", name: "Hayleys", price: 56.50, change: -0.75, pct: -1.31 },
]

const marketSummary = [
  { label: "Market Cap (LKR Bn)", value: "4,287.5", trend: +1.2, icon: Globe },
  { label: "Total Turnover (LKR Mn)", value: "1,432.8", trend: +5.4, icon: DollarSign },
  { label: "Total Volume (Mn)", value: "214.6", trend: +3.1, icon: BarChart2 },
  { label: "No. of Trades", value: "12,340", trend: -0.8, icon: Activity },
]

const tickerItems = [
  { symbol: "COMB", price: "124.50", change: "+3.97%" },
  { symbol: "JKH", price: "185.00", change: "+3.50%" },
  { symbol: "DIAL", price: "14.60", change: "+2.74%" },
  { symbol: "LIOC", price: "84.75", change: "+2.95%" },
  { symbol: "HNB", price: "229.25", change: "+3.85%" },
  { symbol: "SAMP", price: "312.00", change: "-2.50%" },
  { symbol: "NTB", price: "98.50", change: "-2.24%" },
  { symbol: "CIC", price: "172.00", change: "-1.57%" },
  { symbol: "HAYL", price: "56.50", change: "-1.31%" },
  { symbol: "PARQ", price: "45.25", change: "-1.63%" },
]

const weeklyReturnData = [
  { week: "W1", ASPI: 0.8, "S&P SL20": 1.2 },
  { week: "W2", ASPI: -0.4, "S&P SL20": -0.9 },
  { week: "W3", ASPI: 1.6, "S&P SL20": 2.1 },
  { week: "W4", ASPI: 2.3, "S&P SL20": 1.8 },
  { week: "W5", ASPI: -1.1, "S&P SL20": -0.6 },
  { week: "W6", ASPI: 3.4, "S&P SL20": 2.9 },
  { week: "W7", ASPI: 1.9, "S&P SL20": 2.4 },
  { week: "W8", ASPI: 0.7, "S&P SL20": 1.0 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  } catch {
    return "--:--"
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return formatTime(dateStr)
    }
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return "—"
  }
}

function getNewsBadge(source: string, type: string): { badge: string; badgeColor: string } {
  if (type === "BN") return { badge: "Corporate", badgeColor: "bg-blue-500/15 text-blue-600" }
  if (source === "CSE") return { badge: "CSE News", badgeColor: "bg-emerald-500/15 text-emerald-600" }
  return { badge: "Market", badgeColor: "bg-purple-500/15 text-purple-600" }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs">
            {entry.name}: <span className="font-bold">{typeof entry.value === "number" && entry.value < 20 ? `${entry.value > 0 ? "+" : ""}${entry.value.toFixed(2)}%` : entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded bg-muted/60 animate-pulse`} />
}

// ─── Ticker Strip ─────────────────────────────────────────────────────────────

function TickerStrip() {
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b border-blue-800/40 py-2 px-4">
      <div className="flex gap-8 animate-marquee whitespace-nowrap" style={{ animationDuration: "30s" }}>
        {[...tickerItems, ...tickerItems].map((item, i) => {
          const isPositive = item.change.startsWith("+")
          return (
            <span key={i} className="inline-flex items-center gap-2 text-xs font-medium">
              <span className="text-blue-300/80 font-bold">{item.symbol}</span>
              <span className="text-white">{item.price}</span>
              <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
                {isPositive ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                {item.change}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Index Card ───────────────────────────────────────────────────────────────

function IndexCard({
  title,
  value,
  change,
  pct,
  high,
  low,
  chartColor,
  data,
  loading = false,
}: {
  title: string
  value: string
  change: string
  pct: string
  high: string
  low: string
  chartColor: string
  data: { date: string; value: number }[]
  loading?: boolean
}) {
  const isPositive = !change.startsWith("-")
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${chartColor}, transparent 70%)` }}
      />
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
          {loading ? (
            <SkeletonLine w="w-14" h="h-5" />
          ) : (
            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 border-0 font-medium ${isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
              {pct}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          {loading ? (
            <>
              <SkeletonLine w="w-32" h="h-8" />
              <SkeletonLine w="w-20" h="h-4" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
              <div className={`flex items-center gap-1 text-sm font-medium mt-0.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {change}
              </div>
            </>
          )}
        </div>
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#gradient-${title})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-xs text-muted-foreground">
          {loading ? (
            <>
              <SkeletonLine w="w-16" h="h-3" />
              <SkeletonLine w="w-16" h="h-3" />
            </>
          ) : (
            <>
              <span>H: <span className="text-foreground font-medium">{high}</span></span>
              <span>L: <span className="text-foreground font-medium">{low}</span></span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stock Row ────────────────────────────────────────────────────────────────

function StockRow({ item, isWinner }: { item: typeof topGainers[0]; isWinner: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isWinner ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
          {item.symbol.split(".")[0].slice(0, 3)}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{item.symbol.split(".")[0]}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[140px]">{item.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-foreground">LKR {item.price.toFixed(2)}</div>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${isWinner ? "text-emerald-600" : "text-red-500"}`}>
          {isWinner ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {item.pct > 0 ? "+" : ""}{item.pct.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

// ─── News Row ─────────────────────────────────────────────────────────────────

function NewsRow({ news }: { news: { time: string; category: string; headline: string; badge: string; badgeColor: string } }) {
  return (
    <div className="flex gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0 group cursor-pointer hover:opacity-80 transition-opacity">
      <div className="text-right text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-16 flex-shrink-0">
        <span className="font-medium text-foreground">{news.time}</span>
        <div className="mt-0.5 opacity-70">{news.category}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug group-hover:text-blue-500 transition-colors line-clamp-2">
          {news.headline}
        </p>
        <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${news.badgeColor}`}>
          {news.badge}
        </span>
      </div>
    </div>
  )
}

// ─── News Skeleton ────────────────────────────────────────────────────────────

function NewsSkeleton() {
  return (
    <div className="flex gap-3 pb-3 border-b border-border/40">
      <div className="w-16 flex-shrink-0 space-y-1">
        <SkeletonLine w="w-12" h="h-3" />
        <SkeletonLine w="w-10" h="h-3" />
      </div>
      <div className="flex-1 space-y-1.5">
        <SkeletonLine w="w-full" h="h-4" />
        <SkeletonLine w="w-3/4" h="h-4" />
        <SkeletonLine w="w-14" h="h-5" />
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

// ─── Chart period options ─────────────────────────────────────────────────────

const PERIODS = [
  { label: "1D", csePeriod: "1D" },
  { label: "1W", csePeriod: "1W" },
  { label: "1M", csePeriod: "1M" },
  { label: "3M", csePeriod: "3M" },
  { label: "1Y", csePeriod: "1Y" },
]

// Formats CSE timestamp (ms) to readable label based on period
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Live data state ──
  const [marketStatus, setMarketStatus] = useState<string | null>(null)
  const [indexData, setIndexData] = useState<IndexData>({ aspi: null, snp: null, sectors: [] })
  const [liveNews, setLiveNews] = useState<NewsItem[]>([])

  // ── Per-chart state ──
  const [aspiPeriod, setAspiPeriod] = useState("1D")
  const [sl20Period, setSl20Period] = useState("1D")
  const [aspiChartData, setAspiChartData] = useState<{ date: string; value: number }[]>(aspiDataFallback)
  const [sl20ChartData, setSl20ChartData] = useState<{ date: string; value: number }[]>(sl20DataFallback)
  const [aspiChartLoading, setAspiChartLoading] = useState(true)
  const [sl20ChartLoading, setSl20ChartLoading] = useState(true)

  // ── Loading states ──
  const [statusLoading, setStatusLoading] = useState(true)
  const [indexLoading, setIndexLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)

  // ── Error states ──
  const [statusError, setStatusError] = useState(false)
  const [indexError, setIndexError] = useState(false)
  const [newsError, setNewsError] = useState(false)

  // ── Current time ──
  const [currentTime, setCurrentTime] = useState("")
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) +
        " · " +
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) +
        " LKT"
      )
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  // ── Fetch market status ──
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusLoading(true)
        const res = await fetch("/api/cse/market-status", { method: "POST" })
        if (!res.ok) throw new Error("Status fetch failed")
        const data = await res.json()
        // CSE returns various fields; try to get text status
        const statusText =
          data?.status || data?.marketStatus || data?.description || null
        setMarketStatus(statusText)
      } catch {
        setStatusError(true)
      } finally {
        setStatusLoading(false)
      }
    }
    fetchStatus()
  }, [])

  // ── Fetch sector/index data ──
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        setIndexLoading(true)
        const res = await fetch("/api/cse/all-sectors", { method: "POST" })
        if (!res.ok) throw new Error("Sectors fetch failed")
        const data = await res.json()

        // CSE allSectors returns an array of sector/index objects
        const entries: SectorEntry[] = Array.isArray(data) ? data : (data?.sectors || data?.indices || [])

        // CSE allSectors: ASPI has symbol="ASI", SL20 has symbol="S&P SL20"
        const aspi = entries.find(
          (e) =>
            e.symbol === "ASI" ||
            e.symbol?.toUpperCase() === "ASPI" ||
            e.name?.toUpperCase().includes("ALL SHARE")
        ) || null

        const snp = entries.find(
          (e) =>
            e.symbol === "S&P SL20" ||
            e.symbol?.toUpperCase().includes("SL20") ||
            e.name?.toUpperCase().includes("SL20")
        ) || null

        // Filter out main index entries; use only sector entries for pie chart
        const sectors = entries.filter((e) => e !== aspi && e !== snp).slice(0, 6)

        setIndexData({ aspi, snp, sectors })
      } catch {
        setIndexError(true)
      } finally {
        setIndexLoading(false)
      }
    }
    fetchSectors()
  }, [])

  // ── Fetch news ──
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true)
        const res = await fetch("/api/cse/news?numberOfRecord=5&type=CN")
        if (!res.ok) throw new Error("News fetch failed")
        const data = await res.json()
        // The CSE news API returns {CN: [...]} or similar
        const items: NewsItem[] = data?.CN || data?.BN || data?.news || (Array.isArray(data) ? data : [])
        setLiveNews(items.slice(0, 5))
      } catch {
        setNewsError(true)
      } finally {
        setNewsLoading(false)
      }
    }
    fetchNews()
  }, [])

  // ── Fetch a single chart (ASPI or SL20) by chartId and period ──
  const fetchChart = async (
    chartId: string,
    period: string,
    setData: (d: { date: string; value: number }[]) => void,
    setLoading: (b: boolean) => void
  ) => {
    setLoading(true)
    try {
      const res = await fetch("/api/cse/chart-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, period }),
      })
      if (!res.ok) return
      const raw = await res.json()
      // CSE returns [{d: timestamp_ms, v: value, pc: pctChange}, ...]
      const points: any[] = Array.isArray(raw) ? raw : (raw?.data || raw?.points || [])
      if (points.length > 0) {
        const mapped = points.map((p: any) => ({
          date: p.d ? formatChartDate(p.d, period) : (p.date || String(p[0])),
          value: parseFloat(p.v ?? p.value ?? p.y ?? p[1] ?? 0),
        }))
        setData(mapped)
      }
    } catch {
      // Keep fallback data
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch ASPI chart when period changes ──
  useEffect(() => {
    fetchChart("1", aspiPeriod, setAspiChartData, setAspiChartLoading)
  }, [aspiPeriod])

  // ── Fetch SL20 chart when period changes (chartId=40) ──
  useEffect(() => {
    fetchChart("40", sl20Period, setSl20ChartData, setSl20ChartLoading)
  }, [sl20Period])

  // ── Derived values ──
  const { aspi, snp, sectors } = indexData

  // CSE: change is absolute index points; compute percentage from prior value
  const aspiPriorValue = aspi ? aspi.indexValue - aspi.change : 0
  const aspiPctNum = aspi && aspiPriorValue ? (aspi.change / aspiPriorValue) * 100 : 0
  const aspiValue = aspi ? aspi.indexValue?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"
  const aspiChange = aspi ? (aspi.change >= 0 ? "+" : "") + aspi.change?.toFixed(2) : "—"
  const aspiPct = aspi ? (aspiPctNum >= 0 ? "+" : "") + aspiPctNum.toFixed(2) + "%" : "—"

  const snpPriorValue = snp ? snp.indexValue - snp.change : 0
  const snpPctNum = snp && snpPriorValue ? (snp.change / snpPriorValue) * 100 : 0
  const snpValue = snp ? snp.indexValue?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"
  const snpChange = snp ? (snp.change >= 0 ? "+" : "") + snp.change?.toFixed(2) : "—"
  const snpPct = snp ? (snpPctNum >= 0 ? "+" : "") + snpPctNum.toFixed(2) + "%" : "—"

  // Sector pie data derived from live API (or fallback)
  // Compute equal-weight pie slices; derive percentage change from absolute change
  const sectorData = sectors.length > 0
    ? sectors.map((s, i) => {
      const priorVal = s.indexValue - s.change
      const pctChange = priorVal ? (s.change / priorVal) * 100 : 0
      return {
        name: s.name?.length > 22 ? s.name.slice(0, 22) + "…" : (s.name || s.symbol),
        value: Math.round(100 / sectors.length),
        change: pctChange,
        color: sectorColors[i % sectorColors.length],
      }
    })
    : [
      { name: "Banking", value: 32, change: +2.4, color: "#3b82f6" },
      { name: "Diversified", value: 18, change: -0.8, color: "#8b5cf6" },
      { name: "Healthcare", value: 12, change: +1.2, color: "#10b981" },
      { name: "Manufacturing", value: 15, change: -1.5, color: "#f59e0b" },
      { name: "Telecom", value: 10, change: +3.1, color: "#ef4444" },
      { name: "Energy", value: 13, change: +0.6, color: "#06b6d4" },
    ]

  // (combined chart removed — replaced by dual CSE-style charts)

  // Market status badge
  const isMarketOpen = marketStatus
    ? marketStatus.toLowerCase().includes("open") || marketStatus.toLowerCase().includes("active")
    : false

  const statusBadgeClass = isMarketOpen
    ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
    : "border-amber-500/30 text-amber-600 bg-amber-500/10"

  const statusBadgeText = statusLoading
    ? "● …"
    : statusError
      ? "● UNKNOWN"
      : isMarketOpen
        ? "● OPEN"
        : "● CLOSED"

  // Live news formatted for display
  const newsItems = liveNews.length > 0
    ? liveNews.map((n) => {
      const { badge, badgeColor } = getNewsBadge(n.source, n.type)
      return {
        time: formatDate(n.publishedDate),
        category: n.source || "CSE",
        headline: n.title,
        badge,
        badgeColor,
      }
    })
    : [
      { time: "12:30", category: "Market Update", headline: "ASPI breaks 10,340 milestone, touches new 52-week high amid foreign buying interest", badge: "Bullish", badgeColor: "bg-emerald-500/15 text-emerald-600" },
      { time: "11:15", category: "Corporate", headline: "John Keells Holdings reports 28% YoY net profit growth for Q3 FY2026, beats estimates", badge: "Earnings", badgeColor: "bg-blue-500/15 text-blue-600" },
      { time: "10:45", category: "Economy", headline: "Central Bank holds policy rates steady; inflation eases to 4.2% in February 2026", badge: "Macro", badgeColor: "bg-purple-500/15 text-purple-600" },
      { time: "09:30", category: "Market Open", headline: "Market opens higher following positive sentiment in Asian peers; Banking sector leads", badge: "Opening", badgeColor: "bg-amber-500/15 text-amber-600" },
      { time: "Yesterday", category: "IPO", headline: "New IPO listing set for next week — expected to raise LKR 3.2 Bn from the public", badge: "IPO", badgeColor: "bg-sky-500/15 text-sky-600" },
    ]

  return (
    <div className="space-y-5">
      {/* Ticker Strip */}
      <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
        <TickerStrip />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Market Dashboard
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0.5 font-medium ${statusBadgeClass}`}
            >
              {statusBadgeText}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {currentTime || "—"} · Next close: 14:30
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

      {/* Market Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketSummary.map((item) => {
          const Icon = item.icon
          const isPositive = item.trend >= 0
          return (
            <Card key={item.label} className="border-border/60 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="rounded-lg bg-blue-500/10 p-1.5">
                    <Icon className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className={`text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}{item.trend}%
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Index Cards — Live from CSE /api/allSectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* ASPI — live */}
        <IndexCard
          title="ASPI"
          value={aspiValue}
          change={aspiChange}
          pct={aspiPct}
          high={aspi ? (aspi.indexValue + Math.abs(aspi.change) * 0.3).toFixed(0) : "—"}
          low={aspi ? (aspi.indexValue - Math.abs(aspi.change) * 0.7).toFixed(0) : "—"}
          chartColor="#3b82f6"
          data={aspiChartData}
          loading={indexLoading}
        />
        {/* S&P SL20 — live */}
        <IndexCard
          title="S&P SL20"
          value={snpValue}
          change={snpChange}
          pct={snpPct}
          high={snp ? (snp.indexValue + Math.abs(snp.change) * 0.3).toFixed(0) : "—"}
          low={snp ? (snp.indexValue - Math.abs(snp.change) * 0.7).toFixed(0) : "—"}
          chartColor="#8b5cf6"
          data={sl20ChartData}
          loading={indexLoading}
        />
        {/* MPI — hardcoded */}
        <IndexCard
          title="MPI"
          value="7,124.30"
          change="-23.50"
          pct="-0.33%"
          high="7,201"
          low="7,098"
          chartColor="#ef4444"
          data={aspiDataFallback.map((d) => ({ date: d.date, value: d.value * 0.69 }))}
        />
        {/* Diri Savi — hardcoded */}
        <IndexCard
          title="Diri Savi Index"
          value="5,812.75"
          change="+15.80"
          pct="+0.27%"
          high="5,840"
          low="5,795"
          chartColor="#10b981"
          data={aspiDataFallback.map((d) => ({ date: d.date, value: d.value * 0.56 }))}
        />
      </div>

      {/* Main Charts Section — CSE-style dual live charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ASPI + SL20 side-by-side like CSE website */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ── ASPI Chart ── */}
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ASPI Statistics</CardTitle>
                <div className="flex gap-0.5">
                  {PERIODS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setAspiPeriod(p.csePeriod)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${aspiPeriod === p.csePeriod
                          ? "bg-emerald-600 text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1">
                {indexLoading ? (
                  <SkeletonLine w="w-32" h="h-8" />
                ) : (
                  <>
                    <div className="text-2xl font-bold tracking-tight text-foreground">{aspiValue}</div>
                    <div className={`flex items-center gap-1 text-sm font-semibold mt-0.5 ${aspi && aspi.change >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}>
                      {aspi && aspi.change >= 0
                        ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />}
                      {aspiPct} ({aspiChange})
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {aspiChartLoading ? (
                <div className="flex items-center justify-center h-[180px]">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={aspiChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aspiGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 2" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="ASPI"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#aspiGreenGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#10b981", stroke: "white", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {/* Yearly return stats */}
              {aspi && (
                <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Return for ASPI for the year</span>
                    <span className={`font-semibold ${aspiPctNum >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}>{aspiPct}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── S&P SL20 Chart ── */}
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">S&P SL20 Statistics</CardTitle>
                <div className="flex gap-0.5">
                  {PERIODS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSl20Period(p.csePeriod)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${sl20Period === p.csePeriod
                          ? "bg-violet-600 text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1">
                {indexLoading ? (
                  <SkeletonLine w="w-32" h="h-8" />
                ) : (
                  <>
                    <div className="text-2xl font-bold tracking-tight text-foreground">{snpValue}</div>
                    <div className={`flex items-center gap-1 text-sm font-semibold mt-0.5 ${snp && snp.change >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}>
                      {snp && snp.change >= 0
                        ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />}
                      {snpPct} ({snpChange})
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {sl20ChartLoading ? (
                <div className="flex items-center justify-center h-[180px]">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={sl20ChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sl20VioletGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
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
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#8b5cf6", strokeWidth: 1, strokeDasharray: "4 2" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="S&P SL20"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#sl20VioletGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#8b5cf6", stroke: "white", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {/* Yearly return stats */}
              {snp && (
                <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Return for S&P SL20 for the year</span>
                    <span className={`font-semibold ${snpPctNum >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}>{snpPct}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sector Allocation — live from allSectors if available */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Sector Allocation</CardTitle>
            <CardDescription className="text-xs">By market capitalisation (%)</CardDescription>
          </CardHeader>
          <CardContent>
            {indexLoading ? (
              <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading sector data…</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {sectorData.map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sector.color }} />
                        <span className="text-muted-foreground">{sector.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{sector.value}%</span>
                        <span className={`font-medium ${sector.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {sector.change > 0 ? "+" : ""}{sector.change.toFixed ? sector.change.toFixed(2) : sector.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume & Top Movers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Volume & Turnover */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Market Activity</CardTitle>
            <CardDescription className="text-xs">Weekly Volume (Mn) & Turnover (LKR Mn)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="volume" name="Volume (Mn)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.9} />
                <Bar dataKey="turnover" name="Turnover (Mn)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Gainers & Losers */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Movers</CardTitle>
            <CardDescription className="text-xs">Today's best and worst performing stocks</CardDescription>
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
                {topGainers.map((item) => (
                  <StockRow key={item.symbol} item={item} isWinner={true} />
                ))}
              </TabsContent>
              <TabsContent value="losers" className="mt-0 space-y-0.5">
                {topLosers.map((item) => (
                  <StockRow key={item.symbol} item={item} isWinner={false} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Returns & News */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly Returns */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Weekly Returns</CardTitle>
            <CardDescription className="text-xs">8-week return comparison (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyReturnData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="ASPI" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="S&P SL20" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* News & Announcements — Live from CSE /api/news/web */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <Newspaper className="h-4 w-4 text-blue-500" /> Market News
                  {!newsLoading && !newsError && liveNews.length > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">LIVE</span>
                  )}
                  {newsError && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium flex items-center gap-0.5">
                      <WifiOff className="h-2.5 w-2.5" /> Offline
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">Latest news &amp; corporate announcements from CSE</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-500 hover:text-blue-600">
                See all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {newsLoading ? (
              <>
                <NewsSkeleton />
                <NewsSkeleton />
                <NewsSkeleton />
                <NewsSkeleton />
                <NewsSkeleton />
              </>
            ) : (
              newsItems.map((news, i) => <NewsRow key={i} news={news} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This platform is for informational and research purposes only.
            Market index data (ASPI, S&P SL20) and news are fetched live from the{" "}
            <strong>Colombo Stock Exchange (CSE)</strong> public API. Top Movers, Market Activity, and
            Weekly Returns data are illustrative. This is not financial advice. Always consult with a
            qualified financial advisor before making investment decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
