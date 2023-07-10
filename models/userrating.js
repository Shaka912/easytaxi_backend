const mongoose = require("mongoose");

const { Schema } = mongoose;

const userratingsSchema = new Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, 
    ratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'driver',
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

const userratings = mongoose.model("userratings", userratingsSchema);
module.exports = userratings;