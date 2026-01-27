export type ManualCategory = 'BASIC' | 'TECHNIQUE' | 'CONFIDENCE' | 'SOCIAL' | 'CORRECTION' | 'EXAM';
export type ManualDifficulty = 'basic' | 'field' | 'final';
export type DrinkUnit = 'sip' | 'shot';

export interface ManualRule {
  id: number;
  title: string;
  category: ManualCategory;
  instruction: string;
  failure: string;
  penalty: string;
  tags: string[];
  modeWeights: {
    basic: number;
    field: number;
    final: number;
  };
}

export interface ManualSettings {
  players: string[];
  difficulty: ManualDifficulty;
  drinkUnit: DrinkUnit;
  vetoEnabled: boolean;
  noRepeatWindow: number;
}

export interface ManualHistoryEntry {
  ruleId: number;
  ruleTitle: string;
  playerName: string;
  vetoed?: boolean;
}

export interface ManualGameState {
  settings: ManualSettings;
  currentPlayerIndex: number;
  currentRule: ManualRule | null;
  history: ManualHistoryEntry[];
  noRepeatQueue: number[];
  vetoTokens: number[];
  undoStack: ManualUndoEntry[];
  turnCount: number;
}

export interface ManualUndoEntry {
  currentPlayerIndex: number;
  currentRule: ManualRule | null;
  history: ManualHistoryEntry[];
  noRepeatQueue: number[];
  vetoTokens: number[];
  turnCount: number;
}
