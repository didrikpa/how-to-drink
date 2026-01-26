import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type {
  Player,
  GameState,
  GameSettings,
  Challenge,
  ChallengeResult,
  ClientMessage,
  ServerMessage,
  DEFAULT_SETTINGS,
} from '../types/game';

interface ClientConnection {
  ws: WebSocket;
  playerId: string | null;
  isHost: boolean;
}

export class GameServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private state: GameState;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'lobby',
      players: [],
      settings: {
        minTimerSeconds: 30,
        maxTimerSeconds: 90,
        enabledClasses: [
          'pop-quiz',
          'social-studies',
          'physical-education',
          'drama-class',
          'detention',
          'recess',
        ],
      },
      currentChallenge: null,
      lastResult: null,
      countdownTarget: null,
      hostConnected: false,
    };
  }

  attach(wss: WebSocketServer): void {
    this.wss = wss;

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('[GameServer] New connection');

      const client: ClientConnection = {
        ws,
        playerId: null,
        isHost: false,
      };
      this.clients.set(ws, client);

      ws.on('message', (data) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (err) {
          console.error('[GameServer] Invalid message:', err);
          this.send(ws, { type: 'error', message: 'Invalid message format' });
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        console.error('[GameServer] WebSocket error:', err);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: ClientMessage): void {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'host-connect':
        this.handleHostConnect(ws, client);
        break;
      case 'join':
        this.handlePlayerJoin(ws, client, message.name, message.photo);
        break;
      case 'start-game':
        this.handleStartGame(client);
        break;
      case 'vote':
        this.handleVote(client, message.challengeId, message.vote);
        break;
      case 'answer':
        this.handleAnswer(client, message.challengeId, message.answer);
        break;
      case 'pass-fail':
        this.handlePassFail(client, message.challengeId, message.passed);
        break;
      case 'update-settings':
        this.handleUpdateSettings(client, message.settings);
        break;
      case 'kick-player':
        this.handleKickPlayer(client, message.playerId);
        break;
      case 'end-game':
        this.handleEndGame(client);
        break;
    }
  }

  private handleHostConnect(ws: WebSocket, client: ClientConnection): void {
    client.isHost = true;
    this.state.hostConnected = true;
    console.log('[GameServer] Host connected');
    this.send(ws, { type: 'state', state: this.state });
  }

  private handlePlayerJoin(
    ws: WebSocket,
    client: ClientConnection,
    name: string,
    photo: string
  ): void {
    const playerId = this.generateId();
    const player: Player = {
      id: playerId,
      name,
      photo,
      sips: 0,
      shots: 0,
      connected: true,
    };

    client.playerId = playerId;
    this.state.players.push(player);

    console.log(`[GameServer] Player joined: ${name} (${playerId})`);

    this.send(ws, { type: 'assigned-id', playerId });
    this.send(ws, { type: 'state', state: this.state });
    this.broadcast({ type: 'player-joined', player });
  }

  private handleStartGame(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can start game' });
      return;
    }

    if (this.state.players.length < 2) {
      this.send(client.ws, { type: 'error', message: 'Need at least 2 players' });
      return;
    }

    console.log('[GameServer] Starting game');
    this.startCountdown();
  }

  private handleVote(
    client: ClientConnection,
    challengeId: string,
    vote: string
  ): void {
    // TODO: Implement voting logic
    console.log(`[GameServer] Vote from ${client.playerId}: ${vote}`);
  }

  private handleAnswer(
    client: ClientConnection,
    challengeId: string,
    answer: string
  ): void {
    // TODO: Implement answer logic
    console.log(`[GameServer] Answer from ${client.playerId}: ${answer}`);
  }

  private handlePassFail(
    client: ClientConnection,
    challengeId: string,
    passed: boolean
  ): void {
    // TODO: Implement pass/fail logic
    console.log(`[GameServer] Pass/fail from ${client.playerId}: ${passed}`);
  }

  private handleUpdateSettings(
    client: ClientConnection,
    settings: Partial<GameSettings>
  ): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can change settings' });
      return;
    }

    this.state.settings = { ...this.state.settings, ...settings };
    this.broadcastState();
  }

  private handleKickPlayer(client: ClientConnection, playerId: string): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can kick players' });
      return;
    }

    this.state.players = this.state.players.filter((p) => p.id !== playerId);

    // Close the kicked player's connection
    for (const [ws, c] of this.clients.entries()) {
      if (c.playerId === playerId) {
        ws.close();
        this.clients.delete(ws);
        break;
      }
    }

    this.broadcast({ type: 'player-left', playerId });
    this.broadcastState();
  }

  private handleEndGame(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can end game' });
      return;
    }

    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }

    this.state.phase = 'lobby';
    this.state.currentChallenge = null;
    this.state.lastResult = null;
    this.state.countdownTarget = null;
    this.broadcastState();
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    if (client.isHost) {
      this.state.hostConnected = false;
      console.log('[GameServer] Host disconnected');
    }

    if (client.playerId) {
      const player = this.state.players.find((p) => p.id === client.playerId);
      if (player) {
        player.connected = false;
        console.log(`[GameServer] Player disconnected: ${player.name}`);
        this.broadcast({ type: 'player-left', playerId: client.playerId });
      }
    }

    this.clients.delete(ws);
    this.broadcastState();
  }

  private startCountdown(): void {
    const { minTimerSeconds, maxTimerSeconds } = this.state.settings;
    const duration =
      Math.floor(Math.random() * (maxTimerSeconds - minTimerSeconds + 1)) +
      minTimerSeconds;

    const targetTime = Date.now() + duration * 1000;
    this.state.phase = 'countdown';
    this.state.countdownTarget = targetTime;

    this.broadcastState();
    this.broadcast({ type: 'countdown-start', targetTime });

    this.countdownTimer = setTimeout(() => {
      this.triggerChallenge();
    }, duration * 1000);
  }

  private triggerChallenge(): void {
    // TODO: Implement actual challenge selection
    const challenge = this.generateRandomChallenge();
    this.state.phase = 'challenge';
    this.state.currentChallenge = challenge;

    this.broadcastState();
    this.broadcast({ type: 'challenge-start', challenge });

    // For now, auto-complete after 10 seconds
    // TODO: Implement proper challenge completion logic
    setTimeout(() => {
      this.completeChallenge();
    }, 10000);
  }

  private generateRandomChallenge(): Challenge {
    const enabledClasses = this.state.settings.enabledClasses;
    const classType = enabledClasses[Math.floor(Math.random() * enabledClasses.length)];
    const connectedPlayers = this.state.players.filter((p) => p.connected);
    const targetPlayer = connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)];

    // Placeholder challenge
    return {
      id: this.generateId(),
      classType,
      title: `${classType.replace('-', ' ').toUpperCase()}`,
      description: `Challenge for ${targetPlayer?.name || 'someone'}`,
      targetPlayerIds: targetPlayer ? [targetPlayer.id] : [],
      votingPlayerIds: connectedPlayers
        .filter((p) => p.id !== targetPlayer?.id)
        .map((p) => p.id),
      timeLimit: 10,
    };
  }

  private completeChallenge(): void {
    if (!this.state.currentChallenge) return;

    const result: ChallengeResult = {
      challengeId: this.state.currentChallenge.id,
      drinks: this.state.currentChallenge.targetPlayerIds.map((playerId) => ({
        playerId,
        sips: 2,
        shots: 0,
        reason: 'Challenge completed',
      })),
    };

    // Apply drinks
    for (const drink of result.drinks) {
      const player = this.state.players.find((p) => p.id === drink.playerId);
      if (player) {
        player.sips += drink.sips;
        player.shots += drink.shots;
      }
    }

    this.state.phase = 'result';
    this.state.lastResult = result;
    this.state.currentChallenge = null;

    this.broadcastState();
    this.broadcast({ type: 'challenge-result', result });

    // Start next countdown after showing result
    setTimeout(() => {
      this.startCountdown();
    }, 5000);
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ServerMessage): void {
    for (const [ws] of this.clients.entries()) {
      this.send(ws, message);
    }
  }

  private broadcastState(): void {
    this.broadcast({ type: 'state', state: this.state });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
