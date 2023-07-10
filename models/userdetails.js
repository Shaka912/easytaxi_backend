const mongoose = require('mongoose');
const {Schema} = mongoose;

const details = new Schema({
    firstname: String,
    lastname: String,
    email: String,
    gender: String,
    birthdate: String,
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, 
    rideRequests: [{ type: Schema.Types.ObjectId, ref: "riderequest" }],
    ratings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userratings',
      }],
})

const Details = mongoose.model('userdetails', details);

module.exports = Details;