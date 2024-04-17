const Messages = require("../models/message");
const User = require("../models/User.js");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        id: msg._id, // Include the ID of the message
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        createdAt: msg.createdAt,
        isHidden: msg.isHidden,
        avatar: msg.avatar,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};
module.exports.forwardMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    
    // Xác định số lượng người nhận tin nhắn
    const recipients = Array.isArray(to) ? to : [to];
    
    // Hàm gửi tin nhắn cho từng người dùng một cách tuần tự
    async function sendMessageToRecipients(recipients) {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        
        // Tạo tin nhắn
        const data = await Messages.create({
          message: { text: message },
          users: [from, recipient],
          sender: from,
          group: recipient,
        });
        
        // Kiểm tra kết quả và gửi phản hồi
        if (!data) {
          return res.status(500).json({ msg: "Failed to add message to the database" });
        }
      }
      return res.json({ msg: "Messages added successfully." });
    }
    
    // Gửi tin nhắn cho từng người dùng một cách tuần tự
    await sendMessageToRecipients(recipients);
    
  } catch (ex) {
    next(ex);
  }
};


module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message ,avatar} = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      avatar: avatar,

    });

    if (data) return res.json({ msg: "Message added successfully." ,data: data });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};
module.exports.retrieveMessage = async (req, res, next) => {
  try {
    const { messageId, senderId } = req.params;
    console.log(messageId, senderId);
    const message = await Messages.findOneAndUpdate(
      { _id: messageId, sender: senderId },
      { $set: { isHidden: true } },
      { new: true }
    );
    console.log(message);
    // Nếu không tìm thấy tin nhắn, trả về lỗi
    if (!message) {
      return res.status(404).json({ error: "Message not found or not sent by the sender" });
    }

    // Trả về tin nhắn đã được cập nhật
    return res.json({ message: "Message retrieved successfully", updatedMessage: message });
  } catch (ex) {
    next(ex);
  }
};


module.exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    // Tìm kiếm tin nhắn theo ID
    const message = await Messages.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Xóa tin nhắn
    await Messages.findByIdAndUpdate(messageId, { "message.text": "đã thu hồi 1 tin nhắn" });

    return res.json({ message: "Message deleted successfully" });
  } catch (ex) {
    next(ex);
  }
};
module.exports.getGroupMessages = async (req, res, next) => {
  try {
    const { groupId,from } = req.body; // Lấy ID của nhóm từ yêu cầu

    const messages = await Messages.find({
      group: groupId, // Tìm kiếm tin nhắn của nhóm cụ thể
    }).sort({ updatedAt: 1 });
    const projectedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await User.findById(msg.sender).select('name');
      console.log('Sender name:', sender.name); // Chỉnh lại thành sender.name
      return {
          id: msg._id,
          fromSelf: msg.sender.toString() === from,
          message: msg.message.text,
          createdAt: msg.createdAt,
          isHidden: msg.isHidden,
          group: msg.group,
          avatar: msg.avatar,
          name: sender.name, // Thay vì senderName
      };
  }));
  

    res.json(projectedMessages); // Trả về tin nhắn của nhóm
  } catch (ex) {
    next(ex); // Xử lý lỗi nếu có
  }
};

module.exports.sendMessageToGroup = async (req, res, next) => {
  try {
    const { to, from, message,avatar } = req.body; // Lấy thông tin từ yêu cầu

    const newMessage = await Messages.create({
      message: { text: message }, // Nội dung tin nhắn
      users: [from, to],
      group: to, // ID của nhóm
      sender: from, // Người gửi
      avatar: avatar,
    });

    if (newMessage) {
      return res.json({ message: "Message sent to group successfully", data: newMessage });
    } else {
      return res.status(500).json({ error: "Failed to send message to group" });
    }
  } catch (ex) {
    next(ex);
  }
};