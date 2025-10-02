const nodemailer = require('nodemailer');

let transporter;

const initEmail = () => {
  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10s timeout
  });

  transporter.verify()
    .then(() => console.log("✅ Email transporter verified"))
    .catch(err => console.error("❌ Email transporter error:", err.message));
};

const getTransporter = () => transporter;

module.exports = { initEmail, getTransporter };
