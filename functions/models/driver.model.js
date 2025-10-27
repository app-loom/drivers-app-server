const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    age: {
      type: String,
    },
    skill: {
      type: String,
    },
    experience: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    gender: {
      type: String,
    },
    city: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    bankAccountDetails: {
      imageUrl: {
        type: String,
      },
      ifsc: { type: String },
      bank: { type: String },
      accountNo: { type: String },
    },
    drivingLicence: {
      frontImage: {
        type: String,
      },
      backImage: {
        type: String,
      },
      drivingLicenseNo: { type: String },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isActingDriver: {
      type: Boolean,
      default: false,
    },
    driverLocation : {
      latitude : {type : Number},
      longitude : {type : Number}
    },
    regiStatus: { type: String, default: "cre" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Driver", driverSchema);
