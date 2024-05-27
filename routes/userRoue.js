const express = require("express");
const router = express.Router();
const userController = require('../controller/userController')

router.post('/phonepe/payment',userController.makePurchase)
// router.post('/phonepe/status',orderController.phonePeStatus)

module.exports = router