const express = require('express')
const router = express.Router()

const { newGroups, getGroupList,deleteGroup,addMemberToGroup} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
router.delete('/deleteGroup/:groupId', deleteGroup)
router.put('/addMemberToGroup/:groupId', addMemberToGroup)
module.exports = router