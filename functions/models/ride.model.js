const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  rideId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  origin: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },

  destination: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },

  stops: [
    {
      latitude: Number,
      longitude: Number,
    },
  ],

  distance_km: { type: Number, required: true },
  price: { type: Number, required: true },

  driverName: { type: String, default: "Jenny Wilson" },

  driverLocation: {
    latitude: Number,
    longitude: Number,
  },

  status: {
    type: String,
    enum: ["booked", "accepted", "ongoing", "completed", "cancelled"],
    default: "booked",
  },

  createdAt: { type: Date, default: Date.now },
});

const Ride = mongoose.model("Ride", rideSchema);
module.exports = Ride;
