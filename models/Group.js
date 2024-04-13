const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    leader: {  // Nhóm trưởng
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Tham chiếu tới user trong collection 'User'
    },
    coLeader: [{  // Nhóm phó
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Tham chiếu tới user trong collection 'User'
    }],
    members: [{  // Các thành viên
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Tham chiếu tới user trong collection 'User'
    }],
    avatar: {
        type: String 
    },
});

module.exports = mongoose.model('Group', groupSchema);
