"use client"

import { useEffect, useState } from "react"
import { type Company } from "@/lib/fakeApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown } from "lucide-react"

interface TickerSearchProps {
  onSelect: (company: Company) => void
  placeholder?: string
  value?: string
}

export function TickerSearchDIV({ onSelect, placeholder = "Search stocks...", value }: TickerSearchProps) {
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedValue, setSelectedValue] = useState(value || "")

  // The 15 firms present in the financial_records collection (2011-2024).
  // `symbol` must be the FIRM code the backend stores - the previous list sent
  // full company names that no record matched, so every lookup 404'd.
  const exampleCompanies: Company[] = [
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

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value || "")
      setQuery("")
    }
  }, [value, selectedValue])

  useEffect(() => {
    // Filter the seeded firms rather than querying the wider CSE list: only
    // these have financial records, so offering anything else guarantees a 404.
    const handleSearch = () => {
      const q = query.trim().toLowerCase()
      if (q.length === 0) {
        setCompanies(exampleCompanies)
        return
      }
      setCompanies(
        exampleCompanies.filter(
          (c) =>
            c.symbol.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            (c.sector ?? "").toLowerCase().includes(q),
        ),
      )
    }

    const timer = setTimeout(handleSearch, 200)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {query || selectedValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0"
          />
          <CommandList>
            {loading && <CommandEmpty>Searching...</CommandEmpty>}
            {!loading && companies.length === 0 && query && <CommandEmpty>No stocks found.</CommandEmpty>}
            {companies.length > 0 && (
              <CommandGroup heading={query.length === 0 ? "Popular Companies" : undefined}>
                {companies.map((company) => (
                  <CommandItem
                    key={company.symbol}
                    value={company.symbol}
                    onSelect={() => {
                      setSelectedValue(company.symbol)
                      onSelect(company)
                      setQuery("")
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{company.symbol}</span>
                      <span className="text-xs text-muted-foreground">{company.name}</span>
                    </div>
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
