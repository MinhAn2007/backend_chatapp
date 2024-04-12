const Group = require('../models/group');
const User = require('../models/User.js');

module.exports.newGroups = async (req, res) => {
    const { name, creatorId, avatar, members } = req.body;

    try {
        // Kiểm tra số lượng thành viên
        if (members.length < 2) { // Nếu số lượng thành viên ít hơn 2
            return res.status(400).json({ message: 'Nhóm cần có ít nhất 3 thành viên.' });
        }

        // Tạo một đối tượng nhóm mới từ dữ liệu nhận được
        const newGroup = new Group({
            name,
            leader: creatorId, // Người tạo nhóm được gán là nhóm trưởng
            avatar,
            members: [...members, creatorId] // Thêm người tạo nhóm vào danh sách thành viên
        });

        // Lưu nhóm mới vào cơ sở dữ liệu
        const savedGroup = await newGroup.save();

        res.status(201).json(savedGroup); // Trả về thông tin của nhóm đã tạo thành công
    } catch (error) {
        res.status(400).json({ message: error.message }); // Trả về thông báo lỗi nếu có lỗi xảy ra
    }
};
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
            groupList: groupList
          }
        });
      } catch (error) {
        next(error);
      }
  };
  

