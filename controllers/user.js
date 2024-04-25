const User = require("../models/User.js"); // Import model User
const bcrypt = require("bcrypt"); // Import thư viện bcrypt để mã hóa mật khẩu
const multer = require("multer"); // Import thư viện multer để upload file
const AWS = require("aws-sdk"); // Import thư viện aws-sdk để sử dụng AWS S3
const path = require("path"); // Import thư viện path để xử lý đường dẫn file
const Messages = require("../models/Message.js");

// Khởi tạo AWS S3
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const bucketName = process.env.S3_BUCKET_NAME;

// Cấu hình multer
const storage = multer.memoryStorage({
  destination(req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300000000 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
}).single("avatar");

function checkFileType(file, cb) {
  const fileTypes = /jpeg|jpg|png|gif|doc|docx|xls|xlsx|pdf|csv|json|mp4|mp3/; // Thêm các loại file mới vào regex
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  return cb("Error: Images, Word, Excel, and PDF files only !!!");
}

exports.uploadAvatarS3 = async (req, res) => {
  try {
    // Gọi middleware multer ở đây để xử lý upload
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: "Lỗi trong quá trình upload ảnh",
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          message: "Upload ảnh thất bại",
        });
      }

      const { userId } = req.params; // Lấy id của người dùng từ request
      const avatar = req.file?.originalname.split("."); // Lấy tên file ảnh và tách ra để lấy loại file
      const fileType = avatar[avatar.length - 1]; // Lấy loại file từ tên file
      const filePath = `zalo/W${userId}_W${Date.now().toString()}.${fileType}`;

      const paramsS3 = {
        Bucket: bucketName,
        Key: filePath,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      s3.upload(paramsS3, async (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Upload ảnh thất bại",
          });
        }
        const url = data.Location; // Lấy đường dẫn ảnh từ AWS S3 sau khi upload
        return res.status(200).json({
          success: true,
          message: "Upload ảnh thành công",
          avatar: url,
        });
      });
    });
  } catch (error) {
    res.send("Error");
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params; // Lấy id của người dùng từ request
    const foundUser = await User.findById(userId); // Tìm kiếm người dùng trong cơ sở dữ liệu

    // Kiểm tra xem người dùng có tồn tại không
    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Lấy thông tin cập nhật từ body request
    const { name, gender, avatar } = req.body;

    // Cập nhật thông tin nếu có
    if (name) foundUser.name = name;
    if (gender !== undefined) foundUser.gender = gender;
    if (avatar) foundUser.avatar = avatar;

    // Lưu thông tin người dùng đã cập nhật vào cơ sở dữ liệu
    await foundUser.save();

    // Trả về thông báo thành công và thông tin người dùng đã cập nhật
    return res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      updatedUser: foundUser,
    });
  } catch (error) {
    console.error(error);
    // Nếu có lỗi, trả về thông báo lỗi
    return res.status(500).json({
      success: false,
      message: "Cập nhật người dùng thất bại",
    });
  }
};

