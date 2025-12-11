"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Plus, Upload, Search, Loader2, AlertCircle, Phone, Mail } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

interface Contact {
  id: string
  phone: string
  name?: string
  email?: string
  language: string
  tags: string[]
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])

  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/contacts")
        if (!response.ok) {
          throw new Error("Failed to fetch contacts")
        }

        const data = await response.json()
        setContacts(data.contacts || [])
        setFilteredContacts(data.contacts || [])
      } catch (err) {
        console.error("Error fetching contacts:", err)
        setError("Failed to load contacts. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  // Handle search filtering
  useEffect(() => {
    const filtered = contacts.filter((contact) => {
      const query = searchQuery.toLowerCase()
      return (
        (contact.name && contact.name.toLowerCase().includes(query)) ||
        contact.phone.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query))
      )
    })
    setFilteredContacts(filtered)
  }, [searchQuery, contacts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contacts/upload">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </Link>
          <Link href="/contacts/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      {!loading && contacts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && contacts.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No contacts yet</CardTitle>
          <CardDescription className="text-center max-w-sm mb-6">
            Import your first contact list from CSV or add contacts manually to get started
          </CardDescription>
          <div className="flex gap-2">
            <Link href="/contacts/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Import Contacts
              </Button>
            </Link>
            <Link href="/contacts/new">
              <Button variant="outline">Add Contact</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {!loading && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredContacts.length} of {contacts.length} Contacts
            </CardTitle>
            {searchQuery && (
              <CardDescription>
                Search results for "{searchQuery}"
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No contacts match your search</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {contact.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              {contact.email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {contact.language.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.length > 0 ? (
                              contact.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No tags</span>
                            )}
                            {contact.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contacts/${contact.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
