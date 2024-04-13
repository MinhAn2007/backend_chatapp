const express = require('express')
const router = express.Router()

const { newGroups, getGroupList,deleteGroup,addMemberToGroup,getNonGroupFriends} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
router.delete('/deleteGroup/:groupId', deleteGroup)
router.put('/addMemberToGroup/:groupId', addMemberToGroup)
router.get('/getNonGroupFriends/:userId/:groupId', getNonGroupFriends)
module.exports = router