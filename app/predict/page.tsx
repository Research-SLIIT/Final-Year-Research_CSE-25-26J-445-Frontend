"use client";

import { useState, useEffect, useRef } from "react";
import {
  predictOpenPrice,
  fetchOpenPriceHistory,
  type OpenPriceHistoryPoint,
} from "@/lib/api/open-price-prediction.api";
import { usePredictStore } from "@/stores/usePredictStore";
import { TickerSearch } from "@/components/ticker-search";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  BarChart3,
  Sparkles,
  Activity,
  Target,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────────── */
/*  Constants                                               */
/* ─────────────────────────────────────────────────────── */
const TIME_RANGE_DAYS: Record<string, number> = {
  "1week": 5,
  "2weeks": 10,
  "3weeks": 15,
  "4weeks": 22,
};

/* ─────────────────────────────────────────────────────── */
/*  Animated wrapper – fades + slides in on mount          */
/* ─────────────────────────────────────────────────────── */
function AnimateIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Animated number counter                                */
/* ─────────────────────────────────────────────────────── */
function AnimatedNumber({ value, decimals = 2, prefix = "" }: { value: number; decimals?: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 900;
    const from = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{prefix}{display.toFixed(decimals)}</>;
}

/* ─────────────────────────────────────────────────────── */
/*  Shimmer base block                                      */
/* ─────────────────────────────────────────────────────── */
function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-muted/60 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.07) 50%,transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Prediction loading skeleton                            */
/* ─────────────────────────────────────────────────────── */
function PredictionSkeleton() {
  return (
    <div className="space-y-5">
      {/* Hero card skeleton */}
      <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-5">
        {/* Symbol + badge row */}
        <div className="flex items-center gap-3">
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-14 rounded-full ml-auto" />
        </div>
        {/* Price trio */}
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-10 w-36" />
              <Shimmer className="h-3 w-8" />
            </div>
          ))}
        </div>
        {/* Meta strip */}
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
              <Shimmer className="h-2.5 w-full" />
              <Shimmer className="h-4 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Chart card skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-2.5 w-64" />
        <Shimmer className="h-72 w-full rounded-xl" />
      </div>
      {/* Reasoning card skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Shimmer className="h-5 w-48" />
        <Shimmer className="h-16 w-full rounded-xl" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded-full" />
              <Shimmer className="h-4 w-48" />
              <Shimmer className="h-3 w-20 ml-auto rounded-full" />
            </div>
            <Shimmer className="h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Historical data loading skeleton                       */
/* ─────────────────────────────────────────────────────── */
function HistoricalSkeleton() {
  return (
    <div className="space-y-5">
      {/* Snapshot card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Shimmer className="h-5 w-52" />
        <Shimmer className="h-3.5 w-32" />
        <div className="grid grid-cols-7 gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-muted/50 p-3 space-y-2">
              <Shimmer className="h-2.5 w-full" />
              <Shimmer className="h-4 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-7 w-36" />
            <Shimmer className="h-2.5 w-20" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Shimmer className="h-5 w-56" />
        <Shimmer className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Animated progress bar                                  */
/* ─────────────────────────────────────────────────────── */
function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${width}%`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Main Page                                              */
/* ─────────────────────────────────────────────────────── */
export default function PredictPage() {
  const { inputs, output, loading, setInputs, setOutput, setLoading } =
    usePredictStore();
  const [historicalData, setHistoricalData] = useState<OpenPriceHistoryPoint[]>([]);
  const { toast } = useToast();

  const [histCompany, setHistCompany] = useState<string>("");
  const [histTimeRange, setHistTimeRange] = useState<string>("4weeks");
  const [histData, setHistData] = useState<OpenPriceHistoryPoint[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histPrediction, setHistPrediction] = useState<number | null>(null);

  const handleSearch = (company: any) => {
    setInputs({ symbol: company.symbol });
    setOutput(null);
    setHistoricalData([]);
  };

  const handlePredict = async () => {
    if (!inputs.symbol) {
      toast({ title: "Error", description: "Please select a stock", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await predictOpenPrice(inputs.symbol, new Date().toISOString().split("T")[0]);
      setOutput(result);
      const history = await fetchOpenPriceHistory(inputs.symbol, 22);
      setHistoricalData(history);
      toast({ title: "Success", description: `Prediction generated for ${inputs.symbol}` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate prediction";
      toast({ title: "Prediction Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleHistCompanySelect = async (company: any) => {
    setHistCompany(company.symbol);
    setHistData([]);
    setHistPrediction(null);
    setHistLoading(true);
    try {
      const [data, pred] = await Promise.allSettled([
        fetchOpenPriceHistory(company.symbol, 22),
        predictOpenPrice(company.symbol),
      ]);
      if (data.status === "fulfilled") setHistData(data.value);
      if (pred.status === "fulfilled") setHistPrediction(pred.value.predOpenTplus5);
    } finally {
      setHistLoading(false);
    }
  };

  const isBullish = output ? output.predOpenTplus5 >= output.openToday : false;
  const priceDiff = output ? output.predOpenTplus5 - output.openToday : 0;
  const pricePct = output ? (priceDiff / output.openToday) * 100 : 0;

  return (
    <div className="space-y-6">

      {/* ── Animated Page Header ── */}
      <AnimateIn delay={0}>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-emerald-600/10 border border-blue-500/20">
          {/* decorative orbs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Open Price Prediction
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-powered CSE stock analysis — predict next week's open price or explore historical data
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="relative mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            ML model active · CSE market data
          </div>
        </div>
      </AnimateIn>

      {/* ── Tabs ── */}
      <AnimateIn delay={80}>
        <Tabs defaultValue="prediction" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="prediction" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Open Price Prediction
            </TabsTrigger>
            <TabsTrigger value="historical" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Historical Data
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════
               TAB 1 – Prediction
          ══════════════════════════════════ */}
          <TabsContent value="prediction" className="space-y-6 mt-6">

            {/* Input Card */}
            <AnimateIn delay={120}>
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Prediction Configuration
                  </CardTitle>
                  <CardDescription>
                    Select a CSE-listed stock to generate a T+5 open price forecast using our ML model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">
                      Stock Selection
                    </label>
                    <TickerSearch onSelect={handleSearch} placeholder="Search for a stock…" />
                  </div>
                  <Button
                    onClick={handlePredict}
                    disabled={!inputs.symbol || loading}
                    className="w-full md:w-auto relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-md shadow-blue-500/20 transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Generating Prediction…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Predict Next Week Open
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </AnimateIn>

            {/* Loading skeleton */}
            {loading && (
              <AnimateIn delay={0}>
                <PredictionSkeleton />
              </AnimateIn>
            )}

            {/* ── Prediction Results ── */}
            {output && !loading && (
              <>
                {/* ── Hero Result Card ── */}
                <AnimateIn delay={0}>
                  <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-xl ${isBullish
                    ? "bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 border-emerald-500/25"
                    : "bg-gradient-to-br from-red-500/10 via-rose-500/5 to-orange-500/10 border-red-500/25"
                    }`}>
                    {/* decorative blobs */}
                    <div className={`absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl pointer-events-none ${isBullish ? "bg-emerald-400/15" : "bg-red-400/15"
                      }`} />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

                    {/* Header row */}
                    <div className="relative flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-3xl font-black tracking-tight text-foreground">
                            {output.symbol}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isBullish
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/20 text-red-600 dark:text-red-400"
                            }`}>
                            {isBullish ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {isBullish ? "Bullish" : "Bearish"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI Forecast — Next Week's Opening Price (T+5 Trading Days)
                        </p>
                      </div>
                      <ConfidenceBadge confidence={output.confidence} />
                    </div>

                    {/* Price trio */}
                    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">

                      {/* Today's open */}
                      <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Today's Open</p>
                        <p className="text-4xl font-black text-foreground">
                          <AnimatedNumber value={output.openToday} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">LKR</p>
                      </div>

                      {/* Arrow / trend divider */}
                      <div className="hidden sm:flex items-center justify-center">
                        <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border ${isBullish ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
                          }`}>
                          {isBullish
                            ? <ArrowUpRight className="h-8 w-8 text-emerald-500" />
                            : <ArrowDownRight className="h-8 w-8 text-red-500" />
                          }
                          <span className={`text-sm font-bold ${isBullish ? "text-emerald-500" : "text-red-500"}`}>
                            {isBullish ? "+" : ""}{pricePct.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isBullish ? "+" : ""}{priceDiff.toFixed(2)} LKR
                          </span>
                        </div>
                      </div>

                      {/* Predicted open */}
                      <div className={`rounded-xl border p-4 ${isBullish
                        ? "bg-emerald-500/15 border-emerald-500/30"
                        : "bg-red-500/15 border-red-500/30"
                        }`}>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                          Predicted Open (Day 5)
                        </p>
                        <p className={`text-4xl font-black ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                          <AnimatedNumber value={output.predOpenTplus5} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">LKR</p>

                        {/* mobile inline change */}
                        <p className={`sm:hidden text-sm font-semibold mt-2 flex items-center gap-1 ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                          {isBullish ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {isBullish ? "+" : ""}{pricePct.toFixed(2)}% ({isBullish ? "+" : ""}{priceDiff.toFixed(2)} LKR)
                        </p>
                      </div>
                    </div>

                    {/* Meta strip */}
                    <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {[
                        { label: "Data As Of", value: output.asofDate },
                        { label: "Predicted For", value: output.predictedForDate },
                        { label: "Price Change", value: `${isBullish ? "+" : ""}${priceDiff.toFixed(2)} LKR`, colored: true },
                        { label: "% Change", value: `${isBullish ? "+" : ""}${pricePct.toFixed(2)}%`, colored: true },
                      ].map((m) => (
                        <div key={m.label} className="rounded-lg bg-background/50 border border-border px-3 py-2.5 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">{m.label}</p>
                          <p className={`text-sm font-semibold ${m.colored
                            ? isBullish
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                            : "text-foreground"
                            }`}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimateIn>

                {/* Price Comparison Bar Chart */}
                <AnimateIn delay={60}>
                  <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Price Comparison
                      </CardTitle>
                      <CardDescription>
                        Today's open price vs. predicted next week's open price
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { label: "Today's Open", value: output.openToday },
                              { label: "Predicted (T+5)", value: output.predOpenTplus5 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                            <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
                            <YAxis
                              stroke="var(--color-muted-foreground)"
                              label={{ value: "Price (LKR)", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                              formatter={(value: number) => [`LKR ${value.toFixed(2)}`, "Price"]}
                            />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                              <Cell fill="#3b82f6" />
                              <Cell fill={isBullish ? "#22c55e" : "#ef4444"} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </AnimateIn>

                {/* Prediction Reasoning (XAI) */}
                <AnimateIn delay={100}>
                  <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Prediction Reasoning
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </CardTitle>
                          <CardDescription>
                            Key factors influencing the T+5 open price forecast for {output.symbol}
                          </CardDescription>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                          SHAP Explainability
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {output.explanation ? (
                        <>
                          {/* AI summary */}
                          <div className="bg-muted/40 rounded-xl p-4 border border-border text-sm text-muted-foreground leading-relaxed">
                            {output.explanation.summary}
                          </div>

                          {/* Top driving factors */}
                          <div>
                            <p className="text-sm font-semibold mb-3">Top Driving Factors</p>
                            <div className="space-y-3">
                              {(() => {
                                const maxShap = Math.max(
                                  ...output.explanation!.top_drivers.map((d) => Math.abs(d.shap_value)),
                                  0.001
                                );
                                return output.explanation!.top_drivers.map((driver, i) => (
                                  <AnimateIn key={driver.feature} delay={i * 60}>
                                    <div className="bg-muted/30 rounded-xl p-4 border border-border hover:border-blue-500/30 transition-colors duration-200 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          {driver.direction === "bullish"
                                            ? <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                                            : <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                                          }
                                          <span className="text-sm font-medium">{driver.display_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className={`text-xs font-semibold ${driver.direction === "bullish"
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-600 dark:text-red-400"
                                            }`}>
                                            {driver.direction === "bullish" ? "+" : ""}
                                            {driver.shap_value.toFixed(4)}
                                          </span>
                                          <div className="w-24">
                                            <AnimatedBar
                                              pct={(Math.abs(driver.shap_value) / maxShap) * 100}
                                              color={driver.direction === "bullish" ? "bg-emerald-500" : "bg-red-500"}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground pl-6">{driver.description}</p>
                                    </div>
                                  </AnimateIn>
                                ));
                              })()}
                            </div>
                          </div>

                          {/* Signal counts */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                            {[
                              {
                                label: "Bullish Signals",
                                count: output.explanation.top_drivers.filter((d) => d.direction === "bullish").length,
                                color: "text-emerald-600 dark:text-emerald-400",
                                bg: "bg-emerald-500/10 border-emerald-500/20",
                                icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
                              },
                              {
                                label: "Bearish Signals",
                                count: output.explanation.top_drivers.filter((d) => d.direction === "bearish").length,
                                color: "text-red-600 dark:text-red-400",
                                bg: "bg-red-500/10 border-red-500/20",
                                icon: <TrendingDown className="h-5 w-5 text-red-500" />,
                              },
                            ].map((s) => (
                              <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
                                <div className="flex justify-center mb-1">{s.icon}</div>
                                <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
                                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Category impacts */}
                          <div className="pt-3 border-t border-border">
                            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Category Impact Breakdown
                            </p>
                            <div className="space-y-3">
                              {(() => {
                                const categories = Object.entries(output.explanation!.category_impacts);
                                const maxCatShap = Math.max(...categories.map(([, c]) => Math.abs(c.total_shap)), 0.001);
                                return categories.map(([category, impact]) => (
                                  <div key={category} className="flex items-center gap-3">
                                    <span className="text-xs font-medium w-28 shrink-0 text-right text-muted-foreground">
                                      {category}
                                    </span>
                                    <div className="flex-1 flex items-center gap-2">
                                      <AnimatedBar
                                        pct={(Math.abs(impact.total_shap) / maxCatShap) * 100}
                                        color={impact.direction === "bullish" ? "bg-emerald-500" : "bg-red-500"}
                                      />
                                      <span className={`text-xs font-semibold w-16 shrink-0 ${impact.direction === "bullish"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}>
                                        {impact.direction === "bullish" ? "+" : ""}{impact.total_shap.toFixed(4)}
                                      </span>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          {/* Model agreement */}
                          <div className="pt-3 border-t border-border">
                            {(() => {
                              const score = output.explanation.model_agreement.agreement_score * 100;
                              const textColor = score >= 70
                                ? "text-emerald-600 dark:text-emerald-400"
                                : score >= 50
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400";
                              const barColor = score >= 70
                                ? "bg-emerald-500"
                                : score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500";
                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Model Agreement</p>
                                    <span className={`text-sm font-medium ${textColor}`}>
                                      {score.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${barColor}`}
                                      style={{ width: `${score.toFixed(1)}%` }}
                                    />
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Explanation unavailable for this prediction.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimateIn>

                {/* How This Works */}
                <AnimateIn delay={140}>
                  <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        How This Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        This prediction model uses machine learning trained on historical CSE stock data.
                        It analyzes patterns in opening prices, trading volume, volatility, and market returns
                        to forecast the most likely opening price after 5 trading days (next week).
                      </p>
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400 leading-relaxed">
                        <strong>⚠️ Important Disclaimer:</strong> This is NOT financial advice. Predictions are
                        based on historical patterns and may not reflect future market conditions. CSE data is
                        delayed. Always consult with a qualified financial advisor before making investment decisions.
                      </div>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="features">
                          <AccordionTrigger>Model Features</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <p className="font-medium">The model uses the following features:</p>
                              <ul className="grid grid-cols-2 gap-2 text-muted-foreground">
                                {[
                                  "high_low_range", "close_open_ratio", "overnight_gap", "return_1d",
                                  "return_5d", "log_return_5d", "rsi_14", "macd", "macd_histogram",
                                  "stoch_k", "roc_5", "price_to_sma_20", "price_to_ema_10",
                                  "price_position_20d", "volatility_5d", "volatility_20d",
                                  "volatility_ratio", "volume_ratio_5", "volume_ratio_20", "log_volume",
                                  "day_of_week", "month", "price_vs_company_avg", "volume_vs_company_avg",
                                  "company_volatility", "company_price_level", "sector_N",
                                ].map((f) => (
                                  <li key={f} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </AnimateIn>
              </>
            )}

            {/* Empty state */}
            {!output && !loading && (
              <AnimateIn delay={160}>
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium">No prediction yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Select a stock and click &quot;Predict Next Week Open&quot; to see the forecast
                  </p>
                </div>
              </AnimateIn>
            )}
          </TabsContent>

          {/* ══════════════════════════════════
               TAB 2 – Historical Data
          ══════════════════════════════════ */}
          <TabsContent value="historical" className="space-y-6 mt-6">

            {/* Selector card */}
            <AnimateIn delay={0}>
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Select Company
                  </CardTitle>
                  <CardDescription>
                    Choose a company to view historical OHLCV data from the CSE database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Stock Selection</label>
                    <TickerSearch onSelect={handleHistCompanySelect} placeholder="Search for a stock…" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time Period</label>
                    <Select value={histTimeRange} onValueChange={setHistTimeRange}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1week">1 Week</SelectItem>
                        <SelectItem value="2weeks">2 Weeks</SelectItem>
                        <SelectItem value="3weeks">3 Weeks</SelectItem>
                        <SelectItem value="4weeks">4 Weeks (1 Month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>

            {/* Loading */}
            {histLoading && (
              <AnimateIn delay={0}>
                <HistoricalSkeleton />
              </AnimateIn>
            )}

            {/* Charts & table */}
            {!histLoading && histData.length > 0 && (() => {
              const sliced = histData.slice(-TIME_RANGE_DAYS[histTimeRange]);
              const first = sliced[0];
              const last = sliced[sliced.length - 1];

              const minOpen = Math.min(...sliced.map((d) => d.openPrice));
              const maxOpen = Math.max(...sliced.map((d) => d.openPrice));
              const avgOpen = sliced.reduce((s, d) => s + d.openPrice, 0) / sliced.length;
              const openChangePct = ((last.openPrice - first.openPrice) / first.openPrice) * 100;
              const closeChangePct = ((last.closePrice - first.closePrice) / first.closePrice) * 100;
              const volChangePct = first.tradeVolume > 0
                ? ((last.tradeVolume - first.tradeVolume) / first.tradeVolume) * 100
                : 0;

              const changeBadge = (pct: number) => (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-0.5 ${pct >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}>
                  {pct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                </span>
              );

              return (
                <>
                  {/* Latest snapshot */}
                  <AnimateIn delay={0}>
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Latest Trading Day Snapshot</CardTitle>
                        <CardDescription>{last.date} — {histCompany}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                          {[
                            { label: "Open", value: `LKR ${last.openPrice.toFixed(2)}`, color: "text-foreground" },
                            { label: "High", value: `LKR ${last.highPrice.toFixed(2)}`, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Low", value: `LKR ${last.lowPrice.toFixed(2)}`, color: "text-red-600 dark:text-red-400" },
                            { label: "Close", value: `LKR ${last.closePrice.toFixed(2)}`, color: "text-foreground" },
                            { label: "Trade Vol", value: last.tradeVolume.toLocaleString(), color: "text-foreground" },
                            { label: "Share Vol", value: last.shareVolume.toLocaleString(), color: "text-foreground" },
                            { label: "Turnover", value: last.turnover.toLocaleString(), color: "text-foreground" },
                          ].map((item, i) => (
                            <AnimateIn key={item.label} delay={i * 50}>
                              <div className="bg-muted/50 rounded-xl p-3 text-center hover:bg-muted/70 transition-colors duration-200">
                                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                              </div>
                            </AnimateIn>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>

                  {/* Summary stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Min Open Price", value: `LKR ${minOpen.toFixed(2)}`, sub: "Period low", color: "text-foreground", icon: <TrendingDown className="h-4 w-4 text-red-400" /> },
                      { label: "Max Open Price", value: `LKR ${maxOpen.toFixed(2)}`, sub: "Period high", color: "text-foreground", icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
                      { label: "Avg Open Price", value: `LKR ${avgOpen.toFixed(2)}`, sub: "Period mean", color: "text-foreground", icon: <Activity className="h-4 w-4 text-blue-400" /> },
                      {
                        label: "Period Change",
                        value: `${openChangePct >= 0 ? "+" : ""}${openChangePct.toFixed(2)}%`,
                        sub: `${first.date} → ${last.date}`,
                        color: openChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                        icon: openChangePct >= 0
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          : <ArrowDownRight className="h-4 w-4 text-red-400" />,
                      },
                    ].map((stat, i) => (
                      <AnimateIn key={stat.label} delay={i * 60}>
                        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                          <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              {stat.icon}
                              <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                          </CardContent>
                        </Card>
                      </AnimateIn>
                    ))}
                  </div>

                  {/* Graph 1: Open Price Trend */}
                  <AnimateIn delay={80}>
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Historical Open Price Trend</CardTitle>
                            <CardDescription>Daily open price over selected period — {histCompany}</CardDescription>
                          </div>
                          {changeBadge(openChangePct)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sliced} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                              <YAxis stroke="var(--color-muted-foreground)" label={{ value: "Open Price (LKR)", angle: -90, position: "insideLeft" }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                                formatter={(value: number) => [`LKR ${value.toFixed(2)}`, "Open Price"]}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="openPrice" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} name="Open Price" />
                              {histPrediction !== null && (
                                <ReferenceLine
                                  y={histPrediction}
                                  stroke="#f59e0b"
                                  strokeDasharray="5 3"
                                  strokeWidth={1.5}
                                  label={{ value: `T+5 Pred: LKR ${histPrediction.toFixed(2)}`, position: "insideTopRight", fill: "#f59e0b", fontSize: 11 }}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>

                  {/* Graph 2: OHLC */}
                  <AnimateIn delay={100}>
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Price History (OHLC)</CardTitle>
                            <CardDescription>Open, High, Low and Close prices — {histCompany}</CardDescription>
                          </div>
                          {changeBadge(closeChangePct)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sliced} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                              <YAxis stroke="var(--color-muted-foreground)" label={{ value: "Price (LKR)", angle: -90, position: "insideLeft" }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                                formatter={(value: number) => [`LKR ${value.toFixed(2)}`]}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="openPrice" stroke="#3b82f6" strokeWidth={2} dot={false} name="Open" />
                              <Line type="monotone" dataKey="highPrice" stroke="#22c55e" strokeWidth={2} dot={false} name="High" />
                              <Line type="monotone" dataKey="lowPrice" stroke="#ef4444" strokeWidth={2} dot={false} name="Low" />
                              <Line type="monotone" dataKey="closePrice" stroke="#f59e0b" strokeWidth={2} dot={false} name="Close" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>

                  {/* Graph 3: Volume & Turnover */}
                  <AnimateIn delay={120}>
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Volume &amp; Turnover</CardTitle>
                            <CardDescription>Trade volume, share volume and turnover — {histCompany}</CardDescription>
                          </div>
                          {changeBadge(volChangePct)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sliced} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
                              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                              <YAxis stroke="var(--color-muted-foreground)" />
                              <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                              <Legend />
                              <Bar dataKey="tradeVolume" fill="#3b82f6" name="Trade Volume" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="shareVolume" fill="#8b5cf6" name="Share Volume" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="turnover" fill="#f59e0b" name="Turnover" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>

                  {/* Data table */}
                  <AnimateIn delay={140}>
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader>
                        <CardTitle>Raw OHLCV Data</CardTitle>
                        <CardDescription>Daily trading data for selected period — {histCompany}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 border-b border-border">
                                {["Date", "Open", "High", "Low", "Close", "Trade Vol", "Share Vol", "Turnover"].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...sliced].reverse().map((row, i) => (
                                <tr
                                  key={`${row.date}-${i}`}
                                  className={`border-b border-border last:border-0 transition-colors duration-150 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"
                                    }`}
                                >
                                  <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">{row.date}</td>
                                  <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{row.openPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.highPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-red-600 dark:text-red-400 whitespace-nowrap">{row.lowPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{row.closePrice.toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.tradeVolume.toLocaleString()}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.shareVolume.toLocaleString()}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.turnover.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>
                </>
              );
            })()}

            {/* Empty state */}
            {!histLoading && !histCompany && (
              <AnimateIn delay={80}>
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium">No company selected</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Select a company above to view its historical OHLCV data
                  </p>
                </div>
              </AnimateIn>
            )}
          </TabsContent>
        </Tabs>
      </AnimateIn>
    </div>
  );
}
