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
      console.log("User connected " + userId)
    });

    // Similarly for drivers
    socket.on("driverConnected", (driverId) => {
      users[driverId] = socket;
      socket.join(`driver_${driverId}`);
      socket.join("drivers");
      console.log("driver connected " + driverId);
    });


    const disconnectDriver = (driverId) => {
      const driverSocket = users[driverId];
      if (driverSocket) {
        // Leave the driver room
        driverSocket.leave(`driver_${driverId}`);
        driverSocket.leave("drivers");

        // Notify other users that the driver is disconnected
        // socket.to("drivers").emit("driverDisconnected", driverId);
        console.log(`Driver disconnected: ${driverId}`);
      }
    };

    // Add a socket event to disconnect a specific driver
    socket.on("disconnectDriver", (driverId) => {
      disconnectDriver(driverId);
    });



    //socket event once user decides to find a driver
    socket.on("rideRequest", async (rideDetails) => {
      // rideDetails.userId = socket.id;

      // Store the ride request data in the users object
      users[rideDetails.userId] = { socket, rideRequestData: rideDetails };

      socket.to("drivers").emit("newRideRequest", rideDetails);
      console.log(rideDetails);
    });


    socket.on('updaterequest', async (user_id, price, type) => {
      // console.log(type);
      var newprice = price
      if (type == "increment") {
        newprice = newprice + 1
      } else {
        newprice = newprice - 1
      }
      // Access the ride request data emitted in "newRideRequest" event
      const rideRequestData = users[user_id]?.rideRequestData;
      if (rideRequestData) {
        rideRequestData.reduxprice = newprice
        socket.to("drivers").emit("newRideRequest", rideRequestData);
        console.log(rideRequestData)
      } else {
        console.log("No ride request data found for user:", user_id);
      }
    });


    socket.on('deleteride', async (user_id) => {
      // Access the ride request data emitted in "newRideRequest" event
      const rideRequestData = users[user_id]?.rideRequestData;
      if (rideRequestData) {
        console.log(rideRequestData)
        delete users[user_id]?.rideRequestData;
        socket.to("drivers").emit("ridedeleted", rideRequestData);
      } else {
        console.log("No ride request data found for user:", user_id);
      }
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
      rideRequest.userid = rideDetails.userId;
      await rideRequest.save();
      // Emit an event to the driver who accepted the offer
      // socket.to(rideDetails.driverId).emit("offerAccepted", rideRequest);
      io.to(`user_${rideDetails.userId}`).emit("offerAccepted", rideRequest);
      // Join the rider and driver to the chat room
      socket.join(rideRequest.chatRoomId);
      if (users[rideDetails.driverId]) {
        users[rideDetails.driverId].join(rideRequest.chatRoomId);
      }
      // Emit an event to the driver who accepted the offer
      // socket.to(rideDetails.driverId).emit("offerAccepted", rideRequest);
      io.to(`driver_${rideDetails.driverId}`).emit("offerAccepted", rideRequest);
    });

    socket.on("rejectRideOffer", (rejectdata, driveId) => {
      socket.to("drivers").emit("newRideRequest", rejectdata);
      io.to(driveId).emit("rideOfferRejected");
      // console.log(rejectdata);
    });

    //socket event once the rider accepts ride offer, this event will be used to track driver approaching rider
    socket.on("driverLocationUpdate", async (data, rideId) => {
      // console.log(data)
      const rideRequest = await Riderequest.findById(rideId);

      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }
      // console.log(rideRequest)
      io.to(`user_${rideRequest.userid}`).emit("driverLocation", data);
      console.log(rideId);
      // console.log(data)
      // console.log(rideRequest);
    })


    //socket event once the ride is started , this event can be started from driver side.
    socket.on("startride", async (rideRequestId) => {
      const rideRequest = await Riderequest.findById(rideRequestId);

      if (!rideRequest) {
        console.log("Ride request not found");
      }

      rideRequest.status = "in-progress";
      await rideRequest.save();
      // Emitting an event to user that the ride is started so we can update the UI accordingly
      io.to(`user_${rideRequest.userid}`).emit("rideStarted", rideRequest);
      // Emitting an event to driver that the ride is started so we can update the UI accordingly
      io.to(`driver_${rideRequest.acceptedBy}`).emit(
        "ride started",
        rideRequest
      );
    });
    //listening a for end ride event on the client side and performing function on the server side upon fire of the event
    socket.on("end ride", async (rideRequestId) => {
      const rideRequest = await Riderequest.findById(rideRequestId);
      if (!rideRequest) {
        return socket.emit("error", "Ride request not found");
      }
      rideRequest.status = "completed";
      await rideRequest.save();

      // Both user and driver leave the chat room
      // if (users[rideRequest.userid]) {
      //   users[rideRequest.userid].leave(rideRequest.chatRoomId);
      // }
      if (users[rideRequest.userid] && users[rideRequest.userid].socket) {
        users[rideRequest.userid].socket.leave(rideRequest.chatRoomId);
      }
      if (users[rideRequest.acceptedBy]) {
        users[rideRequest.acceptedBy].leave(rideRequest.chatRoomId);
      }

      console.log(rideRequest)

      // Notify both user and driver that the ride has ended
      io.to(`user_${rideRequest.userid}`).emit("ride ended", rideRequest);
      io.to(`driver_${rideRequest.acceptedBy}`).emit("ride ended", rideRequest);
    });
    //socket event if the user decides to cancel the ride
    socket.on("cancel ride request", async (rideRequestId, userId) => {
      let rideRequest = await Riderequest.findById(rideRequestId);
      let user = userId

      if (
        rideRequest &&
        user &&
        String(rideRequest.userid) === String(user) &&
        rideRequest.status !== "completed"
      ) {
        rideRequest.status = "cancelled";
        rideRequest.cancelby = "user";
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
    //Event if driver decided to cancel the ride
    socket.on("driver cancel ride request", async (rideRequestId, driverid) => {
      let rideRequest = await Riderequest.findById(rideRequestId);
      let driver = driverid

      if (
        rideRequest &&
        driver &&
        String(rideRequest.acceptedBy) === String(driver) &&
        rideRequest.status !== "completed"
      ) {
        rideRequest.status = "cancelled";
        rideRequest.cancelby = "driver";
        await rideRequest.save();

        // Emit a 'ride request cancelled' event to just the 'User' room.
        io.to(`user_${rideRequest.userid}`).emit("ride cancelled", {
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
      async ({ message, senderId, recipientId, rideRequestId, type }) => {
        const chat = await Chat.findOne({ rideRequestId });
        if (chat) {
          chat.messages.push({
            message,
            senderId,
            recipientId,
            user: type
          });
          await chat.save();
        } else {
          const newChat = new Chat({
            rideRequestId,
            messages: [
              {
                message,
                senderId,
                recipientId,
                user: type
              },
            ],
          });
          await newChat.save();
        }

        // console.log(chat)
        // Emit the message to the chat room
        io.to(rideRequestId).emit("receive message", {
          message,
          senderId,
          recipientId,
          rideRequestId,
          timestamp: new Date(),
          user: type
        });
        // console.log("Received message")
      }
    );
  });
};
