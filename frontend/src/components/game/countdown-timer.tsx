"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function CountdownTimer({ 
  totalTime, 
  currentTime,
  isActive
}: { 
  totalTime: number,
  currentTime: number,
  isActive: boolean
}) {
  const [percentage, setPercentage] = useState(100)
  const [timeLeft, setTimeLeft] = useState(totalTime)
  
  useEffect(() => {
    setPercentage((currentTime / totalTime) * 100)
    setTimeLeft(currentTime)
  }, [currentTime, totalTime])
  
  // Calculate color based on percentage
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-2 w-full">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
          {isActive && (
            <div 
              className="absolute inset-0 bg-white opacity-30 animate-pulse"
            />
          )}
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-bold">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-muted-foreground">
            Time remaining
          </div>
        </div>
      </CardContent>
    </Card>
  )
}