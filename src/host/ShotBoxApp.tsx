import { useState, useEffect, useRef, useCallback } from 'react';

interface ShotBoxPlayer {
  name: string;
  shots: number;
}

interface ShotBoxState {
  players: ShotBoxPlayer[];
  minSeconds: number;
  maxSeconds: number;
}

const STORAGE_KEY = 'mode.shotBox.v1';

function playBuzzer() {
  try {
    const ctx = new AudioContext();
    // Short aggressive buzzer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 220;
    gain.gain.value = 0.4;
    osc.start();
    // Ramp frequency up for urgency
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch { /* audio not available */ }
}

export function ShotBoxApp() {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [minSeconds, setMinSeconds] = useState(10);
  const [maxSeconds, setMaxSeconds] = useState(60);

  // Game state
  const [gameState, setGameState] = useState<ShotBoxState | null>(null);
  const [phase, setPhase] = useState<'countdown' | 'reveal'>('countdown');
  const [timerEnd, setTimerEnd] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.gameState) {
          setGameState(data.gameState);
          setPhase('countdown');
          // Start a fresh timer on resume
          startTimer(data.gameState.minSeconds, data.gameState.maxSeconds);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save game state
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState }));
    }
  }, [gameState]);

  // Auto-advance from reveal to next round
  useEffect(() => {
    if (phase !== 'reveal') return;
    const timeout = setTimeout(() => {
      if (gameState) {
        startTimer(gameState.minSeconds, gameState.maxSeconds);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [phase, gameState]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'countdown' || paused || timerEnd === 0) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, timerEnd - now);
      setRemaining(left);

      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Pick random player
        if (gameState) {
          const idx = Math.floor(Math.random() * gameState.players.length);
          const player = gameState.players[idx];
          setSelectedPlayer(player.name);
          setPhase('reveal');
          playBuzzer();

          // Increment shot count
          const updated = {
            ...gameState,
            players: gameState.players.map((p, i) =>
              i === idx ? { ...p, shots: p.shots + 1 } : p
            ),
          };
          setGameState(updated);
        }
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, paused, timerEnd, gameState]);

  function startTimer(min: number, max: number) {
    const duration = (min + Math.random() * (max - min)) * 1000;
    setTimerEnd(Date.now() + duration);
    setRemaining(duration);
    setPhase('countdown');
    setSelectedPlayer(null);
  }

  const startGame = useCallback(() => {
    const players = playerNames
      .filter(n => n.trim())
      .map(n => ({ name: n.trim(), shots: 0 }));
    if (players.length < 2) return;

    const state: ShotBoxState = { players, minSeconds, maxSeconds };
    setGameState(state);
    startTimer(minSeconds, maxSeconds);
  }, [playerNames, minSeconds, maxSeconds]);

  const togglePause = useCallback(() => {
    if (phase !== 'countdown') return;
    if (!paused) {
      // Pause: store remaining time
      pausedAtRef.current = remaining;
      setPaused(true);
    } else {
      // Resume: set new end time from remaining
      setTimerEnd(Date.now() + pausedAtRef.current);
      setPaused(false);
    }
  }, [paused, remaining, phase]);

  const restartMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(null);
    setPhase('countdown');
    setTimerEnd(0);
    setRemaining(0);
    setSelectedPlayer(null);
    setPaused(false);
  }, []);

  const validPlayers = playerNames.filter(n => n.trim());

  // --- SETUP SCREEN ---
  if (!gameState) {
    return (
      <div className="host-app">
        <header className="host-header">
          <h1>HOW TO DRINK</h1>
          <p className="subtitle">SHOT BOX</p>
        </header>

        <div className="sb-setup">
          <button className="back-btn" onClick={() => { window.location.href = '/'; }}>
            BACK TO MENU
          </button>

          <p className="sb-tagline">Random timer. Random victim. Take a shot.</p>

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
                {playerNames.length > 2 && (
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
            <h2>TIMER RANGE</h2>
            <div className="sb-timer-range">
              <div className="dm-option-row">
                <label>Min seconds:</label>
                <input
                  type="number"
                  value={minSeconds}
                  min={5}
                  max={300}
                  onChange={(e) => setMinSeconds(parseInt(e.target.value) || 10)}
                  className="dm-number-input"
                />
              </div>
              <div className="dm-option-row">
                <label>Max seconds:</label>
                <input
                  type="number"
                  value={maxSeconds}
                  min={5}
                  max={300}
                  onChange={(e) => setMaxSeconds(parseInt(e.target.value) || 60)}
                  className="dm-number-input"
                />
              </div>
            </div>
          </div>

          {validPlayers.length >= 2 ? (
            <button className="start-btn" onClick={startGame}>
              START
            </button>
          ) : (
            <p className="waiting-msg">Need at least 2 players...</p>
          )}
        </div>
      </div>
    );
  }

  // --- PLAY SCREEN ---
  const seconds = Math.ceil(remaining / 1000);
  const sorted = [...gameState.players].sort((a, b) => b.shots - a.shots);
  const isLow = phase === 'countdown' && seconds <= 5 && seconds > 0;

  return (
    <div className="host-app">
      <header className="host-header">
        <h1>SHOT BOX</h1>
      </header>

      <div className="sb-play">
        {/* Countdown */}
        {phase === 'countdown' && !paused && (
          <div className={`sb-timer ${isLow ? 'sb-timer-low' : ''}`}>
            <span className="sb-timer-value">{seconds}</span>
          </div>
        )}

        {phase === 'countdown' && paused && (
          <div className="sb-timer sb-timer-paused">
            <span className="sb-timer-value">II</span>
            <span className="sb-timer-label">PAUSED</span>
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && selectedPlayer && (
          <div className="sb-reveal">
            <h2 className="sb-reveal-label">TO THE SHOT BOX</h2>
            <span className="sb-reveal-name">{selectedPlayer}</span>
          </div>
        )}

        {/* Controls during countdown */}
        {phase === 'countdown' && (
          <div className="sb-controls">
            <button className="dm-pause-btn" onClick={togglePause}>
              {paused ? 'RESUME' : 'PAUSE'}
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="sb-leaderboard">
          <h3>SHOT COUNT</h3>
          {sorted.map((player, i) => (
            <div
              key={player.name}
              className={`sb-lb-row ${phase === 'reveal' && selectedPlayer === player.name ? 'sb-lb-active' : ''}`}
            >
              <span className="sb-lb-rank">{i + 1}</span>
              <span className="sb-lb-name">{player.name}</span>
              <span className="sb-lb-shots">{player.shots}</span>
            </div>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="sb-bottom-controls">
          <button className="dm-restart-btn" onClick={restartMode}>END GAME</button>
        </div>
      </div>
    </div>
  );
}
