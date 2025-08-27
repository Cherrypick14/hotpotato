"use client"

import { Flame, Trophy, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button-extended"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GameOver({ 
  loser, 
  onRestart 
}: { 
  loser: string | null,
  onRestart: () => void
}) {
  return (
    <Card className="border-2 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-red-800">
          <Flame className="w-6 h-6" />
          Game Over!
          <Flame className="w-6 h-6" />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="p-4 bg-red-100 rounded-lg">
          <Trophy className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Player Eliminated</h3>
          <p className="text-red-700 font-mono mt-1">
            {loser ? `${loser.slice(0, 6)}...${loser.slice(-4)}` : 'Unknown player'}
          </p>
        </div>
        
        <p className="text-red-700">
          The hot potato exploded in their hands!
        </p>
        
        <Button 
          onClick={onRestart}
          className="w-full"
          variant="default"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Game
        </Button>
      </CardContent>
    </Card>
  )
}