
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { Readable } = require('stream');
const { Server } = require('socket.io');
const nodemailer = require("nodemailer");
// Import configs
const connectDB = require('./config/db');
const { initEmail } = require('./config/email');
const chatSocket = require('./sockets/chatSocket');
const callSocket = require('./sockets/callSocket');

// Routes
const messageRoutes = require('./routes/messageRoutes');
const fileRoutes = require('./routes/fileRoutes');
const callRoutes = require('./routes/callRoutes');

dotenv.config();
const app = express();
const server = http.createServer(app);
const upload = multer();

app.use(cors());
app.use(express.json());

// DB Connection
connectDB();

// Initialize Email transporter
initEmail();

// Setup Socket.io
const io = new Server(server, { cors: { origin: '*' } });
chatSocket(io);
callSocket(io);

// Routes
app.use('/messages', messageRoutes);
app.use('/files', fileRoutes(upload));
app.use('/api/calls', callRoutes);

// Default route
app.get('/', (req, res) => {
  res.send("Welcome to the chat & file upload server");
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
  user: "saisubbusai0@gmail.com",
  pass: "kxzzppnnzlwfnwss",
  }
});


app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    const mailOptions = {
      from: "saisubbusai0@gmail.com",
      to,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


