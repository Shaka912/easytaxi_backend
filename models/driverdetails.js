const mongoose = require("mongoose");

const { Schema } = mongoose;

const driverdetailsSchema = new Schema({
  phone: String,
  createdat: {
    default: Date.now,
  },
  password: String,
  driverinfo: { type: Schema.Types.ObjectId, ref: "driver" },
});
