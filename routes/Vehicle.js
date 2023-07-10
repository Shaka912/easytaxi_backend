const express = require("express");
const router = express.Router();

const fetchuser = require("../middleware/fetchuser");
const Vehicles = require("../models/Vehicles");
const { body, validationResult } = require("express-validator");



// adding vehicles to server using post request

router.post(
  "/addvehicles",
  [
    body("Name", "please Enter Vehicle Name").exists(),
    body("Model", "Please Enter Model  name ").exists(),
    body("Make", "Please Enter Making Year").exists(),
    body("Image", "Please Enter Image string").exists(),
  ],
  async (req, res) => {
    try {
      const { Name, Model, Make, Image } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const vehicle = new Vehicles({ Name, Model, Make, Image });
      const save = await vehicle.save();
      res.json(save);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error has accored");
    }
  }
);
// fetching all cars available for renting

router.get("/getvehicles",async (req, res) => {
    try {
      const vehicle1 =await Vehicles.find({});
      res.json(vehicle1);
    
    } catch (error) {
      console.log(error);
    }
  });
module.exports = router;
