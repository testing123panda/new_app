const Message = require('../models/Message');
const sendEmail = require('../utils/sendEmail');

// Track users by their role/userId instead of raw socket count
let connectedUsers = {}; // { userId: socket.id }
let lastSeen = {};
let messageReactions = {};
let typingUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 A socket connected:', socket.id);

    // 🔥 Send all messages when user connects
    Message.find().sort({ createdAt: 1 }).then((msgs) => {
      socket.emit('allMessages', msgs);
    });

    // User connects with a role/userId
    socket.on('userConnected', (userId) => {
      socket.userId = userId;
      connectedUsers[userId] = socket.id;

      // Update online users count
      io.emit('updateOnlineUsers', Object.keys(connectedUsers).length);

      console.log(`👤 User "${userId}" connected. Total: ${Object.keys(connectedUsers).length}`);

      lastSeen[socket.id] = new Date().toLocaleTimeString();
      socket.broadcast.emit('userStatus', `${userId} connected`);
      io.emit('lastSeen', lastSeen);

      if (userId === 'f' || userId === 'm') {
        sendEmail('👤 New User Connected', `User with role "${userId}" just connected.`);
      }

      // Send email if server becomes active
      if (Object.keys(connectedUsers).length <= 2) {
        sendEmail('🟢 Server Active', `Online users: ${Object.keys(connectedUsers).length}`);
      }
    });

    // Handle sending message
    socket.on('sendMessage', async (msg) => {
      const message = new Message({
        text: msg.text,
        sender: msg.sender,
        image: msg.image || null,
      });
      const saved = await message.save();
      io.emit('message', saved); // ✅ live broadcast
    });

    // Mark message as read
    socket.on('messageRead', (messageId, userId) => {
      io.emit('readMessage', { messageId, userId });
      io.emit('seenMessage', { messageId, userId });
    });

    // Typing indicator
    socket.on('typing', (userId) => {
      typingUsers[userId] = true;
      io.emit('typing', Object.keys(typingUsers).length > 0);
    });

    socket.on('stopTyping', (userId) => {
      delete typingUsers[userId];
      if (Object.keys(typingUsers).length === 0) io.emit('stopTyping');
    });

    // Message reactions
    socket.on('messageReaction', (messageId, emoji) => {
      if (!messageReactions[messageId]) {
        messageReactions[messageId] = [];
      }
      messageReactions[messageId].push(emoji);
      io.emit('messageReaction', { messageId, emoji });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected:', socket.id);

      if (socket.userId) {
        delete connectedUsers[socket.userId];
      }

      io.emit('updateOnlineUsers', Object.keys(connectedUsers).length);

      lastSeen[socket.id] = new Date().toLocaleTimeString();
      io.emit('lastSeen', lastSeen);
    });
  });
};
