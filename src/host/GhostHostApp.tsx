import { useState, useEffect } from 'react';
import { useGhostHostSocket } from '../hooks/useGhostHostSocket';
import { QRCodeSVG } from 'qrcode.react';
import type { GhostHostSettings, GhostHostPlayer } from '../types/ghosthost';
import { DEFAULT_GHOSTHOST_SETTINGS } from '../types/ghosthost';

export function GhostHostApp() {
  const {
    connected,
    state,
    hauntTriggered,
    startGame,
    endGame,
  } = useGhostHostSocket({ isHost: true });

  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [settings, setSettings] = useState<GhostHostSettings>({
    ...DEFAULT_GHOSTHOST_SETTINGS,
  });
  const [playerUrl, setPlayerUrl] = useState('');

  useEffect(() => {
    fetch('/api/lan-ip')
      .then((r) => r.json())
      .then(({ ip }) => {
        const port = window.location.port;
        const proto = window.location.protocol;
        setPlayerUrl(`${proto}//${ip}${port ? ':' + port : ''}/play-ghosthost`);
      })
      .catch(() => {
        setPlayerUrl(
          `${window.location.protocol}//${window.location.host}/play-ghosthost`
        );
      });
  }, []);

  if (!connected) {
    return (
      <div className="host-app gh-app">
        <h1>GHOST HOST</h1>
        <p>Connecting...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="host-app gh-app">
        <h1>GHOST HOST</h1>
        <p>Loading game state...</p>
      </div>
    );
  }

  const connectedPlayers = state.players.filter((p) => p.connected);

  return (
    <div className="host-app gh-app">
      <header className="host-header">
        <h1 className="gh-title">GHOST HOST</h1>
        <p className="subtitle gh-subtitle">ONE AMONG YOU IS A GHOST</p>
      </header>

      {/* LOBBY PHASE */}
      {state.phase === 'lobby' && (
        <div className="lobby gh-lobby">
          <button
            className="back-btn"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            BACK TO MENU
          </button>
          <div className="join-section gh-join-section">
            <h2>JOIN THE SEANCE</h2>
            <div className="qr-container">
              <QRCodeSVG value={playerUrl} size={200} />
            </div>
            <p className="join-url">{playerUrl}</p>
          </div>

          <div className="players-section">
            <h2>MORTALS ({connectedPlayers.length})</h2>
            <div className="player-grid">
              {connectedPlayers.map((player) => (
                <div key={player.id} className="player-card gh-player-card">
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="player-photo"
                  />
                  <span className="player-name">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-toggles">
            <button
              className="settings-toggle"
              onClick={() => {
                setShowRules(!showRules);
                setShowSettings(false);
              }}
            >
              {showRules ? 'HIDE RULES' : 'HOW TO PLAY'}
            </button>
            <button
              className="settings-toggle"
              onClick={() => {
                setShowSettings(!showSettings);
                setShowRules(false);
              }}
            >
              {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
            </button>
          </div>

          {showRules && (
            <div className="rules-panel gh-rules-panel">
              <h3>HOW TO PLAY</h3>
              <p className="rules-intro">
                One player is secretly the Ghost with missions to complete.
                Mortals must figure out who the Ghost is before time runs out.
              </p>
              <div className="rules-phases">
                <div className="rules-phase">
                  <span className="rules-phase-name">THE GHOST</span>
                  <span className="rules-phase-desc">
                    Secretly assigned at game start. Gets missions to complete
                    (like "get someone to check their phone"). When a mission is
                    done, press HAUNT for a new one.
                  </span>
                </div>
                <div className="rules-phase">
                  <span className="rules-phase-name">THE MORTALS</span>
                  <span className="rules-phase-desc">
                    Watch for suspicious behavior. When someone "haunts", all
                    mortals see a spooky alert. Use this to narrow down suspects.
                  </span>
                </div>
                <div className="rules-phase">
                  <span className="rules-phase-name">THE VOTE</span>
                  <span className="rules-phase-desc">
                    When time runs out, mortals vote for who they think is the
                    Ghost. Majority wins. Ghost drinks if caught, everyone else
                    drinks if the Ghost escapes.
                  </span>
                </div>
              </div>
              <div className="rules-section">
                <h4>COVER RULES</h4>
                <p className="rules-desc">
                  Everyone follows 3 random rules (shown on screen). These give
                  the Ghost cover - if a rule triggers an action, it might not
                  be a mission.
                </p>
              </div>
            </div>
          )}

          {showSettings && (
            <div className="settings-panel gh-settings-panel">
              <h3>GAME SETTINGS</h3>
              <div className="setting-row">
                <label>Game Duration (min):</label>
                <input
                  type="number"
                  value={Math.floor(settings.gameDurationSeconds / 60)}
                  min={3}
                  max={20}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gameDurationSeconds: (parseInt(e.target.value) || 10) * 60,
                    })
                  }
                />
              </div>
              <div className="setting-row">
                <label>Haunt Cooldown (sec):</label>
                <input
                  type="number"
                  value={settings.hauntCooldownSeconds}
                  min={10}
                  max={120}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hauntCooldownSeconds: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="setting-row">
                <label>Voting Duration (sec):</label>
                <input
                  type="number"
                  value={settings.votingDurationSeconds}
                  min={30}
                  max={120}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      votingDurationSeconds: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
          )}

          {connectedPlayers.length >= 3 && (
            <button
              className="start-btn gh-start-btn"
              onClick={() => startGame(settings)}
            >
              BEGIN SEANCE
            </button>
          )}
          {connectedPlayers.length < 3 && (
            <p className="waiting-msg">Waiting for at least 3 mortals...</p>
          )}
        </div>
      )}

      {/* PLAYING PHASE */}
      {state.phase === 'playing' && (
        <div className="gh-phase gh-playing">
          {state.gameTimerEnd && <GameTimer endTime={state.gameTimerEnd} />}

          <div className="gh-haunt-counter">
            <span className="gh-haunt-label">HAUNTS</span>
            <span className="gh-haunt-value">{state.hauntCount}</span>
          </div>

          <div className="gh-rules-display">
            <h3>COVER RULES</h3>
            <ul className="gh-rules-list">
              {state.globalRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="gh-players-grid">
            {connectedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          {hauntTriggered && (
            <div className="gh-haunt-overlay">
              <div className="gh-haunt-text">HAUNT</div>
            </div>
          )}

          <div className="gh-controls">
            <button className="end-btn" onClick={endGame}>
              END GAME
            </button>
          </div>
        </div>
      )}

      {/* VOTING PHASE */}
      {state.phase === 'voting' && (
        <div className="gh-phase gh-voting">
          <h2 className="gh-voting-title">VOTING PHASE</h2>
          <p className="gh-voting-subtitle">Who is the Ghost?</p>

          {state.votingTimerEnd && <VotingTimer endTime={state.votingTimerEnd} />}

          <div className="gh-vote-counts">
            {connectedPlayers.map((player) => {
              const voteCount = Object.values(state.votes).filter(
                (v) => v === player.id
              ).length;
              return (
                <div key={player.id} className="gh-vote-card">
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="gh-vote-photo"
                  />
                  <span className="gh-vote-name">{player.name}</span>
                  <span className="gh-vote-count">{voteCount} votes</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULT PHASE */}
      {state.phase === 'result' && state.votingResult && (
        <div className="gh-phase gh-result">
          <h2 className="gh-result-title">
            {state.votingResult.correctGuess ? 'GHOST CAUGHT' : 'GHOST ESCAPED'}
          </h2>

          <div className="gh-ghost-reveal">
            <p className="gh-reveal-label">THE GHOST WAS</p>
            <img
              src={state.votingResult.ghostPhoto}
              alt={state.votingResult.ghostName}
              className="gh-reveal-photo"
            />
            <span className="gh-reveal-name">{state.votingResult.ghostName}</span>
          </div>

          <div className="gh-penalty">
            {state.votingResult.correctGuess ? (
              <p className="gh-penalty-text">
                {state.votingResult.ghostName} drinks a penalty shot!
              </p>
            ) : (
              <p className="gh-penalty-text">Everyone else drinks!</p>
            )}
          </div>

          <button
            className="start-btn gh-start-btn"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}

// ========== Sub-components ==========

function GameTimer({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="gh-timer">
      <span className="gh-timer-value">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      <span className="gh-timer-label">remaining</span>
    </div>
  );
}

function VotingTimer({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="gh-voting-timer">
      <span className="gh-voting-timer-value">{seconds}</span>
      <span className="gh-voting-timer-label">seconds to vote</span>
    </div>
  );
}

function PlayerCard({ player }: { player: GhostHostPlayer }) {
  return (
    <div className="gh-player-card-large">
      <img src={player.photo} alt={player.name} className="gh-player-photo-large" />
      <span className="gh-player-name-large">{player.name}</span>
    </div>
  );
}
