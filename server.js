const express = require("express");
const cors = require("cors");
const expressListEndpoints = require("express-list-endpoints");
const {
  addMessage,
  getMessages,
  deleteMessage,
  retrieveMessage,
  forwardMessage,
  getGroupMessages,
  sendMessageToGroup,
} = require("././controllers/message");

const app = express();
const PORT = process.env.PORT || 4000;
 
require("dotenv").config(); // Load các biến môi trường từ file .env

app.use(express.json()); // Sử dụng middleware để phân tích JSON gửi đến từ client
app.use(cors()); // Sử dụng middleware để xử lý lỗi CORS

// Kết nối tới cơ sở dữ liệu
require("./config/database").connect(); // Kết nối với cơ sở dữ liệu MongoDB

// Định tuyến cho các endpoints
const user = require("./routes/user"); // Import các routes cho user từ thư mục routes/user
app.use("/user", user); // Sử dụng routes cho user

const group = require("./routes/group"); // Import các routes cho group từ thư mục routes/group
app.use("/group", group); // Sử dụng routes cho group
// Endpoint để thêm tin nhắn mới
app.post("/addmsg/", addMessage); // Định tuyến cho endpoint thêm tin nhắn mới

// Endpoint để lấy tất cả tin nhắn
app.post("/getmsg/", getMessages); // Định tuyến cho endpoint lấy tất cả tin nhắn

app.delete("/deletemsg/:messageId/", deleteMessage); // Định tuyến cho endpoint xóa tin nhắn

app.put("/retrievemsg/:messageId/:senderId", retrieveMessage); // Định tuyến cho endpoint thu hồi tin nhắn

app.post("/forwardMessage", forwardMessage); // Định tuyến cho endpoint chuyển tiếp tin nhắn

app.post("/getGroupMessages", getGroupMessages); // Định tuyến cho endpoint lấy tất cả tin nhắn của nhóm

app.post("/sendMessageToGroup", sendMessageToGroup); // Định tuyến cho endpoint gửi tin nhắn đến nhóm

console.log(expressListEndpoints(app)); // In ra danh sách các endpoint mà server đang lắng nghe

const server = app.listen(PORT, () => {
  // Khởi tạo server và lắng nghe trên PORT được xác định
  console.log("Server Started in", PORT);
});

const socketIo = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const roomIn = []; // Đối tượng lưu trữ danh sách người dùng trong mỗi phòng
const socketId = [];
const userIds = {}; // Đối tượng lưu trữ các userId đã tham gia vào phòng
const alert = []; // Mảng lưu trữ thông báo
const idUser = []; // Đối tượng lưu trữ các userId đã tham gia vào phòng

socketIo.on("connection", (socket) => {
  console.log("New client connected" + socket.id);
  socket.emit("getId", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });
  socket.on('joinRoom', ({ room, userId }) => {
    // Thêm người dùng vào phòng
    socket.join(room);
    if (!roomIn[room]) {
        roomIn[room] = {};
    }
  
    // Kiểm tra xem userId đã tồn tại trong phòng chưa
    if (userIds[room] && userIds[room][userId]) {
        // Nếu userId đã tồn tại, không thêm vào mảng và cập nhật thông báo
        alert[alert.length - 1] = `${socket.id} ${userId}`;
    } else {
        // Nếu userId là mới, thêm vào mảng và hiển thị thông báo mới
        if (!userIds[room]) {
            userIds[room] = {};
        }
        
        // Kiểm tra xem userId đã tồn tại chưa
        if (!userIds[room][userId]) {
            userIds[room][userId] = true;
            socketId.push(`${socket.id}`);
            idUser.push(`${userId}`);

            roomIn.push(userId + socket.id);
        } else {
            // Nếu userId đã tồn tại, thông báo lỗi
            console.log("User ID đã tồn tại trong phòng.");
            // Bạn có thể thực hiện các hành động khác ở đây, như gửi thông báo lỗi đến người dùng.
        }
    }
    // Gửi thông tin phòng đến người dùng vừa tham gia

    // Gửi danh sách người dùng trong phòng đến tất cả người dùng trong phòng
  });
  socketIo.to(socket.id).emit('roomInfo', roomIn); // Gửi thông tin phòng đến máy khách

  socket.on('message', () => {
    socketIo.to('common-room').emit('message', { idUser, socketId });});

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {

    console.log("userToCall", userToCall);
    console.log("signalData", signalData);
    console.log("from", from);
    console.log("name", name);
    socketIo.to(userToCall).emit("callUser", { signal: signalData, from, name });
    console.log("callUser", userToCall);
  });

  socket.on("answerCall", (data) => {
    socketIo.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("endCall", ({ userToDisconnect }) => {
    console.log("endCall", userToDisconnect);
    socketIo.to(userToDisconnect).emit("callEnded");
  });
  socket.on("sendDataClient", function (data) {
    console.log("gr", data);
    socketIo.emit("sendDataServer", { data });
  });
  socket.on("addGroup", function (data) {
    socketIo.emit("addGroup", { data });
    console.log("send addGroup", data);
  });
  socket.on("transferLeader", function (data) {
    socketIo.emit("transferLeader", { data });
  });
  socket.on("leaveGroup", function (data) {
    console.log("leaveGroup", data);
    socketIo.emit("leaveGroup", { data });
  });
  socket.on("setCoLeader", function (data) {
    socketIo.emit("setCoLeader", { data });
  });
  socket.on("deleteGroupWhenMem", function (data) {
    socketIo.emit("deleteGroupWhenMem", { data });
  });
  socket.on("leaveGroup", function (data) {
    socketIo.emit("leaveGroup", { data });
  });
  socket.on("message_deletedClient", function (data) {
    console.log(data);
    socketIo.emit("message_deleted", { data });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
module.exports = app;