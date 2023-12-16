const mongoose = require('mongoose');
const { Schema } = mongoose;

const booking_duration = ['Full Day', 'Per Hour'];
const booking_helper = ['With Driver', 'Without Driver'];

const BookingSchema = new Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    booking_duration: {
        type: String,
        required: true,
        enum: booking_duration
    },
    booking_helper: {
        type: String,
        required: true,
        enum: booking_helper
    },
    booking_origin: {
        type: String,
        required: true,
    },
    booking_destination: {
        type: String,
        required: true,
    },
    booking_cost: {
        type: Number,
        required: true,
    },
    verification: {
        national_id_image: {
            type: String,
            required: true
        },
        guarantee_image: {
            type: String,
            required: true
        },
        license_image: {
            type: String,
        }
    },
    booking_status: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('booking', BookingSchema);
