"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare, 
  Search, 
  Phone, 
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  Clock
} from "lucide-react"

// Mock conversations data
const conversations = [
  {
    id: "1",
    name: "Mohammed Hassan",
    phone: "+971509876543",
    lastMessage: "I'm interested in 2-bedroom apartments in Dubai Marina",
    timestamp: "10:30 AM",
    unread: 2,
    status: "active",
  },
  {
    id: "2", 
    name: "Sarah Al Maktoum",
    phone: "+971501234567",
    lastMessage: "When can I schedule a viewing?",
    timestamp: "9:45 AM",
    unread: 0,
    status: "active",
  },
  {
    id: "3",
    name: "Ahmed Abdullah",
    phone: "+971507654321",
    lastMessage: "Thank you for the information",
    timestamp: "Yesterday",
    unread: 0,
    status: "resolved",
  },
  {
    id: "4",
    name: "Fatima Khalid",
    phone: "+971508765432",
    lastMessage: "What's the price range for villas?",
    timestamp: "Yesterday",
    unread: 1,
    status: "active",
  },
]

const messages = [
  {
    id: "1",
    direction: "inbound",
    content: "Hi, I am interested in 2-bedroom apartments in Dubai Marina",
    timestamp: "10:30 AM",
    status: "read",
  },
  {
    id: "2",
    direction: "outbound",
    content: "Hello Mohammed! Thank you for reaching out. I have some excellent options in Dubai Marina. What is your budget range?",
    timestamp: "10:32 AM",
    status: "delivered",
  },
  {
    id: "3",
    direction: "inbound",
    content: "Looking for something between 1.5M to 2M AED",
    timestamp: "10:35 AM",
    status: "read",
  },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function InboxPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Manage your WhatsApp conversations
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          Connected to WhatsApp
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conv.id === "1"
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(conv.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="shrink-0">{conv.unread}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    MH
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Mohammed Hassan</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    +971509876543
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Hot Lead
                </Badge>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.direction === "outbound"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      msg.direction === "outbound" ? "justify-end" : ""
                    }`}>
                      <span className={`text-xs ${
                        msg.direction === "outbound" 
                          ? "text-primary-foreground/70" 
                          : "text-muted-foreground"
                      }`}>
                        {msg.timestamp}
                      </span>
                      {msg.direction === "outbound" && (
                        <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="w-4 h-4" />
              </Button>
              <Button size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Messages are sent via WhatsApp Business API
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

