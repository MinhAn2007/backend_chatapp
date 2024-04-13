const express = require('express')
const router = express.Router()

const { newGroups, getGroupList,deleteGroup,addMembersToGroup,getNonGroupFriends,getGroupMembers,removeMembersFromGroup,setCoLeader} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
router.delete('/deleteGroup/:groupId', deleteGroup)
router.put('/addMemberToGroup/:groupId', addMembersToGroup)
router.get('/getNonGroupFriends/:userId/:groupId', getNonGroupFriends)
router.get('/getGroupMembers/:groupId', getGroupMembers)
router.put('/removeMembersFromGroup/:groupId', removeMembersFromGroup)
router.put('/setCoLeader/:groupId/:userId', setCoLeader)
module.exports = router