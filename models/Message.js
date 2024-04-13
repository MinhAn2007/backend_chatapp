const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isHidden: { type: Boolean, default: false }, 
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group', // Tham chiếu đến mô hình Group hoặc bất kỳ mô hình nhóm nào bạn đang sử dụng
    },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }

);

module.exports = mongoose.model("Messages", MessageSchema);
