const user = require("../models/user");

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
