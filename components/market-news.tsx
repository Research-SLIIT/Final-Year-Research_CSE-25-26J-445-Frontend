"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronRight, ExternalLink, Newspaper, Search, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export interface MarketNewsItem {
  id: string
  title: string
  summary: string
  image: string | null
  logo: string | null
  source: string
  sourceKind: "cse" | "press"
  category: string
  url: string | null
  publishedAt: string | null
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "cse", label: "Exchange" },
  { key: "press", label: "Press" },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

/** The route caps `limit` at 40 — ask for all of it when the modal opens. */
const FULL_LIMIT = 40

/** "3h ago" / "Yesterday" / "12 Aug" — relative near-term, absolute beyond a week. */
function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return "—"

  const minutes = Math.round((Date.now() - then) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`

  return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function categoryTone(item: MarketNewsItem): string {
  if (item.sourceKind === "cse") return "bg-emerald-500/15 text-emerald-600"
  const tones: Record<string, string> = {
    Economy: "bg-purple-500/15 text-purple-600",
    Business: "bg-blue-500/15 text-blue-600",
    Markets: "bg-amber-500/15 text-amber-600",
  }
  return tones[item.category] ?? "bg-sky-500/15 text-sky-600"
}

/** Stable per-source colour so image-less stories still look deliberate. */
function fallbackGradient(source: string): string {
  const palettes = [
    "from-blue-600/30 to-indigo-600/10",
    "from-emerald-600/30 to-teal-600/10",
    "from-purple-600/30 to-fuchsia-600/10",
    "from-amber-600/30 to-orange-600/10",
    "from-rose-600/30 to-red-600/10",
  ]
  const hash = [...source].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palettes[hash % palettes.length]
}

function Thumb({
  item,
  className,
  iconClass = "h-5 w-5",
}: {
  item: MarketNewsItem
  className: string
  iconClass?: string
}) {
  const [broken, setBroken] = useState(false)
  const src = item.image ?? item.logo

  useEffect(() => {
    setBroken(false)
  }, [src])

  if (!src || broken) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br ${fallbackGradient(
          item.source
        )}`}
      >
        <Newspaper className={`${iconClass} text-foreground/40`} />
      </div>
    )
  }

  return (
    // Feed images come from many hosts and next.config sets images.unoptimized,
    // so a plain <img> avoids per-domain remotePatterns config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`${className} object-cover`}
    />
  )
}

/** Compact thumbnail + headline row, shared by the rail and the "See all" modal. */
function StoryRow({ item, boxed = false }: { item: MarketNewsItem; boxed?: boolean }) {
  return (
    <a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex gap-3 group ${
        boxed
          ? "rounded-lg border border-border/50 p-3 hover:border-blue-500/40 hover:bg-muted/30 transition-colors"
          : "pb-3 border-b border-border/40 last:border-0 last:pb-0"
      }`}
    >
      <Thumb item={item} className="w-24 h-16 rounded-md flex-shrink-0 border border-border/40" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-blue-500 transition-colors">
          {item.title}
        </p>
        {item.summary && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{item.summary}</p>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryTone(item)}`}
          >
            {item.category}
          </span>
          <span className="text-[11px] text-muted-foreground">{item.source}</span>
          <span className="text-[11px] text-muted-foreground/60">·</span>
          <span className="text-[11px] text-muted-foreground/80">{timeAgo(item.publishedAt)}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/70 transition-colors ml-auto" />
        </div>
      </div>
    </a>
  )
}

