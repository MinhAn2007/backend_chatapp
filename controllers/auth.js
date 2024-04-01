const bcrypt = require('bcrypt');
const user = require("../models/user");
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
require('dotenv').config();

// Hàm gửi email OTP
const sendOTPEmail = async (email, otp) => {
    // Tạo một transporter để gửi email
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,  //-> Host SMTP detail
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Nội dung email
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is: ${otp}`
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, gender, otp } = req.body;

        // Bước 1: Kiểm tra và tạo người dùng mới
        if (!name || !email || !password || !otp) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            });
        }

        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        if (response.length === 0 || otp !== response[0].otp) {
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        }

        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: `Hashing password error: ${error.message}`
            });
        }

        const newUser = await user.create({
            name, email, password: hashedPassword, gender
        });

        await sendOTPEmail(newUser.email, otp);


        return res.status(200).json({
            success: true,
            newUser,
            message: "User created successfully"
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'EAUTH' && error.command === 'API') {
            console.log("Ignoring 'Missing credentials for 'PLAIN'' error.");
            return res.status(200).json({
                success: true,
                message: "User created successfully"
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "User registration failed"
            });
        }
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the details carefully"
            });
        }

        let foundUser = await user.findOne({ email });
        if (!foundUser) {
            return res.status(401).json({
                success: false,
                message: "You have to Signup First"
            });
        }

        const payload = {
            email: foundUser.email,
            id: foundUser._id,
        };

        if (await bcrypt.compare(password, foundUser.password)) {
            let token = jwt.sign(payload,
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            foundUser = foundUser.toObject();
            foundUser.token = token;
            foundUser.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            };

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                foundUser,
                message: "Logged in Successfully"
            });
        } else {
            return res.status(403).json({
                success: false,
                message: "Password incorrect"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Login failure :" + error
        });
    }
};

exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;
        const checkUserPresent = await user.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            });
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const result = await OTP.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
        }

        const otpPayload = { email, otp };
        await OTP.create(otpPayload);

        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};
