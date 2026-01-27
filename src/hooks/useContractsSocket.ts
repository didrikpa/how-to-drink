import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ContractsGameState,
  ContractsSettings,
  ContractsClientMessage,
  ContractsServerMessage,
  PlayerTokens,
} from '../types/contracts';

interface UseContractsSocketOptions {
  isHost: boolean;
}

interface UseContractsSocketReturn {
  connected: boolean;
  state: ContractsGameState | null;
  playerId: string | null;
  error: string | null;
  paused: boolean;

  // Shared actions
  join: (name: string, photo: string) => void;
  startGame: (settings: ContractsSettings) => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Contract actions
  signContract: (contractId: string) => void;
  witnessContract: (contractId: string) => void;
  nopeContract: (contractId: string) => void;

  // Token actions
  useToken: (token: keyof PlayerTokens, targetContractId?: string, targetPlayerId?: string) => void;

  // Buyout actions
  proposeBuyout: (contractId: string) => void;
  voteBuyout: (approve: boolean) => void;

  // Event actions
  triggerEvent: (eventType: string) => void;
  reportDuelResult: (contractId: string, loserId: string) => void;
}

export function useContractsSocket({ isHost }: UseContractsSocketOptions): UseContractsSocketReturn {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ContractsGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
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
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws-contracts`);
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
      // Error will trigger onclose, so reconnect happens there
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const message: ContractsServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse contracts message:', err);
      }
    };
  }, []);

  const handleMessage = (message: ContractsServerMessage) => {
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
      case 'paused':
        setPaused(true);
        break;
      case 'resumed':
        setPaused(false);
        break;
      case 'contract-signed':
      case 'event':
      case 'buyout-proposed':
      case 'buyout-result':
      case 'round-result':
      case 'milestone-triggered':
      case 'game-end':
        // These are handled through full state updates
        // but could be used for notifications/animations
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

  const send = useCallback((message: ContractsClientMessage) => {
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

  const startGame = useCallback(
    (settings: ContractsSettings) => {
      send({ type: 'start-game', settings });
    },
    [send]
  );

  const endGame = useCallback(() => {
    send({ type: 'end-game' });
  }, [send]);

  const pauseGame = useCallback(() => {
    send({ type: 'pause-game' });
  }, [send]);

  const resumeGame = useCallback(() => {
    send({ type: 'resume-game' });
  }, [send]);

  const signContract = useCallback(
    (contractId: string) => {
      send({ type: 'sign-contract', contractId });
    },
    [send]
  );

  const witnessContract = useCallback(
    (contractId: string) => {
      send({ type: 'witness-contract', contractId });
    },
    [send]
  );

  const nopeContract = useCallback(
    (contractId: string) => {
      send({ type: 'nope-contract', contractId });
    },
    [send]
  );

  const useToken = useCallback(
    (token: keyof PlayerTokens, targetContractId?: string, targetPlayerId?: string) => {
      send({ type: 'use-token', token, targetContractId, targetPlayerId });
    },
    [send]
  );

  const proposeBuyout = useCallback(
    (contractId: string) => {
      send({ type: 'propose-buyout', contractId });
    },
    [send]
  );

  const voteBuyout = useCallback(
    (approve: boolean) => {
      send({ type: 'vote-buyout', approve });
    },
    [send]
  );

  const triggerEvent = useCallback(
    (eventType: string) => {
      send({ type: 'trigger-event', eventType });
    },
    [send]
  );

  const reportDuelResult = useCallback(
    (contractId: string, loserId: string) => {
      send({ type: 'report-duel-result', contractId, loserId });
    },
    [send]
  );

  return {
    connected,
    state,
    playerId,
    error,
    paused,
    join,
    startGame,
    endGame,
    pauseGame,
    resumeGame,
    signContract,
    witnessContract,
    nopeContract,
    useToken,
    proposeBuyout,
    voteBuyout,
    triggerEvent,
    reportDuelResult,
  };
}