function FilterPills({
  value,
  onChange,
}: {
  value: FilterKey
  onChange: (key: FilterKey) => void
}) {
  return (
    <div className="flex gap-0.5 rounded-md bg-muted/50 p-0.5">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
            value === f.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function StorySkeleton({ lead = false }: { lead?: boolean }) {
  return (
    <div className={lead ? "space-y-3" : "flex gap-3"}>
      <div
        className={`rounded-lg bg-muted/60 animate-pulse ${
          lead ? "w-full h-40" : "w-24 h-16 flex-shrink-0"
        }`}
      />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
        <div className="h-4 w-3/5 rounded bg-muted/60 animate-pulse" />
        <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Full feed in a modal. The rail only loads `limit` stories, so this refetches
 * at the route's ceiling on open rather than re-showing what is already visible.
 */
function AllNewsDialog({
  open,
  onOpenChange,
  fallback,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Stories the rail already has — shown while the fuller fetch is in flight. */
  fallback: MarketNewsItem[]
}) {
  const [items, setItems] = useState<MarketNewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setLoading(true)
    setQuery("")
    ;(async () => {
      try {
        const res = await fetch(`/api/market-news?limit=${FULL_LIMIT}`)
        if (!res.ok) throw new Error(`news ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setItems(data.items ?? [])
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  // Keep the rail's copy on screen until the wider set lands, so the modal never
  // opens empty.
  const pool = items.length ? items : fallback

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return pool.filter((item) => {
      if (filter !== "all" && item.sourceKind !== filter) return false
      if (!term) return true
      return (
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.source.toLowerCase().includes(term)
      )
    })
  }, [pool, filter, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-5xl">
        <DialogHeader className="shrink-0 space-y-3 border-b border-border/60 p-5 pb-4">
          <div className="pr-8">
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <Newspaper className="h-4 w-4 text-blue-500" /> All Market News
            </DialogTitle>
            <DialogDescription className="text-xs">
              {loading && !pool.length
                ? "Loading latest headlines…"
                : `${visible.length} ${visible.length === 1 ? "story" : "stories"} · CSE filings + business press`}
            </DialogDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPills value={filter} onChange={setFilter} />
            <div className="relative min-w-[10rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search headlines, sources…"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="scroll-pane min-h-0 flex-1 overflow-y-auto p-5">
          {loading && !pool.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <StorySkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {error && !pool.length
                ? "News sources are unreachable right now. They will retry automatically."
                : query.trim()
                  ? `No stories match “${query.trim()}”.`
                  : "No stories in this category yet."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((item) => (
                <StoryRow key={item.id} item={item} boxed />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MarketNews({
  limit = 20,
  className = "",
}: {
  limit?: number
  /** Set by the caller so the rail can bound its own height and scroll. */
  className?: string
}) {
  const [items, setItems] = useState<MarketNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/market-news?limit=${limit}`)
        if (!res.ok) throw new Error(`news ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setItems(data.items ?? [])
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    // Feeds update slowly; a 5-minute poll matches the server-side cache TTL.
    const timer = setInterval(load, 5 * 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [limit])

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.sourceKind === filter)),
    [items, filter]
  )

  const sourceCount = useMemo(() => new Set(items.map((i) => i.source)).size, [items])

  const [lead, ...rest] = filtered

  return (
    <Card className={`flex h-full flex-col overflow-hidden border-border/60 bg-card ${className}`}>
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Newspaper className="h-4 w-4 text-blue-500" /> Market News
              {!loading && !error && items.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                  LIVE
                </span>
              )}
              {error && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium flex items-center gap-0.5">
                  <WifiOff className="h-2.5 w-2.5" /> Offline
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {loading
                ? "Loading latest headlines…"
                : `CSE filings + business press · ${sourceCount} sources`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <FilterPills value={filter} onChange={setFilter} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="gap-1 text-xs text-blue-500 hover:text-blue-600"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* min-h-0 lets this flex child shrink below its content so the cap on the
          card turns into a scroll here rather than an overflowing rail. */}
      <CardContent className="scroll-pane min-h-0 flex-1 space-y-4 overflow-y-auto">
        {loading ? (
          <>
            <StorySkeleton lead />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {error
              ? "News sources are unreachable right now. They will retry automatically."
              : "No stories in this category yet."}
          </p>
        ) : (
          <>
            {/* Lead story */}
            <a
              href={lead.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block group rounded-lg overflow-hidden border border-border/50 hover:border-blue-500/40 transition-colors"
            >
              <div className="relative">
                <Thumb item={lead} className="w-full h-44 sm:h-52" iconClass="h-8 w-8" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryTone(
                        lead
                      )}`}
                    >
                      {lead.category}
                    </span>
                    <span className="text-[11px] text-white/80 font-medium">{lead.source}</span>
                    <span className="text-[11px] text-white/60">·</span>
                    <span className="text-[11px] text-white/60">{timeAgo(lead.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-blue-200 transition-colors">
                    {lead.title}
                  </h3>
                  {lead.summary && (
                    <p className="text-xs text-white/70 leading-snug line-clamp-2 hidden sm:block">
                      {lead.summary}
                    </p>
                  )}
                </div>
              </div>
            </a>

            {/* Remaining stories */}
            <div className="space-y-3">
              {rest.map((item) => (
                <StoryRow key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </CardContent>

      <AllNewsDialog open={showAll} onOpenChange={setShowAll} fallback={items} />
    </Card>
  )
}
