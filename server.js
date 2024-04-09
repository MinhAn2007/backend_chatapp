const express = require('express');
const cors = require('cors');
const expressListEndpoints = require('express-list-endpoints');
const { addMessage, getMessages,deleteMessage,retrieveMessage } = require("././controllers/message");
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

app.delete("/deletemsg/:messageId/", deleteMessage); // Định tuyến cho endpoint xóa tin nhắn

app.get("/retrievemsg/:messageId/:senderId", retrieveMessage); // Định tuyến cho endpoint thu hồi tin nhắn

console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

const server = app.listen(PORT, () => { // Khởi tạo server và lắng nghe trên PORT được xác định
    console.log("Server Started in", PORT);
});

// Khởi tạo Socket.IO
const io = socket(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
    },
});

global.onlineUsers = new Map(); // Biến toàn cục để lưu trữ thông tin của người dùng đang trực tuyến

// Xử lý các sự kiện của Socket.IO
io.on("connection", (socket) => {
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
        console.log(`Received a message from user ${data.from}: ${data.msg}`);
        
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", data.msg);
            console.log(`Sent message to user ${data.to}`);
        } else {
            console.log(`User ${data.to} is not online`);
        }
    });
});
