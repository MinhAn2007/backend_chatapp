const Group = require("../models/Group.js");
const User = require("../models/user");
const Messages = require("../models/Message.js");
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
exports.addMembersToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params; // Lấy ID của nhóm từ tham số yêu cầu
    const { memberIds } = req.body; // Lấy mảng ID của thành viên từ phần thân của yêu cầu
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Lặp qua từng ID thành viên và thêm họ vào nhóm nếu họ chưa là thành viên
    for (const memberId of memberIds) {
      if (!group.members.includes(memberId)) {
        group.members.push(memberId);
        await updateUser(memberId, groupId);

        // Tạo tin nhắn cho thành viên vừa được thêm vào nhóm
        const user = await User.findById(memberId);
        await Messages.create({
          message: { text: `"${user.name}" đã được thêm vào nhóm` },
          users: [memberId, groupId],
          group: groupId,
          sender: group.leader,
          avatar: group.avatar,
        });
        console.log("avatar của leader", group.avatar);
      }
    }

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Members added to the group successfully",
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
      groups: { $ne: groupId }, // Không thuộc nhóm hiện tại
    });

    // Trả về danh sách bạn bè không nằm trong nhóm hiện tại
    return res.status(200).json({
      success: true,
      friendList: friendList,
    });
  } catch (error) {
    next(error);
  }
};

exports.getGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params; // Lấy ID của nhóm từ request params

    // Tìm kiếm nhóm trong cơ sở dữ liệu bằng ID
    const group = await Group.findById(groupId);

    // Kiểm tra xem nhóm có tồn tại không
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Lấy danh sách thành viên trong nhóm cùng với vai trò của họ
    const membersWithRoles = await Promise.all(
      group.members.map(async (memberId) => {
        const user = await User.findById(memberId); // Tìm kiếm thông tin người dùng bằng ID
        if (!user) {
          return null; // Trả về null nếu không tìm thấy người dùng
        }
        let role = "member"; // Giả sử mặc định là vai trò "member"
        console.log(group.leader.toString());
        console.log(memberId);
        if (group.leader.toString() === memberId.toString()) {
          role = "leader"; // Nếu là người tạo nhóm, vai trò là "leader"
        } else {
          // Nếu không phải là người tạo nhóm, kiểm tra xem memberId có là co-leader không
          if (
            Array.isArray(group.coLeader) &&
            group.coLeader.includes(memberId.toString())
          ) {
            role = "coLeader"; // Nếu là co-leader, vai trò là "coLeader"
          }
        }
        return {
          _id: user._id,
          name: user.name,
          role: role,
          avatar: user.avatar,
        };
      })
    );

    // Lọc bỏ những thành viên không tồn tại trong nhóm
    const validMembersWithRoles = membersWithRoles.filter(
      (member) => member !== null
    );

    // Trả về danh sách thành viên trong nhóm cùng với vai trò của họ
    return res.status(200).json({
      success: true,
      groupMembers: validMembersWithRoles,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.removeMembersFromGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params; // Lấy ID của nhóm từ tham số yêu cầu
    const { memberIds } = req.body; // Lấy mảng ID của thành viên từ phần thân của yêu cầu

    // Kiểm tra xem memberIds có phải là một mảng không
    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: "memberIds must be an array",
      });
    }

    // Tìm nhóm trong cơ sở dữ liệu theo ID
    const group = await Group.findById(groupId);

    // Kiểm tra xem nhóm có tồn tại không
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Tính số lượng thành viên còn lại sau khi loại bỏ
    const remainingMembersCount = group.members.length - memberIds.length;

    // Kiểm tra xem số lượng thành viên còn lại sẽ ít hơn 3 không
    if (remainingMembersCount < 3) {
      return res.status(400).json({
        success: false,
        message: "Nhóm phải có ít nhất 3 thành viên",
      });
    }

    // Tạo tin nhắn cho mỗi thành viên bị xóa khỏi nhóm
    for (const memberId of memberIds) {
      // Kiểm tra xem thành viên có tồn tại trong nhóm không
      const index = group.members.indexOf(memberId);
      if (index !== -1) {
        // Loại bỏ thành viên khỏi nhóm
        group.members.splice(index, 1);

        // Cập nhật thông tin nhóm của người dùng
        await User.findByIdAndUpdate(memberId, { $pull: { groups: groupId } });

        // Tạo tin nhắn thông báo cho thành viên bị xóa khỏi nhóm
        const user = await User.findById(memberId);
        await Messages.create({
          message: { text: `"${user.name}" đã bị xóa khỏi nhóm` },
          users: [memberId, groupId],
          group: groupId,
          sender: group.leader,
          avatar: group.avatar,
        });
      }
    }

    // Lưu thông tin nhóm sau khi cập nhật
    await group.save();

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Members removed from the group successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports.setCoLeader = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params; // Lấy ID của nhóm và ID của người dùng từ request params

    // Tìm nhóm trong cơ sở dữ liệu
    const group = await Group.findById(groupId);
    console.log(group);
    // Kiểm tra xem nhóm có tồn tại không
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(userId);
    console;
    console.log(user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra xem nhóm đã có đủ 2 nhóm phó chưa
    if (group.coLeader.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "Nhóm đã có đủ 2 nhóm phó",
      });
    }

    // Kiểm tra xem người dùng đã là nhóm phó chưa
    if (group.coLeader.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Người dùng đã là nhóm phó của nhóm này",
      });
    }

    // Phân quyền người dùng thành nhóm phó
    group.coLeader.push(userId);

    await Messages.create({
      message: { text: `"${user.name}" đã trở thành nhóm phó` },
      users: [userId, groupId],
      group: groupId,
      sender: group.leader,
      avatar: group.avatar,
    });

    // Lưu thông tin nhóm đã được cập nhật
    await group.save();

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Người dùng đã được phân quyền thành nhóm phó",
    });
  } catch (error) {
    next(error);
  }
};
exports.transferOwnership = async (req, res, next) => {
  try {
    const { groupId, newOwnerId } = req.params; // Lấy ID của nhóm và ID của người dùng mới từ request params
    console.log(newOwnerId);
    console.log(groupId);
    // Tìm nhóm trong cơ sở dữ liệu
    const group = await Group.findById(groupId);

    // Kiểm tra xem nhóm có tồn tại không
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }
    // Kiểm tra xem người dùng mới có tồn tại không
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: "Người dùng mới không tồn tại",
      });
    }
    const coLeaderIndex = group.coLeader.indexOf(newOwnerId);
    if (coLeaderIndex !== -1) {
      // Nếu người dùng là nhóm phó, loại bỏ người dùng khỏi mảng coLeader
      group.coLeader.splice(coLeaderIndex, 1);
    }
    // Cập nhật thông tin nhóm trưởng
    group.leader = newOwnerId;

    await Messages.create({
      message: { text: `"${newOwner.name}" đã trở thành nhóm trưởng` },
      users: [newOwnerId, groupId],
      group: groupId,
      sender: group.leader,
      avatar: group.avatar,
    });
    // Lưu thông tin nhóm đã được cập nhật
    await group.save();

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Nhượng quyền nhóm trưởng thành công",
    });
  } catch (error) {
    next(error);
  }
};

