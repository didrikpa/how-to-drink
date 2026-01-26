import { useState, useEffect } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import { QRCodeSVG } from 'qrcode.react';

export function HostApp() {
  const { connected, state, startGame, kickPlayer, endGame, updateSettings } = useGameSocket({
    isHost: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  const playerUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}/play`
      : '';

  if (!connected) {
    return (
      <div className="host-app">
        <h1>HOW TO DRINK</h1>
        <p>Connecting...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="host-app">
        <h1>HOW TO DRINK</h1>
        <p>Loading game state...</p>
      </div>
    );
  }

  const connectedPlayers = state.players.filter((p) => p.connected);

  return (
    <div className="host-app">
      <header className="host-header">
        <h1>HOW TO DRINK</h1>
        <p className="subtitle">DRINKING SCHOOL</p>
      </header>

      {state.phase === 'lobby' && (
        <div className="lobby">
          <div className="join-section">
            <h2>JOIN THE CLASS</h2>
            <div className="qr-container">
              <QRCodeSVG value={playerUrl} size={200} />
            </div>
            <p className="join-url">{playerUrl}</p>
          </div>

          <div className="players-section">
            <h2>STUDENTS ({connectedPlayers.length})</h2>
            <div className="player-grid">
              {connectedPlayers.map((player) => (
                <div key={player.id} className="player-card">
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="player-photo"
                  />
                  <span className="player-name">{player.name}</span>
                  <button
                    className="kick-btn"
                    onClick={() => kickPlayer(player.id)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            className="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
          </button>

          {showSettings && (
            <div className="settings-panel">
              <h3>TIMER SETTINGS</h3>
              <div className="setting-row">
                <label>Min seconds:</label>
                <input
                  type="number"
                  value={state.settings.minTimerSeconds}
                  min={5}
                  max={300}
                  onChange={(e) =>
                    updateSettings({ minTimerSeconds: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
              <div className="setting-row">
                <label>Max seconds:</label>
                <input
                  type="number"
                  value={state.settings.maxTimerSeconds}
                  min={5}
                  max={300}
                  onChange={(e) =>
                    updateSettings({ maxTimerSeconds: parseInt(e.target.value) || 90 })
                  }
                />
              </div>
            </div>
          )}

          {connectedPlayers.length >= 2 && (
            <button className="start-btn" onClick={startGame}>
              START CLASS
            </button>
          )}
          {connectedPlayers.length < 2 && (
            <p className="waiting-msg">Waiting for at least 2 students...</p>
          )}
        </div>
      )}

      {state.phase === 'countdown' && state.countdownTarget && (
        <div className="countdown-phase">
          <Countdown target={state.countdownTarget} />
          <div className="leaderboard">
            <Leaderboard players={state.players} />
          </div>
        </div>
      )}

      {state.phase === 'challenge' && state.currentChallenge && (
        <div className="challenge-phase">
          <h2 className="class-name">{state.currentChallenge.title}</h2>
          <p className="challenge-desc">{state.currentChallenge.description}</p>
          {state.currentChallenge.targetPlayerIds.length > 0 && (
            <div className="target-players">
              {state.currentChallenge.targetPlayerIds.map((id) => {
                const player = state.players.find((p) => p.id === id);
                return player ? (
                  <div key={id} className="target-player">
                    <img src={player.photo} alt={player.name} />
                    <span>{player.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {state.phase === 'result' && state.lastResult && (
        <div className="result-phase">
          <h2>RESULT</h2>
          {state.lastResult.drinks.map((drink) => {
            const player = state.players.find((p) => p.id === drink.playerId);
            return player ? (
              <div key={drink.playerId} className="drink-result">
                <img src={player.photo} alt={player.name} />
                <span>{player.name}</span>
                <span className="drink-amount">
                  {drink.sips > 0 && `${drink.sips} sips`}
                  {drink.sips > 0 && drink.shots > 0 && ' + '}
                  {drink.shots > 0 && `${drink.shots} shots`}
                </span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {state.phase !== 'lobby' && (
        <button className="end-btn" onClick={endGame}>
          END CLASS
        </button>
      )}
    </div>
  );
}

function Countdown({ target }: { target: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, target - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [target]);

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="countdown">
      <span className="countdown-number">{seconds}</span>
      <span className="countdown-label">seconds until next class</span>
    </div>
  );
}

function Leaderboard({ players }: { players: Array<{ id: string; name: string; photo: string; sips: number; shots: number; connected: boolean }> }) {
  const sorted = [...players]
    .filter((p) => p.connected)
    .sort((a, b) => b.sips + b.shots * 5 - (a.sips + a.shots * 5));

  return (
    <div className="leaderboard-list">
      <h3>DRINK COUNTER</h3>
      {sorted.map((player, i) => (
        <div key={player.id} className="leaderboard-row">
          <span className="rank">{i + 1}</span>
          <img src={player.photo} alt={player.name} className="lb-photo" />
          <span className="lb-name">{player.name}</span>
          <span className="lb-drinks">
            {player.sips}s / {player.shots}sh
          </span>
        </div>
      ))}
    </div>
  );
}
