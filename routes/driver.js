const express = require('express')
const imageupload = require('../middleware/fileUpload')
const auth = require('../middleware/fetchuser')
const { Login, Register, verifyotp, driver_to_user,driver_rating,SendAgianOtp } = require('../Controllers/DriverController')
const router = express.Router()

router.route('/login').post(Login)
router.route('/register').post(imageupload.array("driver", 3), Register)
router.route('/verifyotp').post(verifyotp)
router.route('/SendAgianOtp').post(SendAgianOtp)
router.route('/userrating').post(auth, driver_to_user)
router.route('/rating').post(auth, driver_rating) //Getting Driver Average Rating

module.exports = router
