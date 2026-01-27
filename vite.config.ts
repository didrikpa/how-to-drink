import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { WebSocketServer } from 'ws'
import { networkInterfaces } from 'os'
import { GameServer } from './src/server/GameServer'
import { ContractsGameServer } from './src/server/ContractsGameServer'

function getLanIp(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

function gameServerPlugin(): Plugin {
  let gameServer: GameServer | null = null
  let contractsServer: ContractsGameServer | null = null

  return {
    name: 'game-server',
    configureServer(server) {
      // Serve LAN IP via API endpoint
      server.middlewares.use('/api/lan-ip', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ip: getLanIp() }))
      })

      const wss = new WebSocketServer({ noServer: true })
      const wssContracts = new WebSocketServer({ noServer: true })

      gameServer = new GameServer()
      gameServer.attach(wss)

      contractsServer = new ContractsGameServer()

      wssContracts.on('connection', (ws) => {
        contractsServer!.handleConnection(ws)
      })

      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        } else if (request.url === '/ws-contracts') {
          wssContracts.handleUpgrade(request, socket, head, (ws) => {
            wssContracts.emit('connection', ws, request)
          })
        }
      })

      console.log('[Vite] Game WebSocket servers ready at /ws and /ws-contracts')
    },
  }
}

export default defineConfig({
  plugins: [react(), gameServerPlugin()],
  server: {
    host: true, // Expose on local network
  },
})
