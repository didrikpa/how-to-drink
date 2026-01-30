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
    const now = ctx.currentTime;

    // Deep bass hit
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    bassGain.gain.setValueAtTime(0.8, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    bass.start(now);
    bass.stop(now + 0.5);

    // Mid punch
    const mid = ctx.createOscillator();
    const midGain = ctx.createGain();
    mid.connect(midGain);
    midGain.connect(ctx.destination);
    mid.type = 'sawtooth';
    mid.frequency.setValueAtTime(120, now);
    mid.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    midGain.gain.setValueAtTime(0.5, now);
    midGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    mid.start(now);
    mid.stop(now + 0.35);

    // Noise burst for explosion texture
    const bufferSize = ctx.sampleRate * 0.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noise.start(now);
    noise.stop(now + 0.2);

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
