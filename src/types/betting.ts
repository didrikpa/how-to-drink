export interface BettingPlayer {
  id: string;
  name: string;
  photo: string;
  connected: boolean;
  pendingDrinks: number; // drinks owed but not yet drunk
  totalDrinks: number;   // lifetime drinks assigned
}

export type BettingPhase =
  | 'lobby'
  | 'betting'
  | 'racing'
  | 'distribution'
  | 'results';

export interface Bet {
  racerId: number;
  amount: number;
  type: 'sip' | 'shot';
}

export interface RacerState {
  id: number;
  position: number;  // 0-100
  color: string;
  name: string;
}

export interface BettingSettings {
  numRacers: number;
  betTimerSeconds: number;
  distributionTimerSeconds: number;
}

export interface DrinkToGive {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  type: 'sip' | 'shot';
}

export interface BettingGameState {
  phase: BettingPhase;
  players: BettingPlayer[];
  settings: BettingSettings;
  racers: RacerState[];
  bets: Record<string, Bet[]>; // playerId -> bets
  winningRacer: number | null;
  roundNumber: number;
  phaseEndTime: number | null;
  hostConnected: boolean;
  // Distribution tracking
  winnerDrinksToGive: Record<string, number>; // playerId -> drinks they can distribute
  drinkAssignments: DrinkToGive[];            // drinks assigned this round
}

// Racer names and colors
export const RACER_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#9b59b6', // purple
  '#e67e22', // orange
  '#1abc9c', // teal
  '#e91e63', // pink
];

export const RACER_NAMES = [
  'Red Rocket',
  'Blue Blitz',
  'Gold Rush',
  'Green Machine',
  'Purple Haze',
  'Orange Crush',
  'Teal Thunder',
  'Pink Panther',
];

// WebSocket message types

export type BettingClientMessage =
  | { type: 'host-connect' }
  | { type: 'join'; name: string; photo: string }
  | { type: 'start-betting' }
  | { type: 'place-bet'; bet: Bet }
  | { type: 'lock-bets' }
  | { type: 'give-drink'; toPlayerId: string; amount: number; drinkType: 'sip' | 'shot' }
  | { type: 'next-round' }
  | { type: 'end-game' }
  | { type: 'kick-player'; playerId: string }
  | { type: 'update-settings'; settings: Partial<BettingSettings> };

export type BettingServerMessage =
  | { type: 'state'; state: BettingGameState }
  | { type: 'assigned-id'; playerId: string }
  | { type: 'player-joined'; player: BettingPlayer }
  | { type: 'player-left'; playerId: string }
  | { type: 'betting-started'; endTime: number }
  | { type: 'bet-placed'; playerId: string; racerId: number }
  | { type: 'race-started' }
  | { type: 'race-update'; racers: RacerState[] }
  | { type: 'race-finished'; winningRacer: number }
  | { type: 'distribution-started'; endTime: number }
  | { type: 'drink-given'; drink: DrinkToGive }
  | { type: 'round-results'; drinkAssignments: DrinkToGive[] }
  | { type: 'error'; message: string };

export const DEFAULT_BETTING_SETTINGS: BettingSettings = {
  numRacers: 4,
  betTimerSeconds: 30,
  distributionTimerSeconds: 30,
};
