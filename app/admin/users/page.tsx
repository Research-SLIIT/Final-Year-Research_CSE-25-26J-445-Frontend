"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("cse_auth_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://13.60.26.93:8080"}/api/v1/user/all/users`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (res.ok) {
          setUsers(data.data || [])
        } else {
          toast({
            title: "Error fetching users",
            description: data.message || "Failed to load users",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error fetching users",
          description: "Network error occurred",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", format: (v: any) => v || "N/A" },
    { key: "role", label: "Role", format: (v: any) => (
      <span className={`px-2 py-1 rounded text-xs px-2 py-1 flex items-center justify-center w-fit ${v === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
        {v}
      </span>
    )},
    { key: "plan", label: "Plan", format: (v: any) => v && v.toUpperCase() },
    { key: "isOnboarded", label: "Onboarded", format: (v: any) => v ? "Yes" : "No" }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">Manage users and view their details.</p>
      </div>
      
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
      </div>
    </div>
  )
}
