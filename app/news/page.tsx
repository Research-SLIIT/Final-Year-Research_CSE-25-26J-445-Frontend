"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"

import { newsList, newsGetAllTags, type NewsArticle } from "@/lib/fakeApi"

import AnalyzeBox from "@/components/news/AnalyzeBox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { MarketSentimentPulse } from "@/components/news/MarketSentimentPulse"

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tags = await newsGetAllTags()
        setAllTags(tags)

        const data = await newsList(
          searchQuery || undefined,
          selectedTag || undefined,
          sortOrder
        )

        setArticles(data)
      } catch (error) {
        console.error("Failed to fetch news:", error)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchData()
  }, [searchQuery, selectedTag, sortOrder])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">News & Updates</h1>
        <p className="text-muted-foreground">
          Stay informed about market news and company updates
        </p>
      </div>

      {/* ================= ANALYZE CUSTOM NEWS ================= */}
      <AnalyzeBox />

      {/* ================= MARKET PULSE SPARKLINE ================= */}
      {!loading && articles.length > 0 && (
        <MarketSentimentPulse articles={articles} />
      )}

      {/* ================= SEARCH & FILTERS ================= */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-4">
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>

              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sort
            </label>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ================= NEWS LIST ================= */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`}>
                <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {article.summary}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                      </div>

                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>
                            {new Date(
                              article.publishedDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
