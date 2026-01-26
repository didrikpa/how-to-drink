# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start dev server with WebSocket game server (exposes on LAN)
npm run build     # Type-check with tsc then build for production
npm run lint      # Run ESLint on the codebase
npm run preview   # Preview production build locally
```

The dev server automatically exposes on local network. Players join by visiting the IP address shown in terminal (e.g., `http://192.168.x.x:5173/play`).

## What This Is

"How to Drink" is a local multiplayer drinking game themed as "Drinking School". The host computer displays the main game screen while players join via phones on the same WiFi network.

## Tech Stack

- React 19 + TypeScript
- Vite (rolldown-vite) with WebSocket server integrated via plugin
- ws library for WebSocket communication
- qrcode.react for QR code generation
- No database - all state in memory

## Architecture

```
Host computer (main screen)  <--WebSocket-->  Game Server (in Vite)
                                                    ^
                                                    |
Player phones (browser)      <--WebSocket-----------+
```

**URL routing:**
- `/` - Host screen (lobby, game display, leaderboard)
- `/play` - Player screen (join form, in-game actions)

## Key Directories

- `src/host/` - Host screen components
- `src/player/` - Player phone components
- `src/game/challenges/` - Challenge generators for each class type
- `src/server/GameServer.ts` - WebSocket server and game state machine
- `src/hooks/useGameSocket.ts` - Client-side WebSocket hook
- `src/types/game.ts` - Shared TypeScript types

## Game Flow

1. Host opens `/`, sees QR code
2. Players scan QR or visit `/play`, enter name + selfie
3. Host clicks START CLASS
4. Random timer counts down (configurable 30-90s default)
5. Random "class" challenge appears
6. Challenge resolves, drinks assigned
7. Loop continues until host ends game

## Challenge Classes

| Class | Mechanic |
|-------|----------|
| Pop Quiz | Trivia questions, wrong answer = drink |
| Social Studies | Voting ("who is most likely to..."), minority drinks |
| Physical Education | Coordination task, others vote pass/fail |
| Drama Class | Acting prompt, others vote on performance |
| Detention | Punishment rounds (waterfall, everyone drinks) |
| Recess | Mini-games (RPS, staring contest, word games) |

## Styling

Retro arcade aesthetic using Press Start 2P font. Dark background with yellow/orange/red/purple accent colors. No emojis.
