const User = require('../models/user'); // Import model User
const bcrypt = require('bcrypt'); // Import thư viện bcrypt để mã hóa mật khẩu
const multer = require('multer'); // Import thư viện multer để upload file
const AWS = require('aws-sdk'); // Import thư viện aws-sdk để sử dụng AWS S3
const path = require('path'); // Import thư viện path để xử lý đường dẫn file


// Khởi tạo AWS S3
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

const bucketName = process.env.S3_BUCKET_NAME;

// Cấu hình multer
const storage = multer.memoryStorage({
    destination(req, file, callback) {
        callback(null, "");
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2000000 },
    fileFilter(req, file, cb) {
        checkFileType(file, cb);
    }
}).single("avatar");

function checkFileType(file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    return cb("Error: Images only !!!");
}

exports.uploadAvatarS3 = async (req, res) => {
    try {
        // Gọi middleware multer ở đây để xử lý upload
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: 'Lỗi trong quá trình upload ảnh'
                });
            } else if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Upload ảnh thất bại'
                });
            }

            const { userId } = req.params; // Lấy id của người dùng từ request
            const avatar = req.file?.originalname.split(".");
            const fileType = avatar[avatar - 1];
            const filePath = `zalo/W${userId}_W${Date.now().toString()}.${fileType}`;

            const paramsS3 = {
                Bucket: bucketName,
                Key: filePath,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };

            s3.upload(paramsS3, async (err, data) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Upload ảnh thất bại'
                    });
                }
                const url = data.Location; // Lấy đường dẫn ảnh từ AWS S3 sau khi upload 
                return res.status(200).json({
                    success: true,
                    message: 'Upload ảnh thành công',
                    avatar: url
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
                message: "Không tìm thấy người dùng"
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
            updatedUser: foundUser
        });
    } catch (error) {
        console.error(error);
        // Nếu có lỗi, trả về thông báo lỗi
        return res.status(500).json({
            success: false,
            message: "Cập nhật người dùng thất bại"
        });
    }
};

// Cập nhật mật khẩu người dùng
exports.updatePassword = async (req, res) => {
    try {
        const { email } = req.params; // Lấy email người dùng từ request

        // Lấy thông tin mật khẩu hiện tại và mật khẩu mới từ body request
        const { currentPassword, newPassword } = req.body;

        // Tìm kiếm người dùng trong cơ sở dữ liệu
        const foundUser = await User.findOne({ email: email });
        if (!foundUser) {
            // Nếu không tìm thấy người dùng, trả về thông báo lỗi
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng với email: ' + email,
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
        if (!isMatch) {
            // Nếu mật khẩu hiện tại không đúng, trả về thông báo lỗi
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng',
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
            message: 'Cập nhật mật khẩu thành công',
        });
    } catch (error) {
        console.error(error);
        // Nếu có lỗi, trả về thông báo lỗi
        return res.status(500).json({
            success: false,
            message: 'Cập nhật mật khẩu thất bại',
        });
    }
};
