const express = require("express");
const router = new express.Router();
const Driver = require("../models/driver.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
};

router.route("/getuser").get((req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({
      success: false,
      message: "Authorization token missing",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.id;

  Driver.findById({ _id: userId })
    .select("-password")
    .lean()
    .then((user) => {
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User data fetched successfully",
        data: user,
      });
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      res.json({
        success: false,
        message: "Internal server error",
      });
    });
});

router.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.json({
        success: false,
        message: "Mobile number and password are required",
      });
    }

    const user = await Driver.findOne({ mobileNumber });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.route("/register").post(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    password,
    regiStatus,
    otp, // Should remove this after implementing the otp validation
  } = req.body;

  try {
    const existingUser = await Driver.findOne({ mobileNumber });
    if (existingUser) {
      return res.json({ success: false, message: "User with this mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Driver({
      fullName,
      mobileNumber,
      password: hashedPassword,
      regiStatus,
      otp, // Should remove this after implementing the otp validation
    });

    const user = await newUser.save();

    const token = generateToken(user._id);

    const userDetails = await Driver.findById(newUser._id).select("-password").lean();

    res.json({
      success: true,
      message: "User registered successfully",
      user: userDetails,
      token: token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.json({ success: false, message: "Internal server error" });
  }
});

router.route("/verifyotp").post((req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { otp, mobileNumber, regiStatus } = req.body;

    if (!otp || !mobileNumber) {
      return res.json({
        success: false,
        message: "Missing OTP or mobile number",
      });
    }

    Driver.findOne({ mobileNumber, otp })
      .then((user) => {
        if (!user) {
          res.json({ success: false, message: "Invalid OTP", data: [] });
          return null;
        }

        return Driver.findOneAndUpdate({ mobileNumber }, { isMobileVerified: true, regiStatus }, { new: true }).select("-password");
      })
      .then((updatedUser) => {
        if (updatedUser) {
          res.json({
            success: true,
            message: "OTP verified successfully",
            data: updatedUser,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.json({
      success: false,
      message: "Invalid or expired token",
    });
  }
});

router.route("/update").post((req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({
      success: false,
      message: "Authorization token missing",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const { mobileNumber, fullName, name, age, skill, experience, email, gender, city, profilePicture, bankAccountDetails, drivingLicence, regiStatus } = req.body;

  if (!mobileNumber) {
    return res.json({
      success: false,
      message: "Mobile number is required for update",
    });
  }

  Driver.findOneAndUpdate(
    { mobileNumber },
    {
      fullName,
      name,
      email,
      gender,
      city,
      age,
      skill,
      experience,
      profilePicture,
      bankAccountDetails,
      drivingLicence,
      regiStatus,
    },
    { new: true }
  )
    .select("-password")
    .lean()
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.json({
          success: false,
          message: "Unable to update",
          data: [],
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    })
    .catch((err) => {
      console.error("User update error:", err);
      res.json({
        success: false,
        message: "Internal server error during update",
      });
    });
});

router.route("/updateLocation").post((req, res) => {
  const { driverId, latitude, longitude } = req.body;
  console.log(req.body)

  Driver.findByIdAndUpdate(
    { _id: driverId },
    {
      driverLocation: {
        latitude,
        longitude,
      },
    },
    { new: true }
  )
    .select("-password")
    .lean()
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.json({
          success: false,
          message: "Unable to update",
          data: [],
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        location: updatedUser.driverLocation,
      });
    })
    .catch((err) => {
      console.error("User update error:", err);
      res.json({
        success: false,
        message: "Internal server error during update",
      });
    });
});

module.exports = router;
