const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const driverRoutes = require("./routes/driver");
const userRoutes = require("./routes/Users");
const rideRoutes = require("./routes/rideRoutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri);
const connection = mongoose.connection;

connection.once("open", () => {
  console.info("MongoDB database connection established successfully");
});

app.use("/driver", driverRoutes);
app.use("/user", userRoutes);
app.use("/ride", rideRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on ${PORT}`);
});
