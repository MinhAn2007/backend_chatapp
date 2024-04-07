const express = require('express')
const router = express.Router()

//Handlers from controllers
const { login, signup, sendotp } = require("../controllers/auth")
const { updateUser, updatePassword, uploadAvatarS3, resetPassword } = require('../controllers/user')
router.post('/login', login)
router.post('/signup', signup)
router.post('/sendotp', sendotp)
router.put('/updatePassword/:email', updatePassword)
router.put('/updateUser/:userId', updateUser)
router.post('/uploadAvatarS3/:userId', uploadAvatarS3)
router.post('/resetPassword',resetPassword)

module.exports = router