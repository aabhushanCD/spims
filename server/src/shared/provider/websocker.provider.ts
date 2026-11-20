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
  let delivered = false;

  for (const socket of [...sockets]) {
    if (socket.readyState !== socket.OPEN) {
      sockets.delete(socket);
      continue;
    }

    try {
      socket.send(data);
      delivered = true;
    } catch {
      // A socket can close between the readyState check and send(). Never let
      // that surface as a delivery failure for the notification row.
      sockets.delete(socket);
    }
  }

  if (sockets.size === 0) {
    connections.delete(userId);
  }

  return delivered;
}
