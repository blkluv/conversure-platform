/**
 * Working Hours Page
 * 
 * Configure business hours schedule
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Clock } from 'lucide-react'

const dayData = [
    { day: 'Monday', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Tuesday', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Wednesday', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Thursday', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Friday', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Saturday', enabled: false, open: '', close: '' },
    { day: 'Sunday', enabled: false, open: '', close: '' }
]

export default function WorkingHoursPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Working Hours"
                    description="Set your business hours"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Weekly Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dayData.map((day) => (
                            <div key={day.day} className="flex items-center gap-4">
                                <Switch checked={day.enabled} />
                                <span className="w-24 font-medium">{day.day}</span>
                                {day.enabled && (
                                    <>
                                        <span className="text-sm text-muted-foreground">
                                            {day.open} - {day.close}
                                        </span>
                                    </>
                                )}
                                {!day.enabled && (
                                    <span className="text-sm text-muted-foreground">Closed</span>
                                )}
                            </div>
                        ))}
                        <Button className="mt-4">Save Changes</Button>
                    </CardContent>
                </Card>
            </div>
        
    )
}
