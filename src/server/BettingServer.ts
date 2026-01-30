import { WebSocket } from 'ws';
import type {
  BettingPlayer,
  BettingGameState,
  BettingSettings,
  Bet,
  DrinkToGive,
  BettingClientMessage,
  BettingServerMessage,
} from '../types/betting';
import {
  RACER_COLORS,
  RACER_NAMES,
  DEFAULT_BETTING_SETTINGS,
} from '../types/betting';

interface ClientConnection {
  ws: WebSocket;
  playerId: string | null;
  isHost: boolean;
}

export class BettingServer {
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private state: BettingGameState;
  private raceInterval: ReturnType<typeof setInterval> | null = null;
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): BettingGameState {
    return {
      phase: 'lobby',
      players: [],
      settings: { ...DEFAULT_BETTING_SETTINGS },
      racers: [],
      bets: {},
      winningRacer: null,
      roundNumber: 0,
      phaseEndTime: null,
      hostConnected: false,
      winnerDrinksToGive: {},
      drinkAssignments: [],
    };
  }

  handleConnection(ws: WebSocket): void {
    console.log('[BettingServer] New connection');

    const client: ClientConnection = {
      ws,
      playerId: null,
      isHost: false,
    };
    this.clients.set(ws, client);

    ws.on('message', (data) => {
      try {
        const message: BettingClientMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        console.error('[BettingServer] Invalid message:', err);
        this.send(ws, { type: 'error', message: 'Invalid message format' });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[BettingServer] WebSocket error:', err);
    });
  }

  private handleMessage(ws: WebSocket, message: BettingClientMessage): void {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'host-connect':
        this.handleHostConnect(ws, client);
        break;
      case 'join':
        this.handlePlayerJoin(ws, client, message.name, message.photo);
        break;
      case 'start-betting':
        this.handleStartBetting(client);
        break;
      case 'place-bet':
        this.handlePlaceBet(client, message.bet);
        break;
      case 'lock-bets':
        this.handleLockBets(client);
        break;
      case 'give-drink':
        this.handleGiveDrink(client, message.toPlayerId, message.amount, message.drinkType);
        break;
      case 'next-round':
        this.handleNextRound(client);
        break;
      case 'end-game':
        this.handleEndGame(client);
        break;
      case 'kick-player':
        this.handleKickPlayer(client, message.playerId);
        break;
      case 'update-settings':
        this.handleUpdateSettings(client, message.settings);
        break;
    }
  }

  private handleHostConnect(ws: WebSocket, client: ClientConnection): void {
    client.isHost = true;
    this.state.hostConnected = true;
    console.log('[BettingServer] Host connected');
    this.send(ws, { type: 'state', state: this.state });
  }

  private handlePlayerJoin(
    ws: WebSocket,
    client: ClientConnection,
    name: string,
    photo: string
  ): void {
    const playerId = this.generateId();
    const player: BettingPlayer = {
      id: playerId,
      name,
      photo,
      connected: true,
      pendingDrinks: 0,
      totalDrinks: 0,
    };

    client.playerId = playerId;
    this.state.players.push(player);

    console.log(`[BettingServer] Player joined: ${name} (${playerId})`);

    this.send(ws, { type: 'assigned-id', playerId });
    this.send(ws, { type: 'state', state: this.state });
    this.broadcast({ type: 'player-joined', player });
  }

  private handleStartBetting(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can start' });
      return;
    }

    if (this.state.players.length < 2) {
      this.send(client.ws, { type: 'error', message: 'Need at least 2 players' });
      return;
    }

    console.log('[BettingServer] Starting betting phase');
    this.state.roundNumber++;
    this.state.phase = 'betting';
    this.state.bets = {};
    this.state.winningRacer = null;
    this.state.drinkAssignments = [];
    this.state.winnerDrinksToGive = {};

    // Generate racers
    const numRacers = Math.min(
      Math.max(this.state.settings.numRacers, 2),
      8
    );
    this.state.racers = [];
    for (let i = 0; i < numRacers; i++) {
      this.state.racers.push({
        id: i,
        position: 0,
        color: RACER_COLORS[i],
        name: RACER_NAMES[i],
      });
    }

    const endTime = Date.now() + this.state.settings.betTimerSeconds * 1000;
    this.state.phaseEndTime = endTime;

    this.broadcastState();
    this.broadcast({ type: 'betting-started', endTime });

    // Auto-start race when timer ends
    this.phaseTimer = setTimeout(() => {
      this.startRace();
    }, this.state.settings.betTimerSeconds * 1000);
  }

  private handlePlaceBet(client: ClientConnection, bet: Bet): void {
    if (this.state.phase !== 'betting') return;
    if (!client.playerId) return;

    // Initialize bets array if needed
    if (!this.state.bets[client.playerId]) {
      this.state.bets[client.playerId] = [];
    }

    // Add or update bet for this racer
    const existingBetIndex = this.state.bets[client.playerId].findIndex(
      (b) => b.racerId === bet.racerId
    );

    if (existingBetIndex >= 0) {
      this.state.bets[client.playerId][existingBetIndex] = bet;
    } else {
      this.state.bets[client.playerId].push(bet);
    }

    console.log(`[BettingServer] Bet from ${client.playerId}: ${bet.amount} ${bet.type}(s) on racer ${bet.racerId}`);

    this.broadcast({ type: 'bet-placed', playerId: client.playerId, racerId: bet.racerId });
    this.broadcastState();
  }

  private handleLockBets(client: ClientConnection): void {
    if (!client.isHost) return;
    if (this.state.phase !== 'betting') return;

    // Clear timer and start race early
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    this.startRace();
  }

  private startRace(): void {
    console.log('[BettingServer] Starting race');
    this.state.phase = 'racing';
    this.state.phaseEndTime = null;

    this.broadcastState();
    this.broadcast({ type: 'race-started' });

    // Animate race
    this.raceInterval = setInterval(() => {
      this.updateRace();
    }, 100);
  }

  private updateRace(): void {
    let raceFinished = false;
    let winner: number | null = null;

    for (const racer of this.state.racers) {
      if (racer.position < 100) {
        // Random speed boost (0-8 units per tick)
        const speed = Math.random() * 8;
        racer.position = Math.min(100, racer.position + speed);

        if (racer.position >= 100 && !raceFinished) {
          raceFinished = true;
          winner = racer.id;
        }
      }
    }

    this.broadcast({ type: 'race-update', racers: this.state.racers });

    if (raceFinished && winner !== null) {
      this.finishRace(winner);
    }
  }

  private finishRace(winningRacer: number): void {
    if (this.raceInterval) {
      clearInterval(this.raceInterval);
      this.raceInterval = null;
    }

    console.log(`[BettingServer] Race finished! Winner: ${RACER_NAMES[winningRacer]}`);

    this.state.winningRacer = winningRacer;
    this.state.drinkAssignments = [];
    this.state.winnerDrinksToGive = {};

    // Calculate winners and losers
    for (const [playerId, bets] of Object.entries(this.state.bets)) {
      for (const bet of bets) {
        const drinkValue = bet.type === 'shot' ? bet.amount * 3 : bet.amount;

        if (bet.racerId === winningRacer) {
          // Winner: gets to distribute drinks
          this.state.winnerDrinksToGive[playerId] =
            (this.state.winnerDrinksToGive[playerId] || 0) + drinkValue;
        } else {
          // Loser: drinks their own bet
          const player = this.state.players.find((p) => p.id === playerId);
          if (player) {
            player.pendingDrinks += drinkValue;
            player.totalDrinks += drinkValue;
          }

          this.state.drinkAssignments.push({
            fromPlayerId: playerId,
            toPlayerId: playerId,
            amount: bet.amount,
            type: bet.type,
          });
        }
      }
    }

    this.broadcast({ type: 'race-finished', winningRacer });

    // Check if there are winners who need to distribute
    const hasWinners = Object.values(this.state.winnerDrinksToGive).some((v) => v > 0);

    if (hasWinners) {
      // Start distribution phase
      this.state.phase = 'distribution';
      const endTime = Date.now() + this.state.settings.distributionTimerSeconds * 1000;
      this.state.phaseEndTime = endTime;

      this.broadcastState();
      this.broadcast({ type: 'distribution-started', endTime });

      this.phaseTimer = setTimeout(() => {
        this.finishDistribution();
      }, this.state.settings.distributionTimerSeconds * 1000);
    } else {
      // No winners, go straight to results
      this.showResults();
    }
  }

  private handleGiveDrink(
    client: ClientConnection,
    toPlayerId: string,
    amount: number,
    drinkType: 'sip' | 'shot'
  ): void {
    if (this.state.phase !== 'distribution') return;
    if (!client.playerId) return;

    const drinksRemaining = this.state.winnerDrinksToGive[client.playerId] || 0;
    const drinkValue = drinkType === 'shot' ? amount * 3 : amount;

    if (drinkValue > drinksRemaining) {
      this.send(client.ws, { type: 'error', message: 'Not enough drinks to give' });
      return;
    }

    const targetPlayer = this.state.players.find((p) => p.id === toPlayerId);
    if (!targetPlayer) return;

    // Deduct from winner's pool
    this.state.winnerDrinksToGive[client.playerId] -= drinkValue;

    // Add to target player
    targetPlayer.pendingDrinks += drinkValue;
    targetPlayer.totalDrinks += drinkValue;

    const drink: DrinkToGive = {
      fromPlayerId: client.playerId,
      toPlayerId,
      amount,
      type: drinkType,
    };
    this.state.drinkAssignments.push(drink);

    console.log(`[BettingServer] ${client.playerId} gave ${amount} ${drinkType}(s) to ${toPlayerId}`);

    this.broadcast({ type: 'drink-given', drink });
    this.broadcastState();

    // Check if all drinks distributed
    const totalRemaining = Object.values(this.state.winnerDrinksToGive).reduce(
      (sum, v) => sum + v,
      0
    );

    if (totalRemaining <= 0) {
      if (this.phaseTimer) {
        clearTimeout(this.phaseTimer);
        this.phaseTimer = null;
      }
      this.finishDistribution();
    }
  }

  private finishDistribution(): void {
    this.showResults();
  }

  private showResults(): void {
    console.log('[BettingServer] Showing results');
    this.state.phase = 'results';
    this.state.phaseEndTime = null;

    this.broadcastState();
    this.broadcast({ type: 'round-results', drinkAssignments: this.state.drinkAssignments });
  }

  private handleNextRound(client: ClientConnection): void {
    if (!client.isHost) return;

    // Clear pending drinks (they drank them)
    for (const player of this.state.players) {
      player.pendingDrinks = 0;
    }

    this.handleStartBetting(client);
  }

  private handleEndGame(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can end game' });
      return;
    }

    this.clearTimers();
    this.state.phase = 'lobby';
    this.state.racers = [];
    this.state.bets = {};
    this.state.winningRacer = null;
    this.state.roundNumber = 0;
    this.state.phaseEndTime = null;
    this.state.drinkAssignments = [];
    this.state.winnerDrinksToGive = {};

    // Keep players but reset their drinks
    for (const player of this.state.players) {
      player.pendingDrinks = 0;
      player.totalDrinks = 0;
    }

    this.broadcastState();
  }

  private handleKickPlayer(client: ClientConnection, playerId: string): void {
    if (!client.isHost) return;

    this.state.players = this.state.players.filter((p) => p.id !== playerId);
    delete this.state.bets[playerId];
    delete this.state.winnerDrinksToGive[playerId];

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

  private handleUpdateSettings(
    client: ClientConnection,
    settings: Partial<BettingSettings>
  ): void {
    if (!client.isHost) return;

    this.state.settings = { ...this.state.settings, ...settings };
    this.broadcastState();
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    if (client.isHost) {
      this.state.hostConnected = false;
      console.log('[BettingServer] Host disconnected');
    }

    if (client.playerId) {
      const player = this.state.players.find((p) => p.id === client.playerId);
      if (player) {
        player.connected = false;
        console.log(`[BettingServer] Player disconnected: ${player.name}`);
        this.broadcast({ type: 'player-left', playerId: client.playerId });
      }
    }

    this.clients.delete(ws);
    this.broadcastState();
  }

  private clearTimers(): void {
    if (this.raceInterval) {
      clearInterval(this.raceInterval);
      this.raceInterval = null;
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private send(ws: WebSocket, message: BettingServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: BettingServerMessage): void {
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
