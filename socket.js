const Riderequest = require("./models/riderequest");
const User = require("./models/users");
const Chat = require("./models/messages");
const jwt = require("jsonwebtoken");

module.exports = (io) => {
  //middleware to check if the user is authenticated
  //this middleware ensures that every connection comes to server is authenticated with correct user
  // io.use((socket, next) => {
  //   if (socket.handshake.query && socket.handshake.query.token){
  //     jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, function(err, decoded) {
  //       if (err) return next(new Error('Authentication error'));
  //       socket.decoded = decoded;
  //       next();
  //     });
  //   }
  //   else {
  //     next(new Error('Authentication error'));
  //   }
  // })
  // Create an object to store the mapping of user IDs to sockets
  const users = {};
  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
    // When a user connects, store their socket
    socket.on("userConnected", (userId) => {
      users[userId] = socket;
      socket.join(`user_${userId}`);
    });

    // Similarly for drivers
    socket.on("driverConnected", (driverId) => {
      users[driverId] = socket;
      socket.join(`driver_${driverId}`);
      socket.join("drivers");
      console.log("driver connected");
    });
    //socket event once user decides to find a driver
    socket.on("rideRequest", async (rideDetails) => {
      rideDetails.userId = socket.id;
      socket.to("drivers").emit("newRideRequest", rideDetails);
      console.log(rideDetails);
    });
    //socket event if user decides to cancel the request before start of ride .
    socket.on("cancelRideRequest", (rideId) => {
      socket.to("drivers").emit("removeRideRequest", rideId);
    });
    //socket event once drivers submits his desired offer for the fare it will be broadcasted to rider
    socket.on(
      "acceptRideRequest",
      (rideDetails) => {
        console.log(rideDetails)
        //const offer = { rideId, driverId, modifiedFare };
       // const offer = { name, driverId, carName, rating, price };
console.log(`user_${rideDetails.userId}`)
        io.to(`user_${rideDetails.userId}`).emit("rideOffer", rideDetails);
      }
    );
    //socket event once the rider  accepts the ride and offer by the driver
    //it will be used in rider side
    socket.on("acceptRideOffer", async (rideDetails) => {
      console.log(rideDetails)
      //const acceptedOffer = { rideRequestId, driverId };
      // socket.to("drivers").emit("removeRideRequest", rideRequestId);

      // const rideRequest = await Riderequest.findById(rideRequestId);
      // if (!rideRequest) {
      //   return socket.emit("error", "Ride request not found");
      // }
      const rideRequest = await Riderequest.create({
        origin: rideDetails.origin,
        destination: rideDetails.destination,
        fare: rideDetails.fare,
      });
      // Generate a unique chatRoomId for this ride
      rideRequest.chatRoomId = `ride_${rideRequest._id}`;
      rideRequest.status = "accepted";
      rideRequest.acceptedBy = rideDetails.driverId;
      await rideRequest.save();
      // Emit an event to the driver who accepted the offer
      socket.to(rideDetails.driverId).emit("offerAccepted", rideRequest);
      // Join the rider and driver to the chat room
      socket.join(rideRequest.chatRoomId);
      if (users[rideDetails.driverId]) {
    users[rideDetails.driverId].join(rideRequest.chatRoomId);
  }
 // Emit an event to the driver who accepted the offer
  socket.to(rideDetails.driverId).emit("offerAccepted", rideRequest);
    });

    socket.on("rejectRideOffer", (rideId, driverId) => {
      const rejectedOffer = { rideId, driverId };
      socket.to("drivers").emit("newRideRequest", rideId);
      socket.to(driverId).emit("rideOfferRejected", rejectedOffer);
    });

    //socket event once the rider accepts ride offer, this event will be used to track driver approaching rider
    socket.on("driverLocationUpdate",async (data,rideId) =>{
      const rideRequest = await Riderequest.findById(rideId);

      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }
      console.log(data)
      io.to(`user_${rideRequest.userId}`).emit("driverLocation", data);
    })


    //socket event once the ride is started , this event can be started from driver side.
    socket.on("startride", async ({ rideRequestId }) => {
      const rideRequest = await Riderequest.findById(rideRequestId);

      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }

      rideRequest.status = "in-progress";
      await rideRequest.save();
      // Emitting an event to user that the ride is started so we can update the UI accordingly
      io.to(`user_${rideRequest.userId}`).emit("rideStarted", rideRequest);
      // Emitting an event to driver that the ride is started so we can update the UI accordingly
      io.to(`driver_${rideRequest.acceptedBy}`).emit(
        "ride started",
        rideRequest
      );
    });
    //listening a for end ride event on the client side and performing function on the server side upon fire of the event
    socket.on("end ride", async ({ rideRequestId }) => {
      const rideRequest = await Riderequest.findById(rideRequestId);
      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }
      rideRequest.status = "completed";
      await rideRequest.save();

      // Both user and driver leave the chat room
      if (users[rideRequest.userId]) {
        users[rideRequest.userId].leave(rideRequest.chatRoomId);
      }
      if (users[rideRequest.acceptedBy]) {
        users[rideRequest.acceptedBy].leave(rideRequest.chatRoomId);
      }

      // Notify both user and driver that the ride has ended
      io.to(`user_${rideRequest.userId}`).emit("ride ended", rideRequest);
      io.to(`driver_${rideRequest.acceptedBy}`).emit("ride ended", rideRequest);
    });
    //socket event if the user decides to cancel the ride
    socket.on("cancel ride request", async ({ rideRequestId, userId }) => {
      let rideRequest = await Riderequest.findById(rideRequestId);
      let user = await User.findById(userId);

      if (
        rideRequest &&
        user &&
        String(rideRequest.userid) === String(user._id) &&
        rideRequest.status !== "completed"
      ) {
        rideRequest.status = "cancelled";
        await rideRequest.save();

        // Emit a 'ride request cancelled' event to just the 'drivers' room.
        io.to(`driver_${rideRequest.acceptedBy}`).emit("ride cancelled", {
          rideRequestId: rideRequestId,
        });
        // io.to("drivers").emit("ride request cancelled", {
        //   rideRequestId: rideRequestId,
        // });
      }
    });
    // Send message
    socket.on(
      "send message",
      async ({ message, senderId, recipientId, rideRequestId }) => {
        const chat = await Chat.findOne({ rideRequestId });
        if (chat) {
          chat.messages.push({
            message,
            senderId: socket.decoded.id,
            recipientId,
          });
          await chat.save();
        } else {
          const newChat = new Chat({
            rideRequestId,
            messages: [
              {
                message,
                senderId: socket.decoded.id,
                recipientId,
              },
            ],
          });
          await newChat.save();
        }
        // Emit the message to the chat room
        io.to(rideRequestId).emit("receive message", {
          message,
          senderId,
          recipientId,
          rideRequestId,
          timestamp: chat.timestamp,
        });
      }
    );
  });
};
