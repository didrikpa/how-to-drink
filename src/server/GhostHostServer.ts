import { WebSocket } from 'ws';
import type {
  GhostHostGameState,
  GhostHostPlayer,
  GhostHostSettings,
  GhostHostClientMessage,
  GhostHostServerMessage,
  PrivateState,
  GhostPrivateState,
  MortalPrivateState,
  VotingResult,
  Mission,
} from '../types/ghosthost';
import { DEFAULT_GHOSTHOST_SETTINGS } from '../types/ghosthost';
import { getRandomMission } from '../game/ghosthost/missions';
import { getRandomRules } from '../game/ghosthost/rules';

interface ClientConnection {
  ws: WebSocket;
  playerId: string | null;
  isHost: boolean;
}

export class GhostHostServer {
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private state: GhostHostGameState;
  private gameTimer: ReturnType<typeof setTimeout> | null = null;
  private votingTimer: ReturnType<typeof setTimeout> | null = null;

  // Secret state - never broadcast
  private ghostPlayerId: string | null = null;
  private currentMission: Mission | null = null;
  private completedMissionIds: string[] = [];
  private lastHauntTime: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GhostHostGameState {
    return {
      phase: 'lobby',
      players: [],
      settings: { ...DEFAULT_GHOSTHOST_SETTINGS },
      gameTimerEnd: null,
      votingTimerEnd: null,
      globalRules: [],
      hauntCount: 0,
      votes: {},
      votingResult: null,
      hostConnected: false,
    };
  }

  handleConnection(ws: WebSocket): void {
    const client: ClientConnection = {
      ws,
      playerId: null,
      isHost: false,
    };
    this.clients.set(ws, client);

    ws.on('message', (data) => {
      try {
        const message: GhostHostClientMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        console.error('[GhostHostServer] Invalid message:', err);
        this.send(ws, { type: 'error', message: 'Invalid message format' });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[GhostHostServer] WebSocket error:', err);
    });
  }

  private handleMessage(ws: WebSocket, message: GhostHostClientMessage): void {
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
        this.handleStartGame(client, message.settings);
        break;
      case 'haunt':
        this.handleHaunt(client);
        break;
      case 'vote':
        this.handleVote(client, message.targetId);
        break;
      case 'end-game':
        this.handleEndGame(client);
        break;
    }
  }

  private handleHostConnect(ws: WebSocket, client: ClientConnection): void {
    client.isHost = true;
    this.state.hostConnected = true;
    console.log('[GhostHostServer] Host connected');
    this.send(ws, { type: 'state', state: this.state });
  }

  private handlePlayerJoin(
    ws: WebSocket,
    client: ClientConnection,
    name: string,
    photo: string
  ): void {
    const playerId = this.generateId();
    const player: GhostHostPlayer = {
      id: playerId,
      name,
      photo,
      connected: true,
    };

    client.playerId = playerId;
    this.state.players.push(player);

    console.log(`[GhostHostServer] Player joined: ${name} (${playerId})`);

    this.send(ws, { type: 'assigned-id', playerId });
    this.send(ws, { type: 'state', state: this.state });
    this.broadcast({ type: 'player-joined', player });
  }

