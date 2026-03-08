"use client"

import { useEffect, useState } from "react"
import { Terminal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TERMINAL_STEPS = [
  { text: "Initializing analysis pipeline...", delay: 0 },
  { text: "[System] Connecting to NLP engine v2.4...", delay: 400 },
  { text: "[System] Extracting named entities (NER)...", delay: 1100 },
  { text: "[System] Identified 3 market-relevant entities.", delay: 1800 },
  { text: "[Lexicon] Applying FinBERT embeddings...", delay: 2400 },
  { text: "[Lexicon] Scoring financial vocabulary context...", delay: 3100 },
  { text: "[ML] Querying historical pattern database...", delay: 4000 },
  { text: "[ML] Evaluating 1,204 historical precedents...", delay: 4600 },
  { text: "[Fusion] Calculating weighted impact probability...", delay: 5500 },
  { text: "[Fusion] Generating final direction prediction...", delay: 6200 },
  { text: "Analysis complete. Rendering results...", delay: 7000 },
]

export function AITerminalStream() {
  const [visibleSteps, setVisibleSteps] = useState<number>(0)

  useEffect(() => {
    const timers = TERMINAL_STEPS.map((step, index) => {
      return setTimeout(() => {
        setVisibleSteps(index + 1)
      }, step.delay)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <Card className="bg-slate-950 border-slate-800 font-mono overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
      <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/50">
        <CardTitle className="text-xs text-slate-400 flex items-center gap-2 m-0 font-normal">
          <Terminal className="w-3 h-3" />
          <span>sentiment_engine_v2.log</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 min-h-[160px] text-xs space-y-2">
        {TERMINAL_STEPS.slice(0, visibleSteps).map((step, i) => {
          const isSystem = step.text.includes("[System]")
          const isLexicon = step.text.includes("[Lexicon]")
          const isML = step.text.includes("[ML]")
          const isFusion = step.text.includes("[Fusion]")
          
          let colorClass = "text-slate-300"
          if (isSystem) colorClass = "text-blue-400"
          if (isLexicon) colorClass = "text-pink-400"
          if (isML) colorClass = "text-purple-400"
          if (isFusion) colorClass = "text-emerald-400"

          return (
            <div 
              key={i} 
              className={`flex gap-2 duration-300 ${colorClass} animate-[pulse_2s_ease-in-out_1]`}
            >
              <span className="text-slate-600 shrink-0">
                {">"}
              </span>
              <span>{step.text}</span>
            </div>
          )
        })}
        {visibleSteps < TERMINAL_STEPS.length && (
          <div className="flex gap-2 text-slate-500">
            <span className="text-slate-600 shrink-0">{">"}</span>
            <span className="animate-pulse">_</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
