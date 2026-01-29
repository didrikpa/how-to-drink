import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GhostHostGameState,
  GhostHostSettings,
  GhostHostClientMessage,
  GhostHostServerMessage,
  PrivateState,
} from '../types/ghosthost';

interface UseGhostHostSocketOptions {
  isHost: boolean;
}

interface UseGhostHostSocketReturn {
  connected: boolean;
  state: GhostHostGameState | null;
  playerId: string | null;
  privateState: PrivateState | null;
  error: string | null;
  hauntTriggered: boolean;

  // Actions
  join: (name: string, photo: string) => void;
  startGame: (settings?: Partial<GhostHostSettings>) => void;
  haunt: () => void;
  vote: (targetId: string) => void;
  endGame: () => void;
  clearHaunt: () => void;
}

export function useGhostHostSocket({
  isHost,
}: UseGhostHostSocketOptions): UseGhostHostSocketReturn {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GhostHostGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hauntTriggered, setHauntTriggered] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hauntTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Store connect function in ref to avoid circular dependency
  const connectRef = useRef<() => void>(() => {});

  const handleMessage = useCallback((message: GhostHostServerMessage) => {
    switch (message.type) {
      case 'state':
        setState(message.state);
        break;
      case 'assigned-id':
        setPlayerId(message.playerId);
        break;
      case 'private-state':
        setPrivateState(message.privateState);
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
      case 'haunt-triggered':
        setHauntTriggered(true);
        // Auto-clear after 3 seconds
        if (hauntTimeoutRef.current) {
          clearTimeout(hauntTimeoutRef.current);
        }
        hauntTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setHauntTriggered(false);
          }
        }, 3000);
        break;
      case 'new-mission':
        // Update ghost's current mission in private state
        setPrivateState((prev) => {
          if (prev?.role === 'ghost') {
            return {
              ...prev,
              currentMission: message.mission,
            };
          }
          return prev;
        });
        break;
      case 'voting-started':
        // Clear haunt state when voting starts
        setHauntTriggered(false);
        break;
      case 'voting-result':
        // Result is in state, nothing extra needed
        break;
      case 'error':
        setError(message.message);
        break;
    }
  }, []);

  useEffect(() => {
    connectRef.current = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws-ghosthost`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        setError(null);
        if (isHost) {
          ws.send(JSON.stringify({ type: 'host-connect' }));
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectRef.current();
          }
        }, 1000);
      };

      ws.onerror = () => {
        // Error will trigger onclose
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message: GhostHostServerMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse ghosthost message:', err);
        }
      };
    };
  }, [isHost, handleMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connectRef.current();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (hauntTimeoutRef.current) {
        clearTimeout(hauntTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const send = useCallback((message: GhostHostClientMessage) => {
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
    (settings?: Partial<GhostHostSettings>) => {
      send({ type: 'start-game', settings });
    },
    [send]
  );

  const haunt = useCallback(() => {
    send({ type: 'haunt' });
  }, [send]);

  const vote = useCallback(
    (targetId: string) => {
      send({ type: 'vote', targetId });
    },
    [send]
  );

  const endGame = useCallback(() => {
    send({ type: 'end-game' });
  }, [send]);

  const clearHaunt = useCallback(() => {
    setHauntTriggered(false);
  }, []);

  return {
    connected,
    state,
    playerId,
    privateState,
    error,
    hauntTriggered,
    join,
    startGame,
    haunt,
    vote,
    endGame,
    clearHaunt,
  };
}
