"use client"

import { User, UserCheck, Crown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Player {
  id: string
  name: string
  isCurrentHolder: boolean
  isGameStarter: boolean
}

export function PlayerList({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No players in the game yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                player.isCurrentHolder 
                  ? "bg-orange-100 border-orange-300" 
                  : "bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                {player.isCurrentHolder ? (
                  <div className="p-2 bg-orange-500 text-white rounded-full">
                    <UserCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 bg-gray-200 rounded-full">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {player.id.slice(0, 6)}...{player.id.slice(-4)}
                  </div>
                </div>
              </div>
              {player.isGameStarter && (
                <div className="p-1 bg-yellow-100 text-yellow-800 rounded-full">
                  <Crown className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}