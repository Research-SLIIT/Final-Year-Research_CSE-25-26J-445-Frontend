"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, ChevronsUpDown, CornerDownLeft, X } from "lucide-react"

import { useCompanyDirectory } from "@/hooks/use-company-directory"
import {
  baseSymbol,
  filterDirectory,
  findCompany,
  type DirectoryCompany,
  type ModuleSupport,
} from "@/lib/company-directory"
import { pushRecentCompany } from "@/lib/recent-companies"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * The one company picker.
 *
 * It replaces `ticker-search`, `ticker-search_div` and `company-symbol-search`,
 * which were three copies of this control over three different company lists.
 * Selecting a company navigates to its workspace by default — the company is a
 * destination now, not a form value — but `onSelect` overrides that for the
 * places that genuinely pick a symbol without leaving the page (comparison).
 */

interface CompanySelectHandlers {
  /** Restrict results to companies the given analysis actually covers. */
  module?: keyof ModuleSupport
  /** Overrides navigation. Return value ignored. */
  onSelect?: (company: DirectoryCompany) => void
  /** Tab to land on when navigating. Ignored when `onSelect` is set. */
  tab?: string
}

function useCompanySelection({ module, onSelect, tab }: CompanySelectHandlers) {
  const router = useRouter()

  return useCallback(
    (company: DirectoryCompany) => {
      pushRecentCompany({ symbol: company.symbol, name: company.name })
      if (onSelect) {
        onSelect(company)
        return
      }
      const query = tab ? `?tab=${tab}` : ""
      router.push(`/company/${encodeURIComponent(company.symbol)}${query}`)
    },
    [module, onSelect, router, tab],
  )
}

function useFilteredCompanies(query: string, module?: keyof ModuleSupport, limit = 8) {
  const { companies, loading } = useCompanyDirectory()

  const scoped = useMemo(
    () => (module ? companies.filter((c) => c.modules[module]) : companies),
    [companies, module],
  )

  return { results: useMemo(() => filterDirectory(scoped, query, limit), [scoped, query, limit]), loading }
}

function CoverageBadges({ company }: { company: DirectoryCompany }) {
  const covered = (
    [
      ["Risk", company.modules.risk],
      ["Forecast", company.modules.predict],
      ["Dividend", company.modules.dividend],
    ] as const
  ).filter(([, ok]) => ok)

  if (!covered.length) return null

  return (
    <div className="flex shrink-0 gap-1">
      {covered.map(([label]) => (
        <Badge key={label} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
          {label}
        </Badge>
      ))}
    </div>
  )
}

/**
 * Marks the matched run inside a result so the eye can confirm *why* a row came
 * back — "CTC" matching a symbol and "CTC" buried in a sector name look
 * identical otherwise.
 */
function Highlight({ text, query }: { text: string; query?: string }) {
  const needle = query?.trim().toLowerCase()
  if (!needle) return <>{text}</>

  const at = text.toLowerCase().indexOf(needle)
  if (at === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-blue-600 dark:text-blue-400">
        {text.slice(at, at + needle.length)}
      </mark>
      {text.slice(at + needle.length)}
    </>
  )
}

