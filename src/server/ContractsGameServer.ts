import { WebSocket } from 'ws';
import type {
  ContractsGameState,
  ContractsPlayer,
  ContractsSettings,
  ActiveContract,
  ContractTemplate,
  ContractsClientMessage,
  ContractsServerMessage,
  ContractsDrinkAssignment,
  RoundResult,
  GameResults,
  TabMilestone,
  BuyoutProposal,
  ActionEvent,
  PlayerTokens,
} from '../types/contracts';
import {
  DEFAULT_CONTRACTS_SETTINGS,
  DEFAULT_TOKENS,
  TAB_MILESTONES_CHILL,
  TAB_MILESTONES_UNHINGED,
} from '../types/contracts';
import { getBalancedContracts, getContractsByCategory } from '../game/contracts/library';

interface ClientConnection {
  ws: WebSocket;
  playerId: string | null;
  isHost: boolean;
}

export class ContractsGameServer {
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private state: ContractsGameState;
  private roundTimer: ReturnType<typeof setTimeout> | null = null;
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private eventTimer: ReturnType<typeof setTimeout> | null = null;
  private usedContractIds: string[] = [];
  private paused = false;

  // Track buyout votes as plain object (Map doesn't serialize)
  private buyoutVotes: Record<string, boolean> = {};

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): ContractsGameState {
    return {
      phase: 'lobby',
      players: [],
      settings: { ...DEFAULT_CONTRACTS_SETTINGS },
      currentRound: 0,
      tab: 0,
      milestones: TAB_MILESTONES_CHILL.map(m => ({ ...m })),
      availableContracts: [],
      activeContracts: [],
      settledContracts: [],
      roundTimerEnd: null,
      pendingEvents: [],
      currentBuyout: null,
      roundResults: null,
      gameResults: null,
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
        const message: ContractsClientMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (err) {
        console.error('[ContractsServer] Invalid message:', err);
        this.send(ws, { type: 'error', message: 'Invalid message format' });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[ContractsServer] WebSocket error:', err);
    });
  }

  private handleMessage(ws: WebSocket, message: ContractsClientMessage): void {
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
      case 'sign-contract':
        this.handleSignContract(client, message.contractId);
        break;
      case 'witness-contract':
        this.handleWitnessContract(client, message.contractId);
        break;
      case 'use-token':
        this.handleUseToken(client, message.token, message.targetContractId, message.targetPlayerId);
        break;
      case 'propose-buyout':
        this.handleProposeBuyout(client, message.contractId);
        break;
      case 'vote-buyout':
        this.handleVoteBuyout(client, message.approve);
        break;
      case 'trigger-event':
        this.handleTriggerEvent(client, message.eventType);
        break;
      case 'report-duel-result':
        this.handleDuelResult(client, message.contractId, message.loserId);
        break;
      case 'nope-contract':
        this.handleNopeContract(client, message.contractId);
        break;
      case 'pause-game':
        this.handlePause(client);
        break;
      case 'resume-game':
        this.handleResume(client);
        break;
      case 'end-game':
        this.handleEndGame(client);
        break;
    }
  }

  private handleHostConnect(ws: WebSocket, client: ClientConnection): void {
    client.isHost = true;
    this.state.hostConnected = true;
    console.log('[ContractsServer] Host connected');
    this.send(ws, { type: 'state', state: this.state });
  }

  private handlePlayerJoin(ws: WebSocket, client: ClientConnection, name: string, photo: string): void {
    const playerId = this.generateId();
    const player: ContractsPlayer = {
      id: playerId,
      name,
      photo,
      sips: 0,
      shots: 0,
      tokens: { ...DEFAULT_TOKENS },
      tabContribution: 0,
      contractsSigned: 0,
      buyouts: 0,
      auditsTriggered: 0,
      connected: true,
    };

    client.playerId = playerId;
    this.state.players.push(player);

    console.log(`[ContractsServer] Player joined: ${name} (${playerId})`);

    this.send(ws, { type: 'assigned-id', playerId });
    this.send(ws, { type: 'state', state: this.state });
    this.broadcast({ type: 'player-joined', player });
  }

  private handleStartGame(client: ClientConnection, settings: ContractsSettings): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can start game' });
      return;
    }
    if (this.state.players.length < 2) {
      this.send(client.ws, { type: 'error', message: 'Need at least 2 players' });
      return;
    }

    // Apply settings
    this.state.settings = { ...settings };

    // Set milestones based on difficulty
    this.state.milestones = (settings.difficulty === 'unhinged'
      ? TAB_MILESTONES_UNHINGED
      : TAB_MILESTONES_CHILL
    ).map(m => ({ ...m }));

    // Reset game state
    this.state.currentRound = 0;
    this.state.tab = 0;
    this.state.activeContracts = [];
    this.state.settledContracts = [];
    this.state.availableContracts = [];
    this.usedContractIds = [];

    // Reset player stats
    for (const player of this.state.players) {
      player.sips = 0;
      player.shots = 0;
      player.tokens = { ...DEFAULT_TOKENS };
      player.tabContribution = 0;
      player.contractsSigned = 0;
      player.buyouts = 0;
      player.auditsTriggered = 0;
    }

    console.log('[ContractsServer] Starting game with settings:', settings);
    this.startNextRound();
  }

  private handleSignContract(client: ClientConnection, contractId: string): void {
    if (!client.playerId || this.state.phase !== 'offer') return;

    const contract = this.state.availableContracts.find(c => c.id === contractId);
    if (!contract || contract.signedBy) return;

    // Check player hasn't already signed a contract this round
    const alreadySigned = this.state.availableContracts.some(
      c => c.signedBy === client.playerId && c.roundCreated === this.state.currentRound
    );
    if (alreadySigned) {
      this.send(client.ws, { type: 'error', message: 'You already signed a contract this round' });
      return;
    }

    contract.signedBy = client.playerId;

    const player = this.findPlayer(client.playerId);
    if (player) player.contractsSigned++;

    console.log(`[ContractsServer] ${client.playerId} signed contract ${contractId}`);
    this.broadcast({ type: 'contract-signed', contractId, playerId: client.playerId });
    this.broadcastState();
  }

  private handleWitnessContract(client: ClientConnection, contractId: string): void {
    if (!client.playerId || this.state.phase !== 'offer') return;

    const contract = this.state.availableContracts.find(c => c.id === contractId);
    if (!contract) return;
    if (contract.witnessedBy.includes(client.playerId)) return;
    if (contract.signedBy === client.playerId) return;

    contract.witnessedBy.push(client.playerId);
    this.broadcastState();
  }

  private handleUseToken(
    client: ClientConnection,
    token: keyof PlayerTokens,
    targetContractId?: string,
    targetPlayerId?: string
  ): void {
    if (!client.playerId) return;

    const player = this.findPlayer(client.playerId);
    if (!player || player.tokens[token] <= 0) {
      this.send(client.ws, { type: 'error', message: 'No tokens available' });
      return;
    }

    switch (token) {
      case 'lawyer': {
        // Cancel or rewrite one clause
        if (!targetContractId) return;
        const contract = this.state.activeContracts.find(c => c.id === targetContractId);
        if (!contract) return;
        contract.hiddenClause = 'Clause cancelled by lawyer';
        contract.hiddenRevealed = true;
        player.tokens.lawyer--;
        break;
      }
      case 'hedge': {
        // Reduce own penalty by 1 at settlement
        player.tokens.hedge--;
        // Effect applied at settlement time
        break;
      }
      case 'sabotage': {
        // Flip "who pays" at settlement (once per game)
        if (!targetContractId) return;
        const contract = this.state.activeContracts.find(c => c.id === targetContractId);
        if (!contract || !contract.signedBy) return;
        // Swap the signer to a random other player
        const otherPlayers = this.state.players.filter(
          p => p.id !== contract.signedBy && p.connected
        );
        if (otherPlayers.length > 0) {
          const newTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          contract.targetPlayerId = newTarget.id;
        }
        player.tokens.sabotage--;
        break;
      }
    }

    this.broadcastState();
  }

  private handleProposeBuyout(client: ClientConnection, contractId: string): void {
    if (!client.playerId || this.state.phase !== 'settlement') return;
    if (this.state.currentBuyout) return; // One at a time

    const contract = this.state.activeContracts.find(c => c.id === contractId && c.mature);
    if (!contract) return;

    const buyoutCost = this.state.settings.difficulty === 'unhinged' ? 2 : 1;

    const proposal: BuyoutProposal = {
      id: this.generateId(),
      contractId,
      proposerId: client.playerId,
      sipsCost: buyoutCost,
      votes: {},
    };

    this.state.currentBuyout = proposal;
    this.buyoutVotes = {};

    this.broadcast({ type: 'buyout-proposed', proposal });
    this.broadcastState();

    // Auto-resolve after 15s
    this.phaseTimer = setTimeout(() => {
      this.resolveBuyout();
    }, 15000);
  }

  private handleVoteBuyout(client: ClientConnection, approve: boolean): void {
    if (!client.playerId || !this.state.currentBuyout) return;

    this.buyoutVotes[client.playerId] = approve;

    // Check if all connected players have voted
    const connectedPlayers = this.state.players.filter(p => p.connected);
    const allVoted = connectedPlayers.every(p => this.buyoutVotes[p.id] !== undefined);

    if (allVoted) {
      if (this.phaseTimer) {
        clearTimeout(this.phaseTimer);
        this.phaseTimer = null;
      }
      this.resolveBuyout();
    }
  }

  private handleTriggerEvent(client: ClientConnection, eventType: string): void {
    if (!client.playerId) return;

    // Host reports that a behavior trap or event was triggered
    const activeContract = this.state.activeContracts.find(
      c => !c.settled && c.signedBy
    );

    if (activeContract) {
      const event: ActionEvent = {
        type: 'audit',
        contractId: activeContract.id,
      };
      this.state.pendingEvents.push(event);
      this.broadcast({ type: 'event', event });
    }
  }

  private handleDuelResult(client: ClientConnection, contractId: string, loserId: string): void {
    if (!client.isHost) return;

    const contract = this.state.activeContracts.find(c => c.id === contractId);
    if (!contract) return;

    // Apply duel result - loser drinks
    const loser = this.findPlayer(loserId);
    if (loser) {
      const sips = Math.min(contract.baseSips, this.state.settings.maxSipsPerSettlement);
      loser.sips += sips;
      loser.tabContribution += sips;
      this.state.tab += sips;
    }

    contract.settled = true;
    this.broadcastState();
  }

  private handleNopeContract(client: ClientConnection, contractId: string): void {
    // Safety feature: replace a contract that someone doesn't want to see
    const idx = this.state.availableContracts.findIndex(c => c.id === contractId);
    if (idx === -1) return;

    this.usedContractIds.push(contractId);
    const newTemplates = getBalancedContracts(1, this.usedContractIds);
    if (newTemplates.length > 0) {
      const template = newTemplates[0];
      this.usedContractIds.push(template.id);
      this.state.availableContracts[idx] = this.createActiveContract(template);
    } else {
      this.state.availableContracts.splice(idx, 1);
    }

    this.broadcastState();
  }

  private handlePause(client: ClientConnection): void {
    this.paused = true;
    this.clearTimers();
    this.broadcast({ type: 'paused' });
  }

  private handleResume(client: ClientConnection): void {
    if (!client.isHost) return;
    this.paused = false;
    this.broadcast({ type: 'resumed' });

    // Resume the current phase
    if (this.state.phase === 'action' && this.state.roundTimerEnd) {
      const remaining = this.state.roundTimerEnd - Date.now();
      if (remaining > 0) {
        this.startActionTimer(remaining);
      } else {
        this.endActionPhase();
      }
    }
  }

  private handleEndGame(client: ClientConnection): void {
    if (!client.isHost) {
      this.send(client.ws, { type: 'error', message: 'Only host can end game' });
      return;
    }

    this.clearTimers();
    this.calculateGameResults();
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    if (client.isHost) {
      this.state.hostConnected = false;
      console.log('[ContractsServer] Host disconnected');
    }

    if (client.playerId) {
      const player = this.findPlayer(client.playerId);
      if (player) {
        player.connected = false;
        console.log(`[ContractsServer] Player disconnected: ${player.name}`);
        this.broadcast({ type: 'player-left', playerId: client.playerId });
      }
    }

    this.clients.delete(ws);
    this.broadcastState();
  }

  // ========== GAME FLOW ==========

  private startNextRound(): void {
    this.state.currentRound++;
    console.log(`[ContractsServer] Starting round ${this.state.currentRound}`);

    // Check if game should end
    if (this.state.currentRound > this.state.settings.roundCount) {
      this.calculateGameResults();
      return;
    }

    // Check if it's the last round → use endgame contracts
    const isEndgame = this.state.currentRound === this.state.settings.roundCount;

    // Grow active contracts
    for (const contract of this.state.activeContracts) {
      if (!contract.settled && !contract.mature) {
        contract.growthSips++;
      }
    }

    this.startOfferPhase(isEndgame);
  }

  private startOfferPhase(isEndgame: boolean): void {
    this.state.phase = 'offer';
    this.state.roundResults = null;
    this.state.currentBuyout = null;

    // Generate contracts for this round
    const count = this.state.settings.contractsPerRound;
    let templates: ContractTemplate[];

    if (isEndgame) {
      // Use endgame category
      const endgameContracts = getContractsByCategory('endgame');
      const available = endgameContracts.filter(
        (c: ContractTemplate) => !this.usedContractIds.includes(c.id)
      );
      templates = available.sort(() => Math.random() - 0.5).slice(0, count);
    } else {
      templates = getBalancedContracts(count, this.usedContractIds);
    }

    this.state.availableContracts = templates.map(t => {
      this.usedContractIds.push(t.id);
      return this.createActiveContract(t);
    });

    this.broadcastState();

    // Auto-advance to action phase after 30s
    this.phaseTimer = setTimeout(() => {
      this.startActionPhase();
    }, 30000);
  }

  private startActionPhase(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    this.state.phase = 'action';

    // Move signed contracts to active
    for (const contract of this.state.availableContracts) {
      if (contract.signedBy) {
        this.state.activeContracts.push(contract);
      }
    }
    this.state.availableContracts = [];

    // Start round timer
    const duration = this.state.settings.roundTimerSeconds * 1000;
    this.state.roundTimerEnd = Date.now() + duration;

    this.broadcastState();
    this.startActionTimer(duration);

    // Schedule random events during action phase
    this.scheduleActionEvents(duration);
  }

  private startActionTimer(duration: number): void {
    this.roundTimer = setTimeout(() => {
      this.endActionPhase();
    }, duration);
  }

  private scheduleActionEvents(duration: number): void {
    // Fire 1-3 random events during the action phase
    const eventCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < eventCount; i++) {
      const delay = Math.random() * (duration - 5000) + 2000; // Between 2s and 5s before end
      setTimeout(() => {
        if (this.state.phase === 'action' && !this.paused) {
          this.fireRandomEvent();
        }
      }, delay);
    }
  }

  private fireRandomEvent(): void {
    const unsettledContracts = this.state.activeContracts.filter(c => !c.settled && c.signedBy);
    if (unsettledContracts.length === 0) return;

    const contract = unsettledContracts[Math.floor(Math.random() * unsettledContracts.length)];
    const eventTypes: ActionEvent['type'][] = ['audit', 'fine-print', 'market-shift'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let event: ActionEvent;

    switch (eventType) {
      case 'audit':
        // Reveal hidden clause
        contract.hiddenRevealed = true;
        event = { type: 'audit', contractId: contract.id };

        // Track audit for player stats
        if (contract.signedBy) {
          const signer = this.findPlayer(contract.signedBy);
          if (signer) signer.auditsTriggered++;
        }
        break;
      case 'fine-print':
        event = {
          type: 'fine-print',
          contractId: contract.id,
          twist: this.getRandomTwist(),
        };
        break;
      case 'market-shift':
        // Double payout on this contract
        contract.growthSips += contract.baseSips;
        event = { type: 'market-shift', contractId: contract.id };
        break;
      default:
        return;
    }

    this.state.pendingEvents.push(event);
    this.broadcast({ type: 'event', event });
    this.broadcastState();
  }

  private getRandomTwist(): string {
    const twists = [
      '...but only if said while standing',
      '...and the signer must explain why',
      '...unless someone objects within 5 seconds',
      '...but doubles if it happens again',
      '...and everyone must acknowledge it',
    ];
    return twists[Math.floor(Math.random() * twists.length)];
  }

  private endActionPhase(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    this.state.roundTimerEnd = null;
    this.state.pendingEvents = [];
    this.startSettlementPhase();
  }

  private startSettlementPhase(): void {
    this.state.phase = 'settlement';

    // Mark random contracts as mature
    const unsettled = this.state.activeContracts.filter(c => !c.settled && !c.mature && c.signedBy);
    const matureCount = Math.min(this.state.settings.maturePerRound, unsettled.length);

    const toMature = [...unsettled].sort(() => Math.random() - 0.5).slice(0, matureCount);
    for (const contract of toMature) {
      contract.mature = true;
    }

    this.broadcastState();

    // Wait for buyout proposals, then settle after 20s
    this.phaseTimer = setTimeout(() => {
      this.settleContracts();
    }, 20000);
  }

  private resolveBuyout(): void {
    if (!this.state.currentBuyout) return;

    const approveCount = Object.values(this.buyoutVotes).filter(v => v).length;
    const totalVotes = Object.values(this.buyoutVotes).length;
    const approved = approveCount > totalVotes / 2;

    const proposal = this.state.currentBuyout;

    if (approved) {
      // Proposer drinks the buyout cost
      const proposer = this.findPlayer(proposal.proposerId);
      if (proposer) {
        proposer.sips += proposal.sipsCost;
        proposer.buyouts++;
        proposer.tabContribution += proposal.sipsCost;
        this.state.tab += proposal.sipsCost;
      }

      // Remove the contract
      const contract = this.state.activeContracts.find(c => c.id === proposal.contractId);
      if (contract) {
        contract.settled = true;
        this.state.settledContracts.push(contract);
        this.state.activeContracts = this.state.activeContracts.filter(
          c => c.id !== proposal.contractId
        );
      }
    }

    this.state.currentBuyout = null;
    this.buyoutVotes = {};

    this.broadcast({
      type: 'buyout-result',
      approved,
      contractId: proposal.contractId,
    });
    this.broadcastState();
  }

  private settleContracts(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    // Resolve any pending buyout
    if (this.state.currentBuyout) {
      this.resolveBuyout();
    }

    const maturedContracts = this.state.activeContracts.filter(c => c.mature && !c.settled);
    const drinks: ContractsDrinkAssignment[] = [];
    let tabChange = 0;

    for (const contract of maturedContracts) {
      // Reveal hidden clause at settlement
      contract.hiddenRevealed = true;

      const totalSips = contract.baseSips + contract.growthSips +
        (contract.hiddenRevealed ? contract.hiddenSips : 0);
      const cappedSips = Math.min(totalSips, this.state.settings.maxSipsPerSettlement);

      // Determine who pays
      if (contract.signedBy) {
        const targetId = contract.targetPlayerId || contract.signedBy;
        const player = this.findPlayer(targetId);
        if (player) {
          // Check for hedge token usage (already decremented)
          const finalSips = Math.max(0, cappedSips);
          player.sips += finalSips;
          player.tabContribution += finalSips;
          tabChange += finalSips;

          drinks.push({
            playerId: targetId,
            sips: finalSips,
            shots: 0,
            reason: contract.visibleText,
            contractId: contract.id,
          });
        }
      }

      contract.settled = true;
      this.state.settledContracts.push(contract);
    }

    // Remove settled contracts from active
    this.state.activeContracts = this.state.activeContracts.filter(c => !c.settled);

    // Update tab
    this.state.tab += tabChange;

    // Check milestones
    const triggeredMilestones = this.checkMilestones();

    // Build round result
    const roundResult: RoundResult = {
      round: this.state.currentRound,
      maturedContracts,
      drinks,
      tabChange,
      milestonesTriggered: triggeredMilestones,
    };

    this.state.phase = 'result';
    this.state.roundResults = roundResult;

    this.broadcast({ type: 'round-result', result: roundResult });

    for (const milestone of triggeredMilestones) {
      this.broadcast({ type: 'milestone-triggered', milestone });
      this.applyMilestoneEffect(milestone);
    }

    this.broadcastState();

    // Start next round after showing results
    this.phaseTimer = setTimeout(() => {
      this.startNextRound();
    }, 8000);
  }

  private checkMilestones(): TabMilestone[] {
    const triggered: TabMilestone[] = [];

    for (const milestone of this.state.milestones) {
      if (!milestone.triggered && this.state.tab >= milestone.threshold) {
        milestone.triggered = true;
        triggered.push(milestone);
      }
    }

    return triggered;
  }

  private applyMilestoneEffect(milestone: TabMilestone): void {
    switch (milestone.effect) {
      case 'toast': {
        // Everyone drinks 1
        for (const player of this.state.players.filter(p => p.connected)) {
          player.sips += 1;
        }
        break;
      }
      case 'silence': {
        // Tracked by host - first to speak drinks 2
        // This is a visual cue on the host screen
        break;
      }
      case 'merger': {
        // Two random players become a team - visual cue
        break;
      }
      case 'takeover': {
        // Lowest Tab contributor assigns 2 sips
        const sorted = [...this.state.players]
          .filter(p => p.connected)
          .sort((a, b) => a.tabContribution - b.tabContribution);
        // This is handled via UI - lowest contributor gets to assign
        break;
      }
    }
  }

  private calculateGameResults(): void {
    this.clearTimers();

    const connectedPlayers = this.state.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      this.state.phase = 'lobby';
      this.broadcastState();
      return;
    }

    // Top Investor: Paid least into Tab
    const topInvestor = [...connectedPlayers].sort(
      (a, b) => a.tabContribution - b.tabContribution
    )[0];

    // Bailout King: Most buyouts
    const bailoutKing = [...connectedPlayers].sort(
      (a, b) => b.buyouts - a.buyouts
    )[0];

    // Chaos Auditor: Most audits triggered
    const chaosAuditor = [...connectedPlayers].sort(
      (a, b) => b.auditsTriggered - a.auditsTriggered
    )[0];

    const results: GameResults = {
      topInvestor: topInvestor.id,
      bailoutKing: bailoutKing.id,
      chaosAuditor: chaosAuditor.id,
      finalTab: this.state.tab,
      rounds: this.state.currentRound,
    };

    this.state.phase = 'endgame';
    this.state.gameResults = results;

    this.broadcast({ type: 'game-end', results });
    this.broadcastState();
  }

  // ========== HELPERS ==========

  private createActiveContract(template: ContractTemplate): ActiveContract {
    // Look up hidden sips from template
    const hiddenSips = template.hiddenSips;
    return {
      id: this.generateId(),
      templateId: template.id,
      visibleText: template.visibleText,
      hiddenClause: template.hiddenClause,
      hiddenRevealed: false,
      signedBy: null,
      witnessedBy: [],
      roundCreated: this.state.currentRound,
      growthSips: 0,
      mature: false,
      settled: false,
      baseSips: template.baseSips,
      hiddenSips,
    };
  }

  private findPlayer(playerId: string): ContractsPlayer | undefined {
    return this.state.players.find(p => p.id === playerId);
  }

  private clearTimers(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
      this.eventTimer = null;
    }
  }

  private send(ws: WebSocket, message: ContractsServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ContractsServerMessage): void {
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
