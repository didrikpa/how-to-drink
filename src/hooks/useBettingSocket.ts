import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BettingGameState,
  BettingClientMessage,
  BettingServerMessage,
  BettingSettings,
  Bet,
} from '../types/betting';

interface UseBettingSocketOptions {
  isHost: boolean;
}

interface UseBettingSocketReturn {
  connected: boolean;
  state: BettingGameState | null;
  playerId: string | null;
  error: string | null;
  join: (name: string, photo: string) => void;
  startBetting: () => void;
  placeBet: (bet: Bet) => void;
  lockBets: () => void;
  giveDrink: (toPlayerId: string, amount: number, drinkType: 'sip' | 'shot') => void;
  nextRound: () => void;
  endGame: () => void;
  kickPlayer: (playerId: string) => void;
  updateSettings: (settings: Partial<BettingSettings>) => void;
}

export function useBettingSocket({ isHost }: UseBettingSocketOptions): UseBettingSocketReturn {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<BettingGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHostRef = useRef(isHost);
  const mountedRef = useRef(true);

  isHostRef.current = isHost;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws-betting`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
      if (isHostRef.current) {
        ws.send(JSON.stringify({ type: 'host-connect' }));
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 1000);
    };

    ws.onerror = () => {
      // Error will trigger onclose
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const message: BettingServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };
  }, []);

  const handleMessage = (message: BettingServerMessage) => {
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
      case 'race-update':
        setState((prev) =>
          prev
            ? { ...prev, racers: message.racers }
            : prev
        );
        break;
      case 'error':
        setError(message.message);
        break;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((message: BettingClientMessage) => {
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

  const startBetting = useCallback(() => {
    send({ type: 'start-betting' });
  }, [send]);

  const placeBet = useCallback(
    (bet: Bet) => {
      send({ type: 'place-bet', bet });
    },
    [send]
  );

  const lockBets = useCallback(() => {
    send({ type: 'lock-bets' });
  }, [send]);

  const giveDrink = useCallback(
    (toPlayerId: string, amount: number, drinkType: 'sip' | 'shot') => {
      send({ type: 'give-drink', toPlayerId, amount, drinkType });
    },
    [send]
  );

  const nextRound = useCallback(() => {
    send({ type: 'next-round' });
  }, [send]);

  const endGame = useCallback(() => {
    send({ type: 'end-game' });
  }, [send]);

  const kickPlayer = useCallback(
    (id: string) => {
      send({ type: 'kick-player', playerId: id });
    },
    [send]
  );

  const updateSettings = useCallback(
    (settings: Partial<BettingSettings>) => {
      send({ type: 'update-settings', settings });
    },
    [send]
  );

  return {
    connected,
    state,
    playerId,
    error,
    join,
    startBetting,
    placeBet,
    lockBets,
    giveDrink,
    nextRound,
    endGame,
    kickPlayer,
    updateSettings,
  };
}
