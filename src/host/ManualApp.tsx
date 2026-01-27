import { useState, useEffect, useCallback } from 'react';
import type {
  ManualDifficulty,
  DrinkUnit,
  ManualGameState,
  ManualHistoryEntry,
  ManualUndoEntry,
} from '../types/manual';
import { MANUAL_RULES } from '../game/manual/rules';
import { weightedDraw, substitutePlaceholders } from '../game/manual/draw';

const STORAGE_KEY = 'mode.drinkingManual.v1';

export function ManualApp() {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [difficulty, setDifficulty] = useState<ManualDifficulty>('basic');
  const [drinkUnit, setDrinkUnit] = useState<DrinkUnit>('sip');
  const [vetoEnabled, setVetoEnabled] = useState(true);
  const [noRepeatWindow, setNoRepeatWindow] = useState(5);

  // Game state
  const [gameState, setGameState] = useState<ManualGameState | null>(null);
  const [paused, setPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.gameState) {
          setGameState(data.gameState);
          const s = data.gameState.settings;
          setPlayerNames(s.players);
          setDifficulty(s.difficulty);
          setDrinkUnit(s.drinkUnit);
          setVetoEnabled(s.vetoEnabled);
          setNoRepeatWindow(s.noRepeatWindow);
        }
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  // Save game state on change
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState }));
    }
  }, [gameState]);

  const validPlayers = playerNames.filter(n => n.trim());

  const startGame = useCallback(() => {
    const players = playerNames.filter(n => n.trim()).map(n => n.trim());
    if (players.length < 3) return;

    const settings = { players, difficulty, drinkUnit, vetoEnabled, noRepeatWindow };
    const state: ManualGameState = {
      settings,
      currentPlayerIndex: players.length - 1, // wraps to 0 on first NEXT
      currentRule: null,
      history: [],
      noRepeatQueue: [],
      vetoTokens: players.map(() => vetoEnabled ? 1 : 0),
      undoStack: [],
      turnCount: 0,
    };
    setGameState(state);
  }, [playerNames, difficulty, drinkUnit, vetoEnabled, noRepeatWindow]);

  const nextRule = useCallback(() => {
    if (!gameState) return;

    const { settings } = gameState;
    const playerCount = settings.players.length;

    // Save undo state
    const undoEntry: ManualUndoEntry = {
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentRule: gameState.currentRule,
      history: [...gameState.history],
      noRepeatQueue: [...gameState.noRepeatQueue],
      vetoTokens: [...gameState.vetoTokens],
      turnCount: gameState.turnCount,
    };

    // Advance player
    const newPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;

    // Draw rule
    const rule = weightedDraw(MANUAL_RULES, settings.difficulty, gameState.noRepeatQueue);

    // Update no-repeat queue
    const newQueue = [...gameState.noRepeatQueue, rule.id];
    if (newQueue.length > settings.noRepeatWindow) {
      newQueue.shift();
    }

    // Update history
    const historyEntry: ManualHistoryEntry = {
      ruleId: rule.id,
      ruleTitle: rule.title,
      playerName: settings.players[newPlayerIndex],
    };

    setGameState({
      ...gameState,
      currentPlayerIndex: newPlayerIndex,
      currentRule: rule,
      history: [...gameState.history, historyEntry],
      noRepeatQueue: newQueue,
      undoStack: [...gameState.undoStack, undoEntry],
      turnCount: gameState.turnCount + 1,
    });
  }, [gameState]);

  const undo = useCallback(() => {
    if (!gameState || gameState.undoStack.length === 0) return;

    const prev = gameState.undoStack[gameState.undoStack.length - 1];
    setGameState({
      ...gameState,
      currentPlayerIndex: prev.currentPlayerIndex,
      currentRule: prev.currentRule,
      history: prev.history,
      noRepeatQueue: prev.noRepeatQueue,
      vetoTokens: prev.vetoTokens,
      turnCount: prev.turnCount,
      undoStack: gameState.undoStack.slice(0, -1),
    });
  }, [gameState]);

  const veto = useCallback(() => {
    if (!gameState || !gameState.currentRule) return;
    if (gameState.currentRule.category !== 'EXAM') return;
    if (gameState.vetoTokens[gameState.currentPlayerIndex] <= 0) return;

    // Decrement veto
    const newVetoTokens = [...gameState.vetoTokens];
    newVetoTokens[gameState.currentPlayerIndex]--;

    // Redraw excluding current rule
    const extendedQueue = [...gameState.noRepeatQueue, gameState.currentRule.id];
    const newRule = weightedDraw(MANUAL_RULES, gameState.settings.difficulty, extendedQueue);

    // Update queue: replace last entry with new rule
    const newQueue = [...gameState.noRepeatQueue];
    if (newQueue.length > 0 && newQueue[newQueue.length - 1] === gameState.currentRule.id) {
      newQueue[newQueue.length - 1] = newRule.id;
    } else {
      newQueue.push(newRule.id);
      if (newQueue.length > gameState.settings.noRepeatWindow) {
        newQueue.shift();
      }
    }

    // Update history: mark last as vetoed, add new
    const newHistory = [...gameState.history];
    if (newHistory.length > 0) {
      newHistory[newHistory.length - 1] = {
        ...newHistory[newHistory.length - 1],
        vetoed: true,
      };
    }
    newHistory.push({
      ruleId: newRule.id,
      ruleTitle: newRule.title,
      playerName: gameState.settings.players[gameState.currentPlayerIndex],
    });

    setGameState({
      ...gameState,
      currentRule: newRule,
      vetoTokens: newVetoTokens,
      noRepeatQueue: newQueue,
      history: newHistory,
    });
  }, [gameState]);

  const restartMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(null);
    setPaused(false);
    setShowHistory(false);
  }, []);

  // --- SETUP SCREEN ---
  if (!gameState) {
    return (
      <div className="host-app">
        <header className="host-header">
          <h1>HOW TO DRINK</h1>
          <p className="subtitle">DRINKING MANUAL</p>
        </header>

        <div className="dm-setup">
          <button className="back-btn" onClick={() => { window.location.href = '/'; }}>
            BACK TO MENU
          </button>

          <p className="dm-tagline">Follow the instructions.</p>

          <div className="dm-section">
            <h2>PLAYERS ({validPlayers.length})</h2>
            {playerNames.map((name, i) => (
              <div key={i} className="dm-player-row">
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={(e) => {
                    const updated = [...playerNames];
                    updated[i] = e.target.value;
                    setPlayerNames(updated);
                  }}
                  maxLength={20}
                  className="dm-player-input"
                />
                {playerNames.length > 3 && (
                  <button
                    className="dm-remove-btn"
                    onClick={() => setPlayerNames(playerNames.filter((_, j) => j !== i))}
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            {playerNames.length < 12 && (
              <button
                className="dm-add-btn"
                onClick={() => setPlayerNames([...playerNames, ''])}
              >
                + ADD PLAYER
              </button>
            )}
          </div>

          <div className="dm-section">
            <h2>DIFFICULTY</h2>
            <div className="dm-toggle-group">
              <button
                className={`dm-toggle-btn ${difficulty === 'basic' ? 'active' : ''}`}
                onClick={() => setDifficulty('basic')}
              >
                BASIC TRAINING
              </button>
              <button
                className={`dm-toggle-btn ${difficulty === 'field' ? 'active' : ''}`}
                onClick={() => setDifficulty('field')}
              >
                FIELD TRAINING
              </button>
              <button
                className={`dm-toggle-btn ${difficulty === 'final' ? 'active' : ''}`}
                onClick={() => setDifficulty('final')}
              >
                FINAL ASSESSMENT
              </button>
            </div>
          </div>

          <div className="dm-section">
            <h2>DRINK UNIT</h2>
            <div className="dm-toggle-group">
              <button
                className={`dm-toggle-btn ${drinkUnit === 'sip' ? 'active' : ''}`}
                onClick={() => setDrinkUnit('sip')}
              >
                SIP MODE
              </button>
              <button
                className={`dm-toggle-btn ${drinkUnit === 'shot' ? 'active' : ''}`}
                onClick={() => setDrinkUnit('shot')}
              >
                SHOT MODE
              </button>
            </div>
          </div>

          <div className="dm-section">
            <h2>OPTIONS</h2>
            <label className="dm-checkbox">
              <input
                type="checkbox"
                checked={vetoEnabled}
                onChange={(e) => setVetoEnabled(e.target.checked)}
              />
              Veto Token (recommended)
            </label>
            <div className="dm-option-row">
              <label>No-repeat window:</label>
              <input
                type="number"
                value={noRepeatWindow}
                min={1}
                max={20}
                onChange={(e) => setNoRepeatWindow(parseInt(e.target.value) || 5)}
                className="dm-number-input"
              />
            </div>
          </div>

          {validPlayers.length >= 3 ? (
            <button className="start-btn" onClick={startGame}>
              START
            </button>
          ) : (
            <p className="waiting-msg">Need at least 3 players...</p>
          )}
        </div>
      </div>
    );
  }

  // --- PLAY SCREEN ---
  const { settings, currentRule, currentPlayerIndex, turnCount } = gameState;
  const currentPlayer = settings.players[currentPlayerIndex];
  const nextPlayerIndex = (currentPlayerIndex + 1) % settings.players.length;
  const nextPlayer = settings.players[nextPlayerIndex];
  const sub = (text: string) => substitutePlaceholders(text, settings.drinkUnit);

  const vetoEligible =
    settings.vetoEnabled &&
    currentRule?.category === 'EXAM' &&
    gameState.vetoTokens[currentPlayerIndex] > 0;

  const currentVetoCount = gameState.vetoTokens[currentPlayerIndex];
  const recentHistory = gameState.history.slice(-10).reverse();

  return (
    <div className="host-app">
      <header className="host-header">
        <h1>DRINKING MANUAL</h1>
        <p className="dm-turn-count">Turn {turnCount}</p>
      </header>

      <div className="dm-play">
        {/* Player banner */}
        <div className="dm-player-banner">
          <span className="dm-current-player">{currentPlayer}</span>
          <span className="dm-next-player">Next: {nextPlayer}</span>
        </div>

        {/* Rule card */}
        {currentRule ? (
          <div className={`dm-card dm-cat-${currentRule.category.toLowerCase()}`}>
            <div className="dm-card-header">
              <span className="dm-card-badge">Rule #{currentRule.id}</span>
              <span className="dm-card-category">{currentRule.category}</span>
            </div>
            <h2 className="dm-card-title">{currentRule.title}</h2>
            <p className="dm-card-instruction">{sub(currentRule.instruction)}</p>
            <div className="dm-card-detail">
              <span className="dm-detail-label">FAILURE:</span>
              <span className="dm-detail-text">{sub(currentRule.failure)}</span>
            </div>
            <div className="dm-card-detail">
              <span className="dm-detail-label">PENALTY:</span>
              <span className="dm-detail-text">{sub(currentRule.penalty)}</span>
            </div>
          </div>
        ) : (
          <div className="dm-card dm-card-intro">
            <h2>READY?</h2>
            <p className="dm-card-instruction">
              Starting with: {settings.players[0]}
            </p>
            <p className="dm-intro-sub">Press NEXT RULE to begin</p>
          </div>
        )}

        {/* Veto button */}
        {vetoEligible && (
          <button className="dm-veto-btn" onClick={veto}>
            VETO ({currentVetoCount} left)
          </button>
        )}

        {/* Controls */}
        <div className="dm-controls">
          <button
            className="dm-undo-btn"
            onClick={undo}
            disabled={gameState.undoStack.length === 0}
          >
            UNDO
          </button>
          <button className="dm-pause-btn" onClick={() => setPaused(true)}>
            PAUSE
          </button>
          <button className="dm-next-btn" onClick={nextRule}>
            NEXT RULE
          </button>
        </div>

        {/* History toggle */}
        <button
          className="dm-history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'HIDE HISTORY' : 'HISTORY'}
        </button>

        {showHistory && recentHistory.length > 0 && (
          <div className="dm-history">
            {recentHistory.map((entry, i) => (
              <div key={i} className={`dm-history-row ${entry.vetoed ? 'dm-vetoed' : ''}`}>
                <span className="dm-history-id">#{entry.ruleId}</span>
                <span className="dm-history-title">{entry.ruleTitle}</span>
                <span className="dm-history-player">{entry.playerName}</span>
                {entry.vetoed && <span className="dm-history-veto">VETOED</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="dm-pause-overlay">
          <h2>PAUSED</h2>
          <button className="dm-resume-btn" onClick={() => setPaused(false)}>RESUME</button>
          <button className="dm-restart-btn" onClick={restartMode}>RESTART MODE</button>
          <button className="back-btn" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.href = '/'; }}>
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}
