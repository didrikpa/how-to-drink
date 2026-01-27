import { useState, useRef, useCallback } from 'react';
import { useContractsSocket } from '../hooks/useContractsSocket';
import type { ActiveContract, ContractsPlayer, PlayerTokens } from '../types/contracts';

export function ContractsPlayerApp() {
  const {
    connected,
    state,
    playerId,
    paused,
    join,
    signContract,
    witnessContract,
    nopeContract,
    useToken,
    proposeBuyout,
    voteBuyout,
    pauseGame,
    resumeGame,
  } = useContractsSocket({ isHost: false });

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera not available. Use file picker below.');
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Decode at reduced resolution to avoid memory issues on phones
      const bitmap = await createImageBitmap(file, {
        resizeWidth: 400,
        resizeHeight: 400,
        resizeQuality: 'medium',
      });
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) { bitmap.close(); return; }

      const size = Math.min(bitmap.width, bitmap.height);
      const x = (bitmap.width - size) / 2;
      const y = (bitmap.height - size) / 2;
      ctx.drawImage(bitmap, x, y, size, size, 0, 0, 200, 200);
      bitmap.close();

      setPhoto(canvas.toDataURL('image/jpeg', 0.5));
    } catch {
      // Fallback for browsers without createImageBitmap resize support
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); return; }
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
        setPhoto(canvas.toDataURL('image/jpeg', 0.5));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const video = videoRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const x = (video.videoWidth - size) / 2;
    const y = (video.videoHeight - size) / 2;
    ctx.drawImage(video, x, y, size, size, 0, 0, 200, 200);
    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleJoin = () => {
    if (name.trim() && photo) {
      join(name.trim(), photo);
    }
  };

  if (!connected) {
    return (
      <div className="player-app">
        <h1>HOW TO DRINK</h1>
        <p>Connecting to game...</p>
      </div>
    );
  }

  // Not joined yet - show join form
  if (!playerId) {
    return (
      <div className="player-app join-screen">
        <h1>HOW TO DRINK</h1>
        <p className="subtitle">CONTRACTS</p>

        <div className="join-form">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="name-input"
          />

          <div className="photo-section">
            {!photo && !cameraActive && (
              <>
                <button onClick={startCamera} className="camera-btn">TAKE PHOTO</button>
                {cameraError && <p className="camera-error">{cameraError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button onClick={() => fileInputRef.current?.click()} className="file-btn">
                  CHOOSE FROM GALLERY
                </button>
              </>
            )}
            {cameraActive && (
              <div className="camera-view">
                <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                <button onClick={takePhoto} className="capture-btn">SNAP</button>
              </div>
            )}
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Your photo" />
                <button onClick={() => setPhoto(null)} className="retake-btn">RETAKE</button>
              </div>
            )}
          </div>

          <button onClick={handleJoin} disabled={!name.trim() || !photo} className="join-btn">
            JOIN DEAL
          </button>
        </div>
      </div>
    );
  }

  // Joined - show game state
  const currentPlayer = state?.players.find((p) => p.id === playerId);

  return (
    <div className="player-app in-game">
      <header className="player-header">
        <span className="player-name">{currentPlayer?.name}</span>
        <span className="drink-count">{currentPlayer?.sips}s</span>
      </header>

      {/* Pause button - anyone can hit */}
      {state?.phase !== 'lobby' && state?.phase !== 'endgame' && (
        <button className="ct-player-pause" onClick={pauseGame}>
          PAUSE / WATER
        </button>
      )}

      {paused && (
        <div className="ct-paused-overlay">
          <h2>PAUSED</h2>
          <p>Water round - take a break</p>
          <button className="ct-resume-btn" onClick={resumeGame}>RESUME</button>
        </div>
      )}

      {/* LOBBY */}
      {state?.phase === 'lobby' && (
        <div className="waiting-screen">
          <h2>WAITING FOR DEALS TO START</h2>
          <p>Look at the main screen</p>
          {currentPlayer && (
            <TokenDisplay tokens={currentPlayer.tokens} />
          )}
        </div>
      )}

      {/* OFFER PHASE */}
      {state?.phase === 'offer' && (
        <div className="ct-player-offer">
          <h2>SIGN A DEAL</h2>
          <p className="ct-round-info">Round {state.currentRound} / {state.settings.roundCount}</p>

          <div className="ct-player-contracts">
            {state.availableContracts.map((contract) => (
              <PlayerContractCard
                key={contract.id}
                contract={contract}
                playerId={playerId}
                onSign={() => signContract(contract.id)}
                onWitness={() => witnessContract(contract.id)}
                onNope={() => nopeContract(contract.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ACTION PHASE */}
      {state?.phase === 'action' && (
        <div className="ct-player-action">
          <h2>ACTION PHASE</h2>
          <p>Watch the main screen for events</p>

          {currentPlayer && (
            <TokenDisplay tokens={currentPlayer.tokens} />
          )}

          {currentPlayer && currentPlayer.tokens.lawyer > 0 && state.activeContracts.length > 0 && (
            <div className="ct-token-actions">
              <h3>USE LAWYER TOKEN</h3>
              <p className="ct-token-desc">Cancel a hidden clause</p>
              {state.activeContracts.filter(c => !c.settled).map(c => (
                <button
                  key={c.id}
                  className="ct-token-use-btn"
                  onClick={() => useToken('lawyer', c.id)}
                >
                  LAWYER: {c.visibleText.substring(0, 30)}...
                </button>
              ))}
            </div>
          )}

          {currentPlayer && currentPlayer.tokens.sabotage > 0 && state.activeContracts.length > 0 && (
            <div className="ct-token-actions">
              <h3>USE SABOTAGE TOKEN</h3>
              <p className="ct-token-desc">Flip who pays on a contract</p>
              {state.activeContracts.filter(c => !c.settled && c.signedBy).map(c => (
                <button
                  key={c.id}
                  className="ct-token-use-btn ct-sabotage"
                  onClick={() => useToken('sabotage', c.id)}
                >
                  SABOTAGE: {c.visibleText.substring(0, 30)}...
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTLEMENT PHASE */}
      {state?.phase === 'settlement' && (
        <div className="ct-player-settlement">
          <h2>SETTLEMENT</h2>

          {state.currentBuyout ? (
            <div className="ct-buyout-vote">
              <h3>BUYOUT PROPOSAL</h3>
              <p>
                {state.players.find(p => p.id === state.currentBuyout?.proposerId)?.name} wants
                to drink {state.currentBuyout.sipsCost} to erase a contract
              </p>
              <div className="ct-vote-buttons">
                <button className="pass-btn" onClick={() => voteBuyout(true)}>APPROVE</button>
                <button className="fail-btn" onClick={() => voteBuyout(false)}>DENY</button>
              </div>
            </div>
          ) : (
            <div className="ct-buyout-options">
              <h3>PROPOSE A BUYOUT?</h3>
              <p className="ct-buyout-desc">Drink to erase a maturing contract</p>
              {state.activeContracts.filter(c => c.mature && !c.settled).map(c => (
                <button
                  key={c.id}
                  className="ct-buyout-btn"
                  onClick={() => proposeBuyout(c.id)}
                >
                  BUYOUT: {c.visibleText.substring(0, 40)}...
                </button>
              ))}
            </div>
          )}

          {currentPlayer && currentPlayer.tokens.hedge > 0 && (
            <button
              className="ct-hedge-btn"
              onClick={() => useToken('hedge')}
            >
              USE HEDGE (-1 penalty)
            </button>
          )}
        </div>
      )}

      {/* RESULT PHASE */}
      {state?.phase === 'result' && (
        <div className="result-screen">
          <h2>ROUND RESULTS</h2>
          <p>Check the main screen</p>
          {currentPlayer && (
            <div className="ct-player-stats">
              <p>Your sips: {currentPlayer.sips}</p>
              <p>Tab contribution: {currentPlayer.tabContribution}</p>
              <p>Contracts signed: {currentPlayer.contractsSigned}</p>
            </div>
          )}
        </div>
      )}

      {/* ENDGAME */}
      {state?.phase === 'endgame' && (
        <div className="ct-player-endgame">
          <h2>GAME OVER</h2>
          {currentPlayer && (
            <div className="ct-player-final-stats">
              <p>Total sips: {currentPlayer.sips}</p>
              <p>Tab contribution: {currentPlayer.tabContribution}</p>
              <p>Contracts signed: {currentPlayer.contractsSigned}</p>
              <p>Buyouts: {currentPlayer.buyouts}</p>
            </div>
          )}
          <p>Check the main screen for awards!</p>
        </div>
      )}
    </div>
  );
}

// ========== Sub-components ==========

function PlayerContractCard({
  contract,
  playerId,
  onSign,
  onWitness,
  onNope,
}: {
  contract: ActiveContract;
  playerId: string;
  onSign: () => void;
  onWitness: () => void;
  onNope: () => void;
}) {
  const isSigned = contract.signedBy !== null;
  const isSignedByMe = contract.signedBy === playerId;
  const isWitnessed = contract.witnessedBy.includes(playerId);

  return (
    <div className={`ct-player-contract ${isSigned ? 'ct-signed' : ''}`}>
      <p className="ct-contract-text">{contract.visibleText}</p>
      <p className="ct-contract-sips">{contract.baseSips} sips + hidden clause</p>

      <div className="ct-contract-actions">
        {!isSigned && (
          <button className="ct-sign-btn" onClick={onSign}>SIGN</button>
        )}
        {isSigned && !isSignedByMe && !isWitnessed && (
          <button className="ct-witness-btn" onClick={onWitness}>WITNESS</button>
        )}
        {isSignedByMe && (
          <span className="ct-you-signed">YOU SIGNED</span>
        )}
        {isWitnessed && (
          <span className="ct-you-witnessed">WITNESSED</span>
        )}
        <button className="ct-nope-btn" onClick={onNope}>NOPE</button>
      </div>
    </div>
  );
}

function TokenDisplay({ tokens }: { tokens: PlayerTokens }) {
  return (
    <div className="ct-tokens">
      <div className="ct-token">
        <span className="ct-token-icon">L</span>
        <span className="ct-token-count">{tokens.lawyer}</span>
        <span className="ct-token-name">LAWYER</span>
      </div>
      <div className="ct-token">
        <span className="ct-token-icon">H</span>
        <span className="ct-token-count">{tokens.hedge}</span>
        <span className="ct-token-name">HEDGE</span>
      </div>
      <div className="ct-token">
        <span className="ct-token-icon">S</span>
        <span className="ct-token-count">{tokens.sabotage}</span>
        <span className="ct-token-name">SABOTAGE</span>
      </div>
    </div>
  );
}
