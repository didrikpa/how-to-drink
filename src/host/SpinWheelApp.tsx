import { useState, useCallback } from 'react';

interface SpinWheelPlayer {
  name: string;
  spins: number;
  drinks: number;
}

interface WheelSegment {
  label: string;
  color: string;
  action: string;
  value?: number;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '1 SIP', color: '#27ae60', action: 'drink', value: 1 },
  { label: '2 SIPS', color: '#2ecc71', action: 'drink', value: 2 },
  { label: '3 SIPS', color: '#f39c12', action: 'drink', value: 3 },
  { label: 'SHOT', color: '#e74c3c', action: 'shot' },
  { label: 'GIVE 2', color: '#9b59b6', action: 'give', value: 2 },
  { label: 'SAFE', color: '#3498db', action: 'safe' },
  { label: 'EVERYONE', color: '#e67e22', action: 'everyone' },
  { label: 'WATERFALL', color: '#c0392b', action: 'waterfall' },
  { label: 'RULE', color: '#8e44ad', action: 'rule' },
  { label: 'TRUTH', color: '#1abc9c', action: 'truth' },
  { label: 'DARE', color: '#d35400', action: 'dare' },
  { label: 'CATEGORY', color: '#16a085', action: 'category' },
];

const ACTION_DESCRIPTIONS: Record<string, string> = {
  drink: 'Drink {value} sip(s)',
  shot: 'Take a shot!',
  give: 'Give {value} sips to someone',
  safe: 'Lucky! No drinking',
  everyone: 'Everyone drinks 1 sip',
  waterfall: 'Start a waterfall!',
  rule: 'Make a rule for the game',
  truth: 'Answer a truth or drink 3 sips',
  dare: 'Do a dare or drink 3 sips',
  category: 'Pick a category, go around until someone fails',
};

const STORAGE_KEY = 'mode.spinWheel.v1';

function loadSavedState(): { players: SpinWheelPlayer[] } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.players) {
        return { players: data.players };
      }
    }
  } catch { /* ignore */ }
  return null;
}

function playTickSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
    setTimeout(() => ctx.close(), 100);
  } catch { /* ignore */ }
}

function playWinSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Fanfare-like sound
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });

    setTimeout(() => ctx.close(), 600);
  } catch { /* ignore */ }
}

