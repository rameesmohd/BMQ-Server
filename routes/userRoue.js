const express = require("express");
const router = express.Router();
const userController = require('../controller/userController')
const multer = require('../config/multer')
const upload = multer.createMulter()

router.route('/purchase')
    .post(upload.fields([{ name: 'uploadedFile' }]),userController.makePurchase)
    // router.post('/phonepe/status',orderController.phonePeStatus)

router.post('/login',userController.login)


module.exports = router