const Group = require("../models/group");
const User = require("../models/User.js");

module.exports.newGroups = async (req, res) => {
  const { name, creatorId, avatar, members } = req.body;

  try {
    // Kiểm tra số lượng thành viên
    console.log(members.length);
    if (members.length < 3) {
      // Nếu số lượng thành viên ít hơn 3
      return res
        .status(400)
        .json({ message: "Nhóm cần có ít nhất 3 thành viên." });
    }
    let newAvatar = avatar; // Sử dụng let thay vì const
    if (newAvatar === undefined || newAvatar === null || newAvatar === "") {
      newAvatar =
        "https://www.shutterstock.com/shutterstock/photos/1311666263/display_1500/stock-vector-social-network-users-neon-icon-simple-thin-line-outline-vector-of-web-minimalistic-icons-for-ui-1311666263.jpg";
    }
    // Tạo một đối tượng nhóm mới từ dữ liệu nhận được
    const newGroup = new Group({
      name,
      leader: creatorId, // Người tạo nhóm được gán là nhóm trưởng
      avatar: newAvatar,
      members: [...members], // Thêm người tạo nhóm vào danh sách thành viên
    });

    // Lưu nhóm mới vào cơ sở dữ liệu
    const savedGroup = await newGroup.save();

    // Cập nhật thông tin người dùng sau khi nhóm được tạo
    await Promise.all(
      members.map(async (memberId) => {
        await updateUser(memberId, savedGroup._id);
      })
    );

    res.status(201).json(savedGroup); // Trả về thông tin của nhóm đã tạo thành công
  } catch (error) {
    res.status(400).json({ message: error.message }); // Trả về thông báo lỗi nếu có lỗi xảy ra
  }
};

// Hàm cập nhật thông tin người dùng
async function updateUser(userId, groupId) {
  try {
    // Tìm người dùng theo ID
    const user = await User.findById(userId);

    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      throw new Error("Người dùng không tồn tại.");
    }

    // Thêm groupId vào danh sách groupId của người dùng
    user.groups.push(groupId);

    // Lưu thông tin người dùng đã được cập nhật
    await user.save();
  } catch (error) {
    throw new Error("Lỗi khi cập nhật thông tin người dùng: " + error.message);
  }
}

exports.getGroupList = async (req, res, next) => {
  try {
    const { userId } = req.params; // Lấy id của người dùng từ request params

    // Tìm kiếm người dùng trong cơ sở dữ liệu bằng id
    const user = await User.findById(userId);

    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Lấy danh sách bạn bè của người dùng
    const friendList = await User.find({ _id: { $in: user.friends } });

    // Lấy danh sách các nhóm của người dùng
    const groupList = await Group.find({ members: userId });

    // Trả về thông tin của người dùng bao gồm danh sách bạn bè và danh sách nhóm
    return res.status(200).json({
      success: true,
      userData: {
        friendList: friendList,
        groupList: groupList,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params; // Lấy id của nhóm từ request params

    // Xóa nhóm khỏi cơ sở dữ liệu
    const deletedGroup = await Group.findByIdAndDelete(groupId);

    // Kiểm tra xem nhóm có tồn tại không
    if (!deletedGroup) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Cập nhật thông tin người dùng
    await User.updateMany(
      // Lọc người dùng có groupId bằng groupId của nhóm cần xóa
      { groups: groupId },
      // Xóa groupId khỏi danh sách groupId của người dùng
      { $pull: { groups: groupId } }
    );

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Nhóm đã được xóa và thông tin người dùng đã được cập nhật",
    });
  } catch (error) {
    next(error);
  }
};
exports.addMemberToGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params; // Lấy id của nhóm từ request params
        const { memberId } = req.body; // Lấy mảng các thành viên từ body của request

        // Kiểm tra xem nhóm có tồn tại không
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm",
            });
        }

        // Lặp qua mỗi memberId trong mảng
        for (const member of memberId) {
            // Kiểm tra xem thành viên đã tồn tại trong nhóm chưa
            if (!group.members.includes(member)) {
                // Thêm memberId vào danh sách thành viên của nhóm
                group.members.push(member);

                // Cập nhật thông tin người dùng
                await updateUser(member, groupId);
            }
        }

        // Lưu thông tin nhóm đã được cập nhật
        await group.save();

        // Trả về phản hồi thành công
        return res.status(200).json({
            success: true,
            message: "Thêm thành viên vào nhóm thành công",
        });
    } catch (error) {
        next(error);
    }
};
  

exports.getNonGroupFriends = async (req, res, next) => {
  try {
    const { userId, groupId } = req.params; // Lấy id của người dùng và id của nhóm từ request params

    // Tìm kiếm người dùng trong cơ sở dữ liệu bằng id
    const user = await User.findById(userId);

    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Lấy danh sách bạn bè của người dùng
    const friendList = await User.find({
      _id: { $in: user.friends }, // Bạn bè của người dùng
      groups: { $ne: groupId } // Không thuộc nhóm hiện tại
    });

    // Trả về danh sách bạn bè không nằm trong nhóm hiện tại
    return res.status(200).json({
      success: true,
      friendList: friendList
    });
  } catch (error) {
    next(error);
  }
};
