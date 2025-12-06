"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, TrendingUp } from "lucide-react"

interface WarmupSetupStepProps {
  companyId: string
  onComplete: () => void
}

export function WarmupSetupStep({ companyId, onComplete }: WarmupSetupStepProps) {
  const warmupPlan = [
    { week: 1, messages: 20, description: "Starting slow to build reputation" },
    { week: 2, messages: 50, description: "Gradual increase" },
    { week: 3, messages: 100, description: "Building momentum" },
    { week: 4, messages: "1,000+", description: "Full capacity" },
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Why Warm-up is Important</AlertTitle>
        <AlertDescription>
          WhatsApp monitors sending patterns to detect spam. A gradual warm-up period helps build sender reputation and
          prevents your number from being blocked. This 4-week plan is specifically designed for UAE real estate
          businesses.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Your Warm-up Schedule</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Daily Limit</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warmupPlan.map((phase) => (
              <TableRow key={phase.week}>
                <TableCell className="font-medium">Week {phase.week}</TableCell>
                <TableCell className="text-primary font-semibold">{phase.messages} messages/day</TableCell>
                <TableCell className="text-muted-foreground">{phase.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-900">Best Practices</AlertTitle>
        <AlertDescription className="text-blue-800">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Start with your most engaged contacts</li>
            <li>Distribute messages throughout the day (not all at once)</li>
            <li>Focus on quality conversations over quantity</li>
            <li>Monitor response rates and adjust accordingly</li>
            <li>Comply with TDRA regulations for UAE businesses</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-green-900">You're starting on Week 1</p>
          <p className="text-sm text-green-700">Your daily limit is set to 20 messages</p>
        </div>
      </div>

      <Button onClick={onComplete} className="w-full">
        Complete Setup & Go to Dashboard
      </Button>
    </div>
  )
}
