const express = require('express')
const router = express.Router()

//Handlers from controllers
const { login, signup, sendotp } = require("../controllers/auth")
const { updateUser, updatePassword, uploadAvatarS3, resetPassword ,findUserByEmail,
    sendFriendRequest,acceptFriendRequestAndSendMessage,
    getFriendRequestsSentToUser} = require('../controllers/user')

const { addMessage, getMessages } = require("../controllers/message");

router.post('/login', login)
router.post('/signup', signup)
router.post('/sendotp', sendotp)
router.put('/updatePassword/:email', updatePassword)
router.put('/updateUser/:userId', updateUser)
router.post('/uploadAvatarS3/:userId', uploadAvatarS3)
router.post('/resetPassword',resetPassword)
router.get('/findUserByEmail/:email',findUserByEmail)
router.get('/getFriendRequestsSentToUser/:userId',getFriendRequestsSentToUser)
router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.post("/sendFriendRequest/", sendFriendRequest);
router.post("/acceptFriendRequestAndSendMessage/", acceptFriendRequestAndSendMessage);

module.exports = router