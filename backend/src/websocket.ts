import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ClientSubscription {
  ws: WebSocket;
  assignmentId: string;
}

const subscriptions = new Set<ClientSubscription>();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: any, socket: any, head: any) => {
    wss.handleUpgrade(request, socket, head, (ws: any) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 New WebSocket client connected.');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'subscribe' && data.assignmentId) {
          console.log(`🔌 Client subscribed to assignment updates: ${data.assignmentId}`);
          subscriptions.add({ ws, assignmentId: data.assignmentId });
        }
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected.');
      // Remove all subscriptions for this socket
      for (const sub of subscriptions) {
        if (sub.ws === ws) {
          subscriptions.delete(sub);
        }
      }
    });

    ws.on('error', (err: any) => {
      console.error('🔌 WebSocket error:', err);
    });
  });

  return wss;
}

export function notifyAssignmentUpdate(assignmentId: string, status: string, payload: any = {}) {
  const message = JSON.stringify({
    assignmentId,
    status,
    ...payload,
  });

  let count = 0;
  for (const sub of subscriptions) {
    if (sub.assignmentId === assignmentId && sub.ws.readyState === WebSocket.OPEN) {
      sub.ws.send(message);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`📡 Broadcasted update for assignment ${assignmentId} to ${count} clients.`);
  }
}
