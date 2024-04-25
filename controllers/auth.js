const bcrypt = require('bcrypt');
const User = require("../models/User.js");
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
require('dotenv').config();


// Hàm đăng ký người dùng
exports.signup = async (req, res) => {
    try {
        const { name, email, password, gender, otp } = req.body;

        // Kiểm tra xem tất cả các trường thông tin đã được điền đầy đủ chưa
        if (!name || !email || !password || !otp) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            });
        }

        // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Kiểm tra xem mã OTP có hợp lệ không
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        if (response.length === 0 || otp !== response[0].otp) {
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        const newUser = await User.create({
            name, email, password: hashedPassword, gender
        });

        // Gửi email chứa mã OTP
        return res.status(200).json({
            success: true,
            newUser,
            message: "User created successfully"
        });
    } catch (error) {
        // Xử lý lỗi
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

// Hàm đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the details carefully"
            });
        }

        // Tìm kiếm người dùng trong cơ sở dữ liệu
        let foundUser = await User.findOne({ email });
        console.log(foundUser);
        if (!foundUser) {
            return res.status(401).json({
                success: false,
                message: "You have to Signup First"
            });
        }

        // Tạo payload cho token JWT
        const payload = {
            email: foundUser.email,
            id: foundUser._id,
        };

        // So sánh mật khẩu được nhập với mật khẩu đã được mã hóa trong cơ sở dữ liệu
        if (await bcrypt.compare(password, foundUser.password)) {
            // Tạo token JWT
            let token = jwt.sign(payload,
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            // Loại bỏ trường password khỏi thông tin người dùng trước khi trả về
            foundUser = foundUser.toObject();
            foundUser.token = token;
            foundUser.password = undefined;

            // Trả về token và thông tin người dùng
            res.status(200).json({
                success: true,
                token,
                foundUser,
                message: "Logged in Successfully"
            });
        } else {
            // Nếu mật khẩu không đúng, trả về thông báo lỗi
            return res.status(403).json({
                success: false,
                message: "Password incorrect"
            });
        }
    } catch (error) {
        // Xử lý lỗi
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Login failure :" + error
        });
    }
};

// Hàm gửi mã OTP đến email của người dùng
exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;
        const {checkGetPassEmail} = req?.body;
        const checkUserPresent = await User.findOne({ email });

        if (checkGetPassEmail) {
            if (!checkUserPresent) {
                return res.status(400).json({
                    success: false,
                    message: `User is Not Registered`,
                });
            }
        }
        if (checkUserPresent && !checkGetPassEmail) {
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            });
        }
        // Sinh mã OTP ngẫu nhiên
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Kiểm tra xem mã OTP đã tồn tại trong cơ sở dữ liệu chưa
        const result = await OTP.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
        }

        // Lưu mã OTP vào cơ sở dữ liệu
        const otpPayload = { email, otp };
        await OTP.create(otpPayload);

        // Gửi mã OTP đến email của người dùng
        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        });
    } catch (error) {
        // Xử lý lỗi
        console.log(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};
