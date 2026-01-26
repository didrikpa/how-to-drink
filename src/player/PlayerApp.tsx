import { useState, useRef, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';

export function PlayerApp() {
  const { connected, state, playerId, join, vote, answer, passFail } =
    useGameSocket({ isHost: false });
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPhoto(dataUrl);

    // Stop camera
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
        <p className="subtitle">DRINKING SCHOOL</p>

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
              <button onClick={startCamera} className="camera-btn">
                TAKE PHOTO
              </button>
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
            className="join-btn"
          >
            JOIN CLASS
          </button>
        </div>
      </div>
    );
  }

  // Joined - show game state
  const currentPlayer = state?.players.find((p) => p.id === playerId);
  const isTargeted = state?.currentChallenge?.targetPlayerIds.includes(playerId);
  const canVote = state?.currentChallenge?.votingPlayerIds.includes(playerId);

  return (
    <div className="player-app in-game">
      <header className="player-header">
        <span className="player-name">{currentPlayer?.name}</span>
        <span className="drink-count">
          {currentPlayer?.sips}s / {currentPlayer?.shots}sh
        </span>
      </header>

      {state?.phase === 'lobby' && (
        <div className="waiting-screen">
          <h2>WAITING FOR CLASS TO START</h2>
          <p>Look at the main screen</p>
        </div>
      )}

      {state?.phase === 'countdown' && (
        <div className="countdown-screen">
          <h2>CLASS IN SESSION</h2>
          <p>Watch the main screen...</p>
        </div>
      )}

      {state?.phase === 'challenge' && state.currentChallenge && (
        <div className="challenge-screen">
          <h2>{state.currentChallenge.title}</h2>

          {isTargeted && (
            <div className="you-are-up">
              <h3>YOU ARE UP!</h3>
              <p>{state.currentChallenge.description}</p>
            </div>
          )}

          {canVote && state.currentChallenge.options && (
            <div className="vote-options">
              {state.currentChallenge.options.map((option) => (
                <button
                  key={option}
                  onClick={() => vote(state.currentChallenge!.id, option)}
                  className="vote-btn"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {canVote && !state.currentChallenge.options && (
            <div className="pass-fail-vote">
              <p>Did they pass?</p>
              <button
                onClick={() => passFail(state.currentChallenge!.id, true)}
                className="pass-btn"
              >
                PASS
              </button>
              <button
                onClick={() => passFail(state.currentChallenge!.id, false)}
                className="fail-btn"
              >
                FAIL
              </button>
            </div>
          )}

          {!isTargeted && !canVote && (
            <p>Watch the main screen</p>
          )}
        </div>
      )}

      {state?.phase === 'result' && (
        <div className="result-screen">
          <h2>RESULT</h2>
          <p>Check the main screen</p>
        </div>
      )}
    </div>
  );
}
