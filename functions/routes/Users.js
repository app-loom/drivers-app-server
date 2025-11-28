const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");


const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });


const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(404).json({ success: false, message: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};


router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id);
    const userDetails = await User.findById(savedUser._id).select("-password");

    res.status(201).json({ success: true, message: "User registered", user: userDetails, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Signin successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


router.get("/user", authMiddleware, async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/userByEmail", authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.put("/updateProfileByEmail/:email", authMiddleware, async (req, res) => { 
  try {
    const { email } = req.params;
    const { fullName, phoneNumber, image, gender } = req.body;

    if (req.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "You can only update your own profile" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (image) user.image = image;
    if (gender) user.gender = gender;

    await user.save();

    const userDetails = await User.findOne({ email: email.toLowerCase() }).select("-password");
    res.json({ success: true, message: "Profile updated", user: userDetails });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


router.post("/delete", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

   
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete Account Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post("/address/add", authMiddleware, async (req, res) => {
  try {
    const { label, address, floor, landmark, location } = req.body;
    const user = req.user;

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.address = {
      label: label || "Home",
      street: address || "",
      state: floor || "",
      postalCode: landmark || "",
      country: "India",
      isActive: true,
      location: location || {},
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address added successfully",
      address: user.address,
    });
  } catch (err) {
    console.error("Add Address Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/address", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, address: user.address });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.put("/updateAddress/:email", authMiddleware, async (req, res) => {
  try {
    const { email } = req.params;
    const { street, city, state, postalCode, country } = req.body;

    if (req.user.email.toLowerCase() !== email.toLowerCase())
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.address = {
      street,
      city,
      state,
      postalCode,
      country,
      isActive: true,
    };

    await user.save();
    res.status(200).json({ success: true, message: "Address updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
