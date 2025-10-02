const onlineUsers1 = new Map(); // userId -> socket.id

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on("register", (userId) => {
      socket.userId = userId;
      onlineUsers1.set(userId, socket.id);
      io.to(socket.id).emit("registered", { userId });
    });

    socket.on("call-user", ({ to, from, offer }) => {
      const targetSocketId = onlineUsers1.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("incoming-call", { from, offer });
      } else {
        io.to(socket.id).emit("user-offline", { to });
      }
    });

    socket.on("accept-call", ({ to, from, answer }) => {
      const targetSocketId = onlineUsers1.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-accepted", { from, answer });
      }
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      const targetSocketId = onlineUsers1.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", { candidate, from: socket.userId });
      }
    });

    socket.on("end-call", ({ to, from }) => {
      const targetSocketId = onlineUsers1.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended", { from });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers1.delete(socket.userId);
        console.log("user disconnected", socket.userId);
      }
    });
  });
};
