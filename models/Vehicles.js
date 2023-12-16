const mongoose = require('mongoose');
const { Schema } = mongoose;

const vehicleTypes = ['sedan', 'mini', 'electric', 'suv'];
const controlTypes = ['manual', 'auto'];
const usageTypes = ['General Use', 'Commercial Use'];

const VehicleSchema = new Schema({
    vehicle_type: {
        type: String,
        required: true,
        enum: vehicleTypes,
    },
    vehicle_name: {
        type: String,
        required: true,
    },
    vehicle_petrol_capacity: {
        type: Number,
        required: true,
    },
    vehicle_petrol_average: {
        type: Number,
        required: true,
    },
    vehicle_max_power: {
        type: Number,
        required: true,
    },
    vehicle_max_speed: {
        type: Number,
        required: true,
    },
    vehicle_control_type: {
        type: String,
        required: true,
        enum: controlTypes,
    },
    vehicle_sitting_capacity: {
        type: Number,
        required: true,
    },
    vehicle_price_per_day: {
        type: Number,
        required: true,
    },
    vehicle_image: {
        type: String,
        required: true,
    },
    vehicle_useage: {
        type: String,
        required: true,
        enum: usageTypes,
    },
    vehicle_useage_purpose: {
        type: String,
        required: true,
    },
    vehicle_availability: {
        type: Boolean,
        default: true,
    }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
