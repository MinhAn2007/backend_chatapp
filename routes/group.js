const express = require('express')
const router = express.Router()

const { newGroups, getGroupList} = require('../controllers/group')

router.post('/newGroups', newGroups)
router.get('/getGroupList/:userId', getGroupList)
module.exports = router