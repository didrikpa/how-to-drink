import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBettingSocket } from '../hooks/useBettingSocket';
import type { RacerState } from '../types/betting';

export function BettingApp() {
  const {
    connected,
    state,
    startBetting,
    lockBets,
    nextRound,
    endGame,
    kickPlayer,
    updateSettings,
  } = useBettingSocket({ isHost: true });

  const [joinUrl, setJoinUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch('/api/lan-ip')
      .then((res) => res.json())
      .then((data) => {
        const port = window.location.port ? `:${window.location.port}` : '';
        setJoinUrl(`http://${data.ip}${port}/play-betting`);
      })
      .catch(() => {
        setJoinUrl(`${window.location.origin}/play-betting`);
      });
  }, []);

  if (!connected) {
    return (
      <div className="host-app">
        <header className="host-header">
          <h1>RACE BETTING</h1>
          <p className="subtitle">Connecting...</p>
        </header>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="host-app">
        <header className="host-header">
          <h1>RACE BETTING</h1>
          <p className="subtitle">Loading...</p>
        </header>
      </div>
    );
  }

  const renderLobby = () => {
    const connectedPlayers = state.players.filter((p) => p.connected);

    return (
      <div className="lobby bt-lobby">
        <a href="/" className="back-btn">BACK</a>

        <div className="join-section bt-join-section">
          <h2>SCAN TO JOIN</h2>
          {joinUrl && (
            <>
              <div className="qr-container">
                <QRCodeSVG value={joinUrl} size={180} />
              </div>
              <p className="join-url">{joinUrl}</p>
            </>
          )}
        </div>

        <div className="players-section">
          <h2>PLAYERS ({connectedPlayers.length})</h2>
          <div className="player-grid">
            {state.players.map((player) => (
              <div
                key={player.id}
                className={`player-card ${!player.connected ? 'disconnected' : ''}`}
              >
                <img src={player.photo} alt={player.name} className="player-photo" />
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

        <div className="lobby-toggles">
          <button
            className="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel bt-settings">
            <h3>GAME SETTINGS</h3>
            <div className="setting-row">
              <label>RACERS</label>
              <input
                type="number"
                min={2}
                max={8}
                value={state.settings.numRacers}
                onChange={(e) =>
                  updateSettings({ numRacers: parseInt(e.target.value) || 4 })
                }
              />
            </div>
            <div className="setting-row">
              <label>BET TIMER (s)</label>
              <input
                type="number"
                min={10}
                max={120}
                value={state.settings.betTimerSeconds}
                onChange={(e) =>
                  updateSettings({ betTimerSeconds: parseInt(e.target.value) || 30 })
                }
              />
            </div>
            <div className="setting-row">
              <label>GIVE TIMER (s)</label>
              <input
                type="number"
                min={10}
                max={120}
                value={state.settings.distributionTimerSeconds}
                onChange={(e) =>
                  updateSettings({
                    distributionTimerSeconds: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
          </div>
        )}

        {connectedPlayers.length >= 2 ? (
          <button className="start-btn bt-start" onClick={startBetting}>
            START RACE
          </button>
        ) : (
          <p className="waiting-msg">Waiting for players...</p>
        )}
      </div>
    );
  };

  const renderBetting = () => {
    const timeLeft = state.phaseEndTime
      ? Math.max(0, Math.ceil((state.phaseEndTime - Date.now()) / 1000))
      : 0;

    const playersBet = Object.keys(state.bets).length;
    const totalPlayers = state.players.filter((p) => p.connected).length;

    return (
      <div className="bt-phase bt-betting">
        <div className="bt-round-header">
          <h2>ROUND {state.roundNumber}</h2>
          <p className="bt-phase-label">PLACE YOUR BETS</p>
        </div>

        <div className="bt-timer">
          <span className="bt-timer-value">{timeLeft}</span>
          <span className="bt-timer-label">SECONDS TO BET</span>
        </div>

        <div className="bt-racers-display">
          <h3>RACERS</h3>
          <div className="bt-racer-grid">
            {state.racers.map((racer) => (
              <div key={racer.id} className="bt-racer-card">
                <div
                  className="bt-racer-icon"
                  style={{ backgroundColor: racer.color }}
                >
                  {racer.id + 1}
                </div>
                <span className="bt-racer-name">{racer.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bt-bet-status">
          <p>
            {playersBet} / {totalPlayers} players have bet
          </p>
        </div>

        <button className="bt-lock-btn" onClick={lockBets}>
          START RACE NOW
        </button>
      </div>
    );
  };

  const renderRacing = () => {
    return (
      <div className="bt-phase bt-racing">
        <div className="bt-round-header">
          <h2>ROUND {state.roundNumber}</h2>
          <p className="bt-phase-label">RACE IN PROGRESS</p>
        </div>

        <RaceTrack racers={state.racers} />
      </div>
    );
  };

  const renderDistribution = () => {
    const timeLeft = state.phaseEndTime
      ? Math.max(0, Math.ceil((state.phaseEndTime - Date.now()) / 1000))
      : 0;

    const winningRacer = state.racers.find((r) => r.id === state.winningRacer);

    // Find winners with drinks to give
    const winners = state.players.filter(
      (p) => p.connected && (state.winnerDrinksToGive[p.id] || 0) > 0
    );

    return (
      <div className="bt-phase bt-distribution">
        <div className="bt-round-header">
          <h2>WINNER: {winningRacer?.name}</h2>
          <p className="bt-phase-label">DISTRIBUTE DRINKS</p>
        </div>

        <div className="bt-timer">
          <span className="bt-timer-value">{timeLeft}</span>
          <span className="bt-timer-label">SECONDS LEFT</span>
        </div>

        <div className="bt-winners-section">
          <h3>WINNERS GIVING OUT DRINKS</h3>
          <div className="bt-winner-grid">
            {winners.map((player) => (
              <div key={player.id} className="bt-winner-card">
                <img src={player.photo} alt={player.name} className="bt-winner-photo" />
                <span className="bt-winner-name">{player.name}</span>
                <span className="bt-drinks-remaining">
                  {state.winnerDrinksToGive[player.id] || 0} left
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bt-recent-assignments">
          <h3>RECENT</h3>
          {state.drinkAssignments.slice(-5).map((d, i) => {
            const from = state.players.find((p) => p.id === d.fromPlayerId);
            const to = state.players.find((p) => p.id === d.toPlayerId);
            const isSelf = d.fromPlayerId === d.toPlayerId;
            return (
              <p key={i} className="bt-assignment">
                {isSelf
                  ? `${from?.name} drinks ${d.amount} ${d.type}(s)`
                  : `${from?.name} gives ${to?.name} ${d.amount} ${d.type}(s)`}
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const winningRacer = state.racers.find((r) => r.id === state.winningRacer);

    // Sort players by total drinks
    const sortedPlayers = [...state.players]
      .filter((p) => p.connected)
      .sort((a, b) => b.totalDrinks - a.totalDrinks);

    return (
      <div className="bt-phase bt-results">
        <div className="bt-round-header">
          <h2>ROUND {state.roundNumber} COMPLETE</h2>
          <p className="bt-phase-label">
            {winningRacer?.name} WINS
          </p>
        </div>

        <div className="leaderboard">
          <div className="leaderboard-list">
            <h3>DRINK TOTALS</h3>
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className="leaderboard-row">
                <span className="rank">{index + 1}</span>
                <img src={player.photo} alt={player.name} className="lb-photo" />
                <span className="lb-name">{player.name}</span>
                <span className="lb-drinks">{player.totalDrinks}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="bt-next-round-btn" onClick={nextRound}>
          NEXT ROUND
        </button>
      </div>
    );
  };

  return (
    <div className="host-app bt-app">
      <header className="host-header">
        <h1>RACE BETTING</h1>
        <p className="subtitle">
          {state.phase === 'lobby' && 'BET ON RACERS'}
          {state.phase === 'betting' && `ROUND ${state.roundNumber}`}
          {state.phase === 'racing' && 'AND THEY\'RE OFF'}
          {state.phase === 'distribution' && 'WINNERS GIVE DRINKS'}
          {state.phase === 'results' && 'RESULTS'}
        </p>
      </header>

      {state.phase === 'lobby' && renderLobby()}
      {state.phase === 'betting' && renderBetting()}
      {state.phase === 'racing' && renderRacing()}
      {state.phase === 'distribution' && renderDistribution()}
      {state.phase === 'results' && renderResults()}

      {state.phase !== 'lobby' && (
        <button className="end-btn" onClick={endGame}>
          END GAME
        </button>
      )}
    </div>
  );
}

function RaceTrack({ racers }: { racers: RacerState[] }) {
  return (
    <div className="bt-track">
      {racers.map((racer) => (
        <div key={racer.id} className="bt-lane">
          <div className="bt-lane-label" style={{ color: racer.color }}>
            {racer.id + 1}
          </div>
          <div className="bt-lane-track">
            <div
              className="bt-car"
              style={{
                left: `${racer.position}%`,
                backgroundColor: racer.color,
              }}
            />
            <div className="bt-finish-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
