import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { WebSocketServer } from 'ws'
import { GameServer } from './src/server/GameServer'

function gameServerPlugin(): Plugin {
  let gameServer: GameServer | null = null

  return {
    name: 'game-server',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })
      gameServer = new GameServer()
      gameServer.attach(wss)

      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      })

      console.log('[Vite] Game WebSocket server ready at /ws')
    },
  }
}

export default defineConfig({
  plugins: [react(), gameServerPlugin()],
  server: {
    host: true, // Expose on local network
  },
})
