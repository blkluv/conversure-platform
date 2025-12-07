"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Send, ExternalLink, User, Phone, Mail, MapPin, DollarSign, Home, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
// Define types manually since Prisma client may not be generated yet
interface ConversationWithDetails {
  id: string
  companyId: string
  leadId: string
  agentId: string | null
  whatsappNumber: string
  lastMessageAt: Date
  lastDirection: string
  status: string
  chatwootConversationId: string | null
  evolutionChatId: string | null
  createdAt: Date
  updatedAt: Date
  lead: {
    id: string
    name: string
    phone: string
    email: string | null
    status: string
    tags: string[]
    bitrixLeadId: string | null
    budget: string | null
    propertyType: string | null
    location: string | null
    bedrooms: number | null
  }
  messages: Array<{
    id: string
    conversationId: string
    senderId: string | null
    direction: string
    contentType: string
    body: string
    wabaMessageId: string | null
    templateName: string | null
    sentAt: Date
    deliveredAt: Date | null
    readAt: Date | null
    failedAt: Date | null
    errorMessage: string | null
    createdAt: Date
  }>
}

interface ConversationPanelProps {
  conversation: ConversationWithDetails | null
  agentId: string
  companyId: string
  agentQuota: { dailyLimit: number; messagesSentToday: number } | null
}

export function ConversationPanel({ conversation, agentId, companyId, agentQuota }: ConversationPanelProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation) return

    // Check quota
    if (agentQuota && agentQuota.messagesSentToday >= agentQuota.dailyLimit) {
      alert("You have reached your daily message limit. Please try again tomorrow.")
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          agentId,
          companyId,
          message: messageText,
        }),
      })

      if (response.ok) {
        setMessageText("")
        // Refresh page to show new message
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to send message")
      }
    } catch (error) {
      alert("An error occurred while sending the message")
    } finally {
      setIsSending(false)
    }
  }

  const quickReplies = [
    "Thank you for your interest! Let me share some details with you.",
    "I'd be happy to schedule a viewing. When would be convenient for you?",
    "I'll send you the property details shortly.",
    "Would you like to know more about the payment plans available?",
  ]

  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No conversation selected</p>
          <p className="text-sm">Select a conversation from the left to start messaging</p>
        </div>
      </Card>
    )
  }

  const { lead, messages } = conversation

  return (
    <div className="h-full flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{lead.name}</h3>
                <p className="text-sm text-muted-foreground">{lead.phone}</p>
              </div>
              <Badge>{lead.status}</Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => {
                const isOutbound = message.direction === "OUTBOUND"

                return (
                  <div key={message.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] space-y-1 ${isOutbound ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          isOutbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      </div>
                      <p className="text-xs text-muted-foreground px-1">
                        {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        {message.deliveredAt && " • Delivered"}
                        {message.readAt && " • Read"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 space-y-3">
            {/* Quick Replies */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => setMessageText(reply)}
                  className="shrink-0 text-xs"
                >
                  {reply.substring(0, 30)}...
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="resize-none"
                rows={3}
              />
              <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()} size="icon">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {agentQuota && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Messages today: {agentQuota.messagesSentToday} / {agentQuota.dailyLimit}
                </span>
                {agentQuota.messagesSentToday >= agentQuota.dailyLimit * 0.9 && (
                  <span className="text-amber-600 font-medium">Approaching daily limit</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Lead Info Sidebar */}
      <Card className="w-80">
        <CardHeader className="border-b">
          <h3 className="font-semibold">Lead Details</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{lead.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.phone}</p>
              </div>
            </div>

            {lead.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{lead.email}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Property Interests</h4>

            {lead.budget && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">{lead.budget}</p>
                </div>
              </div>
            )}

            {lead.propertyType && (
              <div className="flex items-start gap-3">
                <Home className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Property Type</p>
                  <p className="text-sm font-medium">{lead.propertyType}</p>
                </div>
              </div>
            )}

            {lead.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Preferred Location</p>
                  <p className="text-sm font-medium">{lead.location}</p>
                </div>
              </div>
            )}

            {lead.bedrooms && (
              <div className="flex items-start gap-3">
                <Home className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                  <p className="text-sm font-medium">{lead.bedrooms}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {lead.bitrixLeadId && (
            <>
              <Separator />
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <a
                  href={`https://${companyId}.bitrix24.com/crm/lead/details/${lead.bitrixLeadId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Bitrix24
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
