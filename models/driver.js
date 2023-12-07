const mongoose = require('mongoose');

const genderEnum = ['male', 'female', 'other'];
const vehicle_type = ['sedan', 'mini', 'electric', 'suv', 'courier'];

const Driver = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  city: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  gender: { type: String, required: true, enum: genderEnum },
  isValid: { type: Boolean, default: false },
  vehicle: {
    brand: {
      type: String,
      required: true
    },
    vehicletype: {
      type: String,
      required: true,
      enum: vehicle_type
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    plate_number: {
      type: String,
      required: true,
      unique: true
    },
    images: {
      vehicle_image: {
        type: String,
        required: true
      },
      license_image: {
        type: String,
        required: true
      },
      driver_image: {
        type: String,
        required: true
      }
    }
  },
}, { timestamps: true });

module.exports = mongoose.model('driver', Driver);
