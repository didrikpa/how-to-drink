import { useState, useEffect } from 'react';
import { useContractsSocket } from '../hooks/useContractsSocket';
import { QRCodeSVG } from 'qrcode.react';
import type {
  ContractsSettings,
  ActiveContract,
  ContractsPlayer,
  TabMilestone,
} from '../types/contracts';
import { DEFAULT_CONTRACTS_SETTINGS } from '../types/contracts';

export function ContractsHostApp() {
  const {
    connected,
    state,
    paused,
    startGame,
    endGame,
    pauseGame,
    resumeGame,
  } = useContractsSocket({ isHost: true });

  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [settings, setSettings] = useState<ContractsSettings>({ ...DEFAULT_CONTRACTS_SETTINGS });
  const [playerUrl, setPlayerUrl] = useState('');

  useEffect(() => {
    fetch('/api/lan-ip')
      .then(r => r.json())
      .then(({ ip }) => {
        const port = window.location.port;
        const proto = window.location.protocol;
        setPlayerUrl(`${proto}//${ip}${port ? ':' + port : ''}/play-contracts`);
      })
      .catch(() => {
        setPlayerUrl(`${window.location.protocol}//${window.location.host}/play-contracts`);
      });
  }, []);

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
        <p className="subtitle">CONTRACTS</p>
      </header>

      {/* LOBBY PHASE */}
      {state.phase === 'lobby' && (
        <div className="lobby">
          <button className="back-btn" onClick={() => { window.location.href = '/'; }}>
            BACK TO MENU
          </button>
          <div className="join-section">
            <h2>JOIN THE DEAL</h2>
            <div className="qr-container">
              <QRCodeSVG value={playerUrl} size={200} />
            </div>
            <p className="join-url">{playerUrl}</p>
          </div>

          <div className="players-section">
            <h2>DEALMAKERS ({connectedPlayers.length})</h2>
            <div className="player-grid">
              {connectedPlayers.map((player) => (
                <div key={player.id} className="player-card">
                  <img src={player.photo} alt={player.name} className="player-photo" />
                  <span className="player-name">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-toggles">
            <button
              className="settings-toggle"
              onClick={() => { setShowRules(!showRules); setShowSettings(false); }}
            >
              {showRules ? 'HIDE RULES' : 'HOW TO PLAY'}
            </button>
            <button
              className="settings-toggle"
              onClick={() => { setShowSettings(!showSettings); setShowRules(false); }}
            >
              {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
            </button>
          </div>

          {showRules && (
            <div className="rules-panel">
              <h3>HOW TO PLAY</h3>
              <p className="rules-intro">
                Sign shady contracts, avoid hidden clauses, and try not to
                run up the Tab. Each round has 3 phases:
              </p>
              <div className="rules-phases">
                <div className="rules-phase">
                  <span className="rules-phase-name">1. OFFER</span>
                  <span className="rules-phase-desc">
                    Contracts appear on your phone. Sign one (you're on the hook)
                    or witness someone else's. Every contract has a hidden clause
                    you won't see until settlement.
                  </span>
                </div>
                <div className="rules-phase">
                  <span className="rules-phase-name">2. ACTION</span>
                  <span className="rules-phase-desc">
                    Random events fire: audits reveal hidden clauses, market shifts
                    double payouts. Use tokens from your phone to interfere.
                  </span>
                </div>
                <div className="rules-phase">
                  <span className="rules-phase-name">3. SETTLEMENT</span>
                  <span className="rules-phase-desc">
                    Mature contracts pay out - the signer drinks. Propose a buyout
                    to erase a contract by drinking yourself (group votes).
                  </span>
                </div>
              </div>
              <div className="rules-section">
                <h4>TOKENS</h4>
                <div className="rules-tokens">
                  <div className="rules-token">
                    <span className="rules-token-name">LAWYER (x2)</span>
                    <span className="rules-token-desc">Cancel a hidden clause before settlement</span>
                  </div>
                  <div className="rules-token">
                    <span className="rules-token-name">HEDGE (x1)</span>
                    <span className="rules-token-desc">Reduce your penalty by 1 sip at settlement</span>
                  </div>
                  <div className="rules-token">
                    <span className="rules-token-name">SABOTAGE (x1)</span>
                    <span className="rules-token-desc">Redirect a contract's penalty to someone else</span>
                  </div>
                </div>
              </div>
              <div className="rules-section">
                <h4>THE TAB</h4>
                <p className="rules-desc">
                  Every sip adds to the group Tab. Hit milestones and
                  special events trigger for everyone.
                </p>
              </div>
            </div>
          )}

          {showSettings && (
            <div className="settings-panel">
              <h3>GAME SETTINGS</h3>
              <div className="setting-row">
                <label>Difficulty:</label>
                <div className="ct-toggle">
                  <button
                    className={`ct-toggle-btn ${settings.difficulty === 'chill' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, difficulty: 'chill' })}
                  >
                    CHILL
                  </button>
                  <button
                    className={`ct-toggle-btn ${settings.difficulty === 'unhinged' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, difficulty: 'unhinged' })}
                  >
                    UNHINGED
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <label>Rounds:</label>
                <input
                  type="number"
                  value={settings.roundCount}
                  min={3}
                  max={20}
                  onChange={(e) => setSettings({ ...settings, roundCount: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="setting-row">
                <label>Timer (sec):</label>
                <input
                  type="number"
                  value={settings.roundTimerSeconds}
                  min={30}
                  max={180}
                  onChange={(e) => setSettings({ ...settings, roundTimerSeconds: parseInt(e.target.value) || 90 })}
                />
              </div>
              <div className="setting-row">
                <label>Contracts/round:</label>
                <input
                  type="number"
                  value={settings.contractsPerRound}
                  min={2}
                  max={5}
                  onChange={(e) => setSettings({ ...settings, contractsPerRound: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div className="setting-row">
                <label>Max sips/settle:</label>
                <input
                  type="number"
                  value={settings.maxSipsPerSettlement}
                  min={1}
                  max={6}
                  onChange={(e) => setSettings({ ...settings, maxSipsPerSettlement: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
          )}

          {connectedPlayers.length >= 2 && (
            <button className="start-btn" onClick={() => startGame(settings)}>
              START DEALING
            </button>
          )}
          {connectedPlayers.length < 2 && (
            <p className="waiting-msg">Waiting for at least 2 dealmakers...</p>
          )}
        </div>
      )}

      {/* OFFER PHASE */}
      {state.phase === 'offer' && (
        <div className="ct-phase">
          <div className="ct-round-header">
            <h2>ROUND {state.currentRound} / {state.settings.roundCount}</h2>
            <p className="ct-phase-label">OFFER PHASE - SIGN YOUR DEALS</p>
          </div>

          <div className="ct-tab-bar">
            <span className="ct-tab-label">TAB</span>
            <span className="ct-tab-value">{state.tab}</span>
            <MilestoneProgress milestones={state.milestones} tab={state.tab} />
          </div>

          <div className="ct-contracts-grid">
            {state.availableContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                players={state.players}
                showHidden={false}
              />
            ))}
          </div>

          <div className="ct-active-count">
            {state.activeContracts.length} active contracts in play
          </div>
        </div>
      )}

      {/* ACTION PHASE */}
      {state.phase === 'action' && (
        <div className="ct-phase">
          <div className="ct-round-header">
            <h2>ROUND {state.currentRound} / {state.settings.roundCount}</h2>
            <p className="ct-phase-label">ACTION PHASE</p>
          </div>

          {state.roundTimerEnd && <RoundTimer endTime={state.roundTimerEnd} />}

          <div className="ct-tab-bar">
            <span className="ct-tab-label">TAB</span>
            <span className="ct-tab-value">{state.tab}</span>
          </div>

          {paused && <div className="ct-paused-banner">PAUSED - WATER ROUND</div>}

          {state.pendingEvents.length > 0 && (
            <div className="ct-events">
              {state.pendingEvents.map((event, i) => (
                <div key={i} className="ct-event-card">
                  {event.type === 'audit' && <span>AUDIT - Hidden clause revealed!</span>}
                  {event.type === 'fine-print' && <span>FINE PRINT - {event.twist}</span>}
                  {event.type === 'market-shift' && <span>MARKET SHIFT - Payout doubled!</span>}
                </div>
              ))}
            </div>
          )}

          <div className="ct-contracts-grid">
            {state.activeContracts.filter(c => !c.settled).map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                players={state.players}
                showHidden={contract.hiddenRevealed}
              />
            ))}
          </div>
        </div>
      )}

      {/* SETTLEMENT PHASE */}
      {state.phase === 'settlement' && (
        <div className="ct-phase">
          <div className="ct-round-header">
            <h2>ROUND {state.currentRound}</h2>
            <p className="ct-phase-label">SETTLEMENT - PAY THE TAB</p>
          </div>

          <div className="ct-tab-bar">
            <span className="ct-tab-label">TAB</span>
            <span className="ct-tab-value">{state.tab}</span>
          </div>

          <div className="ct-mature-contracts">
            <h3>MATURING CONTRACTS</h3>
            {state.activeContracts.filter(c => c.mature && !c.settled).map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                players={state.players}
                showHidden={true}
                highlight
              />
            ))}
          </div>

          {state.currentBuyout && (
            <div className="ct-buyout-banner">
              <h3>BUYOUT PROPOSED</h3>
              <p>
                {state.players.find(p => p.id === state.currentBuyout?.proposerId)?.name} offers
                to drink {state.currentBuyout.sipsCost} to erase a contract
              </p>
              <p className="ct-vote-status">Voting in progress...</p>
            </div>
          )}
        </div>
      )}

      {/* RESULT PHASE */}
      {state.phase === 'result' && state.roundResults && (
        <div className="ct-phase">
          <div className="ct-round-header">
            <h2>ROUND {state.roundResults.round} RESULTS</h2>
          </div>

          <div className="ct-tab-bar">
            <span className="ct-tab-label">TAB</span>
            <span className="ct-tab-value">{state.tab}</span>
            {state.roundResults.tabChange > 0 && (
              <span className="ct-tab-change">+{state.roundResults.tabChange}</span>
            )}
          </div>

          {state.roundResults.drinks.length > 0 ? (
            <div className="ct-results">
              {state.roundResults.drinks.map((drink, i) => {
                const player = state.players.find(p => p.id === drink.playerId);
                return player ? (
                  <div key={i} className="drink-result">
                    <img src={player.photo} alt={player.name} />
                    <span>{player.name}</span>
                    <span className="drink-amount">{drink.sips} sips</span>
                    <span className="ct-drink-reason">{drink.reason}</span>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="ct-no-drinks">No drinks this round!</p>
          )}

          {state.roundResults.milestonesTriggered.length > 0 && (
            <div className="ct-milestone-triggered">
              {state.roundResults.milestonesTriggered.map((m, i) => (
                <div key={i} className="ct-milestone-card">
                  <h3>{m.name}</h3>
                  <p>{m.description}</p>
                </div>
              ))}
            </div>
          )}

          <ContractsLeaderboard players={state.players} />
        </div>
      )}

      {/* ENDGAME PHASE */}
      {state.phase === 'endgame' && state.gameResults && (
        <div className="ct-phase ct-endgame">
          <h2>GAME OVER</h2>
          <div className="ct-final-tab">
            <span className="ct-tab-label">FINAL TAB</span>
            <span className="ct-tab-value ct-big">{state.gameResults.finalTab}</span>
            <span className="ct-rounds-played">{state.gameResults.rounds} rounds played</span>
          </div>

          <div className="ct-awards">
            <AwardCard
              title="TOP INVESTOR"
              subtitle="Paid least into Tab"
              player={state.players.find(p => p.id === state.gameResults?.topInvestor)}
            />
            <AwardCard
              title="BAILOUT KING"
              subtitle="Most buyouts"
              player={state.players.find(p => p.id === state.gameResults?.bailoutKing)}
            />
            <AwardCard
              title="CHAOS AUDITOR"
              subtitle="Most audits triggered"
              player={state.players.find(p => p.id === state.gameResults?.chaosAuditor)}
            />
          </div>

          <ContractsLeaderboard players={state.players} />
        </div>
      )}

      {/* Controls */}
      {state.phase !== 'lobby' && state.phase !== 'endgame' && (
        <div className="ct-controls">
          {!paused ? (
            <button className="ct-pause-btn" onClick={pauseGame}>PAUSE / WATER</button>
          ) : (
            <button className="ct-resume-btn" onClick={resumeGame}>RESUME</button>
          )}
          <button className="end-btn" onClick={endGame}>END GAME</button>
        </div>
      )}

      {state.phase === 'endgame' && (
        <button className="start-btn" onClick={() => { window.location.href = '/'; }}>
          BACK TO MENU
        </button>
      )}
    </div>
  );
}

// ========== Sub-components ==========

function ContractCard({
  contract,
  players,
  showHidden,
  highlight,
}: {
  contract: ActiveContract;
  players: ContractsPlayer[];
  showHidden: boolean;
  highlight?: boolean;
}) {
  const signer = contract.signedBy ? players.find(p => p.id === contract.signedBy) : null;
  const totalSips = contract.baseSips + contract.growthSips;

  return (
    <div className={`ct-contract-card ${highlight ? 'ct-highlight' : ''} ${contract.signedBy ? 'ct-signed' : ''}`}>
      <div className="ct-contract-text">{contract.visibleText}</div>
      {showHidden && (
        <div className="ct-hidden-clause">
          HIDDEN: {contract.hiddenClause}
        </div>
      )}
      <div className="ct-contract-meta">
        <span className="ct-sips-badge">{totalSips} sips</span>
        {contract.growthSips > 0 && (
          <span className="ct-growth">+{contract.growthSips} growth</span>
        )}
        {signer && (
          <span className="ct-signer">
            Signed: {signer.name}
          </span>
        )}
        {contract.witnessedBy.length > 0 && (
          <span className="ct-witnesses">
            {contract.witnessedBy.length} witness{contract.witnessedBy.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function RoundTimer({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="ct-timer">
      <span className="ct-timer-value">{seconds}</span>
      <span className="ct-timer-label">seconds</span>
    </div>
  );
}

function MilestoneProgress({ milestones, tab }: { milestones: TabMilestone[]; tab: number }) {
  const nextMilestone = milestones.find(m => !m.triggered);
  if (!nextMilestone) return null;

  return (
    <div className="ct-milestone-progress">
      <span className="ct-milestone-next">
        Next: {nextMilestone.name} at {nextMilestone.threshold}
      </span>
      <div className="ct-milestone-bar">
        <div
          className="ct-milestone-fill"
          style={{ width: `${Math.min(100, (tab / nextMilestone.threshold) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ContractsLeaderboard({ players }: { players: ContractsPlayer[] }) {
  const sorted = [...players]
    .filter(p => p.connected)
    .sort((a, b) => b.sips + b.shots * 5 - (a.sips + a.shots * 5));

  return (
    <div className="leaderboard-list">
      <h3>DRINK COUNTER</h3>
      {sorted.map((player, i) => (
        <div key={player.id} className="leaderboard-row">
          <span className="rank">{i + 1}</span>
          <img src={player.photo} alt={player.name} className="lb-photo" />
          <span className="lb-name">{player.name}</span>
          <span className="lb-drinks">{player.sips}s</span>
          <span className="ct-lb-tab">tab: {player.tabContribution}</span>
        </div>
      ))}
    </div>
  );
}

function AwardCard({
  title,
  subtitle,
  player,
}: {
  title: string;
  subtitle: string;
  player?: ContractsPlayer;
}) {
  if (!player) return null;

  return (
    <div className="ct-award-card">
      <h3>{title}</h3>
      <img src={player.photo} alt={player.name} className="ct-award-photo" />
      <span className="ct-award-name">{player.name}</span>
      <span className="ct-award-subtitle">{subtitle}</span>
    </div>
  );
}
