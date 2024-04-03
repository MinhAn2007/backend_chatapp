const user = require("../models/user");
const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const foundUser = await user.findById(userId);
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const { name, gender, avatar } = req.body;

        if (name) foundUser.name = name;
        if (gender !== undefined) foundUser.gender = gender;
        if (avatar) foundUser.avatar = avatar; 
        await foundUser.save();
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            updatedUser: foundUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user"
        });
    }
};

exports.updatePassword = async (req, res) => {
    console.log("qưeqweq");

    try {
        const { email } = req.params;

        const { currentPassword, newPassword } = req.body;

        // Tìm kiếm người dùng trong cơ sở dữ liệu
        const foundUser = await User.findOne({ email: email });
        if (!foundUser) {

            return res.status(404).json({
                success: false,
                message: 'User not found for email: ' + email,
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
        if (!isMatch) {
            return res.status(400).json({

                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Mã hóa mật khẩu mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu mới cho người dùng
        foundUser.password = hashedPassword;
        await foundUser.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update password',
        });
    }
};
