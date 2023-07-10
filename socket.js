const Riderequest = require("./models/riderequest");
const User = require("./models/users");
const Chat = require("./models/messages")
const jwt = require('jsonwebtoken');;
module.exports = (io) => {
  //middleware to check if the user is authenticated
  //this middleware ensures that every connection comes to server is authenticated with correct user
  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
      jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, function(err, decoded) {
        if (err) return next(new Error('Authentication error'));
        socket.decoded = decoded;
        next();
      });
    }
    else {
      next(new Error('Authentication error'));
    }    
  })

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
    // Handle a driver registering
    socket.on("register as driver", () => {
      console.log("Driver registered: " + socket.id);
      socket.join("drivers");
    });
    //socket event once a driver accepts a ride request
    socket.on("accept ride request", async (data) => {
      const { rideRequestId, driverId } = data;

      const rideRequest = await Riderequest.findById(rideRequestId);
      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }

      if (new Date() - rideRequest.requestedAt > 5 * 60 * 1000) {
        return socket.emit("error", "Ride request expired");
      }

      if (rideRequest.acceptedBy) {
        return socket.emit(
          "error",
          "Ride request already accepted by another driver"
        );
      }
      // Generate a unique chatRoomId for this ride
      rideRequest.chatRoomId = `ride_${rideRequestId}`;
      rideRequest.status = "accepted";
      rideRequest.acceptedBy = driverId;
      await rideRequest.save();
      // The driver joins the chat room
      socket.join(rideRequest.chatRoomId);
      // Notify the user that their ride request was accepted
      const userId = rideRequest.userid;
      io.to(userId).emit("ride request accepted", {
        rideRequestId,
        driverId,
        chatRoomId: rideRequest.chatRoomId,
      });
      socket.emit("chat room joined", rideRequest.chatRoomId);
      // Emit an 'ride request accepted' event, including the ID of the ride request that was accepted.
      // This will be received by all connected clients.
      //and listen this event on client side to change ui accordingly
      io.emit("ride request accepted", rideRequestId);
    });
    //socket event once the ride is started
    socket.on("start ride", async ({ rideRequestId }) => {
      const rideRequest = await Riderequest.findById(rideRequestId);

      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }

      rideRequest.status = "in-progress";
      await rideRequest.save();
      //emiting an event to user that the ride is started so we can update the ui accordingly
      io.to(rideRequest.userid).emit("ride started", rideRequest);
      //emiting an event to driver that the ride is started so we cab update the ui accordingly
      io.to(rideRequest.acceptedBy).emit("ride started", rideRequest);
    });
    //listening a for end ride event on the client side and performing function on the server side upon fire of the event
    socket.on("end ride", async ({ rideRequestId }) => {
      const rideRequest = await Riderequest.findById(rideRequestId);
      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }
      rideRequest.status = "completed";
      await rideRequest.save();

      socket.leave(rideRequest.chatRoomId); // Both user and driver leave the chat room

      // Notify both user and driver that the ride has ended
      io.to(rideRequest.userid).emit("ride ended", rideRequest);
      io.to(rideRequest.acceptedBy).emit("ride ended", rideRequest);
    });
    //socket event if the user decides to cancel the ride
    socket.on('cancel ride request', async ({ rideRequestId, userId }) => {
      
      let rideRequest = await Riderequest.findById(rideRequestId);
      let user = await User.findById(userId);

      if (rideRequest && user && String(rideRequest.userid) === String(user._id) && rideRequest.status !== 'completed') {
        rideRequest.status = 'cancelled';
        await rideRequest.save();

        // Emit a 'ride request cancelled' event to just the 'drivers' room.
        io.to('drivers').emit('ride request cancelled', { rideRequestId: rideRequestId });
      }
    });
    // Send message
    socket.on('send message', async ({ message, senderId, recipientId, rideRequestId }) => {
      const chat = await Chat.findOne({ rideRequestId });
      if (chat) {
        chat.messages.push({
          message,
          senderId: socket.decoded.id,
          recipientId,
        });
        await chat.save();
      }else {
        const newChat = new Chat({
          rideRequestId,
          messages: [{
            message,
            senderId: socket.decoded.id,
            recipientId,
          }]
        });
        await newChat.save();
      }
       // Emit the message to the chat room
       io.to(rideRequestId).emit('receive message', {
        message,
        senderId,
        recipientId,
        rideRequestId,
        timestamp: chat.timestamp,
      });
    });
  });
};
