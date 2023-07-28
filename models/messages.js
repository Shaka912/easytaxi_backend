const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
    senderId: String,
    recipientId: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  });
  
  const ChatSchema = new Schema({
    rideRequestId: String,
    messages: [MessageSchema],
  });
module.exports = mongoose.model('messages', ChatSchema);