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
      };
    });
    res.json(projectedMessages);
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

    // Kiểm tra xem người gửi có phải là người gửi của tin nhắn hay không
    const message = await Messages.findOne({
      _id: messageId,
      sender: senderId,
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found or not sent by the sender" });
    }

    // Xóa tin nhắn nếu người gửi là người thu hồi
    await Messages.findByIdAndDelete(messageId);

    return res.json({ message: "Message retrieved successfully" });
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
    await Messages.findByIdAndDelete(messageId);

    return res.json({ message: "Message deleted successfully" });
  } catch (ex) {
    next(ex);
  }
};
