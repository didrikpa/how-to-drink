export interface Player {
  id: string;
  name: string;
  photo: string; // base64 data URL
  sips: number;
  shots: number;
  connected: boolean;
}

export type GamePhase =
  | 'lobby'      // Waiting for players to join
  | 'countdown'  // Timer counting down to next event
  | 'challenge'  // Challenge in progress
  | 'result';    // Showing result before next countdown

export type ClassType =
  | 'pop-quiz'
  | 'social-studies'
  | 'physical-education'
  | 'drama-class'
  | 'detention'
  | 'recess';

export interface GameSettings {
  minTimerSeconds: number;
  maxTimerSeconds: number;
  enabledClasses: ClassType[];
}

export interface Challenge {
  id: string;
  classType: ClassType;
  title: string;
  description: string;
  targetPlayerIds: string[];   // Players involved in this challenge
  votingPlayerIds: string[];   // Players who vote (if applicable)
  timeLimit?: number;          // Seconds to complete/vote
  options?: string[];          // For multiple choice
  correctAnswer?: string;      // For quiz questions
}

export interface ChallengeResult {
  challengeId: string;
  drinks: DrinkAssignment[];
  votes?: Record<string, string>; // playerId -> vote
}

export interface DrinkAssignment {
  playerId: string;
  sips: number;
  shots: number;
  reason: string;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentChallenge: Challenge | null;
  lastResult: ChallengeResult | null;
  countdownTarget: number | null; // Unix timestamp when countdown ends
  hostConnected: boolean;
}

// WebSocket message types

export type ClientMessage =
  | { type: 'join'; name: string; photo: string }
  | { type: 'host-connect' }
  | { type: 'start-game' }
  | { type: 'vote'; challengeId: string; vote: string }
  | { type: 'answer'; challengeId: string; answer: string }
  | { type: 'pass-fail'; challengeId: string; passed: boolean }
  | { type: 'update-settings'; settings: Partial<GameSettings> }
  | { type: 'kick-player'; playerId: string }
  | { type: 'end-game' };

export type ServerMessage =
  | { type: 'state'; state: GameState }
  | { type: 'player-joined'; player: Player }
  | { type: 'player-left'; playerId: string }
  | { type: 'challenge-start'; challenge: Challenge }
  | { type: 'challenge-result'; result: ChallengeResult }
  | { type: 'countdown-start'; targetTime: number }
  | { type: 'error'; message: string }
  | { type: 'assigned-id'; playerId: string };

export const DEFAULT_SETTINGS: GameSettings = {
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
};
