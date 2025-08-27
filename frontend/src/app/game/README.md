`# Hot Potato Game

Welcome to the Hot Potato Game! This is a blockchain-based game built on Polkadot using ink! smart contracts.

## How to Play

1. **Connect your wallet** - Connect to the Polkadot network using a compatible wallet
2. **Start a game** - Enter a player address to start the game (you can use your own address)
3. **Pass the potato** - The current holder must pass the potato to another player before time runs out
4. **Avoid being caught** - If time runs out while you're holding the potato, you lose!

## Game Rules

- The game starts with a designated first player
- Each player has a limited time to pass the potato to another player
- If a player fails to pass the potato before the deadline, they lose
- The game can be manually ended by the player who started it

## Technical Details

This game is powered by:
- **ink! smart contracts** running on Polkadot
- **ReactiveDOT** for React integration
- **PAPI** for type-safe contract interactions
- **Next.js** for the frontend

## Contract Functions

- `start_game(to)`: Start a new game with a designated first player
- `pass_potato(to)`: Pass the potato to another player
- `check_deadline()`: Check if the deadline has passed
- `end_game()`: End the game manually (only by the game starter)

## Query Functions

- `get_holder()`: Get the current potato holder
- `is_active()`: Check if the game is active
- `get_deadline_blocks()`: Get the deadline in blocks
- `get_last_passed_block()`: Get the block when the potato was last passed
- `get_game_starter()`: Get the address of the player who started the game
- `get_remaining_blocks()`: Get the remaining blocks until the deadline