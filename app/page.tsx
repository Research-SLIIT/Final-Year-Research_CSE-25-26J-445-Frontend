"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// ─── Hardcoded Data ───────────────────────────────────────────────────────────

const aspiData = [
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

const sl20Data = [
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

const combinedIndexData = aspiData.map((item, i) => ({
  date: item.date,
  ASPI: item.value,
  "S&P SL20": sl20Data[i].value,
}))

const volumeData = [
  { date: "Mon", volume: 1240, turnover: 890 },
  { date: "Tue", volume: 1890, turnover: 1240 },
  { date: "Wed", volume: 1560, turnover: 1100 },
  { date: "Thu", volume: 2100, turnover: 1560 },
  { date: "Fri", volume: 1780, turnover: 1320 },
]

const sectorData = [
  { name: "Banking", value: 32, change: +2.4, color: "#3b82f6" },
  { name: "Diversified", value: 18, change: -0.8, color: "#8b5cf6" },
  { name: "Healthcare", value: 12, change: +1.2, color: "#10b981" },
  { name: "Manufacturing", value: 15, change: -1.5, color: "#f59e0b" },
  { name: "Telecom", value: 10, change: +3.1, color: "#ef4444" },
  { name: "Energy", value: 13, change: +0.6, color: "#06b6d4" },
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

const newsItems = [
  {
    time: "12:30",
    category: "Market Update",
    headline: "ASPI breaks 10,340 milestone, touches new 52-week high amid foreign buying interest",
    badge: "Bullish",
    badgeColor: "bg-emerald-500/15 text-emerald-600",
  },
  {
    time: "11:15",
    category: "Corporate",
    headline: "John Keells Holdings reports 28% YoY net profit growth for Q3 FY2026, beats estimates",
    badge: "Earnings",
    badgeColor: "bg-blue-500/15 text-blue-600",
  },
  {
    time: "10:45",
    category: "Economy",
    headline: "Central Bank holds policy rates steady; inflation eases to 4.2% in February 2026",
    badge: "Macro",
    badgeColor: "bg-purple-500/15 text-purple-600",
  },
  {
    time: "09:30",
    category: "Market Open",
    headline: "Market opens higher following positive sentiment in Asian peers; Banking sector leads",
    badge: "Opening",
    badgeColor: "bg-amber-500/15 text-amber-600",
  },
  {
    time: "Yesterday",
    category: "IPO",
    headline: "New IPO listing set for next week — expected to raise LKR 3.2 Bn from the public",
    badge: "IPO",
    badgeColor: "bg-sky-500/15 text-sky-600",
  },
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
}: {
  title: string
  value: string
  change: string
  pct: string
  high: string
  low: string
  chartColor: string
  data: { date: string; value: number }[]
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
          <Badge variant="outline" className={`text-xs px-1.5 py-0.5 border-0 font-medium ${isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
            {pct}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className={`flex items-center gap-1 text-sm font-medium mt-0.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {change}
          </div>
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
          <span>H: <span className="text-foreground font-medium">{high}</span></span>
          <span>L: <span className="text-foreground font-medium">{low}</span></span>
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("1Y")

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
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 font-medium">
              ● LIVE
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Mon, 9 Mar 2026 · 12:32 LKT · Next close: 14:30
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

      {/* Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <IndexCard
          title="ASPI"
          value="10,340.48"
          change="+127.65"
          pct="+1.25%"
          high="10,412"
          low="10,218"
          chartColor="#3b82f6"
          data={aspiData}
        />
        <IndexCard
          title="S&P SL20"
          value="3,682.15"
          change="+44.20"
          pct="+1.21%"
          high="3,710"
          low="3,641"
          chartColor="#8b5cf6"
          data={sl20Data}
        />
        <IndexCard
          title="MPI"
          value="7,124.30"
          change="-23.50"
          pct="-0.33%"
          high="7,201"
          low="7,098"
          chartColor="#ef4444"
          data={aspiData.map((d) => ({ date: d.date, value: d.value * 0.69 }))}
        />
        <IndexCard
          title="Diri Savi Index"
          value="5,812.75"
          change="+15.80"
          pct="+0.27%"
          high="5,840"
          low="5,795"
          chartColor="#10b981"
          data={aspiData.map((d) => ({ date: d.date, value: d.value * 0.56 }))}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Index Performance Chart */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-semibold">Index Performance</CardTitle>
                <CardDescription className="text-xs">ASPI vs S&P SL20 — Year to date</CardDescription>
              </div>
              <div className="flex gap-1">
                {["1W", "1M", "3M", "6M", "1Y"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === t ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={combinedIndexData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aspiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sl20Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="ASPI" stroke="#3b82f6" strokeWidth={2.5} fill="url(#aspiGrad)" dot={false} />
                <Area type="monotone" dataKey="S&P SL20" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#sl20Grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Sector Allocation</CardTitle>
            <CardDescription className="text-xs">By market capitalisation (%)</CardDescription>
          </CardHeader>
          <CardContent>
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
                      {sector.change > 0 ? "+" : ""}{sector.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

        {/* News & Announcements */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <Newspaper className="h-4 w-4 text-blue-500" /> Market News
                </CardTitle>
                <CardDescription className="text-xs">Latest news &amp; corporate announcements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-500 hover:text-blue-600">
                See all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {newsItems.map((news, i) => (
              <div key={i} className="flex gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0 group cursor-pointer hover:opacity-80 transition-opacity">
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
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This platform is for informational and research purposes only. All market data is simulated and for demonstration purposes only. This is not financial advice. Always consult with a qualified financial advisor before making investment decisions. Data sourced from Colombo Stock Exchange (CSE).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
