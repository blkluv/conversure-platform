"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Conversation, Lead, Message } from "@prisma/client"

interface ConversationWithDetails extends Conversation {
  lead: Lead
  messages: Message[]
}

interface ConversationInboxProps {
  conversations: ConversationWithDetails[]
  activeConversationId?: string
  agentQuota: { dailyLimit: number; messagesSentToday: number } | null
}

export function ConversationInbox({ conversations, activeConversationId, agentQuota }: ConversationInboxProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "new" | "hot" | "follow-up">("all")

  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    const matchesSearch =
      conv.lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lead.phone.includes(searchQuery) ||
      conv.lead.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    // Status filter
    let matchesFilter = true
    if (filter === "new") matchesFilter = conv.lead.status === "NEW"
    if (filter === "hot") matchesFilter = conv.lead.status === "HOT"
    if (filter === "follow-up") matchesFilter = conv.lead.status === "FOLLOW_UP"

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500"
      case "HOT":
        return "bg-red-500"
      case "WARM":
        return "bg-orange-500"
      case "FOLLOW_UP":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversations
            </CardTitle>
            {agentQuota && (
              <Badge variant="outline" className="text-xs">
                {agentQuota.messagesSentToday} / {agentQuota.dailyLimit} today
              </Badge>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="flex-1"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "new" ? "default" : "outline"}
              onClick={() => setFilter("new")}
              className="flex-1"
            >
              New
            </Button>
            <Button
              size="sm"
              variant={filter === "hot" ? "default" : "outline"}
              onClick={() => setFilter("hot")}
              className="flex-1"
            >
              Hot
            </Button>
            <Button
              size="sm"
              variant={filter === "follow-up" ? "default" : "outline"}
              onClick={() => setFilter("follow-up")}
              className="flex-1"
            >
              Follow-up
            </Button>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-0">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => {
                const lastMessage = conversation.messages[0]
                const isActive = conversation.id === activeConversationId

                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/agent?conversation=${conversation.id}`}
                    className={`block p-4 hover:bg-muted/50 transition-colors ${isActive ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(conversation.lead.status)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium truncate">{conversation.lead.name}</h4>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(lastMessage.sentAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {lastMessage?.body || "No messages yet"}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {conversation.lead.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
