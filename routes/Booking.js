const express = require('express')
const imageupload = require('../middleware/fileUpload')
const auth = require('../middleware/fetchuser')
const { PostBooking,get_userbooking } = require('../Controllers/BookingController')
const router = express.Router()

router.route('/addbooking').post(auth, imageupload.array('bookingimages', 3), PostBooking)
router.route('/bookings').get(auth, get_userbooking)

module.exports = router
