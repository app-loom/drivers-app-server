const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
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
    },
    drivingLicence: {
      frontImage: {
        type: String,
      },
      backImage: {
        type: String,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    regiStatus : {type : String, default : 'cre'}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
