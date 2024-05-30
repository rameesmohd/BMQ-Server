const express = require("express")
const router = express.Router()
const adminController = require('../controller/adminController')

router.route('/users')
    .get(adminController.fetchUsers)
    .patch(adminController.blockToggle)
router.route('/order')
    .get(adminController.fetchOrder)
    .patch(adminController.handleOrder)

router.post('/login',adminController.login)

module.exports = router