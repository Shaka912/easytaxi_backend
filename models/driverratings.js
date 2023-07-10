const mongoose = require("mongoose");

const { Schema } = mongoose;

const driverratingSchema = new Schema({
    driverinfo: { type: Schema.Types.ObjectId, ref: "driver" },
    ratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    rideRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'riderequest',
        required: true
    },
    comment: {
        type: String
    }
})

const ratings  = mongoose.model('driverrating', driverratingSchema);
module.exports = ratings;