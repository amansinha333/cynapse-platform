import { useEffect, useMemo, useRef, useState } from 'react';

const TOKEN_KEY = 'cynapse_jwt_token';

function getWebSocketUrl(token) {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) {
    return explicit.includes('?')
      ? `${explicit}&token=${encodeURIComponent(token || '')}`
      : `${explicit}?token=${encodeURIComponent(token || '')}`;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const normalized = String(apiBase)
      .replace(/\/+$/, '')
      .replace(/\/api$/, '')
      .replace(/\/_\/backend$/, '');
    if (normalized.startsWith('https://')) return `${normalized.replace('https://', 'wss://')}/ws/dashboard?token=${encodeURIComponent(token || '')}`;
    if (normalized.startsWith('http://')) return `${normalized.replace('http://', 'ws://')}/ws/dashboard?token=${encodeURIComponent(token || '')}`;
    if (normalized.startsWith('/')) return `${window.location.origin.replace('http', 'ws')}${normalized}/ws/dashboard?token=${encodeURIComponent(token || '')}`;
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/dashboard?token=${encodeURIComponent(token || '')}`;
}

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  const wsUrl = useMemo(() => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    return getWebSocketUrl(token);
  }, []);

  useEffect(() => {
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          setLastEvent(parsed);
          if (parsed?.type === 'audit_started') setIsAuditRunning(true);
          if (parsed?.type === 'audit_completed' || parsed?.type === 'audit_error') setIsAuditRunning(false);
        } catch {
          // Ignore non-JSON keepalive messages.
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsAuditRunning(false);
        if (isUnmounted) return;
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      try {
        wsRef.current?.close();
      } catch {
        // no-op
      }
    };
  }, [wsUrl]);

  return { isConnected, isAuditRunning, lastEvent };
}
