"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("cse_auth_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://13.60.26.93:8080"}/api/v1/logs`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (res.ok) {
          setLogs(data.logs || [])
        } else {
          toast({
            title: "Error fetching logs",
            description: data.message || "Failed to load logs",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error fetching logs", // Use generic error handle format
          description: "Network error occurred",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [toast])

  const columns = [
    { key: "method", label: "Method", format: (v: any) => (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded
        ${v === 'GET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
          v === 'POST' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
          v === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
          v === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30' :
          'bg-gray-100 text-gray-800'}
      `}>
        {v}
      </span>
    )},
    { key: "path", label: "Path" },
    { key: "status", label: "Status", format: (v: any) => (
      <span className={v === 'success' ? 'text-green-500' : 'text-red-500'}>
        {v}
      </span>
    )},
    { key: "serviceName", label: "Service" },
    { key: "userEmail", label: "User Email", format: (v: any) => v || "anonymous" },
    { key: "duration", label: "Duration", format: (v: any) => `${v}ms` },
    { key: "createdAt", label: "Date", format: (v: any) => new Date(v).toLocaleString() }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-2">View system operations and API access logs.</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No logs found" />
      </div>
    </div>
  )
}
