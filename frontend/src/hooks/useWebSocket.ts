import { useState, useEffect, useRef } from 'react';

interface WebSocketOptions {
  url: string;
  onMessage: (data: any) => void;
  reconnectInterval?: number;
}

export function useWebSocket({ url, onMessage, reconnectInterval = 3000 }: WebSocketOptions) {
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          if (isMounted) setConnected(true);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (isMounted) onMessage(data);
          } catch (e) {
            console.error('WebSocket parse error', e);
          }
        };

        ws.current.onclose = () => {
          if (isMounted) {
            setConnected(false);
            reconnectTimer.current = window.setTimeout(connect, reconnectInterval);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error', error);
          ws.current?.close();
        };
      } catch (error) {
        if (isMounted) {
          reconnectTimer.current = window.setTimeout(connect, reconnectInterval);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnection on intentional close
        ws.current.close();
      }
    };
  }, [url, reconnectInterval, onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { connected, sendMessage };
}
