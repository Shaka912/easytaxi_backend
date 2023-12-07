const express = require('express')
const imageupload = require('../middleware/fileUpload')
const auth = require('../middleware/fetchuser')
const { Login, Register, verifyotp, driver_to_user } = require('../Controllers/DriverController')
const router = express.Router()

router.route('/login').post(Login)
router.route('/register').post(imageupload.array("driver", 3), Register)
router.route('/verifyotp').post(verifyotp)
router.route('/userrating').post(auth, driver_to_user)

module.exports = router
