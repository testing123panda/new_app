const { getTransporter } = require("../config/email");

const sendEmail = async (subject, text, toEmail = process.env.ADMIN_EMAIL) => {
  try {
    const transporter = getTransporter();
    if (!transporter) throw new Error("Email transporter not initialized");

    const mailOptions = {
      from: `"My App" <${process.env.EMAIL_USER}>`, // better formatting
      to: toEmail,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✉️ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error; // rethrow so caller knows it failed
  }
};

module.exports = sendEmail;