// Cập nhật mật khẩu người dùng
exports.updatePassword = async (req, res) => {
  try {
    const { email } = req.params; // Lấy email người dùng từ request

    // Lấy mật khẩu mới từ body request
    const { newPassword } = req.body;

    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const foundUser = await User.findOne({ email: email });
    if (!foundUser) {
      // Nếu không tìm thấy người dùng, trả về thông báo lỗi
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng với email: " + email,
      });
    }

    // Mã hóa mật khẩu mới
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu mới cho người dùng
    foundUser.password = hashedPassword;
    await foundUser.save();

    // Trả về thông báo thành công
    return res.status(200).json({
      success: true,
      message: "Cập nhật mật khẩu thành công",
    });
  } catch (error) {
    console.error(error);
    // Nếu có lỗi, trả về thông báo lỗi
    return res.status(500).json({
      success: false,
      message: "Cập nhật mật khẩu thất bại",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra xem người dùng tồn tại trong cơ sở dữ liệu không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Sinh mật khẩu mới ngẫu nhiên
    const newPassword = Math.random().toString(36).slice(-8);

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới cho người dùng trong cơ sở dữ liệu
    user.password = hashedPassword;
    await user.save();

    // Gửi email chứa mật khẩu mới cho người dùng
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "New Password",
      text: `Your new password is: ${newPassword}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to send new password email",
        });
      } else {
        console.log("Email sent:", info.response);
        return res
          .status(200)
          .json({ success: true, message: "New password sent to your email" });
      }
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
};

module.exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    // Tìm người gửi và người nhận
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    // Kiểm tra xem người nhận có tồn tại không
    if (!receiver) {
      return res.status(404).json({ error: "Người nhận không tồn tại" });
    }

    // Kiểm tra xem người nhận có trong danh sách bạn bè của người gửi không
    if (sender.friendRequests.includes(receiver._id)) {
      return res
        .status(400)
        .json({ error: "Bạn đã gửi lời mời kết bạn đến người này trước đó" });
    }

    sender.friendRequests.push(receiver._id);
    await sender.save();

    receiver.receivedFriendRequests.push(sender._id);
    await receiver.save();

    return res.json({ message: "Lời mời kết bạn đã được gửi thành công" });
  } catch (error) {
    next(error);
  }
};
module.exports.acceptFriendRequestAndSendMessage = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    // Tìm người gửi (người chấp nhận lời mời kết bạn) và người nhận (người gửi lời mời kết bạn)
    const sender = await User.findById(userId);
    const receiver = await User.findById(friendId);

    // Kiểm tra xem người gửi và người nhận có tồn tại không
    if (!sender || !receiver) {
      return res
        .status(404)
        .json({ error: "Người gửi hoặc người nhận không tồn tại" });
    }

    // Kiểm tra xem người gửi có trong danh sách lời mời kết bạn của người nhận không
    if (!receiver.friendRequests.includes(sender._id)) {
      return res
        .status(400)
        .json({ error: "Người này không gửi lời mời kết bạn đến bạn" });
    }

    // Thêm người gửi vào danh sách bạn bè của người nhận
    receiver.friends.push(sender._id);
    // Xóa người gửi khỏi danh sách lời mời kết bạn của người nhận
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== sender._id.toString()
    );

    // Thêm người nhận vào danh sách bạn bè của người gửi
    sender.friends.push(receiver._id);
    // Xóa người nhận khỏi danh sách lời mời kết bạn của người gửi
    sender.receivedFriendRequests = sender.receivedFriendRequests.filter(
      (id) => id.toString() !== receiver._id.toString()
    );
    await sender.save();
    await receiver.save();

    const defaultMessage = "Tôi đã chấp nhận lời mời của bạn";
    const messageData = await Messages.create({
      message: { text: defaultMessage },
      users: [sender._id.toString(), receiver._id.toString()],
      sender: sender._id,
      avatar: sender.avatar,
    });

    if (messageData)
      return res.json({
        message:
          "Chấp nhận lời mời kết bạn thành công và tạo tin nhắn thành công",
      });
    else return res.json({ message: "Failed to create message" });
  } catch (error) {
    next(error);
  }
};
// Tìm người dùng theo địa chỉ email
module.exports.findUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params; // Lấy địa chỉ email từ request params
    console.log(email);
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await User.findOne({ email });

    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng với địa chỉ email này",
      });
    }

    // Trả về thông tin của người dùng nếu tìm thấy
    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.getFriendRequestsSentToUser = async (req, res, next) => {
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

    // Lấy danh sách người gửi lời mời kết bạn tới người dùng hiện tại
    const friendRequestsSent = await User.find({
      friendRequests: { $in: [userId] },
    });

    // Trả về danh sách người gửi lời mời kết bạn
    return res.status(200).json({
      success: true,
      friendRequestsSent: friendRequestsSent,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFriendList = async (req, res, next) => {
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

    // Trả về danh sách bạn bè
    return res.status(200).json({
      success: true,
      friendList: friendList,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    // Tìm người gửi (người gửi lời mời kết bạn) và người nhận (người nhận lời mời kết bạn)
    const sender = await User.findById(friendId);
    const receiver = await User.findById(userId);

    // Kiểm tra xem người gửi và người nhận có tồn tại không
    if (!sender || !receiver) {
      return res
        .status(404)
        .json({ error: "Người gửi hoặc người nhận không tồn tại" });
    }

    // Kiểm tra xem người gửi có trong danh sách lời mời kết bạn của người nhận không
    if (!receiver.receivedFriendRequests.includes(sender._id)) {
      return res
        .status(400)
        .json({ error: "Người này không gửi lời mời kết bạn đến bạn" });
    }

    // Xóa người gửi khỏi danh sách lời mời kết bạn của người nhận
    receiver.receivedFriendRequests = receiver.receivedFriendRequests.filter(
      (id) => id.toString() !== sender._id.toString()
    );

    // Kiểm tra xem người nhận có trong danh sách lời mời kết bạn của người gửi không
    if (sender.friendRequests.includes(receiver._id)) {
      // Xóa người nhận khỏi danh sách lời mời kết bạn của người gửi
      sender.friendRequests = sender.friendRequests.filter(
        (id) => id.toString() !== receiver._id.toString()
      );
    }

    // Lưu thông tin cập nhật vào cơ sở dữ liệu
    await Promise.all([receiver.save(), sender.save()]);

    return res.json({ message: "Từ chối lời mời kết bạn thành công" });
  } catch (error) {
    next(error);
  }
};
exports.unfriendUser = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;

    // Tìm người dùng và bạn bè trong cơ sở dữ liệu
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    // Kiểm tra xem người dùng và bạn bè có tồn tại không
    if (!user || !friend) {
      return res
        .status(404)
        .json({ error: "Người dùng hoặc bạn bè không tồn tại" });
    }

    // Xóa bạn bè khỏi danh sách bạn bè của người dùng và ngược lại
    user.friends = user.friends.filter((f) => f.toString() !== friendId);
    friend.friends = friend.friends.filter((u) => u.toString() !== userId);

    // Lưu thông tin cập nhật vào cơ sở dữ liệu
    await Promise.all([user.save(), friend.save()]);

    return res.json({ message: "Hủy kết bạn thành công" });
  } catch (error) {
    next(error);
  }
};