exports.leaveGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params; // Lấy ID của nhóm và ID của người dùng từ request params

    // Tìm nhóm trong cơ sở dữ liệu
    const group = await Group.findById(groupId);

    // Kiểm tra xem nhóm có tồn tại không
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    // Kiểm tra xem người dùng có tồn tại trong nhóm không
    const index = group.members.indexOf(userId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại trong nhóm",
      });
    }

    // Kiểm tra xem người dùng có phải là nhóm trưởng không
    if (group.leader.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Không thể rời nhóm vì bạn là nhóm trưởng. Xin hãy chuyển quyền trước.",
      });
    }
    console.log(group.members.length);
    // Kiểm tra xem nhóm có ít hơn 3 thành viên không
    if (group.members.length < 4) {
      // Giải tán nhóm nếu ít hơn 3 thành viên
      await Group.findByIdAndDelete(groupId);
      // Cập nhật thông tin của các người dùng trong nhóm
      await User.updateMany(
        { _id: { $in: group.members } },
        { $pull: { groups: groupId } }
      );

      return res.status(200).json({
        success: true,
        message: "Nhóm đã được giải tán vì ít hơn 3 thành viên",
      });
    }

    // Nếu người dùng là nhóm phó, loại bỏ người dùng khỏi mảng coLeader
    const coLeaderIndex = group.coLeader.indexOf(userId);
    if (coLeaderIndex !== -1) {
      group.coLeader.splice(coLeaderIndex, 1);
    }
    console.log("id user", userId);
    await Messages.create({
      message: { text: "Đã rời nhóm" },
      users: [userId, groupId],
      group: groupId,
      sender: userId,
      avatar: group.avatar,
    });

    // Xóa người dùng khỏi nhóm
    group.members.splice(index, 1);

    // Cập nhật thông tin nhóm đã được cập nhật
    await group.save();

    // Xóa ID nhóm khỏi danh sách nhóm của người dùng
    await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });

    // Trả về phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Rời nhóm thành công",
    });
  } catch (error) {
    next(error);
  }
};
