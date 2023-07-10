const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
const Riderequest = require("../models/riderequest");
const Userrating = require("../models/userrating");
const Driverrating = require("../models/driverrating");
const Driver = require("../models/driver");
const User = require("../models/users");
const Userdetails = require("../models/userdetails");
// route: 1 adding users current location and destination by Post request(Login required)
router.post('/ride-request', async (req, res) => {
  const { origin, destination, fare, vehicleTier,userid } = req.body;
  const user = await Userdetails.findOne({userid:userid})
  if(!user){
    return res.status(400).json({error:"No User found"})
  }
  const rideRequest = new Riderequest({
    origin,
    destination,
    fare,
    vehicleTier,
    userid,
    requestedAt: new Date(),
  });
  await rideRequest.save();
  user.rideRequests.push(rideRequest._id);
  // emit this ride request to all drivers
  req.app.io.to('drivers').emit('new ride request', rideRequest); // will send new ride request to all drivers. Listen for 'new ride request' events and update the user interface accordingly. This will allow your application to instantly display new ride requests as they're created

  res.status(200).send({ success: true, rideRequest });
});

// route for rating user upon ride completion
router.post('/rate-user', async (req, res) => {
  // Code to handle user rating submission
  const { rideRequestId, rating, ratedById, comment,userid } = req.body;

  const ratedBy = await Driver.findById({driverid:ratedById});

  if (!ratedBy) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  const newRating = new Userrating({
    ratedBy: ratedById,
    rating:rating,
    rideRequestId:rideRequestId,
    comment: comment,
    userid:userid
  });
  await newRating.save();
  const ratedUser = await Userdetails.findOne({ rideRequests: rideRequestId });
  
  if (!ratedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  ratedUser.ratings.push(newRating);
  await ratedUser.save();

  res.status(200).json(newRating);
});
//route for rating driver upone ride completion 
router.post('/rate-driver', async (req, res) => {
  // Code to handle driver rating submission
  const { rideRequestId, rating, ratedById, comment } = req.body;

  const ratedBy = await Userdetails.findOne({userid:ratedById});

  if (!ratedBy) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newRating = new Driverrating({
    ratedBy: ratedById,
    rating,
    rideRequestId,
    comment
  });

  await newRating.save();

  const ratedDriver = await Driver.findOne({ rideRequests: rideRequestId });

  if (!ratedDriver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  ratedDriver.ratings.push(newRating);
  await ratedDriver.save();

  res.status(200).json(newRating);
});
module.exports = router;
