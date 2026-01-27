import { useState, useRef, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';

export function PlayerApp() {
  const { connected, state, playerId, join, vote, answer, passFail } =
    useGameSocket({ isHost: false });
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
    } catch (err) {
      console.error('Camera access denied:', err);
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

          {/* Pop Quiz - target player answers */}
          {isTargeted && state.currentChallenge.classType === 'pop-quiz' && state.currentChallenge.options && (
            <div className="quiz-section">
              <p className="quiz-question">{state.currentChallenge.description}</p>
              <div className="answer-options">
                {state.currentChallenge.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => answer(state.currentChallenge!.id, option)}
                    className="answer-btn"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Physical Ed / Drama - target player sees their challenge */}
          {isTargeted && (state.currentChallenge.classType === 'physical-education' || state.currentChallenge.classType === 'drama-class') && (
            <div className="you-are-up">
              <h3>YOU ARE UP!</h3>
              <p>{state.currentChallenge.description}</p>
              <p className="wait-msg">Others will vote if you pass...</p>
            </div>
          )}

          {/* Detention / Recess - target sees the challenge */}
          {isTargeted && (state.currentChallenge.classType === 'detention' || state.currentChallenge.classType === 'recess') && (
            <div className="you-are-up">
              <h3>YOU ARE UP!</h3>
              <p>{state.currentChallenge.description}</p>
            </div>
          )}

          {/* Social Studies - everyone votes for a player */}
          {canVote && state.currentChallenge.classType === 'social-studies' && state.currentChallenge.options && (
            <div className="vote-section">
              <p className="vote-prompt">{state.currentChallenge.description}</p>
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
            </div>
          )}

          {/* Physical Ed / Drama - voters see pass/fail */}
          {canVote && (state.currentChallenge.classType === 'physical-education' || state.currentChallenge.classType === 'drama-class') && (
            <div className="pass-fail-vote">
              <p>{state.currentChallenge.description}</p>
              <p>Did they pass?</p>
              <div className="pass-fail-buttons">
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
            </div>
          )}

          {/* Not involved - watch the screen */}
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
