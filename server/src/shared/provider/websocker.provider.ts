import type { WebSocket } from "ws";

const connections = new Map<string, Set<WebSocket>>();

export function register(userId: string, socket: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(socket);

  socket.on("close", () => {
    connections.get(userId)?.delete(socket);
  });
}

export function push(
  userId: string,
  payload: { title: string; message: string },
): boolean {
  const sockets = connections.get(userId);
  if (!sockets || sockets.size === 0) {
    return false;
  }
  const data = JSON.stringify(payload);
  for (const socket of sockets) {
    socket.send(data);
  }
  return true;
}