export function SpinWheelApp() {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);

  const savedState = loadSavedState();
  const [players, setPlayers] = useState<SpinWheelPlayer[] | null>(savedState?.players || null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Save state
  const saveState = useCallback((newPlayers: SpinWheelPlayer[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players: newPlayers }));
  }, []);

  const startGame = useCallback(() => {
    const validPlayers = playerNames
      .filter(n => n.trim())
      .map(n => ({ name: n.trim(), spins: 0, drinks: 0 }));
    if (validPlayers.length < 2) return;

    setPlayers(validPlayers);
    saveState(validPlayers);
    setCurrentPlayerIndex(0);
    setRotation(0);
    setResult(null);
    setShowResult(false);
  }, [playerNames, saveState]);

  const spin = useCallback(() => {
    if (isSpinning || !players) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Calculate spin: 5-8 full rotations plus random segment
    const fullRotations = 5 + Math.random() * 3;
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const randomSegment = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const finalAngle = fullRotations * 360 + randomSegment * segmentAngle + segmentAngle / 2;

    // Add to current rotation for continuous spinning effect
    const newRotation = rotation + finalAngle;
    setRotation(newRotation);

    // Play tick sounds during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount < 30) {
        playTickSound();
      } else {
        clearInterval(tickInterval);
      }
    }, 100);

    // Reveal result after spin completes
    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);

      // Calculate which segment we landed on
      // The pointer is at the top (0 degrees), wheel rotates clockwise
      const normalizedRotation = newRotation % 360;
      const pointerAngle = (360 - normalizedRotation + 90) % 360; // Adjust for pointer at top
      const segmentIndex = Math.floor(pointerAngle / segmentAngle) % WHEEL_SEGMENTS.length;
      const landedSegment = WHEEL_SEGMENTS[segmentIndex];

      setResult(landedSegment);
      setShowResult(true);
      playWinSound();

      // Update player stats
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].spins++;
      if (landedSegment.action === 'drink' || landedSegment.action === 'shot') {
        updatedPlayers[currentPlayerIndex].drinks += landedSegment.value || 1;
      }
      setPlayers(updatedPlayers);
      saveState(updatedPlayers);
    }, 4000);
  }, [isSpinning, players, rotation, currentPlayerIndex, saveState]);

  const nextPlayer = useCallback(() => {
    if (!players) return;
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    setShowResult(false);
    setResult(null);
  }, [players]);

  const endGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayers(null);
    setCurrentPlayerIndex(0);
    setRotation(0);
    setResult(null);
    setShowResult(false);
  }, []);

  const validPlayers = playerNames.filter(n => n.trim());

  // --- SETUP SCREEN ---
  if (!players) {
    return (
      <div className="host-app">
        <header className="host-header">
          <h1>HOW TO DRINK</h1>
          <p className="subtitle">SPIN THE WHEEL</p>
        </header>

        <div className="sw-setup">
          <button className="back-btn" onClick={() => { window.location.href = '/'; }}>
            BACK TO MENU
          </button>

          <p className="sw-tagline">Spin it. Land on it. Drink it.</p>

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

          <div className="sw-preview">
            <h2>WHEEL SEGMENTS</h2>
            <div className="sw-segment-list">
              {WHEEL_SEGMENTS.map((seg, i) => (
                <span key={i} className="sw-segment-tag" style={{ backgroundColor: seg.color }}>
                  {seg.label}
                </span>
              ))}
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
  const currentPlayer = players[currentPlayerIndex];
  const sortedPlayers = [...players].sort((a, b) => b.drinks - a.drinks);

  const getActionText = (segment: WheelSegment) => {
    let text = ACTION_DESCRIPTIONS[segment.action] || segment.label;
    if (segment.value) {
      text = text.replace('{value}', String(segment.value));
    }
    return text;
  };

  return (
    <div className="host-app sw-app">
      <header className="host-header">
        <h1>SPIN THE WHEEL</h1>
      </header>

      <div className="sw-play">
        {/* Current player */}
        <div className="sw-current-player">
          <span className="sw-turn-label">SPINNING:</span>
          <span className="sw-player-name">{currentPlayer.name}</span>
        </div>

        {/* Wheel container */}
        <div className="sw-wheel-container">
          <div className="sw-pointer" />
          <svg
            className="sw-wheel"
            viewBox="0 0 200 200"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {WHEEL_SEGMENTS.map((segment, i) => {
              const segmentAngle = 360 / WHEEL_SEGMENTS.length;
              const startAngle = i * segmentAngle - 90; // -90 to start from top
              const endAngle = startAngle + segmentAngle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 100 + 100 * Math.cos(startRad);
              const y1 = 100 + 100 * Math.sin(startRad);
              const x2 = 100 + 100 * Math.cos(endRad);
              const y2 = 100 + 100 * Math.sin(endRad);
              const largeArc = segmentAngle > 180 ? 1 : 0;
              const midAngle = startAngle + segmentAngle / 2;
              const midRad = (midAngle * Math.PI) / 180;
              const textX = 100 + 65 * Math.cos(midRad);
              const textY = 100 + 65 * Math.sin(midRad);

              return (
                <g key={i}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    stroke="#1a1a2e"
                    strokeWidth="1"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontFamily="'Press Start 2P', monospace"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="20" fill="#1a1a2e" stroke="#9b59b6" strokeWidth="3" />
          </svg>
        </div>

        {/* Legend */}
        <div className="sw-legend">
          {WHEEL_SEGMENTS.map((segment, i) => (
            <div key={i} className="sw-legend-item">
              <span className="sw-legend-num" style={{ backgroundColor: segment.color }}>{i + 1}</span>
              <span className="sw-legend-label">{segment.label}</span>
            </div>
          ))}
        </div>

        {/* Spin button or result */}
        {!showResult ? (
          <button
            className="sw-spin-btn"
            onClick={spin}
            disabled={isSpinning}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
        ) : result && (
          <div className="sw-result">
            <div className="sw-result-card" style={{ borderColor: result.color }}>
              <span className="sw-result-label" style={{ color: result.color }}>
                {result.label}
              </span>
              <p className="sw-result-action">{getActionText(result)}</p>
            </div>
            <button className="sw-next-btn" onClick={nextPlayer}>
              NEXT PLAYER
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="sw-leaderboard">
          <h3>DRINK COUNT</h3>
          {sortedPlayers.map((player, i) => (
            <div
              key={player.name}
              className={`sw-lb-row ${player.name === currentPlayer.name ? 'sw-lb-active' : ''}`}
            >
              <span className="sw-lb-rank">{i + 1}</span>
              <span className="sw-lb-name">{player.name}</span>
              <span className="sw-lb-drinks">{player.drinks}</span>
            </div>
          ))}
        </div>

        {/* End game */}
        <div className="sw-bottom-controls">
          <button className="dm-restart-btn" onClick={endGame}>END GAME</button>
        </div>
      </div>
    </div>
  );
}