function CompanyRow({ company, query }: { company: DirectoryCompany; query?: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          <Highlight text={company.name} query={query} />
        </span>
        <span className="truncate text-xs text-muted-foreground">
          <span className="font-mono">
            <Highlight text={company.symbol} query={query} />
          </span>
          {company.sector && <span> · {company.sector}</span>}
        </span>
      </div>
      <CoverageBadges company={company} />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Hero / inline search field — the dashboard's primary call to action
 * ------------------------------------------------------------------ */

interface CompanySearchProps extends CompanySelectHandlers {
  placeholder?: string
  autoFocus?: boolean
  size?: "lg" | "md"
  className?: string
  /**
   * Single key that focuses the field from anywhere on the page (GitHub's `/`).
   * Off by default — only the page that owns the field should claim a key.
   */
  hotkey?: string
  /** Shown above the results when the user has not typed yet. */
  emptyQueryHeading?: string
  /** Extra line under the "nothing matched" state, e.g. why coverage is narrow. */
  noResultsHint?: string
}

export function CompanySearch({
  module,
  onSelect,
  tab,
  placeholder = "Search a company or symbol…",
  autoFocus = false,
  size = "lg",
  className,
  hotkey,
  emptyQueryHeading = "Popular companies",
  noResultsHint,
}: CompanySearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const { results, loading } = useFilteredCompanies(query, module)
  const select = useCompanySelection({ module, onSelect, tab })
  const typed = query.trim().length > 0

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  // The result set also shrinks when the caller narrows `module`, which would
  // otherwise strand the highlight past the end of the list.
  useEffect(() => {
    setHighlighted((i) => (i < results.length ? i : 0))
  }, [results.length])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  // Keyboard navigation is useless if the row it lands on is scrolled out of
  // the 80-unit-tall list, which is what happens from the fifth result down.
  useEffect(() => {
    if (!open) return
    const row = listRef.current?.children[highlighted] as HTMLElement | undefined
    row?.scrollIntoView({ block: "nearest" })
  }, [highlighted, open])

  useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== hotkey || event.metaKey || event.ctrlKey || event.altKey) return
      // Never steal the key from someone mid-sentence in another field.
      const active = document.activeElement as HTMLElement | null
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hotkey])

  const commit = (company: DirectoryCompany) => {
    setOpen(false)
    setQuery("")
    select(company)
  }

  const clear = () => {
    setQuery("")
    setOpen(true)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setHighlighted((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      setHighlighted((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (event.key === "Home" && open) {
      event.preventDefault()
      setHighlighted(0)
    } else if (event.key === "End" && open) {
      event.preventDefault()
      setHighlighted(Math.max(results.length - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const company = results[highlighted]
      if (company) commit(company)
    } else if (event.key === "Escape") {
      // One Escape wipes the query, a second gets out of the way entirely —
      // so a mistyped search never needs a held backspace.
      event.preventDefault()
      if (typed) setQuery("")
      else {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
  }

  const large = size === "lg"
  const activeId = results[highlighted] ? `${listboxId}-${results[highlighted].symbol}` : undefined

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground",
          large ? "h-5 w-5" : "h-4 w-4",
        )}
      />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search companies"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? activeId : undefined}
        aria-autocomplete="list"
        role="combobox"
        className={cn(
          "pl-11 pr-14",
          large &&
            "h-14 rounded-xl text-base shadow-sm md:text-lg " +
              "border-border/80 bg-card/60 hover:border-border focus-visible:shadow-md",
        )}
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {loading && typed && <Spinner className="size-4 text-muted-foreground" />}
        {typed ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </button>
        ) : (
          hotkey && (
            <Kbd className="pointer-events-none hidden bg-muted/80 md:inline-flex">{hotkey}</Kbd>
          )
        )}
      </div>

      {/* Result count for screen readers, which get nothing from the list appearing. */}
      <span className="sr-only" role="status" aria-live="polite">
        {open && typed
          ? results.length
            ? `${results.length} ${results.length === 1 ? "company" : "companies"} found`
            : loading
              ? "Loading companies"
              : "No companies found"
          : ""}
      </span>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>
              {typed
                ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
                : emptyQueryHeading}
            </span>
            {loading && typed && <span className="normal-case tracking-normal">Loading more…</span>}
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Company results"
            className="max-h-80 overflow-y-auto pb-1"
          >
            {results.map((company, index) => (
              <li
                key={company.symbol}
                id={`${listboxId}-${company.symbol}`}
                role="option"
                aria-selected={index === highlighted}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(company)}
                className={cn(
                  "flex w-full cursor-pointer items-center border-l-2 px-4 py-2.5 text-left transition-colors",
                  index === highlighted
                    ? "border-l-blue-500 bg-accent"
                    : "border-l-transparent hover:bg-accent/50",
                )}
              >
                <CompanyRow company={company} query={query} />
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-1.5 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:flex">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to navigate ·
            <Kbd>
              <CornerDownLeft className="h-3 w-3" />
            </Kbd>
            to open ·<Kbd>esc</Kbd> to clear
          </div>
        </div>
      )}

      {open && typed && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-popover px-4 py-6 text-center shadow-xl">
          {loading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Loading the company list…
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground">
                No company matches <span className="font-medium">“{query.trim()}”</span>
              </p>
              {noResultsHint && (
                <p className="mt-1 text-xs text-muted-foreground">{noResultsHint}</p>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={clear}>
                Clear search
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Global ⌘K palette — reachable from every page via the header trigger
 * ------------------------------------------------------------------ */

export function CompanyCommandPalette({
  open,
  onOpenChange,
  initialQuery = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Seeds the input so the current company is there to edit, not retype. */
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const { results } = useFilteredCompanies(query, undefined, 10)
  const select = useCompanySelection({})

  // Reopening should show the company you are on, not whatever you last typed.
  useEffect(() => {
    if (!open) setQuery(initialQuery)
  }, [open, initialQuery])

  // Built on Dialog rather than the shared CommandDialog: that wrapper mounts its
  // own <Command> with filtering on, which would re-filter (and re-order) results
  // that filterDirectory has already ranked.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search companies</DialogTitle>
        <DialogDescription>Find a listed company by name or symbol</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search a company or symbol…"
            // Seeded with the current company, so select it on focus: typing
            // replaces it outright, but it is still there to see and edit.
            onFocus={(event) => event.currentTarget.select()}
          />
          <CommandList>
            {results.length === 0 && <CommandEmpty>No company found.</CommandEmpty>}
            {results.length > 0 && (
              <CommandGroup heading={query.trim() ? "Results" : "Popular companies"}>
                {results.map((company) => (
                  <CommandItem
                    key={company.symbol}
                    value={company.symbol}
                    onSelect={() => {
                      onOpenChange(false)
                      select(company)
                    }}
                  >
                    <CompanyRow company={company} query={query} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Reads the company out of the URL, so the search field can show what you
 * searched for rather than resetting to a generic prompt on every page.
 */
function useRoutedCompany(): DirectoryCompany | undefined {
  const pathname = usePathname()
  const { companies } = useCompanyDirectory()

  return useMemo(() => {
    const match = /^\/company\/([^/?#]+)/.exec(pathname ?? "")
    if (!match) return undefined
    const symbol = baseSymbol(decodeURIComponent(match[1]))
    return findCompany(companies, symbol)
  }, [pathname, companies])
}

/** Header affordance that opens the palette. Also owns the ⌘K / Ctrl+K binding. */
export function CompanySearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const company = useRoutedCompany()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted",
          company ? "text-foreground" : "text-muted-foreground",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="hidden truncate sm:inline">
          {company ? company.name : "Search companies…"}
        </span>
        {company && (
          <span className="hidden shrink-0 font-mono text-xs text-muted-foreground md:inline">
            {company.symbol}
          </span>
        )}
        <Kbd className="ml-auto hidden shrink-0 md:inline-flex">⌘K</Kbd>
      </button>
      <CompanyCommandPalette
        open={open}
        onOpenChange={setOpen}
        initialQuery={company?.name ?? ""}
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Compact combobox — for the places that pick a symbol without navigating
 * ------------------------------------------------------------------ */

interface CompanyPickerProps extends CompanySelectHandlers {
  value?: string
  placeholder?: string
  disabled?: boolean
}

export function CompanyPicker({
  value,
  module,
  onSelect,
  placeholder = "Select a company…",
  disabled = false,
}: CompanyPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { results } = useFilteredCompanies(query, module, 50)
  const select = useCompanySelection({ module, onSelect })

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-transparent font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} />
          <CommandList>
            {results.length === 0 && <CommandEmpty>No company found.</CommandEmpty>}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((company) => (
                  <CommandItem
                    key={company.symbol}
                    value={company.symbol}
                    onSelect={() => {
                      setOpen(false)
                      select(company)
                    }}
                  >
                    <CompanyRow company={company} query={query} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
