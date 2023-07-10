const mongoose = require("mongoose");

const { Schema } = mongoose;

const driverSchema = new Schema({
    firstname: String,
    lastname: String,
    email: String,
    phone: String,
    car: String,
    car_model: String,
    car_color: String,
    car_plate: String,
    driverid:{ type: mongoose.Schema.Types.ObjectId, ref: "driverdetails" },
    rideRequests: [{ type: Schema.Types.ObjectId, ref: "riderequest" }],
    ratings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'driverrating',
      }], 
})

const driverModel = mongoose.model("driver", driverSchema);

module.exports = driverModel;