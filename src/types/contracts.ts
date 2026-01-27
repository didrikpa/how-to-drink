// Contracts Game Mode Types

export type GameModeType = 'drinking-school' | 'contracts';

export type ContractsDifficulty = 'chill' | 'unhinged';

export interface ContractsSettings {
  difficulty: ContractsDifficulty;
  roundCount: number;
  roundTimerSeconds: number;
  contractsPerRound: number;
  maturePerRound: number;
  maxSipsPerSettlement: number;
}

export const DEFAULT_CONTRACTS_SETTINGS: ContractsSettings = {
  difficulty: 'chill',
  roundCount: 10,
  roundTimerSeconds: 90,
  contractsPerRound: 3,
  maturePerRound: 2,
  maxSipsPerSettlement: 3,
};

export interface PlayerTokens {
  lawyer: number;    // Cancel or rewrite one clause
  hedge: number;     // Reduce own penalty by 1
  sabotage: number;  // Flip "who pays" at settlement (once per game)
}

export const DEFAULT_TOKENS: PlayerTokens = {
  lawyer: 2,
  hedge: 1,
  sabotage: 1,
};

export interface ContractsPlayer {
  id: string;
  name: string;
  photo: string;
  sips: number;
  shots: number;
  tokens: PlayerTokens;
  tabContribution: number;  // How much they've paid into the Tab
  contractsSigned: number;
  buyouts: number;
  auditsTriggered: number;
  connected: boolean;
}

export type ContractCategory =
  | 'behavior-trap'
  | 'prediction'
  | 'duel'
  | 'social'
  | 'market'
  | 'wild-card'
  | 'endgame';

export interface ContractTemplate {
  id: string;
  category: ContractCategory;
  visibleText: string;
  hiddenClause: string;
  baseSips: number;
  hiddenSips: number;  // Additional sips from hidden clause
  targetType: 'trigger' | 'signer' | 'specific' | 'everyone' | 'duel';
  triggerWord?: string;  // For behavior traps
  duelType?: string;     // For duels
}

export interface ActiveContract {
  id: string;
  templateId: string;
  visibleText: string;
  hiddenClause: string;
  hiddenRevealed: boolean;
  signedBy: string | null;      // Player ID who signed
  witnessedBy: string[];        // Player IDs who witnessed
  roundCreated: number;
  growthSips: number;           // Extra sips from market growth
  mature: boolean;              // Ready to settle
  settled: boolean;
  baseSips: number;             // Base sips from template
  hiddenSips: number;           // Additional sips from hidden clause
  targetPlayerId?: string;      // For duels or specific targets
  secondPlayerId?: string;      // For duels
}

export type ContractsPhase =
  | 'lobby'
  | 'offer'       // Players sign contracts
  | 'action'      // Timer running, events fire
  | 'settlement'  // Contracts mature and pay out
  | 'buyout'      // Buyout proposals
  | 'result'      // Show round results
  | 'endgame';    // Final round

export type ActionEvent =
  | { type: 'audit'; contractId: string }
  | { type: 'fine-print'; contractId: string; twist: string }
  | { type: 'market-shift'; contractId: string }
  | { type: 'whistleblower'; playerId: string; contractId: string };

export interface TabMilestone {
  threshold: number;
  name: string;
  description: string;
  effect: 'toast' | 'silence' | 'merger' | 'takeover' | 'custom';
  triggered: boolean;
}

export const TAB_MILESTONES_CHILL: TabMilestone[] = [
  { threshold: 10, name: 'Toast Round', description: 'Everyone sips together', effect: 'toast', triggered: false },
  { threshold: 20, name: 'Silent Minute', description: 'First to speak drinks 2', effect: 'silence', triggered: false },
  { threshold: 30, name: 'The Merger', description: 'Two players become a team for 2 rounds', effect: 'merger', triggered: false },
];

export const TAB_MILESTONES_UNHINGED: TabMilestone[] = [
  { threshold: 7, name: 'Toast Round', description: 'Everyone sips together', effect: 'toast', triggered: false },
  { threshold: 14, name: 'Silent Minute', description: 'First to speak drinks 2', effect: 'silence', triggered: false },
  { threshold: 21, name: 'The Merger', description: 'Two players become a team for 2 rounds', effect: 'merger', triggered: false },
  { threshold: 28, name: 'Hostile Takeover', description: 'Lowest Tab contributor assigns 2 sips', effect: 'takeover', triggered: false },
];

export interface BuyoutProposal {
  id: string;
  contractId: string;
  proposerId: string;
  sipsCost: number;
  votes: Record<string, boolean>;  // playerId -> approve
}

export interface ContractsGameState {
  phase: ContractsPhase;
  players: ContractsPlayer[];
  settings: ContractsSettings;
  currentRound: number;
  tab: number;
  milestones: TabMilestone[];

  // Contract pools
  availableContracts: ActiveContract[];  // Contracts available to sign this round
  activeContracts: ActiveContract[];     // Signed contracts in play
  settledContracts: ActiveContract[];    // History of settled contracts

  // Round state
  roundTimerEnd: number | null;
  pendingEvents: ActionEvent[];
  currentBuyout: BuyoutProposal | null;

  // Results
  roundResults: RoundResult | null;
  gameResults: GameResults | null;

  hostConnected: boolean;
}

export interface RoundResult {
  round: number;
  maturedContracts: ActiveContract[];
  drinks: ContractsDrinkAssignment[];
  tabChange: number;
  milestonesTriggered: TabMilestone[];
}

export interface ContractsDrinkAssignment {
  playerId: string;
  sips: number;
  shots: number;
  reason: string;
  contractId?: string;
}

export interface GameResults {
  topInvestor: string;       // Paid least into Tab
  bailoutKing: string;       // Most buyouts
  chaosAuditor: string;      // Most audits triggered
  finalTab: number;
  rounds: number;
}

// WebSocket message types for Contracts mode

export type ContractsClientMessage =
  | { type: 'join'; name: string; photo: string }
  | { type: 'host-connect' }
  | { type: 'start-game'; settings: ContractsSettings }
  | { type: 'sign-contract'; contractId: string }
  | { type: 'witness-contract'; contractId: string }
  | { type: 'use-token'; token: keyof PlayerTokens; targetContractId?: string; targetPlayerId?: string }
  | { type: 'propose-buyout'; contractId: string }
  | { type: 'vote-buyout'; approve: boolean }
  | { type: 'trigger-event'; eventType: string }  // For behavior traps
  | { type: 'report-duel-result'; contractId: string; loserId: string }
  | { type: 'nope-contract'; contractId: string }  // Safety: replace this contract
  | { type: 'pause-game' }
  | { type: 'resume-game' }
  | { type: 'end-game' };

export type ContractsServerMessage =
  | { type: 'state'; state: ContractsGameState }
  | { type: 'player-joined'; player: ContractsPlayer }
  | { type: 'player-left'; playerId: string }
  | { type: 'contract-signed'; contractId: string; playerId: string }
  | { type: 'event'; event: ActionEvent }
  | { type: 'buyout-proposed'; proposal: BuyoutProposal }
  | { type: 'buyout-result'; approved: boolean; contractId: string }
  | { type: 'round-result'; result: RoundResult }
  | { type: 'milestone-triggered'; milestone: TabMilestone }
  | { type: 'game-end'; results: GameResults }
  | { type: 'error'; message: string }
  | { type: 'assigned-id'; playerId: string }
  | { type: 'paused' }
  | { type: 'resumed' };
