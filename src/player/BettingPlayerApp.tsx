import { useState, useRef, useEffect } from 'react';
import { useBettingSocket } from '../hooks/useBettingSocket';
import type { Bet, RacerState } from '../types/betting';

export function BettingPlayerApp() {
  const {
    connected,
    state,
    playerId,
    join,
    placeBet,
    giveDrink,
  } = useBettingSocket({ isHost: false });

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [selectedRacer, setSelectedRacer] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(1);
  const [betType, setBetType] = useState<'sip' | 'shot'>('sip');
  const [lastRoundNumber, setLastRoundNumber] = useState(0);

  // Clear bets when a new round starts
  useEffect(() => {
    if (state && state.phase === 'betting' && state.roundNumber !== lastRoundNumber) {
      setMyBets([]);
      setSelectedRacer(null);
      setBetAmount(1);
      setLastRoundNumber(state.roundNumber);
    }
  }, [state, lastRoundNumber]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Use file upload.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 400, 400);
    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);
        setPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleJoin = () => {
    if (name.trim() && photo) {
      join(name.trim(), photo);
    }
  };

  const handlePlaceBet = () => {
    if (selectedRacer === null) return;

    const bet: Bet = {
      racerId: selectedRacer,
      amount: betAmount,
      type: betType,
    };

    placeBet(bet);

    // Track locally
    setMyBets((prev) => {
      const existing = prev.findIndex((b) => b.racerId === selectedRacer);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = bet;
        return updated;
      }
      return [...prev, bet];
    });

    setSelectedRacer(null);
    setBetAmount(1);
  };

  const handleGiveDrink = (toPlayerId: string) => {
    giveDrink(toPlayerId, 1, 'sip');
  };

  if (!connected) {
    return (
      <div className="player-app bt-player-app">
        <h1>RACE BETTING</h1>
        <p className="subtitle">Connecting...</p>
      </div>
    );
  }

  // Join screen
  if (!playerId || !state) {
    return (
      <div className="player-app join-screen bt-player-app">
        <a href="/" className="back-btn bt-back-btn">BACK TO MENU</a>
        <h1>RACE BETTING</h1>
        <form
          className="join-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
        >
          <input
            type="text"
            className="name-input"
            placeholder="YOUR NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
          />

          <div className="photo-section">
            {!photo && !cameraActive && (
              <>
                <button type="button" className="camera-btn" onClick={startCamera}>
                  TAKE SELFIE
                </button>
                {cameraError && <p className="camera-error">{cameraError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="camera-btn bt-gallery-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  SELECT PHOTO
                </button>
              </>
            )}

            {cameraActive && (
              <div className="camera-view">
                <video ref={videoRef} autoPlay playsInline className="camera-video" />
                <button type="button" className="capture-btn" onClick={capturePhoto}>
                  CAPTURE
                </button>
              </div>
            )}

            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Your photo" />
                <button type="button" className="retake-btn" onClick={() => setPhoto('')}>
                  RETAKE
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="join-btn bt-join-btn"
            disabled={!name.trim() || !photo}
          >
            JOIN RACE
          </button>
        </form>
      </div>
    );
  }

  const me = state.players.find((p) => p.id === playerId);
  if (!me) {
    return (
      <div className="player-app bt-player-app">
        <h1>RACE BETTING</h1>
        <p>Reconnecting...</p>
      </div>
    );
  }

  const renderHeader = () => (
    <div className="player-header bt-player-header">
      <span className="player-name">{me.name}</span>
      <span className="drink-count bt-drink-count">{me.totalDrinks} DRINKS</span>
    </div>
  );

  const renderWaiting = () => (
    <div className="waiting-screen bt-waiting">
      <h2>WAITING FOR HOST</h2>
      <p className="bt-waiting-msg">Get ready to place your bets</p>
    </div>
  );

  const renderBetting = () => {
    const timeLeft = state.phaseEndTime
      ? Math.max(0, Math.ceil((state.phaseEndTime - Date.now()) / 1000))
      : 0;

    return (
      <div className="bt-player-betting">
        <h2>PLACE YOUR BETS</h2>
        <div className="bt-player-timer">
          <span className="bt-timer-value">{timeLeft}s</span>
        </div>

        <div className="bt-racer-select">
          {state.racers.map((racer) => {
            const myBet = myBets.find((b) => b.racerId === racer.id);
            return (
              <button
                key={racer.id}
                className={`bt-racer-btn ${selectedRacer === racer.id ? 'bt-selected' : ''} ${myBet ? 'bt-has-bet' : ''}`}
                onClick={() => setSelectedRacer(racer.id)}
                style={{ borderColor: racer.color }}
              >
                <div
                  className="bt-racer-color"
                  style={{ backgroundColor: racer.color }}
                >
                  {racer.id + 1}
                </div>
                <span className="bt-racer-label">{racer.name}</span>
                {myBet && (
                  <span className="bt-bet-badge">
                    {myBet.amount} {myBet.type}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedRacer !== null && (
          <div className="bt-bet-form">
            <div className="bt-bet-controls">
              <div className="bt-amount-control">
                <button onClick={() => setBetAmount(Math.max(1, betAmount - 1))}>-</button>
                <span>{betAmount}</span>
                <button onClick={() => setBetAmount(Math.min(5, betAmount + 1))}>+</button>
              </div>
              <div className="bt-type-toggle">
                <button
                  className={betType === 'sip' ? 'active' : ''}
                  onClick={() => setBetType('sip')}
                >
                  SIPS
                </button>
                <button
                  className={betType === 'shot' ? 'active' : ''}
                  onClick={() => setBetType('shot')}
                >
                  SHOTS
                </button>
              </div>
            </div>
            <button className="bt-confirm-bet" onClick={handlePlaceBet}>
              BET {betAmount} {betType.toUpperCase()}(S)
            </button>
          </div>
        )}

        {myBets.length > 0 && (
          <div className="bt-my-bets">
            <h3>YOUR BETS</h3>
            {myBets.map((bet) => {
              const racer = state.racers.find((r) => r.id === bet.racerId);
              return (
                <div key={bet.racerId} className="bt-bet-summary">
                  <span style={{ color: racer?.color }}>{racer?.name}</span>
                  <span>
                    {bet.amount} {bet.type}(s)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderRacing = () => (
    <div className="bt-player-racing">
      <h2>RACE IN PROGRESS</h2>
      <PlayerRaceTrack racers={state.racers} myBets={myBets} />
    </div>
  );

  const renderDistribution = () => {
    const myDrinksToGive = state.winnerDrinksToGive[playerId] || 0;
    const isWinner = myDrinksToGive > 0;
    const winningRacer = state.racers.find((r) => r.id === state.winningRacer);

    const timeLeft = state.phaseEndTime
      ? Math.max(0, Math.ceil((state.phaseEndTime - Date.now()) / 1000))
      : 0;

    // Check my bets to see what happened
    const myWinningBets = myBets.filter((b) => b.racerId === state.winningRacer);
    const myLosingBets = myBets.filter((b) => b.racerId !== state.winningRacer);

    const otherPlayers = state.players.filter(
      (p) => p.id !== playerId && p.connected
    );

    return (
      <div className="bt-player-distribution">
        <h2>{winningRacer?.name} WINS</h2>

        <div className="bt-player-timer">
          <span className="bt-timer-value">{timeLeft}s</span>
        </div>

        {isWinner ? (
          <div className="bt-winner-ui">
            <p className="bt-you-won">YOU WON! Give out {myDrinksToGive} drinks</p>
            <div className="bt-give-drink-grid">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  className="bt-give-drink-btn"
                  onClick={() => handleGiveDrink(player.id)}
                  disabled={myDrinksToGive <= 0}
                >
                  <img src={player.photo} alt={player.name} />
                  <span>{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bt-loser-ui">
            {myLosingBets.length > 0 && (
              <div className="bt-you-lost">
                <p>YOU DRINK:</p>
                {myLosingBets.map((bet) => {
                  const racer = state.racers.find((r) => r.id === bet.racerId);
                  return (
                    <p key={bet.racerId} className="bt-lost-bet">
                      {bet.amount} {bet.type}(s) (bet on {racer?.name})
                    </p>
                  );
                })}
              </div>
            )}
            {myWinningBets.length > 0 && myLosingBets.length === 0 && (
              <p className="bt-safe">You bet correctly but had no losing bets.</p>
            )}
            {myBets.length === 0 && (
              <p className="bt-no-bet">You didn't bet this round.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const winningRacer = state.racers.find((r) => r.id === state.winningRacer);

    return (
      <div className="bt-player-results">
        <h2>ROUND COMPLETE</h2>
        <p className="bt-winner-announce">{winningRacer?.name} WON</p>

        <div className="bt-round-summary">
          <p>Your total drinks: {me.totalDrinks}</p>
        </div>

        <p className="bt-waiting-msg">Waiting for next round...</p>
      </div>
    );
  };

  return (
    <div className="player-app in-game bt-player-app">
      {renderHeader()}

      {state.phase === 'lobby' && renderWaiting()}
      {state.phase === 'betting' && renderBetting()}
      {state.phase === 'racing' && renderRacing()}
      {state.phase === 'distribution' && renderDistribution()}
      {state.phase === 'results' && renderResults()}
    </div>
  );
}

function PlayerRaceTrack({
  racers,
  myBets,
}: {
  racers: RacerState[];
  myBets: Bet[];
}) {
  return (
    <div className="bt-player-track">
      {racers.map((racer) => {
        const hasBet = myBets.some((b) => b.racerId === racer.id);
        return (
          <div
            key={racer.id}
            className={`bt-player-lane ${hasBet ? 'bt-my-bet' : ''}`}
          >
            <div className="bt-player-lane-label" style={{ color: racer.color }}>
              {racer.id + 1}
            </div>
            <div className="bt-player-lane-track">
              <div
                className="bt-player-car"
                style={{
                  left: `${racer.position}%`,
                  backgroundColor: racer.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
