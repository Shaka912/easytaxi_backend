const mongoose = require('mongoose');
const {Schema} = mongoose;


const UserSchema = new Schema ({

    timestamp:{
        type: Date,
        default: Date.now
    },
    fcmtoken:{type:String},
    phonenumber:{
        type: Number,
        required:true,
        unique:true
    }
});
const user = mongoose.model("users", UserSchema);

module.exports = user; 