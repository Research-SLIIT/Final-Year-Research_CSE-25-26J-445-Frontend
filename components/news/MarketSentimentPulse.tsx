"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NewsArticle } from "@/lib/fakeApi"

interface MarketSentimentPulseProps {
  articles: NewsArticle[]
}

export function MarketSentimentPulse({ articles }: MarketSentimentPulseProps) {
  // We'll generate a cool-looking "Market Pulse" line chart
  // Since we don't have exact sentiment scores for every un-analyzed article,
  // we simulate a rolling sentiment index based on article publication dates and tags.
  const chartData = useMemo(() => {
    if (!articles || articles.length === 0) return []

    // 1. Group articles by date (last 14 days ideally, or just the dates we have)
    const dateMap = new Map<string, number>()
    
    // Sort oldest to newest for the chart timeline
    const sorted = [...articles].sort(
      (a, b) => new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime()
    )

    let currentPulse = 50 // Start neutral (0-100 scale)

    sorted.forEach((article) => {
      const dateOption = new Date(article.publishedDate)
      const dateStr = dateOption.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      
      // Heuristic: Some tags sound "good", some sound "bad". This is just for visual effect.
      const tagsStr = article.tags.join(" ").toLowerCase()
      let impact = 0
      
      if (tagsStr.match(/(growth|dividend|profit|up|bull|recovery|bullish|buy)/)) {
        impact += Math.random() * 5 + 2 // +2 to +7
      } else if (tagsStr.match(/(loss|debt|down|bear|crash|risk|sell|drop)/)) {
        impact -= Math.random() * 5 + 2 // -2 to -7
      } else {
        // Random daily market noise
        impact += (Math.random() * 4) - 2 
      }

      currentPulse = Math.max(10, Math.min(90, currentPulse + impact))
      
      // If we have multiple articles on the same day, take the average or latest
      dateMap.set(dateStr, currentPulse)
    })

    return Array.from(dateMap.entries()).map(([date, value]) => ({
      date,
      sentiment: Number(value.toFixed(1)),
    }))
  }, [articles])

  if (chartData.length < 2) return null // Need at least 2 points to draw a line

  const latestSentiment = chartData[chartData.length - 1]?.sentiment ?? 50
  const isPositive = latestSentiment >= 50

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 overflow-hidden border-border/50 shadow-lg relative">
      {/* Background ambient glow matching current sentiment */}
      <div 
        className={`absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 ${
          isPositive ? "bg-[radial-gradient(circle_at_top_right,_#10b981,_transparent_70%)]" 
                     : "bg-[radial-gradient(circle_at_top_right,_#ef4444,_transparent_70%)]"
        }`}
      />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            Market Pulse
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Sentiment:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-sm ${
              isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              {isPositive ? "Bullish" : "Bearish"} ({latestSentiment})
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[100px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #444", borderRadius: "8px" }}
              itemStyle={{ color: "#fff", fontWeight: "bold" }}
              formatter={(value: number) => [value, "Pulse Index"]}
              labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSentiment)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
