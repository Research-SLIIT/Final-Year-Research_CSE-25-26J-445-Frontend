"use client"

import { useEffect, useState } from "react"
import {
  STATIC_DIRECTORY,
  loadDirectory,
  type DirectoryCompany,
} from "@/lib/company-directory"

/**
 * The merged company list for search.
 *
 * Starts from the static baseline so the picker is usable on first paint, then
 * swaps in the full list once the backend's prediction-capable companies land.
 */
export function useCompanyDirectory() {
  const [companies, setCompanies] = useState<DirectoryCompany[]>(STATIC_DIRECTORY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadDirectory()
      .then((list) => {
        if (active) setCompanies(list)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { companies, loading }
}
