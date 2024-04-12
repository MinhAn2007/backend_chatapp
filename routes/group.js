const express = require('express')
const router = express.Router()

const { newGroups, getGroupList,deleteGroup} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
router.delete('/deleteGroup/:groupId', deleteGroup)
module.exports = router