const express = require("express")
const router = express.Router()
const adminController = require('../controller/adminController')
const {verifyToken} = require('../middleware/adminAuth')

router.post('/login',adminController.login)

router.use(verifyToken)

router.route('/users')
    .get(adminController.fetchUsers)
    .patch(adminController.blockToggle)
router.route('/order')
    .get(adminController.fetchOrder)
    .patch(adminController.handleOrder)


module.exports = router