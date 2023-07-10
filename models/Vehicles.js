// list of vehicle avaialbe for renting 
const mongoose = require('mongoose');
const {Schema} = mongoose;

const VehicleSchema = new Schema ({

    Name:{
        type: String,
        required: true
    },
    Image:{
        type: String,
        required: true
    },
    Model:{
        type: String,
        required: true
    },
    Make:{
        type:Number,
        required:true,
    }
});
const Vehicle = mongoose.model("Vehicle", VehicleSchema);
module.exports = Vehicle;