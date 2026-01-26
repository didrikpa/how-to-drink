import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type {
  Player,
  GameState,
  GameSettings,
  ChallengeResult,
  ClientMessage,
  ServerMessage,
  DrinkAssignment,
} from '../types/game';
import { generateChallenge } from '../game/challenges/index';

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
  private challengeTimer: ReturnType<typeof setTimeout> | null = null;

  // Track responses for current challenge
  private votes: Map<string, string> = new Map(); // playerId -> vote
  private answers: Map<string, string> = new Map(); // playerId -> answer
  private passFails: Map<string, boolean> = new Map(); // playerId -> passed

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
    if (!client.playerId) return;
    if (!this.state.currentChallenge) return;
    if (this.state.currentChallenge.id !== challengeId) return;
    if (!this.state.currentChallenge.votingPlayerIds.includes(client.playerId)) return;

    this.votes.set(client.playerId, vote);
    console.log(`[GameServer] Vote from ${client.playerId}: ${vote}`);

    // Check if all votes are in
    this.checkAllResponsesIn();
  }

  private handleAnswer(
    client: ClientConnection,
    challengeId: string,
    answer: string
  ): void {
    if (!client.playerId) return;
    if (!this.state.currentChallenge) return;
    if (this.state.currentChallenge.id !== challengeId) return;
    if (!this.state.currentChallenge.targetPlayerIds.includes(client.playerId)) return;

    this.answers.set(client.playerId, answer);
    console.log(`[GameServer] Answer from ${client.playerId}: ${answer}`);

    // Check if all answers are in
    this.checkAllResponsesIn();
  }

  private handlePassFail(
    client: ClientConnection,
    challengeId: string,
    passed: boolean
  ): void {
    if (!client.playerId) return;
    if (!this.state.currentChallenge) return;
    if (this.state.currentChallenge.id !== challengeId) return;
    if (!this.state.currentChallenge.votingPlayerIds.includes(client.playerId)) return;

    this.passFails.set(client.playerId, passed);
    console.log(`[GameServer] Pass/fail from ${client.playerId}: ${passed}`);

    // Check if all votes are in
    this.checkAllResponsesIn();
  }

  private checkAllResponsesIn(): void {
    if (!this.state.currentChallenge) return;

    const challenge = this.state.currentChallenge;
    const classType = challenge.classType;

    let allIn = false;

    if (classType === 'pop-quiz') {
      // Need answer from target player
      allIn = challenge.targetPlayerIds.every((id) => this.answers.has(id));
    } else if (classType === 'social-studies') {
      // Need votes from all voting players
      allIn = challenge.votingPlayerIds.every((id) => this.votes.has(id));
    } else if (classType === 'physical-education' || classType === 'drama-class') {
      // Need pass/fail from all voting players
      allIn = challenge.votingPlayerIds.every((id) => this.passFails.has(id));
    }

    if (allIn) {
      // Clear the timeout and complete immediately
      if (this.challengeTimer) {
        clearTimeout(this.challengeTimer);
        this.challengeTimer = null;
      }
      this.completeChallenge();
    }
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

    this.clearTimers();
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

  private clearTimers(): void {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.challengeTimer) {
      clearTimeout(this.challengeTimer);
      this.challengeTimer = null;
    }
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
    // Clear any previous responses
    this.votes.clear();
    this.answers.clear();
    this.passFails.clear();

    const enabledClasses = this.state.settings.enabledClasses;
    const classType = enabledClasses[Math.floor(Math.random() * enabledClasses.length)];
    const connectedPlayers = this.state.players.filter((p) => p.connected);

    if (connectedPlayers.length === 0) {
      this.startCountdown();
      return;
    }

    const challenge = generateChallenge(classType, connectedPlayers, this.state.players);
    this.state.phase = 'challenge';
    this.state.currentChallenge = challenge;

    console.log(`[GameServer] Challenge: ${challenge.title} (${challenge.classType})`);

    this.broadcastState();
    this.broadcast({ type: 'challenge-start', challenge });

    // Auto-complete challenge after time limit
    const timeLimit = (challenge.timeLimit || 15) * 1000;
    this.challengeTimer = setTimeout(() => {
      this.completeChallenge();
    }, timeLimit);
  }

  private completeChallenge(): void {
    if (!this.state.currentChallenge) return;

    const challenge = this.state.currentChallenge;
    const drinks: DrinkAssignment[] = [];

    switch (challenge.classType) {
      case 'pop-quiz':
        drinks.push(...this.resolvePopQuiz());
        break;
      case 'social-studies':
        drinks.push(...this.resolveSocialStudies());
        break;
      case 'physical-education':
      case 'drama-class':
        drinks.push(...this.resolvePassFail());
        break;
      case 'detention':
        drinks.push(...this.resolveDetention());
        break;
      case 'recess':
        drinks.push(...this.resolveRecess());
        break;
    }

    // Apply drinks
    for (const drink of drinks) {
      const player = this.state.players.find((p) => p.id === drink.playerId);
      if (player) {
        player.sips += drink.sips;
        player.shots += drink.shots;
      }
    }

    const result: ChallengeResult = {
      challengeId: challenge.id,
      drinks,
      votes: Object.fromEntries(this.votes),
    };

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

  private resolvePopQuiz(): DrinkAssignment[] {
    const challenge = this.state.currentChallenge!;
    const drinks: DrinkAssignment[] = [];

    for (const playerId of challenge.targetPlayerIds) {
      const answer = this.answers.get(playerId);
      const correct = answer === challenge.correctAnswer;

      if (!correct) {
        drinks.push({
          playerId,
          sips: 3,
          shots: 0,
          reason: answer ? `Wrong answer: ${answer}` : 'No answer',
        });
      } else {
        // Correct answer - they can give out drinks (for now just log it)
        console.log(`[GameServer] ${playerId} answered correctly!`);
      }
    }

    return drinks;
  }

  private resolveSocialStudies(): DrinkAssignment[] {
    const challenge = this.state.currentChallenge!;
    const drinks: DrinkAssignment[] = [];

    // Count votes for each player name
    const voteCounts: Map<string, number> = new Map();
    for (const vote of this.votes.values()) {
      voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
    }

    // Find the player(s) with most votes
    let maxVotes = 0;
    for (const count of voteCounts.values()) {
      if (count > maxVotes) maxVotes = count;
    }

    // Players with most votes drink
    for (const [name, count] of voteCounts.entries()) {
      if (count === maxVotes) {
        const player = this.state.players.find((p) => p.name === name);
        if (player) {
          drinks.push({
            playerId: player.id,
            sips: 2,
            shots: 0,
            reason: `Got ${count} votes`,
          });
        }
      }
    }

    return drinks;
  }

  private resolvePassFail(): DrinkAssignment[] {
    const challenge = this.state.currentChallenge!;
    const drinks: DrinkAssignment[] = [];

    // Count pass vs fail votes
    let passCount = 0;
    let failCount = 0;
    for (const passed of this.passFails.values()) {
      if (passed) passCount++;
      else failCount++;
    }

    const passed = passCount >= failCount;

    for (const playerId of challenge.targetPlayerIds) {
      if (!passed) {
        drinks.push({
          playerId,
          sips: 3,
          shots: 0,
          reason: `Failed (${failCount} fail vs ${passCount} pass)`,
        });
      }
    }

    return drinks;
  }

  private resolveDetention(): DrinkAssignment[] {
    const challenge = this.state.currentChallenge!;
    const drinks: DrinkAssignment[] = [];

    // Detention always assigns drinks to targets
    for (const playerId of challenge.targetPlayerIds) {
      drinks.push({
        playerId,
        sips: 2,
        shots: 0,
        reason: 'Detention',
      });
    }

    return drinks;
  }

  private resolveRecess(): DrinkAssignment[] {
    const challenge = this.state.currentChallenge!;
    const drinks: DrinkAssignment[] = [];

    // For 2-player games, pick a random loser
    if (challenge.targetPlayerIds.length === 2) {
      const loserId = challenge.targetPlayerIds[Math.floor(Math.random() * 2)];
      drinks.push({
        playerId: loserId,
        sips: 2,
        shots: 0,
        reason: 'Lost the game',
      });
    } else {
      // Group games - random person drinks
      const connectedPlayers = this.state.players.filter((p) => p.connected);
      if (connectedPlayers.length > 0) {
        const loser = connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)];
        drinks.push({
          playerId: loser.id,
          sips: 2,
          shots: 0,
          reason: 'Lost the game',
        });
      }
    }

    return drinks;
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
