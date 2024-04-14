const express = require('express')
const router = express.Router()

const { newGroups, getGroupList,deleteGroup,addMembersToGroup,getNonGroupFriends,getGroupMembers,removeMembersFromGroup,setCoLeader,transferOwnership,leaveGroup} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
router.delete('/deleteGroup/:groupId', deleteGroup)
router.put('/addMemberToGroup/:groupId', addMembersToGroup)
router.get('/getNonGroupFriends/:userId/:groupId', getNonGroupFriends)
router.get('/getGroupMembers/:groupId', getGroupMembers)
router.put('/removeMembersFromGroup/:groupId', removeMembersFromGroup)
router.put('/setCoLeader/:groupId/:userId', setCoLeader)
router.put('/transferOwnership/:groupId/:newOwnerId', transferOwnership)
router.put('/leaveGroup/:groupId/:userId', leaveGroup)
module.exports = router