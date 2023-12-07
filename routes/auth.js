const express = require('express')
const auth = require('../middleware/fetchuser')
const router = express.Router()
const imageupload = require('../middleware/fileUpload')
const { Login, Register, verifyotp, user_to_driver } = require('../Controllers/AuthControllers')

router.route('/login').post(Login)
router.route('/register').post(imageupload.single('profile'), Register)
router.route('/verifyotp').post(verifyotp)
router.route('/driverrating').post(auth, user_to_driver)


module.exports = router
