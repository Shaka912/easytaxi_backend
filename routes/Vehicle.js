const express = require("express");
const router = express.Router();
const imageupload = require('../middleware/fileUpload')
const auth = require('../middleware/fetchuser');
const { PostVehicle, Get_Vehicles } = require("../Controllers/VehicleController");

router.route('/add_vehicle').post(imageupload.single('vehicle'), PostVehicle)
router.route('/get_vehicles/:vehicle_useage/:vehicle_useage_purpose').get(Get_Vehicles)

module.exports = router;
