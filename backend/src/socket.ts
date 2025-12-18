import { Server } from "socket.io";

export function setupSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("🔌 socket connected:", socket.id);

    socket.on("join", (executionId: string) => {
      console.log("📥 socket joined execution:", executionId);
      socket.join(executionId);
    });

    socket.on("disconnect", () => {
      console.log("❌ socket disconnected:", socket.id);
    });
  });
}
