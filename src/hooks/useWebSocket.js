import { useEffect, useMemo, useRef, useState } from 'react';

function getWebSocketUrl() {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const normalized = String(apiBase)
      .replace(/\/+$/, '')
      .replace(/\/api$/, '')
      .replace(/\/_\/backend$/, '');
    if (normalized.startsWith('https://')) return normalized.replace('https://', 'wss://') + '/ws/dashboard';
    if (normalized.startsWith('http://')) return normalized.replace('http://', 'ws://') + '/ws/dashboard';
    if (normalized.startsWith('/')) return `${window.location.origin.replace('http', 'ws')}${normalized}/ws/dashboard`;
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/dashboard`;
}

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const wsUrl = useMemo(() => getWebSocketUrl(), []);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send('ping');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLastEvent(parsed);
        if (parsed?.type === 'audit_started') setIsAuditRunning(true);
        if (parsed?.type === 'audit_completed') setIsAuditRunning(false);
      } catch {
        // Ignore non-JSON keepalive messages.
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsAuditRunning(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      try {
        ws.close();
      } catch {
        // no-op
      }
    };
  }, [wsUrl]);

  return { isConnected, isAuditRunning, lastEvent };
}
