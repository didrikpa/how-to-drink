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
    const duration = 1.5;

    // Vuvuzela is a B-flat drone around 235 Hz with strong harmonics
    const fundamentalFreq = 235;

    // Create master gain for overall volume
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.gain.exponentialRampToValueAtTime(0.7, now + 0.1);
    masterGain.gain.setValueAtTime(0.7, now + duration - 0.2);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Fundamental tone (strongest)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(fundamentalFreq, now);
    // Add slight pitch wobble for realism
    osc1.frequency.setValueAtTime(fundamentalFreq + 2, now + 0.3);
    osc1.frequency.setValueAtTime(fundamentalFreq - 1, now + 0.6);
    osc1.frequency.setValueAtTime(fundamentalFreq + 1, now + 0.9);
    gain1.gain.setValueAtTime(0.5, now);
    osc1.start(now);
    osc1.stop(now + duration);

    // Second harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(fundamentalFreq * 2, now);
    gain2.gain.setValueAtTime(0.3, now);
    osc2.start(now);
    osc2.stop(now + duration);

    // Third harmonic
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(fundamentalFreq * 3, now);
    gain3.gain.setValueAtTime(0.15, now);
    osc3.start(now);
    osc3.stop(now + duration);

    // Add buzzy texture with noise
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(fundamentalFreq * 2, now);
    noiseFilter.Q.setValueAtTime(5, now);
    const noiseGain = ctx.createGain();
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseGain.gain.setValueAtTime(0.08, now);
    noise.start(now);
    noise.stop(now + duration);

    setTimeout(() => ctx.close(), (duration + 0.2) * 1000);
  } catch { /* audio not available */ }
}

function loadSavedState(): ShotBoxState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.gameState) {
        return data.gameState;
      }
    }
  } catch { /* ignore */ }
  return null;
}

export function ShotBoxApp() {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [minSeconds, setMinSeconds] = useState(10);
  const [maxSeconds, setMaxSeconds] = useState(60);

  // Game state - lazy init from localStorage
  const [gameState, setGameState] = useState<ShotBoxState | null>(loadSavedState);
  const [phase, setPhase] = useState<'countdown' | 'reveal'>('countdown');
  const [timerEnd, setTimerEnd] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initTimerRef = useRef(false);

  function startTimer(min: number, max: number) {
    const duration = (min + Math.random() * (max - min)) * 1000;
    setTimerEnd(Date.now() + duration);
    setRemaining(duration);
    setPhase('countdown');
    setSelectedPlayer(null);
  }

  // Start timer on mount if there's saved game state
  useEffect(() => {
    if (initTimerRef.current) return;
    initTimerRef.current = true;
    if (gameState) {
      // Use setTimeout to avoid sync setState warning
      setTimeout(() => startTimer(gameState.minSeconds, gameState.maxSeconds), 0);
    }
  }, [gameState]);

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
