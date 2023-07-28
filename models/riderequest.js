const mongoose = require("mongoose");

const { Schema } = mongoose;

const rideRequestSchema = new Schema({
  origin: {
    // type: { type: String, default: "Point" },
    // coordinates: {
    //   type: [Number],
    //   required: true,
    // },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  destination: {
    // type: { type: String, default: "Point" },
    // coordinates: {
    //   type: [Number],
    //   required: true,
    // },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  fare: {
    type: Number,
    required: true,
  },
  vehicleTier: {
    type: String,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "accepted", "completed", "cancelled", "in-progress"],
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "driver", // assuming you have a Driver model
    default: null,
  },
  chatRoomId: {
    type: String,
    default: null,
  },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
});

// rideRequestSchema.index({ origin: "2dsphere" });
// rideRequestSchema.index({ destination: "2dsphere" });
module.exports = mongoose.model("riderequest", rideRequestSchema);
