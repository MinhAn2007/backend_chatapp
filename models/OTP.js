const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender"); 
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
async function sendVerificationEmail(email, otp) {
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			`<h1>Please confirm your OTP </h1>
             <p> here is your OTP code:-> ${otp} </p>
            `
		);
		console.log("Email sent successfully: ", mailResponse);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}}

OTPSchema.pre("save", async function (next) {
	console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});

// Schedule the deletion job to run every second
cron.schedule('*/60 * * * * *',   async function deleteExpiredOTPs() {
  const now = new Date();
  const expirationTime = new Date(now - 45 * 1000); // 45 seconds ago
  try {
    await OTP.deleteMany({ createdAt: { $lt: expirationTime } });
    console.log("Expired OTPs deleted successfully.");
  } catch (error) {
    console.error("Error deleting expired OTPs:", error);
  }
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;