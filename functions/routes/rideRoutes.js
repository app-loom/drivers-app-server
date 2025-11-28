const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Ride = require("../models/ride.model");


const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

router.post("/book", authMiddleware, async (req, res) => {
  try {
    const { origin, destination, stops, distance_km } = req.body;

    if (!origin || !destination || !distance_km) {
      return res.status(400).json({
        success: false,
        message: "Origin, destination, and distance are required."
      });
    }

 
    const baseFare = 30;      
    const perKm = 12;        
    const stopCharge = 10;    

    const price =
      Math.round(baseFare + distance_km * perKm + (stops?.length || 0) * stopCharge);

    const ride = new Ride({
      rideId: uuidv4(),
      userId: req.user._id,
      origin,
      destination,
      stops: stops || [],
      distance_km,
      price,
      status: "booked",
      driverName: "Jenny Wilson",
      driverLocation: origin,
    });

    await ride.save();

    return res.status(201).json({ success: true, ride });
  } catch (err) {
    console.error("Book ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/history", authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, rides });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      rideId: req.params.id,
      userId: req.user._id
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    ride.status = "cancelled";
    await ride.save();

    return res.json({ success: true, ride });
  } catch (err) {
    console.error("Cancel ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      rideId: req.params.id,
      userId: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    return res.json({ success: true, ride });
  } catch (err) {
    console.error("Get ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
