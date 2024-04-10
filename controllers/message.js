const Messages = require("../models/message");

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
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
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
