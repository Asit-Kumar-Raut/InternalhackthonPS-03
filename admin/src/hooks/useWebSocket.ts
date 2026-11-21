import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/live';

export interface LiveJunction {
  id: number;
  name: string;
  current_phase: string;
  state: string;
  time_in_state: number;
  signals: {
    NS: string;
    EW: string;
  };
  phases: {
    NS?: { count: number; speed: number; level: string };
    EW?: { count: number; speed: number; level: string };
  };
}

export interface LiveState {
  junctions: LiveJunction[];
  emergency_runs: any[];
  events: any[];
  timestamp?: number;
}

const defaultState: LiveState = {
  junctions: [
    { id: 1, name: 'J1', current_phase: 'NS', state: 'GREEN', time_in_state: 10, signals: { NS: 'GREEN', EW: 'ALL_RED' }, phases: {} },
    { id: 2, name: 'J2', current_phase: 'EW', state: 'GREEN', time_in_state: 8, signals: { NS: 'ALL_RED', EW: 'GREEN' }, phases: {} },
    { id: 3, name: 'J3', current_phase: 'NS', state: 'GREEN', time_in_state: 15, signals: { NS: 'GREEN', EW: 'ALL_RED' }, phases: {} },
    { id: 4, name: 'J4', current_phase: 'EW', state: 'GREEN', time_in_state: 12, signals: { NS: 'ALL_RED', EW: 'GREEN' }, phases: {} },
  ],
  emergency_runs: [],
  events: [],
};

export function useWebSocket() {
  const [liveState, setLiveState] = useState<LiveState>(defaultState);
  const [connected, setConnected] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'LIVE_STATE' && msg.data) {
            setLiveState((prev) => ({
              ...prev,
              junctions: msg.data.junctions || prev.junctions,
              emergency_runs: msg.data.emergency_runs || prev.emergency_runs,
              timestamp: msg.data.timestamp,
            }));
          } else if (msg.type) {
            setRecentEvents((prev) => [msg, ...prev].slice(0, 50));
          }
        } catch {
          // ignore parse error
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    liveState,
    connected,
    isConnected: connected,
    recentEvents,
  };
}
