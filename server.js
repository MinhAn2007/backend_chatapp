const express = require('express');
const cors = require('cors');
const expressListEndpoints = require('express-list-endpoints');
const { addMessage, getMessages,deleteMessage,retrieveMessage, forwardMessage } = require("././controllers/message");

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

const group = require('./routes/group'); // Import các routes cho group từ thư mục routes/group
app.use('/group', group); // Sử dụng routes cho group
// Endpoint để thêm tin nhắn mới
app.post("/addmsg/", addMessage); // Định tuyến cho endpoint thêm tin nhắn mới

// Endpoint để lấy tất cả tin nhắn
app.post("/getmsg/", getMessages); // Định tuyến cho endpoint lấy tất cả tin nhắn

app.delete("/deletemsg/:messageId/", deleteMessage); // Định tuyến cho endpoint xóa tin nhắn

app.put("/retrievemsg/:messageId/:senderId", retrieveMessage); // Định tuyến cho endpoint thu hồi tin nhắn

app.post("/forwardMessage", forwardMessage); // Định tuyến cho endpoint chuyển tiếp tin nhắn

console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

const server = app.listen(PORT, () => { // Khởi tạo server và lắng nghe trên PORT được xác định
    console.log("Server Started in", PORT);
});

const socketIo = require("socket.io")(server, {
    cors: {
        origin: "*",
    }
  });


socketIo.on("connection", (socket) => {
  console.log("New client connected" + socket.id);

  socket.emit("getId", socket.id);

  socket.on("sendDataClient", function(data) {
    console.log(data)
    socketIo.emit("sendDataServer", { data });
  })
  socket.on("message_deletedClient", function(data) {
    console.log(data)
    socketIo.emit("message_deleted", { data });
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});