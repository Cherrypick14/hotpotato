"use client"

import { createReviveSdk, type ReviveSdkTypedApi } from "@polkadot-api/sdk-ink"
import { useChainId, useTypedApi } from "@reactive-dot/react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useSignerAndAddress } from "@/hooks/use-signer-and-address"
import { hotpotato } from "@/lib/inkathon/deployments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button-extended"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Timer, 
  Play, 
  RotateCcw, 
  User, 
  UserCheck,
  AlertCircle,
  Clock,
  Trophy,
  Flame
} from "lucide-react"
import type { WalletAccount } from "@/lib/reactive-dot/custom-types"
import { PotatoAnimation } from "@/components/game/potato-animation"
import { PlayerList } from "@/components/game/player-list"
import { GameOver } from "@/components/game/game-over"
import { CountdownTimer } from "@/components/game/countdown-timer"

interface Player {
  id: string
  name: string
  isCurrentHolder: boolean
  isGameStarter: boolean
}

export function GameInterface({ account }: { account: WalletAccount | undefined }) {
  const [queryIsLoading, setQueryIsLoading] = useState(true)
  const [newPlayerAddress, setNewPlayerAddress] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameState, setGameState] = useState<{
    isActive: boolean
    currentHolder: string | null
    deadlineBlocks: number
    remainingBlocks: number
    gameStarter: string | null
    lastPassedBlock: number
  }>()
  const [gameOver, setGameOver] = useState(false)
  const [loser, setLoser] = useState<string | null>(null)

  const api = useTypedApi()
  const chain = useChainId()
  const { signer, signerAddress } = useSignerAndAddress()

  // Function to format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Contract Read (Query)
   */
  const queryContract = useCallback(async () => {
    setQueryIsLoading(true)
    try {
      if (!api || !chain) return

      // Create SDK & contract instance
      const sdk = createReviveSdk(api as ReviveSdkTypedApi, hotpotato.contract)
      const contract = sdk.getContract(hotpotato.evmAddresses[chain])

      try {
        // Query contract state
        const storageResult = await contract.getStorage().getRoot()
        
        if (storageResult.success) {
          const storage = storageResult.value
          
          const isActive = storage.active
          const currentHolder = storage.current_holder.type === "Some" ? storage.current_holder.value[0] : null
          const deadlineBlocks = storage.deadline_blocks
          const lastPassedBlock = storage.last_passed_block
          const gameStarter = storage.game_starter.type === "Some" ? storage.game_starter.value[0] : null
          
          // Check if game just ended
          if (gameState?.isActive && !isActive && currentHolder) {
            setGameOver(true)
            setLoser(currentHolder)
          }
          
          setGameState({
            isActive,
            currentHolder,
            deadlineBlocks,
            remainingBlocks: 0, // We'll calculate this separately
            gameStarter,
            lastPassedBlock,
          })
          
          // Calculate time left (simplified - in a real app you'd need block time info)
          if (isActive && deadlineBlocks > 0) {
            const estimatedTimeLeft = deadlineBlocks * 6 // Assuming 6 seconds per block
            setTimeLeft(estimatedTimeLeft)
          } else {
            setTimeLeft(0)
          }
        } else {
          // Set default state if storage query fails
          setGameState({
            isActive: false,
            currentHolder: null,
            deadlineBlocks: 0,
            remainingBlocks: 0,
            gameStarter: null,
            lastPassedBlock: 0,
          })
          setTimeLeft(0)
        }
      } catch (storageError) {
        console.error("Storage query error:", storageError)
        // Set default state if storage query throws
        setGameState({
          isActive: false,
          currentHolder: null,
          deadlineBlocks: 0,
          remainingBlocks: 0,
          gameStarter: null,
          lastPassedBlock: 0,
        })
        setTimeLeft(0)
      }
    } catch (error) {
      console.error("Contract initialization error:", error)
      // Set default state if contract initialization fails
      setGameState({
        isActive: false,
        currentHolder: null,
        deadlineBlocks: 0,
        remainingBlocks: 0,
        gameStarter: null,
        lastPassedBlock: 0,
      })
      setTimeLeft(0)
    } finally {
      setQueryIsLoading(false)
    }
  }, [api, chain, gameState?.isActive])

  // Poll for game state updates
  useEffect(() => {
    queryContract()
    const interval = setInterval(queryContract, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [queryContract])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  // Reset game state
  const resetGame = useCallback(() => {
    setGameOver(false)
    setLoser(null)
    setNewPlayerAddress("")
  }, [])

  /**
   * Contract Write (Transaction)
   */
  const handleStartGame = useCallback(async () => {
    if (!api || !chain || !signer || !newPlayerAddress) return

    const sdk = createReviveSdk(api as ReviveSdkTypedApi, hotpotato.contract)
    const contract = sdk.getContract(hotpotato.evmAddresses[chain])

    // Map account if not mapped
    const isMapped = await sdk.addressIsMapped(signerAddress)
    if (!isMapped) {
      toast.error("Account not mapped. Please map your account first.")
      return
    }

    try {
      // Use the correct SendArgs structure
      const tx = contract
        .send("start_game", { 
          origin: signerAddress, 
          data: { to: newPlayerAddress } 
        })
        .signAndSubmit(signer)
        .then((tx) => {
          queryContract()
          setNewPlayerAddress("")
          resetGame()
          if (!tx.ok) throw new Error("Failed to send transaction", { cause: tx.dispatchError })
          toast.success("Game started successfully!")
        })

      toast.promise(tx, {
        loading: "Starting game...",
        success: "Game started successfully!",
        error: "Failed to start game",
      })
    } catch (error) {
      console.error("Contract call error:", error)
      toast.error("Contract call failed - check console for details")
    }
  }, [signer, api, chain, newPlayerAddress, signerAddress, queryContract, resetGame])

  const handlePassPotato = useCallback(async () => {
    if (!api || !chain || !signer || !newPlayerAddress) return

    const sdk = createReviveSdk(api as ReviveSdkTypedApi, hotpotato.contract)
    const contract = sdk.getContract(hotpotato.evmAddresses[chain])

    // Map account if not mapped
    const isMapped = await sdk.addressIsMapped(signerAddress)
    if (!isMapped) {
      toast.error("Account not mapped. Please map your account first.")
      return
    }

    try {
      // Use the correct SendArgs structure
      const tx = contract
        .send("pass_potato", { 
          origin: signerAddress, 
          data: { to: newPlayerAddress } 
        })
        .signAndSubmit(signer)
        .then((tx) => {
          queryContract()
          setNewPlayerAddress("")
          if (!tx.ok) throw new Error("Failed to send transaction", { cause: tx.dispatchError })
          toast.success("Potato passed successfully!")
        })

      toast.promise(tx, {
        loading: "Passing potato...",
        success: "Potato passed successfully!",
        error: "Failed to pass potato",
      })
    } catch (error) {
      console.error("Contract call error:", error)
      toast.error("Contract call failed - check console for details")
    }
  }, [signer, api, chain, newPlayerAddress, signerAddress, queryContract])

  const handleCheckDeadline = useCallback(async () => {
    if (!api || !chain || !signer) return

    const sdk = createReviveSdk(api as ReviveSdkTypedApi, hotpotato.contract)
    const contract = sdk.getContract(hotpotato.evmAddresses[chain])

    // Map account if not mapped
    const isMapped = await sdk.addressIsMapped(signerAddress)
    if (!isMapped) {
      toast.error("Account not mapped. Please map your account first.")
      return
    }

    try {
      // Send transaction
      const tx = contract
        .send("check_deadline", { origin: signerAddress })
        .signAndSubmit(signer)
        .then((tx) => {
          queryContract()
          if (!tx.ok) throw new Error("Failed to send transaction", { cause: tx.dispatchError })
          toast.success("Deadline checked!")
        })

      toast.promise(tx, {
        loading: "Checking deadline...",
        success: "Deadline checked!",
        error: "Failed to check deadline",
      })
    } catch (error) {
      console.error("Contract call error:", error)
      toast.error("Contract call failed - check console for details")
    }
  }, [signer, api, chain, signerAddress, queryContract])

  if (queryIsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            Loading Game...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show game over screen
  if (gameOver && loser) {
    return (
      <GameOver 
        loser={loser} 
        onRestart={resetGame}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PotatoAnimation isActive={gameState?.isActive || false} />
              <span>Hot Potato Game</span>
            </div>
            <div className="flex items-center gap-2">
              {gameState?.isActive ? (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Inactive
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Game Status Banner */}
          {gameState?.isActive ? (
            <div className="space-y-4">
              <CountdownTimer 
                totalTime={gameState.deadlineBlocks * 6 || 60}
                currentTime={timeLeft}
                isActive={gameState.isActive}
              />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Current Holder</h3>
                    <p className="font-mono text-orange-700">
                      {gameState.currentHolder ? formatAddress(gameState.currentHolder) : 'None'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Game Not Active</h3>
                  <p className="text-blue-700">Start a new game to begin playing!</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Game Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="text-green-600" />
              Start New Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player-address">First Player Address</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="player-address"
                    placeholder="Enter player address (0x...)"
                    value={newPlayerAddress}
                    onChange={(e) => setNewPlayerAddress(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPlayerAddress(signerAddress || "")}
                    disabled={!signerAddress}
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </div>
                {signerAddress && (
                  <p className="text-xs text-gray-500 mt-1">
                    Your address: {formatAddress(signerAddress)}
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                variant="default"
                onClick={handleStartGame}
                disabled={gameState?.isActive === true || !newPlayerAddress}
              >
                🚀 Start Game
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="text-blue-600" />
              Game Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pass-address">Pass to Player</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="pass-address"
                    placeholder="Enter player address (0x...)"
                    value={newPlayerAddress}
                    onChange={(e) => setNewPlayerAddress(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPlayerAddress(signerAddress || "")}
                    disabled={!signerAddress}
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handlePassPotato}
                  disabled={!gameState?.isActive || !gameState?.currentHolder || !newPlayerAddress}
                >
                  🔄 Pass Potato
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckDeadline}
                  disabled={!gameState?.isActive}
                >
                  ⏰ Check Deadline
                </Button>
              </div>
              
              {signerAddress && gameState?.currentHolder && (
                <div className={`p-3 rounded-lg ${signerAddress === gameState.currentHolder ? 'bg-orange-100 border border-orange-200' : 'bg-blue-100 border border-blue-200'}`}>
                  <p className="text-sm">
                    <strong>You are:</strong> {
                      signerAddress === gameState.currentHolder 
                        ? "🎯 The current potato holder!" 
                        : "👤 A spectator"
                    }
                  </p>
                  {signerAddress === gameState.currentHolder && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Pass the potato quickly or the game will end automatically!
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player List */}
      <PlayerList players={players} />

      {/* Game Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-600" />
            Game Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <Play className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>Start Game</strong>: Choose any address as the first player</span>
            </li>
            <li className="flex items-start gap-2">
              <RotateCcw className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>Pass Potato</strong>: Current holder can pass to any address</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="text-orange-600 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>Deadline</strong>: Game automatically ends if potato isn't passed in time</span>
            </li>
            <li className="flex items-start gap-2">
              <Flame className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>Loser</strong>: The player holding the potato when time runs out loses!</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Game Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-purple-600" />
            Game Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-3">
              <div className="text-gray-500">Contract Address</div>
              <div className="font-mono text-xs truncate">
                {hotpotato.evmAddresses[chain]}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-gray-500">Deadline Blocks</div>
              <div className="font-semibold">
                {gameState?.deadlineBlocks || 0}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-gray-500">Last Passed Block</div>
              <div className="font-semibold">
                {gameState?.lastPassedBlock || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}