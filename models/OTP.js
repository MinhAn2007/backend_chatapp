const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender"); // Assuming this sends emails
const cron = require('node-cron');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  }
});

async function deleteExpiredOTPs() {
  const now = new Date();
  const expirationTime = new Date(now - 45 * 1000); // 10 seconds ago
  try {
    const deleteResult = await OTP.deleteMany({ createdAt: { $lt: expirationTime } });
  } catch (error) {
    console.error("Error deleting expired OTPs:", error);
  }
}

// Schedule the deletion job to run every second
cron.schedule('* * * * * *', deleteExpiredOTPs);

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;