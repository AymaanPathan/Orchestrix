import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io("http://localhost:3000", {
      transports: ["websocket"],
      autoConnect: true,
    });
  }

  return _socket;
}

// ✅ named export (what you want to import)
export const socket = getSocket();
