const express = require("express");
const router = new express.Router();
const User = require("../models/user.model");
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

  const userId = decoded.id
  
  User.findById({_id : userId})
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

router.route("/login").post((req, res) => {
  const { mobileNo, password } = req.body;

  if (!mobileNo || !password) {
    return res.json({
      success: false,
      message: "Mobile number and password are required",
    });
  }

  User.findOne({ mobileNumber: mobileNo })
    .then((user) => {
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.json({
            success: false,
            message: "Invalid password",
          });
        }

        const token = generateToken(user._id);

        res.json({
          success: true,
          message: "Login successful",
          token,
          data: user,
        });
      });
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.json({
        success: false,
        message: "Internal server error",
      });
    });
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
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.json({ success: false, message: "User with this mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      mobileNumber,
      password: hashedPassword,
      regiStatus,
      otp // Should remove this after implementing the otp validation
    });

    const user = await newUser.save();

    const token = generateToken(user._id);

    const userDetails = await User.findById(newUser._id).select("-password");

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

    User.findOne({ mobileNumber, otp })
      .then((user) => {
        if (!user) {
          res.json({ success: false, message: "Invalid OTP", data: [] });
          return null; 
        }

        return User.findOneAndUpdate({ mobileNumber }, { isVerified: true, regiStatus },  { new: true }).select("-password").lean();
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

  const {
    mobileNumber,
    fullName,
    password,
    name,
    age,
    skill,
    exp,
    email,
    gender,
    city,
    profilePicture,
    bankAccountDetails,
    drivingLicence,
    regiStatus,
  } = req.body;

  if (!mobileNumber) {
    return res.json({
      success: false,
      message: "Mobile number is required for update",
    });
  }

  User.findOneAndUpdate(
    { mobileNumber },
    {
      $set: {
        fullName,
        password,
        name,
        email,
        gender,
        city,
        age,
        skill,
        exp,
        profilePicture,
        bankAccountDetails,
        drivingLicence,
        regiStatus,
      },
    },
    { new: true }
  ).select("-password").lean()
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


module.exports = router;
