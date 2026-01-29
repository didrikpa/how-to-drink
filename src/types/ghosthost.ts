// Ghost Host game types

export type GhostHostPhase = 'lobby' | 'playing' | 'voting' | 'result';

export interface GhostHostPlayer {
  id: string;
  name: string;
  photo: string;
  connected: boolean;
}

export interface GhostHostSettings {
  gameDurationSeconds: number; // Default 600 (10 minutes)
  hauntCooldownSeconds: number; // Default 30
  votingDurationSeconds: number; // Default 60
}

export const DEFAULT_GHOSTHOST_SETTINGS: GhostHostSettings = {
  gameDurationSeconds: 600,
  hauntCooldownSeconds: 30,
  votingDurationSeconds: 60,
};

export interface GhostHostGameState {
  phase: GhostHostPhase;
  players: GhostHostPlayer[];
  settings: GhostHostSettings;
  gameTimerEnd: number | null; // Unix timestamp when game ends
  votingTimerEnd: number | null; // Unix timestamp when voting ends
  globalRules: string[];
  hauntCount: number;
  votes: Record<string, string>; // voterId -> votedForId
  votingResult: VotingResult | null;
  hostConnected: boolean;
}

export interface VotingResult {
  ghostId: string;
  ghostName: string;
  ghostPhoto: string;
  correctGuess: boolean;
  voteCounts: Record<string, number>; // playerId -> vote count
}

// Private state sent only to individual players
export type GhostPrivateState = {
  role: 'ghost';
  currentMission: Mission;
  completedMissionIds: string[];
};

export type MortalPrivateState = {
  role: 'mortal';
};

export type PrivateState = GhostPrivateState | MortalPrivateState;

export interface Mission {
  id: string;
  category: 'physical' | 'conversation' | 'reaction';
  text: string;
}

// WebSocket message types

export type GhostHostClientMessage =
  | { type: 'join'; name: string; photo: string }
  | { type: 'host-connect' }
  | { type: 'start-game'; settings?: Partial<GhostHostSettings> }
  | { type: 'haunt' }
  | { type: 'vote'; targetId: string }
  | { type: 'end-game' };

export type GhostHostServerMessage =
  | { type: 'state'; state: GhostHostGameState }
  | { type: 'private-state'; privateState: PrivateState }
  | { type: 'assigned-id'; playerId: string }
  | { type: 'player-joined'; player: GhostHostPlayer }
  | { type: 'player-left'; playerId: string }
  | { type: 'haunt-triggered' }
  | { type: 'new-mission'; mission: Mission }
  | { type: 'voting-started' }
  | { type: 'voting-result'; result: VotingResult }
  | { type: 'error'; message: string };
