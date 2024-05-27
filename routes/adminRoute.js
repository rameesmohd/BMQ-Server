const express = require("express")
const router = express.Router()
const adminController = require('../controller/adminController')

router.route('/users')
    .get(adminController.fetchUsers)
    .patch(adminController.blockToggle)

module.exports = router