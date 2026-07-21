import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuthToken } from '@/lib/auth';

export function useWebSocket(bondId) {
  const [connected, setConnected] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    if (!bondId) return;

    const token = getAuthToken();
    const wsUrl = process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000';
    const url = `${wsUrl}/ws/bonds/${bondId}${token ? `?token=${token}` : ''}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to bond', bondId);
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected from bond', bondId);
        setConnected(false);
        wsRef.current = null;
        attemptReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      attemptReconnect();
    }
  }, [bondId]);

  const handleMessage = (message) => {
    switch (message.type) {
      case 'presence':
        setViewers(message.viewers || 0);
        break;
      case 'bond_activated':
      case 'participant_joined':
      case 'proof_submitted':
      case 'bond_released':
      case 'bond_failed':
        // Store event message
        setMessages(prev => [...prev.slice(-49), message]);
        break;
      case 'chat':
        setMessages(prev => [...prev.slice(-49), message]);
        break;
      case 'reaction':
        setMessages(prev => [...prev.slice(-49), message]);
        break;
      case 'pong':
        // Keep-alive response
        break;
      default:
        console.log('[WS] Unknown message type:', message.type);
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('[WS] Max reconnection attempts reached');
      return;
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      console.log(`[WS] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
      connect();
    }, reconnectDelay);
  };

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChat = useCallback((userName, text) => {
    sendMessage({ type: 'chat', user_name: userName, message: text });
  }, [sendMessage]);

  const sendReaction = useCallback((emoji) => {
    sendMessage({ type: 'reaction', emoji });
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    viewers,
    messages,
    sendChat,
    sendReaction,
    reconnect: connect,
  };
}
