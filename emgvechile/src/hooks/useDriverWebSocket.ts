import { useState, useEffect, useRef } from 'react';
import type { EmergencyRun } from '../types';

export function useDriverWebSocket(requestId?: number) {
  const [corridor, setCorridor] = useState<EmergencyRun | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!requestId) return;

    const wsUrl = `ws://localhost:8000/ws/driver/${requestId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CORRIDOR_UPDATE' && msg.data) {
          setCorridor(msg.data);
        }
      } catch {
        // ignore
      }
    };
    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, [requestId]);

  return { corridor, connected };
}
