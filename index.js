require("dotenv").config();
const conecttomongo = require("./db");
const http = require("http");
const cors = require("cors");

const express = require("express");
const app = express();
const port = process.env.port || 4000;
//routes
const authRoutes = require("./routes/auth");
const rideRoutes = require("./routes/rides");
var bodyParser = require("body-parser");
const httpServer = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer, {
  cors: {
    origin: "*", // replace with the domain of your client application
    methods: ["GET", "POST"],
    credentials: true,
  },
});

conecttomongo();
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.json());
//Available routes
app.io = io;
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/vehicle", require("./routes/Vehicle"));
//app.use('api/otp', require('./routes/otp'))
const setupSockets = require("./socket");
setupSockets(io); // setup your socket listeners
httpServer.listen(port, () => {
  console.log(`Easy-Taxi backend listening on port ${port}`);
});
