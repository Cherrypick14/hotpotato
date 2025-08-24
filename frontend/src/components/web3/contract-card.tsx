import { createReviveSdk, type ReviveSdkTypedApi } from "@polkadot-api/sdk-ink"
import { useChainId, useTypedApi } from "@reactive-dot/react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useSignerAndAddress } from "@/hooks/use-signer-and-address"
import { hotpotato } from "@/lib/inkathon/deployments"
import { CardSkeleton } from "../layout/skeletons"
import { Button } from "../ui/button-extended"
import { Card, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableRow } from "../ui/table"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export function ContractCard() {
  const [queryIsLoading, setQueryIsLoading] = useState(true)
  const [newPlayerAddress, setNewPlayerAddress] = useState("")

  const api = useTypedApi()
  const chain = useChainId()
  const { signer, signerAddress } = useSignerAndAddress()

  /**
   * Contract Read (Query)
   */
  const [gameState, setGameState] = useState<{
    isActive: boolean
    currentHolder: string | null
    deadlineBlocks: number
    remainingBlocks: number
    gameStarter: string | null
    lastPassedBlock: number
  }>()

  const queryContract = useCallback(async () => {
    setQueryIsLoading(true)
    try {
      if (!api || !chain) return

      // Create SDK & contract instance
      const sdk = createReviveSdk(api as ReviveSdkTypedApi, hotpotato.contract)
      const contract = sdk.getContract(hotpotato.evmAddresses[chain])

      // Debug: Log contract object to understand the API
      console.log("Contract object:", contract)
      console.log("Contract methods:", Object.getOwnPropertyNames(contract))
      if (contract.send) {
        console.log("Send method:", contract.send)
        console.log("Available message names:", Object.keys(contract.send))
      }

      try {
        // Query contract state
        const storageResult = await contract.getStorage().getRoot()
        console.log("Storage result:", storageResult)
        
        if (storageResult.success) {
          const storage = storageResult.value
          console.log("Storage value:", storage)
          
          setGameState({
            isActive: storage.active,
            currentHolder: storage.current_holder.type === "Some" ? storage.current_holder.value["0"] : null,
            deadlineBlocks: storage.deadline_blocks,
            remainingBlocks: 0, // We'll calculate this separately
            gameStarter: storage.game_starter.type === "Some" ? storage.game_starter.value["0"] : null,
            lastPassedBlock: storage.last_passed_block,
          })
        } else {
          console.error("Storage query failed:", storageResult.value)
          // Set default state if storage query fails
          setGameState({
            isActive: false,
            currentHolder: null,
            deadlineBlocks: 0,
            remainingBlocks: 0,
            gameStarter: null,
            lastPassedBlock: 0,
          })
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
    } finally {
      setQueryIsLoading(false)
    }
  }, [api, chain])

  useEffect(() => {
    queryContract()
  }, [queryContract])

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
          if (!tx.ok) throw new Error("Failed to send transaction", { cause: tx.dispatchError })
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
  }, [signer, api, chain, newPlayerAddress, signerAddress, queryContract])

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

  if (queryIsLoading) return <CardSkeleton />

  return (
    <Card className="inkathon-card">
      <CardHeader className="relative">
        <CardTitle>🥔 Hot Potato Game</CardTitle>
      </CardHeader>

      <div className="p-6 space-y-6">
        {/* Game Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Game Status</Label>
            <div className={`text-lg font-semibold ${gameState?.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {gameState?.isActive ? '🟢 Active' : '🔴 Inactive'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Current Holder</Label>
            <div className="text-lg font-mono">
              {gameState?.currentHolder || 'None'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Deadline Blocks</Label>
            <div className="text-lg">
              {gameState?.deadlineBlocks || 0}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Last Passed Block</Label>
            <div className="text-lg">
              {gameState?.lastPassedBlock || 0}
            </div>
          </div>
        </div>

        {/* Deadline Warning */}
        {gameState?.isActive && gameState.deadlineBlocks > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">⏰ Game Deadline</h4>
            <div className="text-sm text-orange-700">
              <p>• <strong>Deadline:</strong> {gameState.deadlineBlocks} blocks</p>
              <p>• <strong>Last Pass:</strong> Block {gameState.lastPassedBlock}</p>
              <p>• <strong>Auto-End:</strong> Game will end automatically if potato isn't passed in time</p>
              {gameState.currentHolder && (
                <p className="mt-2 font-medium">
                  🎯 Current holder must pass the potato before the deadline!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Game Rules & Current Player Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🎮 How to Play</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Start Game</strong>: Choose any address as the first player</p>
            <p>• <strong>Pass Potato</strong>: Current holder can pass to any address</p>
            <p>• <strong>Deadline</strong>: Game automatically ends if potato isn't passed in time</p>
            <p>• <strong>Auto-End</strong>: Game ends automatically when deadline expires</p>
          </div>
          {signerAddress && gameState?.currentHolder && (
            <div className="mt-3 pt-3 border-t border-blue-200">
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

        {/* Game Actions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-address">Player Address</Label>
            <div className="flex gap-2">
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
                Use My Address
              </Button>
            </div>
            {signerAddress && (
              <p className="text-sm text-gray-500">
                Your address: {signerAddress.slice(0, 10)}...{signerAddress.slice(-8)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={handleStartGame}
              disabled={gameState?.isActive === true || !newPlayerAddress}
            >
              🚀 Start Game
            </Button>

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
        </div>

        {/* Contract Info */}
        <div className="pt-4 border-t">
          <Table className="inkathon-card-table">
            <TableBody>
              <TableRow>
                <TableCell>Contract Address</TableCell>
                <TableCell>{hotpotato.evmAddresses[chain]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Language</TableCell>
                <TableCell>{hotpotato.contract.metadata.source.language}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Compiler</TableCell>
                <TableCell>{hotpotato.contract.metadata.source.compiler}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}
