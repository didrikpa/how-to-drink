import { useState, useRef, useCallback } from 'react';
import { useGhostHostSocket } from '../hooks/useGhostHostSocket';

export function GhostHostPlayerApp() {
  const {
    connected,
    state,
    playerId,
    privateState,
    hauntTriggered,
    join,
    haunt,
    vote,
    clearHaunt,
  } = useGhostHostSocket({ isHost: false });

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
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

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const bitmap = await createImageBitmap(file, {
          resizeWidth: 400,
          resizeHeight: 400,
          resizeQuality: 'medium',
        });
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          bitmap.close();
          return;
        }

        const size = Math.min(bitmap.width, bitmap.height);
        const x = (bitmap.width - size) / 2;
        const y = (bitmap.height - size) / 2;
        ctx.drawImage(bitmap, x, y, size, size, 0, 0, 200, 200);
        bitmap.close();

        setPhoto(canvas.toDataURL('image/jpeg', 0.5));
      } catch {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return;
          }
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
          setPhoto(canvas.toDataURL('image/jpeg', 0.5));
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    },
    []
  );

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

  const handleVote = (targetId: string) => {
    setVotedFor(targetId);
    vote(targetId);
  };

  if (!connected) {
    return (
      <div className="player-app gh-player-app">
        <h1 className="gh-title">GHOST HOST</h1>
        <p>Connecting to seance...</p>
      </div>
    );
  }

  // Not joined yet - show join form
  if (!playerId) {
    return (
      <div className="player-app join-screen gh-player-app">
        <h1 className="gh-title">GHOST HOST</h1>
        <p className="subtitle gh-subtitle">JOIN THE SEANCE</p>

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
                <button onClick={startCamera} className="camera-btn">
                  TAKE PHOTO
                </button>
                {cameraError && <p className="camera-error">{cameraError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="file-btn"
                >
                  CHOOSE FROM GALLERY
                </button>
              </>
            )}
            {cameraActive && (
              <div className="camera-view">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                <button onClick={takePhoto} className="capture-btn">
                  SNAP
                </button>
              </div>
            )}
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Your photo" />
                <button onClick={() => setPhoto(null)} className="retake-btn">
                  RETAKE
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={!name.trim() || !photo}
            className="join-btn gh-join-btn"
          >
            JOIN SEANCE
          </button>
        </div>
      </div>
    );
  }

  // Joined - show game state
  const currentPlayer = state?.players.find((p) => p.id === playerId);
  const isGhost = privateState?.role === 'ghost';
  const otherPlayers = state?.players.filter(
    (p) => p.id !== playerId && p.connected
  );

  return (
    <div className="player-app in-game gh-player-app">
      <header className="player-header gh-player-header">
        <span className="player-name">{currentPlayer?.name}</span>
        {isGhost && <span className="gh-role-badge gh-role-ghost">GHOST</span>}
        {!isGhost && privateState && (
          <span className="gh-role-badge gh-role-mortal">MORTAL</span>
        )}
      </header>

      {/* LOBBY */}
      {state?.phase === 'lobby' && (
        <div className="waiting-screen gh-waiting">
          <h2>WAITING FOR SEANCE TO BEGIN</h2>
          <p>Look at the main screen</p>
        </div>
      )}

      {/* PLAYING - GHOST VIEW */}
      {state?.phase === 'playing' && isGhost && privateState?.role === 'ghost' && (
        <div className="gh-ghost-view">
          <h2 className="gh-your-role">YOU ARE THE GHOST</h2>

          <div className="gh-mission-card">
            <span className="gh-mission-label">YOUR MISSION</span>
            <span className="gh-mission-category">
              {privateState.currentMission.category.toUpperCase()}
            </span>
            <p className="gh-mission-text">{privateState.currentMission.text}</p>
          </div>

          <button className="gh-haunt-btn" onClick={haunt}>
            HAUNT
          </button>
          <p className="gh-haunt-hint">
            Press when you complete a mission to get a new one
          </p>

          <div className="gh-rules-reminder">
            <h4>COVER RULES</h4>
            <ul>
              {state.globalRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* PLAYING - MORTAL VIEW */}
      {state?.phase === 'playing' && !isGhost && privateState && (
        <div className="gh-mortal-view">
          <h2 className="gh-your-role">YOU ARE A MORTAL</h2>
          <p className="gh-mortal-hint">Watch for suspicious behavior...</p>

          <div className="gh-haunt-counter-player">
            <span className="gh-haunt-label">HAUNTS</span>
            <span className="gh-haunt-value">{state.hauntCount}</span>
          </div>

          <div className="gh-rules-reminder">
            <h4>COVER RULES</h4>
            <ul>
              {state.globalRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          {hauntTriggered && (
            <div className="gh-haunt-overlay-player" onClick={clearHaunt}>
              <div className="gh-haunt-text-player">HAUNT</div>
              <p className="gh-haunt-dismiss">Tap to dismiss</p>
            </div>
          )}
        </div>
      )}

      {/* VOTING - MORTAL */}
      {state?.phase === 'voting' && !isGhost && (
        <div className="gh-voting-player">
          <h2>WHO IS THE GHOST?</h2>
          <p className="gh-voting-hint">Vote for the player you suspect</p>

          <div className="gh-vote-grid">
            {otherPlayers?.map((player) => (
              <button
                key={player.id}
                className={`gh-vote-btn ${votedFor === player.id ? 'gh-voted' : ''}`}
                onClick={() => handleVote(player.id)}
              >
                <img
                  src={player.photo}
                  alt={player.name}
                  className="gh-vote-btn-photo"
                />
                <span className="gh-vote-btn-name">{player.name}</span>
                {votedFor === player.id && (
                  <span className="gh-vote-check">VOTED</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VOTING - GHOST */}
      {state?.phase === 'voting' && isGhost && (
        <div className="gh-voting-ghost">
          <h2>VOTING IN PROGRESS</h2>
          <p className="gh-ghost-wait">The mortals are deciding your fate...</p>
          <div className="gh-ghost-suspense">
            <span className="gh-suspense-icon">?</span>
          </div>
        </div>
      )}

      {/* RESULT */}
      {state?.phase === 'result' && state.votingResult && (
        <div className="gh-result-player">
          <h2 className="gh-result-title-player">
            {state.votingResult.correctGuess ? 'GHOST CAUGHT' : 'GHOST ESCAPED'}
          </h2>

          <div className="gh-result-reveal">
            <p>The Ghost was</p>
            <span className="gh-result-name">{state.votingResult.ghostName}</span>
          </div>

          {isGhost ? (
            state.votingResult.correctGuess ? (
              <p className="gh-result-penalty">You got caught! Take a penalty shot!</p>
            ) : (
              <p className="gh-result-win">You escaped! Everyone else drinks!</p>
            )
          ) : state.votingResult.correctGuess ? (
            <p className="gh-result-win">You caught the Ghost!</p>
          ) : (
            <p className="gh-result-penalty">The Ghost escaped! Take a drink!</p>
          )}
        </div>
      )}
    </div>
  );
}
