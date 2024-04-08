const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
        trim: true
    },
    email: {
        type: String,
        required : true,
        trim: true
    },
    password: {
        type: String,
        required : true
    },
    gender: {
        type: Boolean,
        default: false,
      },
    avatar: {
        type: String 
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    receivedFriendRequests: [{ // Danh sách các lời mời kết bạn đã nhận
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    
})

module.exports = mongoose.model('user', userSchema)