  private handleStartGame(
    client: ClientConnection,
    settings?: Partial<GhostHostSettings>
  ): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can start game' });
      return;
    }

    const connectedPlayers = this.state.players.filter(p => p.connected);
    if (connectedPlayers.length < 3) {
      this.send(client.ws, { type: 'error', message: 'Need at least 3 players' });
      return;
    }

    // Apply settings
    if (settings) {
      this.state.settings = { ...this.state.settings, ...settings };
    }

    // Reset game state
    this.state.hauntCount = 0;
    this.state.votes = {};
    this.state.votingResult = null;
    this.completedMissionIds = [];
    this.lastHauntTime = 0;

    // Select 3 global rules
    this.state.globalRules = getRandomRules(3);

    // Randomly assign Ghost
    const ghostIndex = Math.floor(Math.random() * connectedPlayers.length);
    this.ghostPlayerId = connectedPlayers[ghostIndex].id;

    // Get first mission for Ghost
    this.currentMission = getRandomMission([]);

    console.log(`[GhostHostServer] Game started. Ghost: ${this.ghostPlayerId}`);

    // Start game timer
    const duration = this.state.settings.gameDurationSeconds * 1000;
    this.state.gameTimerEnd = Date.now() + duration;
    this.state.phase = 'playing';

    this.broadcastState();

    // Send private state to each player
    this.sendAllPrivateStates();

    // Schedule end of game
    this.gameTimer = setTimeout(() => {
      this.startVoting();
    }, duration);
  }

  private handleHaunt(client: ClientConnection): void {
    if (!client.playerId) return;
    if (this.state.phase !== 'playing') return;
    if (client.playerId !== this.ghostPlayerId) return;

    // Check cooldown
    const now = Date.now();
    const cooldownMs = this.state.settings.hauntCooldownSeconds * 1000;
    if (now - this.lastHauntTime < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - this.lastHauntTime)) / 1000);
      this.send(client.ws, {
        type: 'error',
        message: `Haunt on cooldown. Wait ${remaining}s`,
      });
      return;
    }

    this.lastHauntTime = now;
    this.state.hauntCount++;

    console.log(`[GhostHostServer] Haunt #${this.state.hauntCount}`);

    // Mark current mission as completed
    if (this.currentMission) {
      this.completedMissionIds.push(this.currentMission.id);
    }

    // Get new mission
    this.currentMission = getRandomMission(this.completedMissionIds);

    // Broadcast haunt to mortals only (not to ghost)
    for (const [ws, c] of this.clients.entries()) {
      if (c.playerId && c.playerId !== this.ghostPlayerId) {
        this.send(ws, { type: 'haunt-triggered' });
      }
    }

    // Send new mission to ghost
    const ghostClient = this.findClientByPlayerId(this.ghostPlayerId);
    if (ghostClient && this.currentMission) {
      this.send(ghostClient.ws, { type: 'new-mission', mission: this.currentMission });
    }

    this.broadcastState();
  }

  private handleVote(client: ClientConnection, targetId: string): void {
    if (!client.playerId) return;
    if (this.state.phase !== 'voting') return;

    // Ghost cannot vote
    if (client.playerId === this.ghostPlayerId) {
      this.send(client.ws, { type: 'error', message: 'Ghosts cannot vote' });
      return;
    }

    // Can only vote for other players
    const targetPlayer = this.state.players.find(p => p.id === targetId);
    if (!targetPlayer || !targetPlayer.connected) {
      this.send(client.ws, { type: 'error', message: 'Invalid vote target' });
      return;
    }

    // Record vote (can change vote until resolved)
    this.state.votes[client.playerId] = targetId;
    console.log(`[GhostHostServer] ${client.playerId} voted for ${targetId}`);

    this.broadcastState();

    // Check if all mortals have voted
    this.checkAllVotesIn();
  }

  private handleEndGame(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can end game' });
      return;
    }

    this.clearTimers();

    // If in playing phase, go to voting first
    if (this.state.phase === 'playing') {
      this.startVoting();
    } else if (this.state.phase === 'voting') {
      this.resolveVoting();
    } else {
      // Reset to lobby
      this.resetToLobby();
    }
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    if (client.isHost) {
      this.state.hostConnected = false;
      console.log('[GhostHostServer] Host disconnected');
    }

    if (client.playerId) {
      const player = this.state.players.find(p => p.id === client.playerId);
      if (player) {
        player.connected = false;
        console.log(`[GhostHostServer] Player disconnected: ${player.name}`);
        this.broadcast({ type: 'player-left', playerId: client.playerId });
      }
    }

    this.clients.delete(ws);
    this.broadcastState();
  }

  // ========== GAME FLOW ==========

  private startVoting(): void {
    this.clearTimers();

    this.state.phase = 'voting';
    this.state.votes = {};
    this.state.gameTimerEnd = null;

    const duration = this.state.settings.votingDurationSeconds * 1000;
    this.state.votingTimerEnd = Date.now() + duration;

    console.log('[GhostHostServer] Voting phase started');

    this.broadcast({ type: 'voting-started' });
    this.broadcastState();

    // Auto-resolve after timeout
    this.votingTimer = setTimeout(() => {
      this.resolveVoting();
    }, duration);
  }

  private checkAllVotesIn(): void {
    // Get all connected mortals
    const mortals = this.state.players.filter(
      p => p.connected && p.id !== this.ghostPlayerId
    );

    const allVoted = mortals.every(p => this.state.votes[p.id] !== undefined);

    if (allVoted) {
      console.log('[GhostHostServer] All mortals have voted');
      this.resolveVoting();
    }
  }

  private resolveVoting(): void {
    this.clearTimers();

    // Count votes
    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(this.state.votes)) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    // Find player with most votes
    let maxVotes = 0;
    let mostVotedId: string | null = null;
    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = playerId;
      }
    }

    const ghost = this.state.players.find(p => p.id === this.ghostPlayerId);
    const correctGuess = mostVotedId === this.ghostPlayerId;

    const result: VotingResult = {
      ghostId: this.ghostPlayerId || '',
      ghostName: ghost?.name || 'Unknown',
      ghostPhoto: ghost?.photo || '',
      correctGuess,
      voteCounts,
    };

    this.state.votingResult = result;
    this.state.phase = 'result';
    this.state.votingTimerEnd = null;

    console.log(
      `[GhostHostServer] Voting resolved. Ghost ${correctGuess ? 'CAUGHT' : 'ESCAPED'}`
    );

    this.broadcast({ type: 'voting-result', result });
    this.broadcastState();
  }

  private resetToLobby(): void {
    this.clearTimers();

    this.state.phase = 'lobby';
    this.state.gameTimerEnd = null;
    this.state.votingTimerEnd = null;
    this.state.globalRules = [];
    this.state.hauntCount = 0;
    this.state.votes = {};
    this.state.votingResult = null;

    this.ghostPlayerId = null;
    this.currentMission = null;
    this.completedMissionIds = [];
    this.lastHauntTime = 0;

    this.broadcastState();
  }

  // ========== PRIVATE STATE ==========

  private sendAllPrivateStates(): void {
    for (const [ws, client] of this.clients.entries()) {
      if (client.playerId) {
        const privateState = this.getPrivateState(client.playerId);
        this.send(ws, { type: 'private-state', privateState });
      }
    }
  }

  private getPrivateState(playerId: string): PrivateState {
    if (playerId === this.ghostPlayerId) {
      const ghostState: GhostPrivateState = {
        role: 'ghost',
        currentMission: this.currentMission!,
        completedMissionIds: [...this.completedMissionIds],
      };
      return ghostState;
    } else {
      const mortalState: MortalPrivateState = {
        role: 'mortal',
      };
      return mortalState;
    }
  }

  // ========== HELPERS ==========

  private findClientByPlayerId(
    playerId: string | null
  ): ClientConnection | undefined {
    if (!playerId) return undefined;
    for (const [, client] of this.clients.entries()) {
      if (client.playerId === playerId) {
        return client;
      }
    }
    return undefined;
  }

  private clearTimers(): void {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.votingTimer) {
      clearTimeout(this.votingTimer);
      this.votingTimer = null;
    }
  }

  private send(ws: WebSocket, message: GhostHostServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: GhostHostServerMessage): void {
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
