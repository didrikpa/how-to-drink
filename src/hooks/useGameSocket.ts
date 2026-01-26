import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GameState,
  Player,
  ClientMessage,
  ServerMessage,
  GameSettings,
} from '../types/game';

interface UseGameSocketOptions {
  isHost: boolean;
}

interface UseGameSocketReturn {
  connected: boolean;
  state: GameState | null;
  playerId: string | null;
  error: string | null;
  join: (name: string, photo: string) => void;
  startGame: () => void;
  vote: (challengeId: string, vote: string) => void;
  answer: (challengeId: string, answer: string) => void;
  passFail: (challengeId: string, passed: boolean) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  kickPlayer: (playerId: string) => void;
  endGame: () => void;
}

export function useGameSocket({ isHost }: UseGameSocketOptions): UseGameSocketReturn {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      if (isHost) {
        send({ type: 'host-connect' });
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [isHost]);

  const handleMessage = (message: ServerMessage) => {
    switch (message.type) {
      case 'state':
        setState(message.state);
        break;
      case 'assigned-id':
        setPlayerId(message.playerId);
        break;
      case 'player-joined':
        setState((prev) =>
          prev
            ? { ...prev, players: [...prev.players, message.player] }
            : prev
        );
        break;
      case 'player-left':
        setState((prev) =>
          prev
            ? {
                ...prev,
                players: prev.players.map((p) =>
                  p.id === message.playerId ? { ...p, connected: false } : p
                ),
              }
            : prev
        );
        break;
      case 'error':
        setError(message.message);
        break;
      case 'challenge-start':
        setState((prev) =>
          prev
            ? { ...prev, phase: 'challenge', currentChallenge: message.challenge }
            : prev
        );
        break;
      case 'challenge-result':
        setState((prev) =>
          prev
            ? { ...prev, phase: 'result', lastResult: message.result }
            : prev
        );
        break;
      case 'countdown-start':
        setState((prev) =>
          prev
            ? { ...prev, phase: 'countdown', countdownTarget: message.targetTime }
            : prev
        );
        break;
    }
  };

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const join = useCallback(
    (name: string, photo: string) => {
      send({ type: 'join', name, photo });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'start-game' });
  }, [send]);

  const vote = useCallback(
    (challengeId: string, voteValue: string) => {
      send({ type: 'vote', challengeId, vote: voteValue });
    },
    [send]
  );

  const answer = useCallback(
    (challengeId: string, answerValue: string) => {
      send({ type: 'answer', challengeId, answer: answerValue });
    },
    [send]
  );

  const passFail = useCallback(
    (challengeId: string, passed: boolean) => {
      send({ type: 'pass-fail', challengeId, passed });
    },
    [send]
  );

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      send({ type: 'update-settings', settings });
    },
    [send]
  );

  const kickPlayer = useCallback(
    (id: string) => {
      send({ type: 'kick-player', playerId: id });
    },
    [send]
  );

  const endGame = useCallback(() => {
    send({ type: 'end-game' });
  }, [send]);

  return {
    connected,
    state,
    playerId,
    error,
    join,
    startGame,
    vote,
    answer,
    passFail,
    updateSettings,
    kickPlayer,
    endGame,
  };
}
