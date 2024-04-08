const express = require('express');
const cors = require('cors');
const expressListEndpoints = require('express-list-endpoints');
const { addMessage, getMessages } = require("././controllers/message");
const socket = require("socket.io"); // Import thư viện socket.io

const app = express();
const PORT = process.env.PORT || 4000;

require('dotenv').config(); // Load các biến môi trường từ file .env

app.use(express.json()); // Sử dụng middleware để phân tích JSON gửi đến từ client
app.use(cors()); // Sử dụng middleware để xử lý lỗi CORS

// Kết nối tới cơ sở dữ liệu
require('./config/database').connect(); // Kết nối với cơ sở dữ liệu MongoDB

// Định tuyến cho các endpoints
const user = require('./routes/user'); // Import các routes cho user từ thư mục routes/user
app.use('/user', user); // Sử dụng routes cho user

// Endpoint để thêm tin nhắn mới
app.post("/addmsg/", addMessage); // Định tuyến cho endpoint thêm tin nhắn mới

// Endpoint để lấy tất cả tin nhắn
app.post("/getmsg/", getMessages); // Định tuyến cho endpoint lấy tất cả tin nhắn

console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

const server = app.listen(PORT, () => { // Khởi tạo server và lắng nghe trên PORT được xác định
    console.log("Server Started in", PORT);
});

// Khởi tạo Socket.IO
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});

global.onlineUsers = new Map(); // Biến toàn cục để lưu trữ thông tin của người dùng đang trực tuyến

// Xử lý các sự kiện của Socket.IO
io.on("connection", (socket) => {
    socket.on("add-user", (userId) => { // Xử lý sự kiện khi người dùng mới kết nối
        onlineUsers.set(userId, socket.id); // Lưu thông tin của người dùng mới vào Map onlineUsers
    });

    socket.on("send-msg", (data) => { // Xử lý sự kiện khi người dùng gửi tin nhắn
        const sendUserSocket = onlineUsers.get(data.to); // Lấy thông tin socket của người nhận tin nhắn
        if (sendUserSocket) { // Nếu tồn tại thông tin socket của người nhận
            socket.to(sendUserSocket).emit("msg-recieve", data.msg); // Gửi tin nhắn đến socket của người nhận
        }
    });
});
