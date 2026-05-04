"use client"

import { useEffect, useState } from "react"
import { searchTickers, type Company } from "@/lib/fakeApi"
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

  // Example companies to show when search is empty
  const exampleCompanies: Company[] = [

    // DIVIDEND STOCKS
    { symbol: "BALANGODA PLANTATIONS PLC", name: "Balangoda Plantations PLC", sector: "Plantations" },
    { symbol: "Carson Cumberbatch PLC", name: "Carson Cumberbatch PLC", sector: "Food & Beverage" },
    { symbol: "Lion Brewery (Ceylon) PLC", name: "Lion Brewery (Ceylon) PLC", sector: "Food & Beverage" },
    { symbol: "Ceylon Brew Holding", name: "Ceylon Beverage Holdings", sector: "Food & Beverage" },
    { symbol: "Ceylon Tobacco Company PLC", name: "Ceylon Tobacco Company PLC", sector: "Tobacco" },
    { symbol: "DCSL", name: "DCSL Breweries Lanka", sector: "Food & Beverage" },
    { symbol: "Keells Food Products PLC", name: "Keells Food Products PLC", sector: "Food & Beverage" },
    { symbol: "Horana Plantations PLC", name: "Horana Plantations PLC", sector: "Plantations" },
    { symbol: "Renuka Agri Foods PLC", name: "Renuka Agri Foods PLC", sector: "Food & Beverage" },
    { symbol: "Raigam Wayamba Salterns PLC", name: "Raigam Wayamba Salterns PLC", sector: "Food & Beverage" },
    { symbol: "Renuka Shaw Wallace PLC", name: "Renuka Shaw Wallace PLC", sector: "Food & Beverage" },
    { symbol: "Tea Smallholder Factories PLC", name: "Tea Smallholder Factories PLC", sector: "Food & Beverage" },
    // { symbol: "CTEA", name: "Ceylon Tea Services PLC", sector: "Plantations" },
    // { symbol: "TSH", name: "Tea Small Holder Factories PLC", sector: "Plantations" },

  ]

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value || "")
      setQuery("")
    }
  }, [value, selectedValue])

  useEffect(() => {
    const handleSearch = async () => {
      if (query.length === 0) {
        setCompanies(exampleCompanies)
        return
      }
      setLoading(true)
      const results = await searchTickers(query)
      setCompanies(results)
      setLoading(false)
    }

    const timer = setTimeout(handleSearch, 300)
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
